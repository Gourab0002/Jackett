import { describe, it, expect } from 'vitest';
import {
  createCategory,
  containsCategory,
  TorznabCatType,
  getParentCategories,
  getAllCategories,
  getCatDesc,
  getCatByName,
} from '../../src/models/torznab-category.js';

describe('TorznabCategory', () => {
  describe('getParentCategories', () => {
    it('returns exactly 8 parent categories', () => {
      const parents = getParentCategories();
      expect(parents).toHaveLength(8);
    });

    it('contains Console, Movies, Audio, PC, TV, XXX, Books, Other', () => {
      const parents = getParentCategories();
      const names = parents.map(c => c.name);
      expect(names).toEqual(['Console', 'Movies', 'Audio', 'PC', 'TV', 'XXX', 'Books', 'Other']);
    });

    it('has correct IDs for parent categories', () => {
      const parents = getParentCategories();
      const ids = parents.map(c => c.id);
      expect(ids).toEqual([1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000]);
    });
  });

  describe('TorznabCatType constants', () => {
    it('Console has id 1000', () => {
      expect(TorznabCatType.Console.id).toBe(1000);
      expect(TorznabCatType.Console.name).toBe('Console');
    });

    it('Movies has id 2000', () => {
      expect(TorznabCatType.Movies.id).toBe(2000);
    });

    it('Audio has id 3000', () => {
      expect(TorznabCatType.Audio.id).toBe(3000);
    });

    it('PC has id 4000', () => {
      expect(TorznabCatType.PC.id).toBe(4000);
    });

    it('TV has id 5000', () => {
      expect(TorznabCatType.TV.id).toBe(5000);
    });

    it('XXX has id 6000', () => {
      expect(TorznabCatType.XXX.id).toBe(6000);
    });

    it('Books has id 7000', () => {
      expect(TorznabCatType.Books.id).toBe(7000);
    });

    it('Other has id 8000', () => {
      expect(TorznabCatType.Other.id).toBe(8000);
    });

    it('subcategory ConsoleNDS has id 1010', () => {
      expect(TorznabCatType.ConsoleNDS.id).toBe(1010);
      expect(TorznabCatType.ConsoleNDS.name).toBe('Console/NDS');
    });

    it('subcategory MoviesHD has id 2040', () => {
      expect(TorznabCatType.MoviesHD.id).toBe(2040);
      expect(TorznabCatType.MoviesHD.name).toBe('Movies/HD');
    });

    it('subcategory TVUHD has id 5045', () => {
      expect(TorznabCatType.TVUHD.id).toBe(5045);
    });
  });

  describe('subcategories are assigned to parents', () => {
    it('Console has subcategories', () => {
      expect(TorznabCatType.Console.subCategories.length).toBeGreaterThan(0);
      const subIds = TorznabCatType.Console.subCategories.map(c => c.id);
      expect(subIds).toContain(1010); // ConsoleNDS
      expect(subIds).toContain(1080); // ConsolePS3
      expect(subIds).toContain(1180); // ConsolePS4
    });

    it('Movies has subcategories', () => {
      const subIds = TorznabCatType.Movies.subCategories.map(c => c.id);
      expect(subIds).toContain(2030); // MoviesSD
      expect(subIds).toContain(2040); // MoviesHD
      expect(subIds).toContain(2045); // MoviesUHD
    });

    it('TV has subcategories', () => {
      const subIds = TorznabCatType.TV.subCategories.map(c => c.id);
      expect(subIds).toContain(5010); // TVWEBDL
      expect(subIds).toContain(5070); // TVAnime
    });
  });

  describe('getCatDesc', () => {
    it('returns correct name for known category', () => {
      expect(getCatDesc(1000)).toBe('Console');
      expect(getCatDesc(2040)).toBe('Movies/HD');
      expect(getCatDesc(5070)).toBe('TV/Anime');
    });

    it('returns empty string for unknown category', () => {
      expect(getCatDesc(9999)).toBe('');
    });
  });

  describe('getCatByName', () => {
    it('finds category by exact name', () => {
      const cat = getCatByName('Movies');
      expect(cat).toBeDefined();
      expect(cat!.id).toBe(2000);
    });

    it('finds subcategory by exact name', () => {
      const cat = getCatByName('TV/Anime');
      expect(cat).toBeDefined();
      expect(cat!.id).toBe(5070);
    });

    it('returns undefined for non-existent name', () => {
      expect(getCatByName('NonExistent')).toBeUndefined();
    });
  });

  describe('getAllCategories', () => {
    it('includes all parent and subcategories', () => {
      const all = getAllCategories();
      expect(all.length).toBeGreaterThan(8);
      const ids = all.map(c => c.id);
      expect(ids).toContain(1000);
      expect(ids).toContain(1010);
      expect(ids).toContain(2000);
      expect(ids).toContain(8020);
    });
  });

  describe('createCategory', () => {
    it('creates a category with empty subCategories', () => {
      const cat = createCategory(9999, 'Test');
      expect(cat.id).toBe(9999);
      expect(cat.name).toBe('Test');
      expect(cat.subCategories).toEqual([]);
    });
  });

  describe('containsCategory', () => {
    it('returns true when category matches itself', () => {
      expect(containsCategory(TorznabCatType.Console, TorznabCatType.Console)).toBe(true);
    });

    it('returns true when subcategory is found', () => {
      expect(containsCategory(TorznabCatType.Console, TorznabCatType.ConsoleNDS)).toBe(true);
    });

    it('returns false when subcategory not present', () => {
      expect(containsCategory(TorznabCatType.Console, TorznabCatType.MoviesHD)).toBe(false);
    });
  });
});
