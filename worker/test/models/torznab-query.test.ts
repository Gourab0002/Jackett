import { describe, it, expect } from 'vitest';
import {
  createTorznabQuery,
  isSearch,
  isTVSearch,
  isMovieSearch,
  isMusicSearch,
  isBookSearch,
  isIdSearch,
  isRssSearch,
  hasSpecifiedCategories,
  getSanitizedSearchTerm,
  getEpisodeSearchString,
  getQueryString,
  matchQueryStringAND,
  cloneQuery,
} from '../../src/models/torznab-query.js';

describe('TorznabQuery', () => {
  describe('createTorznabQuery', () => {
    it('creates a query with correct defaults', () => {
      const q = createTorznabQuery();
      expect(q.interactiveSearch).toBe(false);
      expect(q.queryType).toBe('');
      expect(q.categories).toEqual([]);
      expect(q.extended).toBe(0);
      expect(q.apiKey).toBe('');
      expect(q.limit).toBe(0);
      expect(q.offset).toBe(0);
      expect(q.cache).toBe(true);
      expect(q.isTest).toBe(false);
    });

    it('has undefined optional fields', () => {
      const q = createTorznabQuery();
      expect(q.searchTerm).toBeUndefined();
      expect(q.season).toBeUndefined();
      expect(q.episode).toBeUndefined();
      expect(q.imdbID).toBeUndefined();
      expect(q.tvdbID).toBeUndefined();
    });
  });

  describe('query type checks', () => {
    it('isSearch returns true for "search" queryType', () => {
      const q = createTorznabQuery();
      q.queryType = 'search';
      expect(isSearch(q)).toBe(true);
      expect(isTVSearch(q)).toBe(false);
    });

    it('isTVSearch returns true for "tvsearch" queryType', () => {
      const q = createTorznabQuery();
      q.queryType = 'tvsearch';
      expect(isTVSearch(q)).toBe(true);
      expect(isSearch(q)).toBe(false);
    });

    it('isMovieSearch returns true for "movie" queryType', () => {
      const q = createTorznabQuery();
      q.queryType = 'movie';
      expect(isMovieSearch(q)).toBe(true);
    });

    it('isMovieSearch returns true for TorrentPotato with search term', () => {
      const q = createTorznabQuery();
      q.queryType = 'TorrentPotato';
      q.searchTerm = 'test movie';
      expect(isMovieSearch(q)).toBe(true);
    });

    it('isMovieSearch returns false for TorrentPotato without search term', () => {
      const q = createTorznabQuery();
      q.queryType = 'TorrentPotato';
      expect(isMovieSearch(q)).toBe(false);
    });

    it('isMusicSearch returns true for "music" queryType', () => {
      const q = createTorznabQuery();
      q.queryType = 'music';
      expect(isMusicSearch(q)).toBe(true);
    });

    it('isBookSearch returns true for "book" queryType', () => {
      const q = createTorznabQuery();
      q.queryType = 'book';
      expect(isBookSearch(q)).toBe(true);
    });
  });

  describe('isIdSearch', () => {
    it('returns false for empty query', () => {
      const q = createTorznabQuery();
      expect(isIdSearch(q)).toBe(false);
    });

    it('returns true when imdbID is set', () => {
      const q = createTorznabQuery();
      q.imdbID = 'tt1234567';
      expect(isIdSearch(q)).toBe(true);
    });

    it('returns true when tvdbID is set', () => {
      const q = createTorznabQuery();
      q.tvdbID = 12345;
      expect(isIdSearch(q)).toBe(true);
    });

    it('returns true when season > 0', () => {
      const q = createTorznabQuery();
      q.season = 1;
      expect(isIdSearch(q)).toBe(true);
    });

    it('returns true when episode is set', () => {
      const q = createTorznabQuery();
      q.episode = '5';
      expect(isIdSearch(q)).toBe(true);
    });

    it('returns true when artist is set', () => {
      const q = createTorznabQuery();
      q.artist = 'Beatles';
      expect(isIdSearch(q)).toBe(true);
    });

    it('returns true when year is set', () => {
      const q = createTorznabQuery();
      q.year = 2023;
      expect(isIdSearch(q)).toBe(true);
    });
  });

  describe('isRssSearch', () => {
    it('returns true when no search term and no ID search', () => {
      const q = createTorznabQuery();
      expect(isRssSearch(q)).toBe(true);
    });

    it('returns false when search term is set', () => {
      const q = createTorznabQuery();
      q.searchTerm = 'test';
      expect(isRssSearch(q)).toBe(false);
    });

    it('returns false when imdbID is set', () => {
      const q = createTorznabQuery();
      q.imdbID = 'tt0000001';
      expect(isRssSearch(q)).toBe(false);
    });
  });

  describe('hasSpecifiedCategories', () => {
    it('returns false for empty categories', () => {
      const q = createTorznabQuery();
      expect(hasSpecifiedCategories(q)).toBe(false);
    });

    it('returns true when categories are set', () => {
      const q = createTorznabQuery();
      q.categories = [2000, 5000];
      expect(hasSpecifiedCategories(q)).toBe(true);
    });
  });

  describe('getSanitizedSearchTerm', () => {
    it('returns empty string for undefined search term', () => {
      const q = createTorznabQuery();
      expect(getSanitizedSearchTerm(q)).toBe('');
    });

    it('keeps alphanumeric characters', () => {
      const q = createTorznabQuery();
      q.searchTerm = 'Hello World 123';
      expect(getSanitizedSearchTerm(q)).toBe('Hello World 123');
    });

    it('strips invalid characters', () => {
      const q = createTorznabQuery();
      q.searchTerm = 'test{value}!';
      expect(getSanitizedSearchTerm(q)).toBe('testvalue');
    });

    it('standardizes Unicode dashes to regular dash', () => {
      const q = createTorznabQuery();
      q.searchTerm = 'test\u2014value';
      expect(getSanitizedSearchTerm(q)).toBe('test-value');
    });

    it('standardizes smart quotes to regular single quote', () => {
      const q = createTorznabQuery();
      q.searchTerm = "it\u2019s";
      expect(getSanitizedSearchTerm(q)).toBe("it's");
    });

    it('keeps allowed special characters like parentheses, brackets, percent', () => {
      const q = createTorznabQuery();
      q.searchTerm = 'test (2023) [720p] 50%';
      expect(getSanitizedSearchTerm(q)).toBe('test (2023) [720p] 50%');
    });
  });

  describe('getEpisodeSearchString', () => {
    it('returns empty string when season is undefined', () => {
      const q = createTorznabQuery();
      expect(getEpisodeSearchString(q)).toBe('');
    });

    it('returns empty string when season is 0', () => {
      const q = createTorznabQuery();
      q.season = 0;
      expect(getEpisodeSearchString(q)).toBe('');
    });

    it('returns S01 for season only', () => {
      const q = createTorznabQuery();
      q.season = 1;
      expect(getEpisodeSearchString(q)).toBe('S01');
    });

    it('returns S02E03 for season and episode', () => {
      const q = createTorznabQuery();
      q.season = 2;
      q.episode = '3';
      expect(getEpisodeSearchString(q)).toBe('S02E03');
    });

    it('pads season and episode numbers', () => {
      const q = createTorznabQuery();
      q.season = 1;
      q.episode = '5';
      expect(getEpisodeSearchString(q)).toBe('S01E05');
    });

    it('handles date format (season >= 1000)', () => {
      const q = createTorznabQuery();
      q.season = 2023;
      q.episode = '03/15';
      expect(getEpisodeSearchString(q)).toBe('2023.03.15');
    });

    it('handles non-numeric episode string', () => {
      const q = createTorznabQuery();
      q.season = 1;
      q.episode = 'special';
      expect(getEpisodeSearchString(q)).toBe('S01Especial');
    });
  });

  describe('getQueryString', () => {
    it('returns only search term when no episode info', () => {
      const q = createTorznabQuery();
      q.searchTerm = 'Breaking Bad';
      expect(getQueryString(q)).toBe('Breaking Bad');
    });

    it('combines search term and episode string', () => {
      const q = createTorznabQuery();
      q.searchTerm = 'Breaking Bad';
      q.season = 5;
      q.episode = '16';
      expect(getQueryString(q)).toBe('Breaking Bad S05E16');
    });

    it('returns only episode string when no search term', () => {
      const q = createTorznabQuery();
      q.season = 3;
      expect(getQueryString(q)).toBe('S03');
    });
  });

  describe('cloneQuery', () => {
    it('creates an independent copy', () => {
      const q = createTorznabQuery();
      q.searchTerm = 'test';
      q.categories = [2000, 5000];
      q.season = 1;

      const clone = cloneQuery(q);
      expect(clone.searchTerm).toBe('test');
      expect(clone.categories).toEqual([2000, 5000]);
      expect(clone.season).toBe(1);

      // Mutation should not affect original
      clone.searchTerm = 'modified';
      clone.categories.push(3000);
      expect(q.searchTerm).toBe('test');
      expect(q.categories).toEqual([2000, 5000]);
    });

    it('copies queryStringParts independently', () => {
      const q = createTorznabQuery();
      q.queryStringParts = ['hello', 'world'];

      const clone = cloneQuery(q);
      clone.queryStringParts!.push('extra');
      expect(q.queryStringParts).toEqual(['hello', 'world']);
    });
  });

  describe('matchQueryStringAND', () => {
    it('matches when all words appear in title', () => {
      const q = createTorznabQuery();
      q.searchTerm = 'Breaking Bad';
      expect(matchQueryStringAND(q, 'Breaking.Bad.S05E16.720p')).toBe(true);
    });

    it('does not match when a word is missing', () => {
      const q = createTorznabQuery();
      q.searchTerm = 'Breaking Bad';
      // Reset cached parts
      q.queryStringParts = undefined;
      expect(matchQueryStringAND(q, 'Breaking.Down.S01E01')).toBe(false);
    });

    it('is case insensitive', () => {
      const q = createTorznabQuery();
      q.searchTerm = 'BREAKING BAD';
      expect(matchQueryStringAND(q, 'breaking.bad.s05e16')).toBe(true);
    });

    it('filters out common words like "and", "the"', () => {
      const q = createTorznabQuery();
      q.searchTerm = 'The Walking Dead';
      // "the" is a common word and should be filtered out
      expect(matchQueryStringAND(q, 'Walking.Dead.S01E01')).toBe(true);
    });

    it('supports limit parameter', () => {
      const q = createTorznabQuery();
      q.searchTerm = 'Breaking Bad Season';
      // With limit=12, only "Breaking Bad" is considered (12 chars)
      expect(matchQueryStringAND(q, 'Breaking.Bad.S05', 12)).toBe(true);
    });

    it('supports queryStringOverride', () => {
      const q = createTorznabQuery();
      q.searchTerm = 'ignored';
      expect(matchQueryStringAND(q, 'hello world test', undefined, 'hello world')).toBe(true);
    });
  });
});
