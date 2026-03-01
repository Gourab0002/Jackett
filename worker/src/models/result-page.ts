import type { ReleaseInfo } from './release-info.js';
import type { ChannelInfo } from './channel-info.js';
import type { TorznabCapabilities } from './torznab-capabilities.js';
import { capabilitiesToXml } from './torznab-capabilities.js';
import {
  buildXml,
  escapeXml,
  removeInvalidXmlChars,
  xmlDateFormat,
  type XmlElement,
} from '../utils/xml-builder.js';

const ATOM_NS = 'http://www.w3.org/2005/Atom';
const TORZNAB_NS = 'http://torznab.com/schemas/2015/feed';

function torznabAttr(name: string, value: string | number | null | undefined): XmlElement | null {
  if (value == null) return null;
  return {
    name: 'torznab:attr',
    attributes: { name, value: String(value) },
  };
}

function formatImdbPadded(imdb: number | undefined): string | null {
  if (imdb == null) return null;
  return String(imdb).padStart(7, '0');
}

function releaseToItem(r: ReleaseInfo): XmlElement {
  const link = r.link ?? r.magnetUri ?? '';
  const pubDate =
    r.publishDate.getTime() === 0
      ? xmlDateFormat(new Date())
      : xmlDateFormat(r.publishDate);

  const torznabAttrs: (XmlElement | null)[] = [];

  // category torznab attrs
  if (r.category) {
    for (const c of r.category) {
      torznabAttrs.push(torznabAttr('category', c));
    }
  }

  torznabAttrs.push(torznabAttr('rageid', r.rageID));
  torznabAttrs.push(torznabAttr('tvdbid', r.tvdbId));
  torznabAttrs.push(torznabAttr('imdb', formatImdbPadded(r.imdb)));
  torznabAttrs.push(
    torznabAttr('imdbid', r.imdb != null ? 'tt' + formatImdbPadded(r.imdb) : undefined),
  );
  torznabAttrs.push(torznabAttr('tmdbid', r.tmdb));
  torznabAttrs.push(torznabAttr('tvmazeid', r.tvMazeId));
  torznabAttrs.push(torznabAttr('traktid', r.traktId));
  torznabAttrs.push(torznabAttr('doubanid', r.doubanId));

  if (r.genres && r.genres.length > 0) {
    torznabAttrs.push(torznabAttr('genre', r.genres.join(', ')));
  }

  if (r.languages) {
    for (const lang of r.languages) {
      torznabAttrs.push(torznabAttr('language', lang));
    }
  }
  if (r.subs) {
    for (const sub of r.subs) {
      torznabAttrs.push(torznabAttr('subs', sub));
    }
  }

  torznabAttrs.push(torznabAttr('year', r.year));
  torznabAttrs.push(torznabAttr('author', removeInvalidXmlChars(r.author)));
  torznabAttrs.push(torznabAttr('booktitle', removeInvalidXmlChars(r.bookTitle)));
  torznabAttrs.push(torznabAttr('publisher', removeInvalidXmlChars(r.publisher)));
  torznabAttrs.push(torznabAttr('artist', removeInvalidXmlChars(r.artist)));
  torznabAttrs.push(torznabAttr('album', removeInvalidXmlChars(r.album)));
  torznabAttrs.push(torznabAttr('label', removeInvalidXmlChars(r.label)));
  torznabAttrs.push(torznabAttr('track', removeInvalidXmlChars(r.track)));
  torznabAttrs.push(torznabAttr('seeders', r.seeders));
  torznabAttrs.push(torznabAttr('peers', r.peers));
  torznabAttrs.push(torznabAttr('coverurl', r.poster));
  torznabAttrs.push(torznabAttr('infohash', removeInvalidXmlChars(r.infoHash)));
  torznabAttrs.push(torznabAttr('magneturl', r.magnetUri));
  torznabAttrs.push(torznabAttr('minimumratio', r.minimumRatio));
  torznabAttrs.push(torznabAttr('minimumseedtime', r.minimumSeedTime));
  torznabAttrs.push(torznabAttr('downloadvolumefactor', r.downloadVolumeFactor));
  torznabAttrs.push(torznabAttr('uploadvolumefactor', r.uploadVolumeFactor));

  const children: (XmlElement | null)[] = [
    { name: 'title', text: removeInvalidXmlChars(r.title) ?? '' },
    { name: 'guid', text: r.guid ?? '' },
  ];

  if (r.origin) {
    children.push({
      name: 'jackettindexer',
      attributes: { id: r.origin.id },
      text: r.origin.name,
    });
    children.push({ name: 'type', text: r.origin.type });
  }

  if (r.details) {
    children.push({ name: 'comments', text: r.details });
  }

  children.push({ name: 'pubDate', text: pubDate });

  if (r.size != null) {
    children.push({ name: 'size', text: String(r.size) });
  }
  if (r.files != null) {
    children.push({ name: 'files', text: String(r.files) });
  }
  if (r.grabs != null) {
    children.push({ name: 'grabs', text: String(r.grabs) });
  }

  children.push({ name: 'description', text: removeInvalidXmlChars(r.description) ?? '' });
  children.push({ name: 'link', text: link });

  // category elements
  if (r.category) {
    for (const c of r.category) {
      children.push({ name: 'category', text: String(c) });
    }
  }

  // enclosure
  const enclosureAttrs: Record<string, string | number | undefined> = {
    url: link,
    type: 'application/x-bittorrent',
  };
  if (r.size != null) {
    enclosureAttrs.length = r.size;
  }
  children.push({ name: 'enclosure', attributes: enclosureAttrs });

  // add torznab attributes
  children.push(...torznabAttrs);

  return {
    name: 'item',
    children,
  };
}

export function resultPageToXml(
  channelInfo: ChannelInfo,
  releases: ReleaseInfo[],
  selfAtomUrl: string,
): string {
  const items = releases.map(releaseToItem);

  const root: XmlElement = {
    name: 'rss',
    attributes: {
      version: '2.0',
      'xmlns:atom': ATOM_NS,
      'xmlns:torznab': TORZNAB_NS,
    },
    children: [
      {
        name: 'channel',
        children: [
          {
            name: 'atom:link',
            attributes: {
              href: selfAtomUrl,
              rel: 'self',
              type: 'application/rss+xml',
            },
          },
          { name: 'title', text: channelInfo.title },
          { name: 'description', text: channelInfo.description },
          { name: 'link', text: channelInfo.link },
          { name: 'language', text: channelInfo.language },
          { name: 'category', text: channelInfo.category },
          ...items,
        ],
      },
    ],
  };

  return buildXml(root);
}

export function createErrorXml(code: number, description: string): string {
  const root: XmlElement = {
    name: 'error',
    attributes: {
      code: String(code),
      description: description,
    },
  };
  return buildXml(root);
}

export { capabilitiesToXml };
