export interface TorznabCategory {
  id: number;
  name: string;
  subCategories: TorznabCategory[];
}

export function createCategory(id: number, name: string): TorznabCategory {
  return { id, name, subCategories: [] };
}

export function containsCategory(cat: TorznabCategory, target: TorznabCategory): boolean {
  return cat.id === target.id || cat.subCategories.some(sc => sc.id === target.id);
}

// Category constants
const Console = createCategory(1000, 'Console');
const ConsoleNDS = createCategory(1010, 'Console/NDS');
const ConsolePSP = createCategory(1020, 'Console/PSP');
const ConsoleWii = createCategory(1030, 'Console/Wii');
const ConsoleXBox = createCategory(1040, 'Console/XBox');
const ConsoleXBox360 = createCategory(1050, 'Console/XBox 360');
const ConsoleWiiware = createCategory(1060, 'Console/Wiiware');
const ConsoleXBox360DLC = createCategory(1070, 'Console/XBox 360 DLC');
const ConsolePS3 = createCategory(1080, 'Console/PS3');
const ConsoleOther = createCategory(1090, 'Console/Other');
const Console3DS = createCategory(1110, 'Console/3DS');
const ConsolePSVita = createCategory(1120, 'Console/PS Vita');
const ConsoleWiiU = createCategory(1130, 'Console/WiiU');
const ConsoleXBoxOne = createCategory(1140, 'Console/XBox One');
const ConsolePS4 = createCategory(1180, 'Console/PS4');

const Movies = createCategory(2000, 'Movies');
const MoviesForeign = createCategory(2010, 'Movies/Foreign');
const MoviesOther = createCategory(2020, 'Movies/Other');
const MoviesSD = createCategory(2030, 'Movies/SD');
const MoviesHD = createCategory(2040, 'Movies/HD');
const MoviesUHD = createCategory(2045, 'Movies/UHD');
const MoviesBluRay = createCategory(2050, 'Movies/BluRay');
const Movies3D = createCategory(2060, 'Movies/3D');
const MoviesDVD = createCategory(2070, 'Movies/DVD');
const MoviesWEBDL = createCategory(2080, 'Movies/WEB-DL');

const Audio = createCategory(3000, 'Audio');
const AudioMP3 = createCategory(3010, 'Audio/MP3');
const AudioVideo = createCategory(3020, 'Audio/Video');
const AudioAudiobook = createCategory(3030, 'Audio/Audiobook');
const AudioLossless = createCategory(3040, 'Audio/Lossless');
const AudioOther = createCategory(3050, 'Audio/Other');
const AudioForeign = createCategory(3060, 'Audio/Foreign');

const PC = createCategory(4000, 'PC');
const PC0day = createCategory(4010, 'PC/0day');
const PCISO = createCategory(4020, 'PC/ISO');
const PCMac = createCategory(4030, 'PC/Mac');
const PCMobileOther = createCategory(4040, 'PC/Mobile-Other');
const PCGames = createCategory(4050, 'PC/Games');
const PCMobileiOS = createCategory(4060, 'PC/Mobile-iOS');
const PCMobileAndroid = createCategory(4070, 'PC/Mobile-Android');

const TV = createCategory(5000, 'TV');
const TVWEBDL = createCategory(5010, 'TV/WEB-DL');
const TVForeign = createCategory(5020, 'TV/Foreign');
const TVSD = createCategory(5030, 'TV/SD');
const TVHD = createCategory(5040, 'TV/HD');
const TVUHD = createCategory(5045, 'TV/UHD');
const TVOther = createCategory(5050, 'TV/Other');
const TVSport = createCategory(5060, 'TV/Sport');
const TVAnime = createCategory(5070, 'TV/Anime');
const TVDocumentary = createCategory(5080, 'TV/Documentary');

const XXX = createCategory(6000, 'XXX');
const XXXDVD = createCategory(6010, 'XXX/DVD');
const XXXWMV = createCategory(6020, 'XXX/WMV');
const XXXXviD = createCategory(6030, 'XXX/XviD');
const XXXx264 = createCategory(6040, 'XXX/x264');
const XXXUHD = createCategory(6045, 'XXX/UHD');
const XXXPack = createCategory(6050, 'XXX/Pack');
const XXXImageSet = createCategory(6060, 'XXX/ImageSet');
const XXXOther = createCategory(6070, 'XXX/Other');
const XXXSD = createCategory(6080, 'XXX/SD');
const XXXWEBDL = createCategory(6090, 'XXX/WEB-DL');

const Books = createCategory(7000, 'Books');
const BooksMags = createCategory(7010, 'Books/Mags');
const BooksEBook = createCategory(7020, 'Books/EBook');
const BooksComics = createCategory(7030, 'Books/Comics');
const BooksTechnical = createCategory(7040, 'Books/Technical');
const BooksOther = createCategory(7050, 'Books/Other');
const BooksForeign = createCategory(7060, 'Books/Foreign');

const Other = createCategory(8000, 'Other');
const OtherMisc = createCategory(8010, 'Other/Misc');
const OtherHashed = createCategory(8020, 'Other/Hashed');

// Initialize subcategories
Console.subCategories.push(
  ConsoleNDS, ConsolePSP, ConsoleWii, ConsoleXBox, ConsoleXBox360,
  ConsoleWiiware, ConsoleXBox360DLC, ConsolePS3, ConsoleOther,
  Console3DS, ConsolePSVita, ConsoleWiiU, ConsoleXBoxOne, ConsolePS4,
);
Movies.subCategories.push(
  MoviesForeign, MoviesOther, MoviesSD, MoviesHD, MoviesUHD,
  MoviesBluRay, Movies3D, MoviesDVD, MoviesWEBDL,
);
Audio.subCategories.push(
  AudioMP3, AudioVideo, AudioAudiobook, AudioLossless, AudioOther, AudioForeign,
);
PC.subCategories.push(
  PC0day, PCISO, PCMac, PCMobileOther, PCGames, PCMobileiOS, PCMobileAndroid,
);
TV.subCategories.push(
  TVWEBDL, TVForeign, TVSD, TVHD, TVUHD, TVOther, TVSport, TVAnime, TVDocumentary,
);
XXX.subCategories.push(
  XXXDVD, XXXWMV, XXXXviD, XXXx264, XXXUHD, XXXPack, XXXImageSet, XXXOther, XXXSD, XXXWEBDL,
);
Books.subCategories.push(
  BooksMags, BooksEBook, BooksComics, BooksTechnical, BooksOther, BooksForeign,
);
Other.subCategories.push(OtherMisc, OtherHashed);

export const TorznabCatType = {
  Console, ConsoleNDS, ConsolePSP, ConsoleWii, ConsoleXBox, ConsoleXBox360,
  ConsoleWiiware, ConsoleXBox360DLC, ConsolePS3, ConsoleOther,
  Console3DS, ConsolePSVita, ConsoleWiiU, ConsoleXBoxOne, ConsolePS4,

  Movies, MoviesForeign, MoviesOther, MoviesSD, MoviesHD, MoviesUHD,
  MoviesBluRay, Movies3D, MoviesDVD, MoviesWEBDL,

  Audio, AudioMP3, AudioVideo, AudioAudiobook, AudioLossless, AudioOther, AudioForeign,

  PC, PC0day, PCISO, PCMac, PCMobileOther, PCGames, PCMobileiOS, PCMobileAndroid,

  TV, TVWEBDL, TVForeign, TVSD, TVHD, TVUHD, TVOther, TVSport, TVAnime, TVDocumentary,

  XXX, XXXDVD, XXXWMV, XXXXviD, XXXx264, XXXUHD, XXXPack, XXXImageSet, XXXOther, XXXSD, XXXWEBDL,

  Books, BooksMags, BooksEBook, BooksComics, BooksTechnical, BooksOther, BooksForeign,

  Other, OtherMisc, OtherHashed,
} as const;

export function getParentCategories(): TorznabCategory[] {
  return [Console, Movies, Audio, PC, TV, XXX, Books, Other];
}

export function getAllCategories(): TorznabCategory[] {
  return [
    Console, ConsoleNDS, ConsolePSP, ConsoleWii, ConsoleXBox, ConsoleXBox360,
    ConsoleWiiware, ConsoleXBox360DLC, ConsolePS3, ConsoleOther,
    Console3DS, ConsolePSVita, ConsoleWiiU, ConsoleXBoxOne, ConsolePS4,
    Movies, MoviesForeign, MoviesOther, MoviesSD, MoviesHD, MoviesUHD,
    MoviesBluRay, Movies3D, MoviesDVD, MoviesWEBDL,
    Audio, AudioMP3, AudioVideo, AudioAudiobook, AudioLossless, AudioOther, AudioForeign,
    PC, PC0day, PCISO, PCMac, PCMobileOther, PCGames, PCMobileiOS, PCMobileAndroid,
    TV, TVWEBDL, TVForeign, TVSD, TVHD, TVUHD, TVOther, TVSport, TVAnime, TVDocumentary,
    XXX, XXXDVD, XXXWMV, XXXXviD, XXXx264, XXXUHD, XXXPack, XXXImageSet, XXXOther, XXXSD, XXXWEBDL,
    Books, BooksMags, BooksEBook, BooksComics, BooksTechnical, BooksOther, BooksForeign,
    Other, OtherMisc, OtherHashed,
  ];
}

export function getCatDesc(torznabCatId: number): string {
  return getAllCategories().find(c => c.id === torznabCatId)?.name ?? '';
}

export function getCatByName(name: string): TorznabCategory | undefined {
  return getAllCategories().find(c => c.name === name);
}
