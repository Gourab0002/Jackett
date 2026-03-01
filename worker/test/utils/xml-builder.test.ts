import { describe, it, expect } from 'vitest';
import {
  escapeXml,
  removeInvalidXmlChars,
  buildXml,
  xmlDateFormat,
  type XmlElement,
} from '../../src/utils/xml-builder.js';

describe('xml-builder', () => {
  describe('escapeXml', () => {
    it('escapes ampersand', () => {
      expect(escapeXml('foo & bar')).toBe('foo &amp; bar');
    });

    it('escapes less than', () => {
      expect(escapeXml('a < b')).toBe('a &lt; b');
    });

    it('escapes greater than', () => {
      expect(escapeXml('a > b')).toBe('a &gt; b');
    });

    it('escapes double quotes', () => {
      expect(escapeXml('say "hello"')).toBe('say &quot;hello&quot;');
    });

    it('escapes single quotes', () => {
      expect(escapeXml("it's")).toBe('it&apos;s');
    });

    it('escapes all special characters together', () => {
      expect(escapeXml('<tag attr="val & \'x\">'))
        .toBe('&lt;tag attr=&quot;val &amp; &apos;x&quot;&gt;');
    });

    it('returns unchanged string with no special chars', () => {
      expect(escapeXml('hello world')).toBe('hello world');
    });
  });

  describe('removeInvalidXmlChars', () => {
    it('returns null for null input', () => {
      expect(removeInvalidXmlChars(null)).toBeNull();
    });

    it('returns null for undefined input', () => {
      expect(removeInvalidXmlChars(undefined)).toBeNull();
    });

    it('removes control characters', () => {
      expect(removeInvalidXmlChars('hello\x00world')).toBe('helloworld');
      expect(removeInvalidXmlChars('test\x01\x02\x03')).toBe('test');
    });

    it('preserves normal text', () => {
      expect(removeInvalidXmlChars('Hello World 123!')).toBe('Hello World 123!');
    });

    it('preserves tab, newline, and carriage return', () => {
      expect(removeInvalidXmlChars('line1\nline2\ttab\r')).toBe('line1\nline2\ttab\r');
    });

    it('removes BOM character', () => {
      expect(removeInvalidXmlChars('\uFEFFhello')).toBe('hello');
    });
  });

  describe('buildXml', () => {
    it('generates XML declaration', () => {
      const el: XmlElement = { name: 'root' };
      const xml = buildXml(el);
      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    });

    it('generates self-closing tag for element without children or text', () => {
      const el: XmlElement = { name: 'empty' };
      const xml = buildXml(el);
      expect(xml).toContain('<empty/>');
    });

    it('generates element with text content', () => {
      const el: XmlElement = { name: 'title', text: 'Hello World' };
      const xml = buildXml(el);
      expect(xml).toContain('<title>Hello World</title>');
    });

    it('escapes text content', () => {
      const el: XmlElement = { name: 'desc', text: 'A & B' };
      const xml = buildXml(el);
      expect(xml).toContain('<desc>A &amp; B</desc>');
    });

    it('generates element with attributes', () => {
      const el: XmlElement = {
        name: 'item',
        attributes: { id: '1', name: 'test' },
      };
      const xml = buildXml(el);
      expect(xml).toContain('id="1"');
      expect(xml).toContain('name="test"');
    });

    it('escapes attribute values', () => {
      const el: XmlElement = {
        name: 'item',
        attributes: { desc: 'a "quoted" & <value>' },
      };
      const xml = buildXml(el);
      expect(xml).toContain('desc="a &quot;quoted&quot; &amp; &lt;value&gt;"');
    });

    it('skips null/undefined attribute values', () => {
      const el: XmlElement = {
        name: 'item',
        attributes: { id: '1', skip: undefined },
      };
      const xml = buildXml(el);
      expect(xml).toContain('id="1"');
      expect(xml).not.toContain('skip');
    });

    it('generates nested elements', () => {
      const el: XmlElement = {
        name: 'root',
        children: [
          { name: 'child1', text: 'a' },
          { name: 'child2', text: 'b' },
        ],
      };
      const xml = buildXml(el);
      expect(xml).toContain('<root><child1>a</child1><child2>b</child2></root>');
    });

    it('skips null children', () => {
      const el: XmlElement = {
        name: 'root',
        children: [
          { name: 'child', text: 'a' },
          null,
          undefined,
        ],
      };
      const xml = buildXml(el);
      expect(xml).toContain('<root><child>a</child></root>');
    });
  });

  describe('xmlDateFormat', () => {
    it('formats a date in RFC 822 style', () => {
      // Use a fixed UTC date to avoid timezone issues in testing
      const dt = new Date('2023-06-15T10:30:45Z');
      const formatted = xmlDateFormat(dt);

      // Check basic structure: Day, DD Mon YYYY HH:MM:SS ±HHMM
      expect(formatted).toMatch(/^\w{3}, \d{2} \w{3} \d{4} \d{2}:\d{2}:\d{2} [+-]\d{4}$/);
    });

    it('contains correct day name', () => {
      const sunday = new Date('2023-01-01T00:00:00Z');
      const formatted = xmlDateFormat(sunday);
      expect(formatted).toMatch(/^Sun,/);
    });

    it('pads single-digit day', () => {
      const dt = new Date('2023-01-05T00:00:00Z');
      const formatted = xmlDateFormat(dt);
      expect(formatted).toMatch(/, 0[45] Jan/);
    });
  });
});
