import {
  type TorznabCategory,
  createCategory,
  containsCategory,
  TorznabCatType,
  getParentCategories,
} from './torznab-category.js';

export enum TvSearchParam {
  Q = 'Q',
  Season = 'Season',
  Ep = 'Ep',
  ImdbId = 'ImdbId',
  TvdbId = 'TvdbId',
  RId = 'RId',
  TmdbId = 'TmdbId',
  TvmazeId = 'TvmazeId',
  TraktId = 'TraktId',
  DoubanId = 'DoubanId',
  Year = 'Year',
  Genre = 'Genre',
}

export enum MovieSearchParam {
  Q = 'Q',
  ImdbId = 'ImdbId',
  TmdbId = 'TmdbId',
  TraktId = 'TraktId',
  DoubanId = 'DoubanId',
  Year = 'Year',
  Genre = 'Genre',
}

export enum MusicSearchParam {
  Q = 'Q',
  Album = 'Album',
  Artist = 'Artist',
  Label = 'Label',
  Track = 'Track',
  Year = 'Year',
  Genre = 'Genre',
}

export enum BookSearchParam {
  Q = 'Q',
  Title = 'Title',
  Author = 'Author',
  Publisher = 'Publisher',
  Year = 'Year',
  Genre = 'Genre',
}

export interface CategoryMapping {
  trackerCategory: string;
  trackerCategoryDesc?: string;
  newzNabCategory: number;
}

export interface TorznabCapabilitiesCategories {
  categoryMapping: CategoryMapping[];
  torznabCategoryTree: TorznabCategory[];
}

export function createCapabilitiesCategories(): TorznabCapabilitiesCategories {
  return {
    categoryMapping: [],
    torznabCategoryTree: [],
  };
}

export function getTrackerCategories(cats: TorznabCapabilitiesCategories): string[] {
  const seen = new Set<string>();
  return cats.categoryMapping
    .filter(m => m.newzNabCategory < 100000)
    .map(m => m.trackerCategory)
    .filter(tc => {
      if (seen.has(tc)) return false;
      seen.add(tc);
      return true;
    });
}

export function getTorznabCategoryTree(
  cats: TorznabCapabilitiesCategories,
  sorted = false,
): TorznabCategory[] {
  if (!sorted) return cats.torznabCategoryTree;

  return [...cats.torznabCategoryTree]
    .map(c => {
      const newCat = createCategory(c.id, c.name);
      newCat.subCategories.push(
        ...c.subCategories.slice().sort((a, b) => a.id - b.id),
      );
      return newCat;
    })
    .sort((a, b) => {
      const aKey = a.id >= 100000 ? `zzz${a.name}` : a.id.toString();
      const bKey = b.id >= 100000 ? `zzz${b.name}` : b.id.toString();
      return aKey.localeCompare(bKey);
    });
}

export function getTorznabCategoryList(
  cats: TorznabCapabilitiesCategories,
  sorted = false,
): TorznabCategory[] {
  const tree = getTorznabCategoryTree(cats, sorted);
  const flat: TorznabCategory[] = [];
  for (const cat of tree) {
    flat.push(createCategory(cat.id, cat.name));
    flat.push(...cat.subCategories);
  }
  return flat;
}

function addTorznabCategoryTree(
  cats: TorznabCapabilitiesCategories,
  torznabCategory: TorznabCategory,
): void {
  const parentCats = getParentCategories();
  const isParent = parentCats.some(pc => pc.id === torznabCategory.id);

  if (isParent) {
    if (!cats.torznabCategoryTree.some(c => c.id === torznabCategory.id)) {
      cats.torznabCategoryTree.push(createCategory(torznabCategory.id, torznabCategory.name));
    }
  } else {
    const parentCat = parentCats.find(c => containsCategory(c, torznabCategory));
    if (parentCat) {
      const nodeCat = cats.torznabCategoryTree.find(c => c.id === parentCat.id);
      if (nodeCat) {
        if (!containsCategory(nodeCat, torznabCategory)) {
          nodeCat.subCategories.push(torznabCategory);
        }
      } else {
        const newParent = createCategory(parentCat.id, parentCat.name);
        newParent.subCategories.push(torznabCategory);
        cats.torznabCategoryTree.push(newParent);
      }
    } else {
      // custom category
      cats.torznabCategoryTree.push(torznabCategory);
    }
  }
}

export function addCategoryMapping(
  cats: TorznabCapabilitiesCategories,
  trackerCategory: string | number,
  torznabCategory: TorznabCategory,
  trackerCategoryDesc?: string,
): void {
  const trackerCatStr = trackerCategory.toString();
  cats.categoryMapping.push({
    trackerCategory: trackerCatStr,
    trackerCategoryDesc,
    newzNabCategory: torznabCategory.id,
  });
  addTorznabCategoryTree(cats, torznabCategory);

  if (!trackerCategoryDesc) return;

  // Create custom category (1:1)
  let trackerCategoryInt = parseInt(trackerCatStr, 10);
  if (isNaN(trackerCategoryInt)) {
    // Compute a simple hash for string categories
    let hash = 0;
    for (let i = 0; i < trackerCatStr.length; i++) {
      hash = ((hash << 5) - hash + trackerCatStr.charCodeAt(i)) & 0xffff;
    }
    trackerCategoryInt = hash;
  }

  const customCat = createCategory(trackerCategoryInt + 100000, trackerCategoryDesc);
  cats.categoryMapping.push({
    trackerCategory: trackerCatStr,
    trackerCategoryDesc,
    newzNabCategory: customCat.id,
  });
  addTorznabCategoryTree(cats, customCat);
}

export function mapTorznabCapsToTrackers(
  cats: TorznabCapabilitiesCategories,
  queryCategories: number[],
  mapChildrenCatsToParent = false,
): string[] {
  const expanded = expandTorznabQueryCategories(cats, queryCategories, mapChildrenCatsToParent);
  const seen = new Set<string>();
  return cats.categoryMapping
    .filter(c => expanded.includes(c.newzNabCategory))
    .map(m => m.trackerCategory)
    .filter(tc => {
      if (seen.has(tc)) return false;
      seen.add(tc);
      return true;
    });
}

export function mapTrackerCatToNewznab(
  cats: TorznabCapabilitiesCategories,
  trackerCategory: string,
): number[] {
  if (!trackerCategory?.trim()) return [];
  return cats.categoryMapping
    .filter(m =>
      m.trackerCategory?.trim() &&
      m.trackerCategory.toLowerCase() === trackerCategory.toLowerCase(),
    )
    .map(c => c.newzNabCategory);
}

export function mapTrackerCatDescToNewznab(
  cats: TorznabCapabilitiesCategories,
  trackerCategoryDesc: string,
): number[] {
  if (!trackerCategoryDesc?.trim()) return [];
  return cats.categoryMapping
    .filter(m =>
      m.trackerCategoryDesc?.trim() &&
      m.trackerCategoryDesc.toLowerCase() === trackerCategoryDesc.toLowerCase(),
    )
    .map(c => c.newzNabCategory);
}

export function supportedCategories(
  cats: TorznabCapabilitiesCategories,
  categories: number[],
): number[] {
  if (!categories || categories.length === 0) return [];
  const subCategories = cats.torznabCategoryTree.flatMap(c => c.subCategories);
  const allCategories = [...cats.torznabCategoryTree, ...subCategories];
  return allCategories.filter(c => categories.includes(c.id)).map(c => c.id);
}

export function expandTorznabQueryCategories(
  cats: TorznabCapabilitiesCategories,
  queryCategories: number[],
  mapChildrenCatsToParent = false,
): number[] {
  const expanded: number[] = [];
  for (const queryCategory of queryCategories) {
    expanded.push(queryCategory);
    if (queryCategory >= 100000) continue;

    const parentCat = cats.torznabCategoryTree.find(c => c.id === queryCategory);
    if (parentCat) {
      expanded.push(...parentCat.subCategories.map(c => c.id));
    } else if (mapChildrenCatsToParent) {
      const queryCategoryTorznab = createCategory(queryCategory, '');
      const parent = cats.torznabCategoryTree.find(c => containsCategory(c, queryCategoryTorznab));
      if (parent) expanded.push(parent.id);
    }
  }
  return [...new Set(expanded)];
}

export function concatCategories(
  lhs: TorznabCapabilitiesCategories,
  rhs: TorznabCapabilitiesCategories,
): void {
  const rhsList = getTorznabCategoryList(rhs);
  for (const cat of rhsList) {
    if (cat.id < 100000) {
      addTorznabCategoryTree(lhs, cat);
    }
  }
}

// ---- TorznabCapabilities ----

export interface TorznabCapabilities {
  limitsMax?: number;
  limitsDefault?: number;
  searchAvailable: boolean;
  supportsRawSearch: boolean;
  tvSearchParams: TvSearchParam[];
  movieSearchParams: MovieSearchParam[];
  musicSearchParams: MusicSearchParam[];
  bookSearchParams: BookSearchParam[];
  tvSearchImdbAvailable: boolean;
  categories: TorznabCapabilitiesCategories;
}

export function createCapabilities(): TorznabCapabilities {
  return {
    limitsMax: 100,
    limitsDefault: 100,
    searchAvailable: true,
    supportsRawSearch: false,
    tvSearchParams: [],
    movieSearchParams: [],
    musicSearchParams: [],
    bookSearchParams: [],
    tvSearchImdbAvailable: false,
    categories: createCapabilitiesCategories(),
  };
}

// Availability helpers

export function tvSearchAvailable(caps: TorznabCapabilities): boolean {
  return caps.tvSearchParams.length > 0;
}
export function tvSearchSeasonAvailable(caps: TorznabCapabilities): boolean {
  return caps.tvSearchParams.includes(TvSearchParam.Season);
}
export function tvSearchEpAvailable(caps: TorznabCapabilities): boolean {
  return caps.tvSearchParams.includes(TvSearchParam.Ep);
}
export function tvSearchTvdbAvailable(caps: TorznabCapabilities): boolean {
  return caps.tvSearchParams.includes(TvSearchParam.TvdbId);
}
export function tvSearchTvRageAvailable(caps: TorznabCapabilities): boolean {
  return caps.tvSearchParams.includes(TvSearchParam.RId);
}
export function tvSearchTmdbAvailable(caps: TorznabCapabilities): boolean {
  return caps.tvSearchParams.includes(TvSearchParam.TmdbId);
}
export function tvSearchTvMazeAvailable(caps: TorznabCapabilities): boolean {
  return caps.tvSearchParams.includes(TvSearchParam.TvmazeId);
}
export function tvSearchTraktAvailable(caps: TorznabCapabilities): boolean {
  return caps.tvSearchParams.includes(TvSearchParam.TraktId);
}
export function tvSearchDoubanAvailable(caps: TorznabCapabilities): boolean {
  return caps.tvSearchParams.includes(TvSearchParam.DoubanId);
}
export function tvSearchYearAvailable(caps: TorznabCapabilities): boolean {
  return caps.tvSearchParams.includes(TvSearchParam.Year);
}
export function tvSearchGenreAvailable(caps: TorznabCapabilities): boolean {
  return caps.tvSearchParams.includes(TvSearchParam.Genre);
}

export function movieSearchAvailable(caps: TorznabCapabilities): boolean {
  return caps.movieSearchParams.length > 0;
}
export function movieSearchImdbAvailable(caps: TorznabCapabilities): boolean {
  return caps.movieSearchParams.includes(MovieSearchParam.ImdbId);
}
export function movieSearchTmdbAvailable(caps: TorznabCapabilities): boolean {
  return caps.movieSearchParams.includes(MovieSearchParam.TmdbId);
}
export function movieSearchTraktAvailable(caps: TorznabCapabilities): boolean {
  return caps.movieSearchParams.includes(MovieSearchParam.TraktId);
}
export function movieSearchDoubanAvailable(caps: TorznabCapabilities): boolean {
  return caps.movieSearchParams.includes(MovieSearchParam.DoubanId);
}
export function movieSearchYearAvailable(caps: TorznabCapabilities): boolean {
  return caps.movieSearchParams.includes(MovieSearchParam.Year);
}
export function movieSearchGenreAvailable(caps: TorznabCapabilities): boolean {
  return caps.movieSearchParams.includes(MovieSearchParam.Genre);
}

export function musicSearchAvailable(caps: TorznabCapabilities): boolean {
  return caps.musicSearchParams.length > 0;
}
export function musicSearchAlbumAvailable(caps: TorznabCapabilities): boolean {
  return caps.musicSearchParams.includes(MusicSearchParam.Album);
}
export function musicSearchArtistAvailable(caps: TorznabCapabilities): boolean {
  return caps.musicSearchParams.includes(MusicSearchParam.Artist);
}
export function musicSearchLabelAvailable(caps: TorznabCapabilities): boolean {
  return caps.musicSearchParams.includes(MusicSearchParam.Label);
}
export function musicSearchTrackAvailable(caps: TorznabCapabilities): boolean {
  return caps.musicSearchParams.includes(MusicSearchParam.Track);
}
export function musicSearchYearAvailable(caps: TorznabCapabilities): boolean {
  return caps.musicSearchParams.includes(MusicSearchParam.Year);
}
export function musicSearchGenreAvailable(caps: TorznabCapabilities): boolean {
  return caps.musicSearchParams.includes(MusicSearchParam.Genre);
}

export function bookSearchAvailable(caps: TorznabCapabilities): boolean {
  return caps.bookSearchParams.length > 0;
}
export function bookSearchTitleAvailable(caps: TorznabCapabilities): boolean {
  return caps.bookSearchParams.includes(BookSearchParam.Title);
}
export function bookSearchAuthorAvailable(caps: TorznabCapabilities): boolean {
  return caps.bookSearchParams.includes(BookSearchParam.Author);
}
export function bookSearchPublisherAvailable(caps: TorznabCapabilities): boolean {
  return caps.bookSearchParams.includes(BookSearchParam.Publisher);
}
export function bookSearchYearAvailable(caps: TorznabCapabilities): boolean {
  return caps.bookSearchParams.includes(BookSearchParam.Year);
}
export function bookSearchGenreAvailable(caps: TorznabCapabilities): boolean {
  return caps.bookSearchParams.includes(BookSearchParam.Genre);
}

// Supported params strings for XML generation

function supportedTvSearchParams(caps: TorznabCapabilities): string {
  const params = ['q'];
  if (tvSearchSeasonAvailable(caps)) params.push('season');
  if (tvSearchEpAvailable(caps)) params.push('ep');
  if (caps.tvSearchImdbAvailable) params.push('imdbid');
  if (tvSearchTvdbAvailable(caps)) params.push('tvdbid');
  if (tvSearchTvRageAvailable(caps)) params.push('rid');
  if (tvSearchTmdbAvailable(caps)) params.push('tmdbid');
  if (tvSearchTvMazeAvailable(caps)) params.push('tvmazeid');
  if (tvSearchTraktAvailable(caps)) params.push('traktid');
  if (tvSearchDoubanAvailable(caps)) params.push('doubanid');
  if (tvSearchYearAvailable(caps)) params.push('year');
  if (tvSearchGenreAvailable(caps)) params.push('genre');
  return params.join(',');
}

function supportedMovieSearchParams(caps: TorznabCapabilities): string {
  const params = ['q'];
  if (movieSearchImdbAvailable(caps)) params.push('imdbid');
  if (movieSearchTmdbAvailable(caps)) params.push('tmdbid');
  if (movieSearchTraktAvailable(caps)) params.push('traktid');
  if (movieSearchDoubanAvailable(caps)) params.push('doubanid');
  if (movieSearchYearAvailable(caps)) params.push('year');
  if (movieSearchGenreAvailable(caps)) params.push('genre');
  return params.join(',');
}

function supportedMusicSearchParams(caps: TorznabCapabilities): string {
  const params = ['q'];
  if (musicSearchAlbumAvailable(caps)) params.push('album');
  if (musicSearchArtistAvailable(caps)) params.push('artist');
  if (musicSearchLabelAvailable(caps)) params.push('label');
  if (musicSearchTrackAvailable(caps)) params.push('track');
  if (musicSearchYearAvailable(caps)) params.push('year');
  if (musicSearchGenreAvailable(caps)) params.push('genre');
  return params.join(',');
}

function supportedBookSearchParams(caps: TorznabCapabilities): string {
  const params = ['q'];
  if (bookSearchTitleAvailable(caps)) params.push('title');
  if (bookSearchAuthorAvailable(caps)) params.push('author');
  if (bookSearchPublisherAvailable(caps)) params.push('publisher');
  if (bookSearchYearAvailable(caps)) params.push('year');
  if (bookSearchGenreAvailable(caps)) params.push('genre');
  return params.join(',');
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function capabilitiesToXml(caps: TorznabCapabilities): string {
  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<caps>');
  lines.push('  <server title="Jackett"/>');

  if (caps.limitsMax != null || caps.limitsDefault != null) {
    const attrs: string[] = [];
    if (caps.limitsDefault != null) attrs.push(`default="${caps.limitsDefault}"`);
    if (caps.limitsMax != null) attrs.push(`max="${caps.limitsMax}"`);
    lines.push(`  <limits ${attrs.join(' ')}/>` );
  }

  const rawAttr = caps.supportsRawSearch ? ' searchEngine="raw"' : '';
  lines.push('  <searching>');
  lines.push(`    <search available="${caps.searchAvailable ? 'yes' : 'no'}" supportedParams="q"${rawAttr}/>`);
  lines.push(`    <tv-search available="${tvSearchAvailable(caps) ? 'yes' : 'no'}" supportedParams="${supportedTvSearchParams(caps)}"${rawAttr}/>`);
  lines.push(`    <movie-search available="${movieSearchAvailable(caps) ? 'yes' : 'no'}" supportedParams="${supportedMovieSearchParams(caps)}"${rawAttr}/>`);
  lines.push(`    <music-search available="${musicSearchAvailable(caps) ? 'yes' : 'no'}" supportedParams="${supportedMusicSearchParams(caps)}"${rawAttr}/>`);
  lines.push(`    <audio-search available="${musicSearchAvailable(caps) ? 'yes' : 'no'}" supportedParams="${supportedMusicSearchParams(caps)}"${rawAttr}/>`);
  lines.push(`    <book-search available="${bookSearchAvailable(caps) ? 'yes' : 'no'}" supportedParams="${supportedBookSearchParams(caps)}"${rawAttr}/>`);
  lines.push('  </searching>');

  lines.push('  <categories>');
  const tree = getTorznabCategoryTree(caps.categories, true);
  for (const cat of tree) {
    if (cat.subCategories.length === 0) {
      lines.push(`    <category id="${cat.id}" name="${escapeXml(cat.name)}"/>`);
    } else {
      lines.push(`    <category id="${cat.id}" name="${escapeXml(cat.name)}">`);
      for (const sc of cat.subCategories) {
        lines.push(`      <subcat id="${sc.id}" name="${escapeXml(sc.name)}"/>`);
      }
      lines.push('    </category>');
    }
  }
  lines.push('  </categories>');
  lines.push('</caps>');

  return lines.join('\n');
}

export function concatCapabilities(
  lhs: TorznabCapabilities,
  rhs: TorznabCapabilities,
): TorznabCapabilities {
  lhs.searchAvailable = lhs.searchAvailable || rhs.searchAvailable;
  lhs.supportsRawSearch = lhs.supportsRawSearch || rhs.supportsRawSearch;

  // Union params
  for (const p of rhs.tvSearchParams) {
    if (!lhs.tvSearchParams.includes(p)) lhs.tvSearchParams.push(p);
  }
  for (const p of rhs.movieSearchParams) {
    if (!lhs.movieSearchParams.includes(p)) lhs.movieSearchParams.push(p);
  }
  for (const p of rhs.musicSearchParams) {
    if (!lhs.musicSearchParams.includes(p)) lhs.musicSearchParams.push(p);
  }
  for (const p of rhs.bookSearchParams) {
    if (!lhs.bookSearchParams.includes(p)) lhs.bookSearchParams.push(p);
  }

  concatCategories(lhs.categories, rhs.categories);
  return lhs;
}

// Enum lookup maps for case-insensitive parsing
const tvSearchParamMap = new Map<string, TvSearchParam>(
  Object.values(TvSearchParam).map(v => [v.toLowerCase(), v]),
);
const movieSearchParamMap = new Map<string, MovieSearchParam>(
  Object.values(MovieSearchParam).map(v => [v.toLowerCase(), v]),
);
const musicSearchParamMap = new Map<string, MusicSearchParam>(
  Object.values(MusicSearchParam).map(v => [v.toLowerCase(), v]),
);
const bookSearchParamMap = new Map<string, BookSearchParam>(
  Object.values(BookSearchParam).map(v => [v.toLowerCase(), v]),
);

export function parseCardigannSearchModes(
  caps: TorznabCapabilities,
  modes: Record<string, string[]>,
): void {
  if (!modes || Object.keys(modes).length === 0) {
    throw new Error('At least one search mode is required');
  }
  if (!('search' in modes)) {
    throw new Error("The search mode 'search' is mandatory");
  }

  for (const [key, value] of Object.entries(modes)) {
    switch (key) {
      case 'search':
        if (!value || value.length !== 1 || value[0] !== 'q') {
          throw new Error("In search mode 'search' only 'q' parameter is supported and it's mandatory");
        }
        break;
      case 'tv-search':
        parseTvSearchParams(caps, value);
        break;
      case 'movie-search':
        parseMovieSearchParams(caps, value);
        break;
      case 'music-search':
        parseMusicSearchParams(caps, value);
        break;
      case 'book-search':
        parseBookSearchParams(caps, value);
        break;
      default:
        throw new Error(`Unsupported search mode: ${key}`);
    }
  }
}

function parseTvSearchParams(caps: TorznabCapabilities, paramsList?: string[]): void {
  if (!paramsList) return;
  for (const paramStr of paramsList) {
    const param = tvSearchParamMap.get(paramStr.toLowerCase());
    if (param == null) throw new Error(`Not supported tv-search param: ${paramStr}`);
    if (caps.tvSearchParams.includes(param)) throw new Error(`Duplicate tv-search param: ${paramStr}`);
    caps.tvSearchParams.push(param);
  }
}

function parseMovieSearchParams(caps: TorznabCapabilities, paramsList?: string[]): void {
  if (!paramsList) return;
  for (const paramStr of paramsList) {
    const param = movieSearchParamMap.get(paramStr.toLowerCase());
    if (param == null) throw new Error(`Not supported movie-search param: ${paramStr}`);
    if (caps.movieSearchParams.includes(param)) throw new Error(`Duplicate movie-search param: ${paramStr}`);
    caps.movieSearchParams.push(param);
  }
}

function parseMusicSearchParams(caps: TorznabCapabilities, paramsList?: string[]): void {
  if (!paramsList) return;
  for (const paramStr of paramsList) {
    const param = musicSearchParamMap.get(paramStr.toLowerCase());
    if (param == null) throw new Error(`Not supported music-search param: ${paramStr}`);
    if (caps.musicSearchParams.includes(param)) throw new Error(`Duplicate music-search param: ${paramStr}`);
    caps.musicSearchParams.push(param);
  }
}

function parseBookSearchParams(caps: TorznabCapabilities, paramsList?: string[]): void {
  if (!paramsList) return;
  for (const paramStr of paramsList) {
    const param = bookSearchParamMap.get(paramStr.toLowerCase());
    if (param == null) throw new Error(`Not supported book-search param: ${paramStr}`);
    if (caps.bookSearchParams.includes(param)) throw new Error(`Duplicate book-search param: ${paramStr}`);
    caps.bookSearchParams.push(param);
  }
}
