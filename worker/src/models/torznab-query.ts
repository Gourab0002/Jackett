export interface TorznabQuery {
  interactiveSearch: boolean;
  queryType: string;
  categories: number[];
  extended: number;
  apiKey: string;
  limit: number;
  offset: number;
  rageID?: number;
  tvdbID?: number;
  imdbID?: string;
  tmdbID?: number;
  tvmazeID?: number;
  traktID?: number;
  doubanID?: number;
  cache: boolean;
  season?: number;
  episode?: string;
  searchTerm?: string;
  album?: string;
  artist?: string;
  label?: string;
  track?: string;
  year?: number;
  genre?: string;
  author?: string;
  title?: string;
  publisher?: string;
  isTest: boolean;
  /** Cached query string parts for MatchQueryStringAND */
  queryStringParts?: string[];
}

export function createTorznabQuery(): TorznabQuery {
  return {
    interactiveSearch: false,
    queryType: '',
    categories: [],
    extended: 0,
    apiKey: '',
    limit: 0,
    offset: 0,
    cache: true,
    isTest: false,
  };
}

export function isSearch(q: TorznabQuery): boolean {
  return q.queryType === 'search';
}

export function isTVSearch(q: TorznabQuery): boolean {
  return q.queryType === 'tvsearch';
}

export function isMovieSearch(q: TorznabQuery): boolean {
  return q.queryType === 'movie' ||
    (q.queryType === 'TorrentPotato' && !!q.searchTerm?.trim());
}

export function isMusicSearch(q: TorznabQuery): boolean {
  return q.queryType === 'music';
}

export function isBookSearch(q: TorznabQuery): boolean {
  return q.queryType === 'book';
}

export function isIdSearch(q: TorznabQuery): boolean {
  return !!q.episode?.trim() ||
    (q.season != null && q.season > 0) ||
    q.imdbID != null ||
    q.tvdbID != null ||
    q.rageID != null ||
    q.traktID != null ||
    q.tvmazeID != null ||
    q.tmdbID != null ||
    q.doubanID != null ||
    !!q.album?.trim() ||
    !!q.artist?.trim() ||
    !!q.label?.trim() ||
    !!q.genre?.trim() ||
    !!q.track?.trim() ||
    !!q.author?.trim() ||
    !!q.title?.trim() ||
    !!q.publisher?.trim() ||
    q.year != null;
}

export function isRssSearch(q: TorznabQuery): boolean {
  return !q.searchTerm?.trim() && !isIdSearch(q);
}

export function hasSpecifiedCategories(q: TorznabQuery): boolean {
  return q.categories != null && q.categories.length > 0;
}

export function getSanitizedSearchTerm(q: TorznabQuery): string {
  let term = q.searchTerm ?? '';

  // Standardize dashes (Unicode Pd category)
  term = term.replace(/[\u002D\u058A\u05BE\u1400\u1806\u2010-\u2015\u2E17\u2E1A\u2E3A\u2E3B\u2E40\u301C\u3030\u30A0\uFE31\uFE32\uFE58\uFE63\uFF0D]+/g, '-');
  // Standardize single quotes
  term = term.replace(/[\u0060\u00B4\u2018\u2019]/g, "'");

  // Keep only safe characters
  const safe = [...term].filter(c =>
    /[\p{L}\p{N}]/u.test(c) ||
    /\s/.test(c) ||
    '-._()@/\'[]+%'.includes(c),
  );

  return safe.join('');
}

export function getEpisodeSearchString(q: TorznabQuery): string {
  if (q.season == null || q.season === 0) {
    return '';
  }

  // Try to parse as date format: "yyyy MM/dd"
  if (q.episode) {
    const dateMatch = q.episode.match(/^(\d{2})\/(\d{2})$/);
    if (dateMatch && q.season >= 1000) {
      const month = dateMatch[1];
      const day = dateMatch[2];
      return `${q.season}.${month}.${day}`;
    }
  }

  const seasonStr = q.season.toString().padStart(2, '0');

  if (!q.episode?.trim()) {
    return `S${seasonStr}`;
  }

  const episodeNum = parseInt(q.episode, 10);
  if (!isNaN(episodeNum)) {
    return `S${seasonStr}E${episodeNum.toString().padStart(2, '0')}`;
  }

  return `S${seasonStr}E${q.episode}`;
}

export function getQueryString(q: TorznabQuery): string {
  return (getSanitizedSearchTerm(q) + ' ' + getEpisodeSearchString(q)).trim();
}

/**
 * AND-filter: checks if all words in the query string appear in the title.
 * With "limit" we can limit the amount of characters which should be compared.
 */
export function matchQueryStringAND(
  q: TorznabQuery,
  title: string,
  limit?: number,
  queryStringOverride?: string,
): boolean {
  const commonWords = ['and', 'the', 'an'];

  if (!q.queryStringParts) {
    let queryString = queryStringOverride?.trim() || getQueryString(q);

    if (limit != null && limit > 0) {
      const effectiveLimit = Math.min(limit, queryString.length);
      queryString = queryString.substring(0, effectiveLimit);
    }

    q.queryStringParts = queryString
      .split(/[^\w]+/)
      .filter(p => p.trim().length > 1 && !commonWords.includes(p.toLowerCase()));
  }

  const titleLower = title.toLowerCase();
  return q.queryStringParts.every(part => titleLower.includes(part.toLowerCase()));
}

export function cloneQuery(q: TorznabQuery): TorznabQuery {
  return {
    interactiveSearch: q.interactiveSearch,
    queryType: q.queryType,
    categories: [...q.categories],
    extended: q.extended,
    apiKey: q.apiKey,
    limit: q.limit,
    offset: q.offset,
    rageID: q.rageID,
    tvdbID: q.tvdbID,
    imdbID: q.imdbID,
    tmdbID: q.tmdbID,
    tvmazeID: q.tvmazeID,
    traktID: q.traktID,
    doubanID: q.doubanID,
    cache: q.cache,
    season: q.season,
    episode: q.episode,
    searchTerm: q.searchTerm,
    album: q.album,
    artist: q.artist,
    label: q.label,
    track: q.track,
    year: q.year,
    genre: q.genre,
    author: q.author,
    title: q.title,
    publisher: q.publisher,
    isTest: q.isTest,
    queryStringParts: q.queryStringParts ? [...q.queryStringParts] : undefined,
  };
}
