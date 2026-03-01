export interface ReleaseInfo {
  title?: string;
  guid?: string;
  link?: string;
  details?: string;
  publishDate: Date;
  category: number[];
  size?: number;
  files?: number;
  grabs?: number;
  description?: string;
  rageID?: number;
  tvdbId?: number;
  imdb?: number;
  tmdb?: number;
  tvMazeId?: number;
  traktId?: number;
  doubanId?: number;
  genres?: string[];
  languages: string[];
  subs: string[];
  year?: number;
  author?: string;
  bookTitle?: string;
  publisher?: string;
  artist?: string;
  album?: string;
  label?: string;
  track?: string;
  seeders?: number;
  peers?: number;
  poster?: string;
  infoHash?: string;
  magnetUri?: string;
  minimumRatio?: number;
  minimumSeedTime?: number;
  downloadVolumeFactor?: number;
  uploadVolumeFactor?: number;
  origin?: { id: string; name: string; type: string };
}

export function createReleaseInfo(partial?: Partial<ReleaseInfo>): ReleaseInfo {
  return {
    publishDate: new Date(),
    category: [],
    languages: [],
    subs: [],
    ...partial,
  };
}

export function cloneReleaseInfo(r: ReleaseInfo): ReleaseInfo {
  return {
    title: r.title,
    guid: r.guid,
    link: r.link,
    details: r.details,
    publishDate: new Date(r.publishDate.getTime()),
    category: [...r.category],
    size: r.size,
    files: r.files,
    grabs: r.grabs,
    description: r.description,
    rageID: r.rageID,
    tvdbId: r.tvdbId,
    imdb: r.imdb,
    tmdb: r.tmdb,
    tvMazeId: r.tvMazeId,
    traktId: r.traktId,
    doubanId: r.doubanId,
    genres: r.genres ? [...r.genres] : undefined,
    languages: [...r.languages],
    subs: [...r.subs],
    year: r.year,
    author: r.author,
    bookTitle: r.bookTitle,
    publisher: r.publisher,
    artist: r.artist,
    album: r.album,
    label: r.label,
    track: r.track,
    seeders: r.seeders,
    peers: r.peers,
    poster: r.poster,
    infoHash: r.infoHash,
    magnetUri: r.magnetUri,
    minimumRatio: r.minimumRatio,
    minimumSeedTime: r.minimumSeedTime,
    downloadVolumeFactor: r.downloadVolumeFactor,
    uploadVolumeFactor: r.uploadVolumeFactor,
    origin: r.origin ? { ...r.origin } : undefined,
  };
}

export function gigabytesFromBytes(size?: number): number | undefined {
  if (size == null) return undefined;
  return size / 1024 / 1024 / 1024;
}

export function getGain(r: ReleaseInfo): number | undefined {
  if (r.seeders == null || r.size == null) return undefined;
  const gb = gigabytesFromBytes(r.size);
  if (gb == null) return undefined;
  return r.seeders * gb;
}
