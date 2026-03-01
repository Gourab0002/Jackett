import { describe, it, expect } from 'vitest';
import {
  createReleaseInfo,
  cloneReleaseInfo,
  gigabytesFromBytes,
  getGain,
} from '../../src/models/release-info.js';

describe('ReleaseInfo', () => {
  describe('createReleaseInfo', () => {
    it('creates with default values', () => {
      const r = createReleaseInfo();
      expect(r.publishDate).toBeInstanceOf(Date);
      expect(r.category).toEqual([]);
      expect(r.languages).toEqual([]);
      expect(r.subs).toEqual([]);
      expect(r.title).toBeUndefined();
      expect(r.size).toBeUndefined();
      expect(r.seeders).toBeUndefined();
    });

    it('merges partial values', () => {
      const r = createReleaseInfo({
        title: 'Test Release',
        size: 1073741824,
        category: [2000],
        seeders: 10,
      });
      expect(r.title).toBe('Test Release');
      expect(r.size).toBe(1073741824);
      expect(r.category).toEqual([2000]);
      expect(r.seeders).toBe(10);
      expect(r.languages).toEqual([]);
    });
  });

  describe('cloneReleaseInfo', () => {
    it('creates a deep copy', () => {
      const original = createReleaseInfo({
        title: 'Original',
        category: [2000, 5000],
        languages: ['en'],
        subs: ['fr'],
        genres: ['action', 'drama'],
        origin: { id: 'test', name: 'Test', type: 'public' },
      });

      const clone = cloneReleaseInfo(original);
      expect(clone.title).toBe('Original');
      expect(clone.category).toEqual([2000, 5000]);
      expect(clone.languages).toEqual(['en']);
      expect(clone.genres).toEqual(['action', 'drama']);
      expect(clone.origin).toEqual({ id: 'test', name: 'Test', type: 'public' });
    });

    it('mutating clone does not affect original', () => {
      const original = createReleaseInfo({
        title: 'Original',
        category: [2000],
        languages: ['en'],
        subs: [],
        genres: ['action'],
      });

      const clone = cloneReleaseInfo(original);
      clone.title = 'Modified';
      clone.category.push(5000);
      clone.languages.push('fr');
      clone.genres!.push('comedy');

      expect(original.title).toBe('Original');
      expect(original.category).toEqual([2000]);
      expect(original.languages).toEqual(['en']);
      expect(original.genres).toEqual(['action']);
    });

    it('deep copies publishDate', () => {
      const date = new Date('2023-06-15T12:00:00Z');
      const original = createReleaseInfo({ publishDate: date });
      const clone = cloneReleaseInfo(original);

      clone.publishDate.setFullYear(2020);
      expect(original.publishDate.getFullYear()).toBe(2023);
    });

    it('handles undefined genres and origin', () => {
      const original = createReleaseInfo();
      const clone = cloneReleaseInfo(original);
      expect(clone.genres).toBeUndefined();
      expect(clone.origin).toBeUndefined();
    });
  });

  describe('gigabytesFromBytes', () => {
    it('returns undefined for null/undefined', () => {
      expect(gigabytesFromBytes(undefined)).toBeUndefined();
      expect(gigabytesFromBytes(null as unknown as undefined)).toBeUndefined();
    });

    it('converts 0 bytes to 0 GB', () => {
      expect(gigabytesFromBytes(0)).toBe(0);
    });

    it('converts 1 GB in bytes to 1', () => {
      expect(gigabytesFromBytes(1073741824)).toBe(1);
    });

    it('converts 500 MB in bytes to ~0.466 GB', () => {
      const result = gigabytesFromBytes(500 * 1024 * 1024);
      expect(result).toBeCloseTo(0.4883, 4);
    });
  });

  describe('getGain', () => {
    it('returns undefined when seeders is undefined', () => {
      const r = createReleaseInfo({ size: 1073741824 });
      expect(getGain(r)).toBeUndefined();
    });

    it('returns undefined when size is undefined', () => {
      const r = createReleaseInfo({ seeders: 10 });
      expect(getGain(r)).toBeUndefined();
    });

    it('calculates seeders * gigabytes', () => {
      const r = createReleaseInfo({
        seeders: 10,
        size: 1073741824, // 1 GB
      });
      expect(getGain(r)).toBe(10);
    });

    it('returns 0 for 0 seeders', () => {
      const r = createReleaseInfo({
        seeders: 0,
        size: 1073741824,
      });
      expect(getGain(r)).toBe(0);
    });
  });
});
