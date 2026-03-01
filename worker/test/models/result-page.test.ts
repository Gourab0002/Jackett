import { describe, it, expect } from 'vitest';
import { resultPageToXml, createErrorXml } from '../../src/models/result-page.js';
import { createReleaseInfo } from '../../src/models/release-info.js';
import { createChannelInfo } from '../../src/models/channel-info.js';

describe('result-page', () => {
  const channel = createChannelInfo({
    title: 'Test Indexer',
    description: 'A test indexer',
    link: 'https://example.com',
    language: 'en-US',
    category: 'search',
  });

  describe('resultPageToXml', () => {
    it('generates valid XML declaration', () => {
      const xml = resultPageToXml(channel, [], 'https://example.com');
      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    });

    it('generates RSS 2.0 root element', () => {
      const xml = resultPageToXml(channel, [], 'https://example.com');
      expect(xml).toContain('version="2.0"');
      expect(xml).toContain('<rss');
    });

    it('includes torznab namespace', () => {
      const xml = resultPageToXml(channel, [], 'https://example.com');
      expect(xml).toContain('xmlns:torznab="http://torznab.com/schemas/2015/feed"');
    });

    it('includes atom namespace', () => {
      const xml = resultPageToXml(channel, [], 'https://example.com');
      expect(xml).toContain('xmlns:atom="http://www.w3.org/2005/Atom"');
    });

    it('contains channel info', () => {
      const xml = resultPageToXml(channel, [], 'https://example.com');
      expect(xml).toContain('<title>Test Indexer</title>');
      expect(xml).toContain('<description>A test indexer</description>');
      expect(xml).toContain('<link>https://example.com</link>');
      expect(xml).toContain('<language>en-US</language>');
    });

    it('contains atom:link with self reference', () => {
      const xml = resultPageToXml(channel, [], 'https://example.com');
      expect(xml).toContain('href="https://example.com"');
      expect(xml).toContain('rel="self"');
    });

    it('includes release items', () => {
      const release = createReleaseInfo({
        title: 'Test Release',
        guid: 'guid-123',
        link: 'https://example.com/download/1',
        publishDate: new Date('2023-06-15T12:00:00Z'),
        category: [2000],
        size: 1073741824,
        seeders: 10,
        peers: 20,
      });

      const xml = resultPageToXml(channel, [release], 'https://example.com');
      expect(xml).toContain('<item>');
      expect(xml).toContain('<title>Test Release</title>');
      expect(xml).toContain('<guid>guid-123</guid>');
      expect(xml).toContain('<size>1073741824</size>');
      expect(xml).toContain('<link>https://example.com/download/1</link>');
    });

    it('includes torznab attributes for seeders and peers', () => {
      const release = createReleaseInfo({
        title: 'Test',
        publishDate: new Date('2023-01-01'),
        category: [],
        seeders: 10,
        peers: 20,
      });

      const xml = resultPageToXml(channel, [release], 'https://example.com');
      expect(xml).toContain('name="seeders" value="10"');
      expect(xml).toContain('name="peers" value="20"');
    });

    it('includes torznab category attributes', () => {
      const release = createReleaseInfo({
        title: 'Test',
        publishDate: new Date('2023-01-01'),
        category: [2000, 5000],
      });

      const xml = resultPageToXml(channel, [release], 'https://example.com');
      expect(xml).toContain('name="category" value="2000"');
      expect(xml).toContain('name="category" value="5000"');
    });

    it('includes IMDB attributes when set', () => {
      const release = createReleaseInfo({
        title: 'Test',
        publishDate: new Date('2023-01-01'),
        category: [],
        imdb: 1234567,
      });

      const xml = resultPageToXml(channel, [release], 'https://example.com');
      expect(xml).toContain('name="imdb" value="1234567"');
      expect(xml).toContain('name="imdbid" value="tt1234567"');
    });

    it('pads short IMDB IDs', () => {
      const release = createReleaseInfo({
        title: 'Test',
        publishDate: new Date('2023-01-01'),
        category: [],
        imdb: 123,
      });

      const xml = resultPageToXml(channel, [release], 'https://example.com');
      expect(xml).toContain('name="imdb" value="0000123"');
      expect(xml).toContain('name="imdbid" value="tt0000123"');
    });

    it('includes enclosure element', () => {
      const release = createReleaseInfo({
        title: 'Test',
        link: 'https://example.com/download/1',
        publishDate: new Date('2023-01-01'),
        category: [],
        size: 500,
      });

      const xml = resultPageToXml(channel, [release], 'https://example.com');
      expect(xml).toContain('<enclosure');
      expect(xml).toContain('url="https://example.com/download/1"');
      expect(xml).toContain('type="application/x-bittorrent"');
      expect(xml).toContain('length="500"');
    });

    it('uses magnetUri as fallback link', () => {
      const release = createReleaseInfo({
        title: 'Test',
        magnetUri: 'magnet:?xt=urn:btih:abc123',
        publishDate: new Date('2023-01-01'),
        category: [],
      });

      const xml = resultPageToXml(channel, [release], 'https://example.com');
      expect(xml).toContain('<link>magnet:?xt=urn:btih:abc123</link>');
    });

    it('handles null/undefined fields gracefully', () => {
      const release = createReleaseInfo({
        publishDate: new Date('2023-01-01'),
        category: [],
      });

      // Should not throw
      const xml = resultPageToXml(channel, [release], 'https://example.com');
      expect(xml).toContain('<item>');
      expect(xml).toContain('<title></title>');
    });

    it('handles multiple releases', () => {
      const releases = [
        createReleaseInfo({ title: 'Release 1', publishDate: new Date(), category: [] }),
        createReleaseInfo({ title: 'Release 2', publishDate: new Date(), category: [] }),
      ];

      const xml = resultPageToXml(channel, releases, 'https://example.com');
      expect(xml).toContain('Release 1');
      expect(xml).toContain('Release 2');
    });
  });

  describe('createErrorXml', () => {
    it('generates XML with error element', () => {
      const xml = createErrorXml(201, 'Indexer not found');
      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<error');
      expect(xml).toContain('code="201"');
      expect(xml).toContain('description="Indexer not found"');
    });

    it('generates self-closing error tag', () => {
      const xml = createErrorXml(100, 'Test error');
      expect(xml).toContain('/>');
    });

    it('escapes special characters in description', () => {
      const xml = createErrorXml(100, 'Error: <invalid> & "bad"');
      expect(xml).toContain('&lt;invalid&gt;');
      expect(xml).toContain('&amp;');
      expect(xml).toContain('&quot;bad&quot;');
    });
  });
});
