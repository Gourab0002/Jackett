import { type IIndexer, type IndexerResult } from './base-indexer.js';
import { type TorznabQuery } from '../models/torznab-query.js';

export class IndexerManager {
  private indexers: Map<string, IIndexer> = new Map();

  registerIndexer(indexer: IIndexer): void {
    this.indexers.set(indexer.id, indexer);
  }

  getIndexer(id: string): IIndexer | undefined {
    return this.indexers.get(id);
  }

  getAllIndexers(): IIndexer[] {
    return Array.from(this.indexers.values());
  }

  getConfiguredIndexers(): IIndexer[] {
    return this.getAllIndexers().filter(i => i.isConfigured);
  }

  async searchAll(query: TorznabQuery): Promise<IndexerResult[]> {
    const configured = this.getConfiguredIndexers().filter(i => i.canHandleQuery(query));
    const results = await Promise.allSettled(
      configured.map(i => i.resultsForQuery(query)),
    );
    return results
      .filter((r): r is PromiseFulfilledResult<IndexerResult> => r.status === 'fulfilled')
      .map(r => r.value);
  }

  deleteIndexer(id: string): boolean {
    return this.indexers.delete(id);
  }
}
