import { BaseIndexer } from './base-indexer.js';
import { type TorznabQuery } from '../models/torznab-query.js';
import { type ReleaseInfo } from '../models/release-info.js';
import { TvSearchParam, MovieSearchParam, addCategoryMapping } from '../models/torznab-capabilities.js';
import { TorznabCatType } from '../models/torznab-category.js';

export class ExampleIndexer extends BaseIndexer {
  constructor() {
    super({
      id: 'example',
      name: 'Example Indexer',
      description: 'An example indexer implementation',
      siteLink: 'https://example.com/',
    });

    this.type = 'public';
    this.language = 'en-US';

    this.torznabCaps.searchAvailable = true;
    this.torznabCaps.tvSearchParams = [TvSearchParam.Q, TvSearchParam.Season, TvSearchParam.Ep];
    this.torznabCaps.movieSearchParams = [MovieSearchParam.Q];
    addCategoryMapping(this.torznabCaps.categories, '1', TorznabCatType.Movies);
    addCategoryMapping(this.torznabCaps.categories, '2', TorznabCatType.TV);
  }

  async performQuery(query: TorznabQuery): Promise<ReleaseInfo[]> {
    const url = `${this.siteLink}api/search?q=${encodeURIComponent(query.searchTerm || '')}`;

    try {
      await this.fetchUrl({ url });
      // Parse results...
      return [];
    } catch {
      return [];
    }
  }
}
