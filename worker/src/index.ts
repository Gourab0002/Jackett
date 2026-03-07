import { Router, type Env } from './router.js';
import { IndexerManager } from './indexers/indexer-manager.js';
import { ExampleIndexer } from './indexers/example-indexer.js';

const indexerManager = new IndexerManager();
indexerManager.registerIndexer(new ExampleIndexer());

export const router = new Router(indexerManager);
export type { Env };
