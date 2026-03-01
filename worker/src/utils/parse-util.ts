const IMDB_ID_REGEX = /^(?:tt)?(\d{1,8})$/;

export function getFullImdbId(id: string | null | undefined): string | null {
  if (id == null) return null;
  const match = id.match(IMDB_ID_REGEX);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  if (num === 0) return null;
  return 'tt' + String(num).padStart(7, '0');
}

export function getImdbId(value: string | null | undefined): number | null {
  if (value == null) return null;
  const match = value.match(IMDB_ID_REGEX);
  if (!match) return null;
  return parseInt(match[1], 10);
}

function normalizeNumber(s: string, isInt: boolean = false): string {
  let valStr = s.replace(/[^\d.,]/g, '').trim();

  if (isInt) {
    if (valStr.includes(',') && valStr.includes('.')) return valStr;
    valStr = valStr.length === 0 ? '0' : valStr.replace(/\./g, ',');
    return valStr;
  }

  valStr = valStr.length === 0 ? '0' : valStr.replace(/,/g, '.');

  const dotCount = (valStr.match(/\./g) || []).length;
  if (dotCount > 1) {
    const lastDot = valStr.lastIndexOf('.');
    valStr = valStr.substring(0, lastDot).replace(/\./g, '') + valStr.substring(lastDot);
  }

  return valStr;
}

export function coerceInt(str: string): number {
  const normalized = normalizeNumber(str, true);
  const val = parseInt(normalized.replace(/,/g, ''), 10);
  if (isNaN(val)) throw new Error(`Cannot parse integer from: "${str}"`);
  return val;
}

export function coerceFloat(str: string): number {
  const normalized = normalizeNumber(str);
  const val = parseFloat(normalized);
  if (isNaN(val)) throw new Error(`Cannot parse float from: "${str}"`);
  return val;
}

export function getLong(str: string): number {
  const normalized = normalizeNumber(str, true);
  const val = parseInt(normalized.replace(/,/g, ''), 10);
  if (isNaN(val)) throw new Error(`Cannot parse long from: "${str}"`);
  return val;
}

export function normalizeSpace(s: string | null | undefined): string {
  return s?.trim() ?? '';
}

export function normalizeMultiSpaces(s: string): string {
  return normalizeSpace(s).replace(/\s+/g, ' ');
}

export function getBytes(str: string): number {
  let valStr = str.replace(/[^\d.,]/g, '').trim();
  valStr = valStr.length === 0 ? '0' : valStr.replace(/,/g, '.');
  const dotCount = (valStr.match(/\./g) || []).length;
  if (dotCount > 1) {
    const lastDot = valStr.lastIndexOf('.');
    valStr = valStr.substring(0, lastDot).replace(/\./g, '') + valStr.substring(lastDot);
  }
  const unit = str.replace(/[^a-zA-Z]/g, '').replace(/i/g, '').toLowerCase();
  const val = parseFloat(valStr);
  return getBytesFromUnit(unit, val);
}

export function getBytesFromUnit(unit: string, value: number): number {
  if (unit.includes('kb')) return Math.floor(value * 1024);
  if (unit.includes('mb')) return Math.floor(value * 1024 * 1024);
  if (unit.includes('gb')) return Math.floor(value * 1024 * 1024 * 1024);
  if (unit.includes('tb')) return Math.floor(value * 1024 * 1024 * 1024 * 1024);
  return Math.floor(value);
}

export function getLongFromString(str: string | null | undefined): number | null {
  if (str == null || str.trim().length === 0) return null;
  let extracted = '';
  for (const c of str) {
    if (c < '0' || c > '9') {
      if (extracted.length > 0) break;
      continue;
    }
    extracted += c;
  }
  return getLong(extracted);
}

export function getArgumentFromQueryString(
  url: string | null | undefined,
  argument: string | null | undefined,
): string | null {
  if (url == null || argument == null) return null;
  const qsPart = url.split('?')[1];
  if (!qsPart) return null;
  const cleaned = qsPart.split('#')[0];
  const params = new URLSearchParams(cleaned);
  return params.get(argument);
}
