// Characters invalid in file names (POSIX + Windows superset)
const INVALID_FILENAME_CHARS = /[<>:"/\\|?*\x00-\x1F]/g;

export function makeValidFileName(
  title: string,
  replacement: string = '_',
  removeDiacritics: boolean = false,
): string {
  let text = removeDiacritics ? stripDiacritics(title) : title;
  text = text.replace(INVALID_FILENAME_CHARS, replacement);
  return text.length === 0 ? '_' : text;
}

function stripDiacritics(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function isNullOrWhiteSpace(str: string | null | undefined): boolean {
  return str == null || str.trim().length === 0;
}

export function isNotNullOrWhiteSpace(str: string | null | undefined): boolean {
  return !isNullOrWhiteSpace(str);
}

export function containsIgnoreCase(str: string, search: string): boolean {
  return str.toLowerCase().includes(search.toLowerCase());
}
