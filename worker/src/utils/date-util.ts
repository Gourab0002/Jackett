import { coerceFloat, normalizeSpace } from './parse-util.js';

const TIME_AGO_REGEX = /(?:^|\b)ago\b/i;
const TODAY_REGEX = /\btoday(?:[\s,]+(?:at)?\s*|[\s,]*|$)/i;
const TOMORROW_REGEX = /\btomorrow(?:[\s,]+(?:at)?\s*|[\s,]*|$)/i;
const YESTERDAY_REGEX = /\byesterday(?:[\s,]+(?:at)?\s*|[\s,]*|$)/i;
const DAYS_OF_WEEK_REGEX = /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+at\s+/i;
const MISSING_YEAR_REGEX = /^(\d{1,2}-\d{1,2})(\s|$)/;
const MISSING_YEAR_REGEX2 = /^(\d{1,2}\s+\w{3})\s+(\d{1,2}:\d{1,2}.*)$/;
const TIME_AGO_PART_REGEX = /\s*?([\d.]+)\s*?([^\d\s.]+)\s*?/g;

const DAY_NAME_MAP: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

function isAllDigits(str: string): boolean {
  return /^\d+$/.test(str);
}

function parseTimeSpan(time: string): number {
  if (!time || time.trim().length === 0) return 0;
  const cleaned = time.trim();
  const match = cleaned.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (match) {
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const seconds = match[3] ? parseInt(match[3], 10) : 0;
    return (hours * 3600 + minutes * 60 + seconds) * 1000;
  }
  // Try to parse as a date to extract time
  const d = new Date('1970-01-01 ' + cleaned);
  if (!isNaN(d.getTime())) {
    return d.getHours() * 3600000 + d.getMinutes() * 60000 + d.getSeconds() * 1000;
  }
  return 0;
}

function setDateMidnight(dt: Date): Date {
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
}

export function unixTimestampToDate(unixTime: number): Date {
  return new Date(unixTime * 1000);
}

export function dateToUnixTimestamp(dt: Date): number {
  return Math.floor(dt.getTime() / 1000);
}

export function fromTimeAgo(str: string, relativeFrom?: Date): Date {
  let s = str.toLowerCase();
  const now = relativeFrom ?? new Date();

  if (s.includes('now')) return new Date(now.getTime());

  s = s.replace(/,/g, '').replace(/ago/g, '').replace(/and/g, '');

  let totalMs = 0;
  let match: RegExpExecArray | null;
  const regex = new RegExp(TIME_AGO_PART_REGEX.source, 'g');

  while ((match = regex.exec(s)) !== null) {
    const val = coerceFloat(match[1]);
    const unit = match[2];

    if (unit.includes('sec') || unit === 's') totalMs += val * 1000;
    else if (unit.includes('min') || unit === 'm') totalMs += val * 60 * 1000;
    else if (unit.includes('hour') || unit.includes('hr') || unit === 'h') totalMs += val * 3600 * 1000;
    else if (unit.includes('day') || unit === 'd') totalMs += val * 86400 * 1000;
    else if (unit.includes('week') || unit.includes('wk') || unit === 'w') totalMs += val * 7 * 86400 * 1000;
    else if (unit.includes('month') || unit === 'mo') totalMs += val * 30 * 86400 * 1000;
    else if (unit.includes('year') || unit === 'y') totalMs += val * 365 * 86400 * 1000;
    else throw new Error('TimeAgo parsing failed, unknown unit: ' + unit);
  }

  return new Date(now.getTime() - totalMs);
}

export function fromFuzzyTime(dateStr: string, _format?: string): Date {
  const str = normalizeSpace(dateStr);
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return parsed;
  throw new Error(`FromFuzzyTime parsing failed for "${str}"`);
}

function fromFuzzyPastTime(str: string, format: string | undefined, now: Date): Date {
  const result = fromFuzzyTime(str, format);
  if (result > now) {
    result.setFullYear(result.getFullYear() - 1);
  }
  return result;
}

export function fromUnknown(dateStr: string, format?: string, relativeFrom?: Date): Date {
  try {
    const str = normalizeSpace(dateStr);
    const now = relativeFrom ?? new Date();

    // try RFC 1123 and standard date parsing
    const rfc = new Date(str);
    if (!isNaN(rfc.getTime()) && !isAllDigits(str) && !TIME_AGO_REGEX.test(str)) {
      return rfc;
    }

    // try parsing as unix timestamp
    if (isAllDigits(str)) {
      const ts = parseInt(str, 10);
      if (!isNaN(ts)) return unixTimestampToDate(ts);
    }

    if (str.toLowerCase().includes('now')) return new Date(now.getTime());

    // ... ago
    if (TIME_AGO_REGEX.test(str)) {
      return fromTimeAgo(str, now);
    }

    // Today ...
    let match = str.match(TODAY_REGEX);
    if (match) {
      const time = str.replace(match[0], '');
      const dt = setDateMidnight(now);
      return new Date(dt.getTime() + parseTimeSpan(time));
    }

    // Yesterday ...
    match = str.match(YESTERDAY_REGEX);
    if (match) {
      const time = str.replace(match[0], '');
      const dt = setDateMidnight(now);
      return new Date(dt.getTime() + parseTimeSpan(time) - 86400000);
    }

    // Tomorrow ...
    match = str.match(TOMORROW_REGEX);
    if (match) {
      const time = str.replace(match[0], '');
      const dt = setDateMidnight(now);
      return new Date(dt.getTime() + parseTimeSpan(time) + 86400000);
    }

    // [day of the week] at ...
    match = str.match(DAYS_OF_WEEK_REGEX);
    if (match) {
      const time = str.replace(match[0], '');
      const dt = setDateMidnight(now);
      const targetDay = DAY_NAME_MAP[match[1].toLowerCase()];
      const result = new Date(dt.getTime() + parseTimeSpan(time));
      while (result.getDay() !== targetDay) {
        result.setDate(result.getDate() - 1);
      }
      return result;
    }

    // add missing year: "01-15" -> "2024-01-15"
    match = str.match(MISSING_YEAR_REGEX);
    if (match) {
      const date = match[1];
      const newStr = str.replace(date, now.getFullYear() + '-' + date);
      return fromFuzzyPastTime(newStr, format, now);
    }

    // add missing year 2: "1 Jan 10:30" -> "1 Jan 2024 10:30"
    match = str.match(MISSING_YEAR_REGEX2);
    if (match) {
      const newStr = match[1] + ' ' + now.getFullYear() + ' ' + match[2];
      return fromFuzzyPastTime(newStr, format, now);
    }

    return fromFuzzyTime(str, format);
  } catch (ex) {
    const msg = ex instanceof Error ? ex.message : String(ex);
    throw new Error(`DateTime parsing failed for "${dateStr}": ${msg}`);
  }
}
