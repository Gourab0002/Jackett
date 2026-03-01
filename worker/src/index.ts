import { Router, type Env } from './router.js';
import { IndexerManager } from './indexers/indexer-manager.js';
import { ExampleIndexer } from './indexers/example-indexer.js';

const indexerManager = new IndexerManager();
indexerManager.registerIndexer(new ExampleIndexer());

const router = new Router(indexerManager);

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    try {
      return await router.handleRequest(request, env);
    } catch (err) {
      console.error('Unhandled error:', err);
      return new Response('Internal Server Error', { status: 500 });
    }
  },
};
