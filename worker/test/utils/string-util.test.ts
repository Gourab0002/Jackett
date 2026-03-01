import { describe, it, expect } from 'vitest';
import {
  makeValidFileName,
  isNullOrWhiteSpace,
  isNotNullOrWhiteSpace,
  containsIgnoreCase,
} from '../../src/utils/string-util.js';

describe('string-util', () => {
  describe('makeValidFileName', () => {
    it('replaces invalid characters with underscore by default', () => {
      expect(makeValidFileName('file<>name')).toBe('file__name');
    });

    it('replaces colon and pipe', () => {
      expect(makeValidFileName('file:name|test')).toBe('file_name_test');
    });

    it('replaces question mark and asterisk', () => {
      expect(makeValidFileName('file?name*.txt')).toBe('file_name_.txt');
    });

    it('replaces double quotes', () => {
      expect(makeValidFileName('file"name"')).toBe('file_name_');
    });

    it('replaces backslash and forward slash', () => {
      expect(makeValidFileName('path\\to/file')).toBe('path_to_file');
    });

    it('uses custom replacement character', () => {
      expect(makeValidFileName('file<name', '-')).toBe('file-name');
    });

    it('returns underscore for empty result', () => {
      expect(makeValidFileName('')).toBe('_');
    });

    it('preserves valid characters', () => {
      expect(makeValidFileName('valid-file_name (1).txt')).toBe('valid-file_name (1).txt');
    });

    it('strips diacritics when removeDiacritics is true', () => {
      expect(makeValidFileName('café', '_', true)).toBe('cafe');
    });

    it('keeps diacritics when removeDiacritics is false', () => {
      expect(makeValidFileName('café', '_', false)).toBe('café');
    });

    it('removes control characters', () => {
      expect(makeValidFileName('hello\x00world')).toBe('hello_world');
    });
  });

  describe('isNullOrWhiteSpace', () => {
    it('returns true for null', () => {
      expect(isNullOrWhiteSpace(null)).toBe(true);
    });

    it('returns true for undefined', () => {
      expect(isNullOrWhiteSpace(undefined)).toBe(true);
    });

    it('returns true for empty string', () => {
      expect(isNullOrWhiteSpace('')).toBe(true);
    });

    it('returns true for whitespace only', () => {
      expect(isNullOrWhiteSpace('   ')).toBe(true);
      expect(isNullOrWhiteSpace('\t\n')).toBe(true);
    });

    it('returns false for non-empty string', () => {
      expect(isNullOrWhiteSpace('hello')).toBe(false);
    });

    it('returns false for string with leading/trailing spaces', () => {
      expect(isNullOrWhiteSpace('  hello  ')).toBe(false);
    });
  });

  describe('isNotNullOrWhiteSpace', () => {
    it('returns false for null', () => {
      expect(isNotNullOrWhiteSpace(null)).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isNotNullOrWhiteSpace('')).toBe(false);
    });

    it('returns true for non-empty string', () => {
      expect(isNotNullOrWhiteSpace('hello')).toBe(true);
    });
  });

  describe('containsIgnoreCase', () => {
    it('finds substring case-insensitively', () => {
      expect(containsIgnoreCase('Hello World', 'hello')).toBe(true);
    });

    it('finds exact match', () => {
      expect(containsIgnoreCase('Hello', 'Hello')).toBe(true);
    });

    it('finds uppercase in lowercase', () => {
      expect(containsIgnoreCase('hello world', 'WORLD')).toBe(true);
    });

    it('returns false when not found', () => {
      expect(containsIgnoreCase('hello world', 'xyz')).toBe(false);
    });

    it('handles empty search string', () => {
      expect(containsIgnoreCase('hello', '')).toBe(true);
    });
  });
});
