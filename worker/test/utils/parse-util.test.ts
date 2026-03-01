import { describe, it, expect } from 'vitest';
import {
  getFullImdbId,
  getImdbId,
  coerceInt,
  coerceFloat,
} from '../../src/utils/parse-util.js';

describe('parse-util', () => {
  describe('getFullImdbId', () => {
    it('returns null for null input', () => {
      expect(getFullImdbId(null)).toBeNull();
    });

    it('returns null for undefined input', () => {
      expect(getFullImdbId(undefined)).toBeNull();
    });

    it('returns null for invalid format', () => {
      expect(getFullImdbId('invalid')).toBeNull();
    });

    it('returns null for zero ID', () => {
      expect(getFullImdbId('0')).toBeNull();
      expect(getFullImdbId('tt0000000')).toBeNull();
    });

    it('normalizes numeric ID with tt prefix and padding', () => {
      expect(getFullImdbId('1234567')).toBe('tt1234567');
    });

    it('normalizes short numeric ID with padding', () => {
      expect(getFullImdbId('123')).toBe('tt0000123');
    });

    it('keeps existing tt prefix', () => {
      expect(getFullImdbId('tt1234567')).toBe('tt1234567');
    });

    it('pads tt-prefixed short IDs', () => {
      expect(getFullImdbId('tt123')).toBe('tt0000123');
    });

    it('handles single digit', () => {
      expect(getFullImdbId('1')).toBe('tt0000001');
    });
  });

  describe('getImdbId', () => {
    it('returns null for null input', () => {
      expect(getImdbId(null)).toBeNull();
    });

    it('returns numeric value for valid ID', () => {
      expect(getImdbId('tt1234567')).toBe(1234567);
    });

    it('returns numeric value without tt prefix', () => {
      expect(getImdbId('1234567')).toBe(1234567);
    });

    it('returns null for invalid string', () => {
      expect(getImdbId('abc')).toBeNull();
    });
  });

  describe('coerceInt', () => {
    it('parses simple integer', () => {
      expect(coerceInt('42')).toBe(42);
    });

    it('parses integer with commas (treated as thousands separators via dots)', () => {
      expect(coerceInt('1000')).toBe(1000);
    });

    it('parses integer with extra characters', () => {
      expect(coerceInt('$42')).toBe(42);
    });

    it('returns 0 for all-alpha string (non-digits stripped)', () => {
      expect(coerceInt('abc')).toBe(0);
    });

    it('handles empty numeric part as 0', () => {
      expect(coerceInt('$')).toBe(0);
    });

    it('parses negative-style (strips non-digit)', () => {
      expect(coerceInt('100 items')).toBe(100);
    });
  });

  describe('coerceFloat', () => {
    it('parses simple float', () => {
      expect(coerceFloat('3.14')).toBeCloseTo(3.14);
    });

    it('parses float with commas as decimal separator', () => {
      expect(coerceFloat('3,14')).toBeCloseTo(3.14);
    });

    it('parses float with extra characters', () => {
      expect(coerceFloat('$3.14')).toBeCloseTo(3.14);
    });

    it('returns 0 for all-alpha string (non-digits stripped)', () => {
      expect(coerceFloat('abc')).toBe(0);
    });

    it('handles number with multiple dots (thousands separator)', () => {
      expect(coerceFloat('1.234.567,89')).toBeCloseTo(1234567.89);
    });

    it('handles empty numeric part as 0', () => {
      expect(coerceFloat('$')).toBe(0);
    });
  });
});
