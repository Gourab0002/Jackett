import { timingSafeEqual as cryptoTimingSafeEqual } from 'node:crypto';
import { IndexerManager } from './indexers/indexer-manager.js';
import { resultPageToXml, createErrorXml } from './models/result-page.js';
import { createChannelInfo } from './models/channel-info.js';
import { type TorznabQuery, createTorznabQuery } from './models/torznab-query.js';
import { capabilitiesToXml } from './models/torznab-capabilities.js';
import { getFullImdbId } from './utils/parse-util.js';

/** Constant-time string comparison to prevent timing attacks on API key validation. */
function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const bufA = enc.encode(a);
  const bufB = enc.encode(b);
  if (bufA.length !== bufB.length) return false;
  return cryptoTimingSafeEqual(bufA, bufB);
}

export interface Env {
  API_KEY: string;
}

export class Router {
  private indexerManager: IndexerManager;

  constructor(indexerManager: IndexerManager) {
    this.indexerManager = indexerManager;
  }

  async handleRequest(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/api/v2.0/health') {
      return this.handleHealth();
    }

    const apiKey = url.searchParams.get('apikey') || url.searchParams.get('passkey');
    if (env.API_KEY && !timingSafeEqual(env.API_KEY, apiKey || '')) {
      return new Response('Invalid API Key', { status: 401 });
    }

    const torznabMatch = path.match(/^\/api\/v2\.0\/indexers\/([^/]+)\/results\/torznab/);
    if (torznabMatch) {
      return this.handleTorznab(torznabMatch[1], url);
    }

    const resultsMatch = path.match(/^\/api\/v2\.0\/indexers\/([^/]+)\/results\/?$/);
    if (resultsMatch) {
      return this.handleResults(resultsMatch[1], url);
    }

    if (path === '/api/v2.0/indexers' || path === '/api/v2.0/indexers/') {
      return this.handleIndexerList();
    }

    if (path === '/api/v2.0/server/config') {
      return this.handleServerConfig(env);
    }

    return new Response('Not Found', { status: 404 });
  }

  private handleHealth(): Response {
    return Response.json({ status: 'ok' });
  }

  private async handleTorznab(indexerId: string, url: URL): Promise<Response> {
    const indexer = this.indexerManager.getIndexer(indexerId);
    if (!indexer) {
      return new Response(createErrorXml(201, 'Indexer not found'), {
        status: 404,
        headers: { 'Content-Type': 'application/xml; charset=utf-8' },
      });
    }

    const t = url.searchParams.get('t') || 'search';

    if (t === 'caps') {
      return new Response(capabilitiesToXml(indexer.torznabCaps), {
        headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
      });
    }

    const query = this.buildQueryFromParams(url.searchParams, t);

    if (!indexer.canHandleQuery(query)) {
      return new Response(createErrorXml(201, `${indexer.id} does not support the requested query`), {
        status: 400,
        headers: { 'Content-Type': 'application/xml; charset=utf-8' },
      });
    }

    try {
      const result = await indexer.resultsForQuery(query);
      const channelInfo = createChannelInfo({
        title: indexer.name,
        description: indexer.description,
        link: indexer.siteLink,
      });

      const xml = resultPageToXml(channelInfo, result.releases, url.origin);
      return new Response(xml, {
        headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return new Response(createErrorXml(900, message), {
        status: 500,
        headers: { 'Content-Type': 'application/xml; charset=utf-8' },
      });
    }
  }

  private async handleResults(indexerId: string, url: URL): Promise<Response> {
    const indexer = this.indexerManager.getIndexer(indexerId);
    if (!indexer) {
      return Response.json({ error: 'Indexer not found' }, { status: 404 });
    }

    const query = this.buildQueryFromParams(url.searchParams, 'search');

    try {
      const result = await indexer.resultsForQuery(query);
      return Response.json({
        Results: result.releases,
        Indexers: [{ ID: indexer.id, Name: indexer.name, Status: 'ok', Results: result.releases.length }],
      });
    } catch (err) {
      return Response.json({ error: String(err) }, { status: 500 });
    }
  }

  private handleIndexerList(): Response {
    const indexers = this.indexerManager.getAllIndexers().map(i => ({
      id: i.id,
      name: i.name,
      description: i.description,
      type: i.type,
      configured: i.isConfigured,
      siteLink: i.siteLink,
      language: i.language,
    }));
    return Response.json(indexers);
  }

  private handleServerConfig(env: Env): Response {
    return Response.json({
      api_key: env.API_KEY ? '***' : '',
      app_version: '1.0.0',
      runtime: 'nodejs',
    });
  }

  private buildQueryFromParams(params: URLSearchParams, queryType: string): TorznabQuery {
    const query = createTorznabQuery();
    query.queryType = queryType;
    query.searchTerm = params.get('q') || undefined;
    query.apiKey = params.get('apikey') || '';
    query.limit = parseInt(params.get('limit') || '100', 10);
    query.offset = parseInt(params.get('offset') || '0', 10);

    const cat = params.getAll('cat');
    if (cat.length > 0) {
      query.categories = cat.flatMap(c => c.split(',')).map(Number).filter(n => !isNaN(n));
    }

    const imdbid = params.get('imdbid');
    if (imdbid) query.imdbID = getFullImdbId(imdbid) || undefined;

    const tvdbid = params.get('tvdbid');
    if (tvdbid) query.tvdbID = parseInt(tvdbid, 10);

    const tmdbid = params.get('tmdbid');
    if (tmdbid) query.tmdbID = parseInt(tmdbid, 10);

    const rid = params.get('rid');
    if (rid) query.rageID = parseInt(rid, 10);

    const tvmazeid = params.get('tvmazeid');
    if (tvmazeid) query.tvmazeID = parseInt(tvmazeid, 10);

    const traktid = params.get('traktid');
    if (traktid) query.traktID = parseInt(traktid, 10);

    const season = params.get('season');
    if (season) query.season = parseInt(season, 10);

    const ep = params.get('ep');
    if (ep) query.episode = ep;

    const year = params.get('year');
    if (year) query.year = parseInt(year, 10);

    const genre = params.get('genre');
    if (genre) query.genre = genre;

    const album = params.get('album');
    if (album) query.album = album;

    const artist = params.get('artist');
    if (artist) query.artist = artist;

    const label = params.get('label');
    if (label) query.label = label;

    const track = params.get('track');
    if (track) query.track = track;

    const author = params.get('author');
    if (author) query.author = author;

    const title = params.get('title');
    if (title) query.title = title;

    const publisher = params.get('publisher');
    if (publisher) query.publisher = publisher;

    return query;
  }
}
