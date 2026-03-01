import { type TorznabCapabilities, createCapabilities } from '../models/torznab-capabilities.js';
import { type TorznabQuery } from '../models/torznab-query.js';
import { type ReleaseInfo } from '../models/release-info.js';
import { fetchUrl, type WebRequest, type WebResult } from '../utils/web-client.js';

export interface IndexerResult {
  indexer: IIndexer;
  releases: ReleaseInfo[];
  elapsedTime: number;
  isFromCache: boolean;
}

export interface IIndexer {
  id: string;
  name: string;
  description: string;
  siteLink: string;
  language: string;
  type: string;
  encoding: string;
  lastError: string | null;
  supportsPagination: boolean;
  torznabCaps: TorznabCapabilities;
  isConfigured: boolean;
  tags: string[];
  isHealthy: boolean;
  isFailing: boolean;

  resultsForQuery(query: TorznabQuery, isMetaIndexer?: boolean): Promise<IndexerResult>;
  canHandleQuery(query: TorznabQuery): boolean;
  applyConfiguration(config: Record<string, unknown>): Promise<string>;
  loadFromSavedConfiguration(config: Record<string, unknown>): void;
  saveConfig(): Promise<void>;
  unconfigure(): void;
}

export interface IWebIndexer extends IIndexer {
  download(link: string): Promise<ArrayBuffer>;
  downloadImage(link: string): Promise<WebResult>;
}

export abstract class BaseIndexer implements IIndexer {
  id: string;
  name: string;
  description: string;
  siteLink: string;
  language: string = 'en-US';
  type: string = 'public';
  encoding: string = 'UTF-8';
  lastError: string | null = null;
  supportsPagination: boolean = false;
  torznabCaps: TorznabCapabilities;
  isConfigured: boolean = false;
  tags: string[] = [];

  get isHealthy(): boolean { return this.isConfigured && !this.lastError; }
  get isFailing(): boolean { return this.isConfigured && !!this.lastError; }

  constructor(options: { id: string; name: string; description: string; siteLink: string }) {
    this.id = options.id;
    this.name = options.name;
    this.description = options.description;
    this.siteLink = options.siteLink;
    this.torznabCaps = createCapabilities();
  }

  abstract performQuery(query: TorznabQuery): Promise<ReleaseInfo[]>;

  async resultsForQuery(query: TorznabQuery, _isMetaIndexer?: boolean): Promise<IndexerResult> {
    const startTime = Date.now();
    try {
      const releases = await this.performQuery(query);
      const elapsed = Date.now() - startTime;
      return { indexer: this, releases, elapsedTime: elapsed, isFromCache: false };
    } catch (err) {
      this.lastError = err instanceof Error ? err.message : String(err);
      throw err;
    }
  }

  canHandleQuery(_query: TorznabQuery): boolean {
    return true;
  }

  async applyConfiguration(_config: Record<string, unknown>): Promise<string> {
    this.isConfigured = true;
    return 'ok';
  }

  loadFromSavedConfiguration(_config: Record<string, unknown>): void {
    this.isConfigured = true;
  }

  async saveConfig(): Promise<void> {
    // Override to persist to KV store
  }

  unconfigure(): void {
    this.isConfigured = false;
    this.lastError = null;
  }

  protected async fetchUrl(request: WebRequest): Promise<WebResult> {
    return fetchUrl(request);
  }
}
