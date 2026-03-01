export interface XmlElement {
  name: string;
  attributes?: Record<string, string | number | undefined>;
  children?: (XmlElement | string | null | undefined)[];
  text?: string;
}

export function buildXml(root: XmlElement): string {
  return '<?xml version="1.0" encoding="UTF-8"?>\n' + renderElement(root);
}

function renderElement(el: XmlElement): string {
  const parts: string[] = [];
  parts.push('<');
  parts.push(el.name);

  if (el.attributes) {
    for (const [key, value] of Object.entries(el.attributes)) {
      if (value == null) continue;
      parts.push(` ${key}="${escapeXml(String(value))}"`);
    }
  }

  const hasChildren = el.children && el.children.length > 0;
  const hasText = el.text != null;

  if (!hasChildren && !hasText) {
    parts.push('/>');
    return parts.join('');
  }

  parts.push('>');

  if (hasText) {
    parts.push(escapeXml(el.text!));
  }

  if (hasChildren) {
    for (const child of el.children!) {
      if (child == null) continue;
      if (typeof child === 'string') {
        parts.push(escapeXml(child));
      } else {
        parts.push(renderElement(child));
      }
    }
  }

  parts.push(`</${el.name}>`);
  return parts.join('');
}

export function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function removeInvalidXmlChars(text: string | null | undefined): string | null {
  if (text == null) return null;
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\uFEFF\uFFFE\uFFFF]/g, '')
    .replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, '');
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function pad2(n: number): string {
  return n < 10 ? '0' + n : String(n);
}

export function xmlDateFormat(dt: Date): string {
  const day = DAY_NAMES[dt.getDay()];
  const dd = pad2(dt.getDate());
  const mon = MONTH_NAMES[dt.getMonth()];
  const yyyy = dt.getFullYear();
  const hh = pad2(dt.getHours());
  const mm = pad2(dt.getMinutes());
  const ss = pad2(dt.getSeconds());

  const tzOffset = -dt.getTimezoneOffset();
  const sign = tzOffset >= 0 ? '+' : '-';
  const absOffset = Math.abs(tzOffset);
  const tzHours = pad2(Math.floor(absOffset / 60));
  const tzMins = pad2(absOffset % 60);

  return `${day}, ${dd} ${mon} ${yyyy} ${hh}:${mm}:${ss} ${sign}${tzHours}${tzMins}`;
}
