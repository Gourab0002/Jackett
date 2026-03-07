import * as http from 'node:http';
import { Router, type Env } from './router.js';
import { IndexerManager } from './indexers/indexer-manager.js';
import { ExampleIndexer } from './indexers/example-indexer.js';

const indexerManager = new IndexerManager();
indexerManager.registerIndexer(new ExampleIndexer());

const router = new Router(indexerManager);

const PORT = parseInt(process.env.PORT ?? '8000', 10);

const env: Env = {
  API_KEY: process.env.API_KEY ?? '',
};

function readRequestBody(req: http.IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const host = req.headers.host ?? 'localhost';
    const url = `http://${host}${req.url ?? '/'}`;

    const headers: Record<string, string> = {};
    for (const [key, val] of Object.entries(req.headers)) {
      if (val != null) {
        headers[key] = Array.isArray(val) ? val.join(', ') : val;
      }
    }

    const body = await readRequestBody(req);

    const method = req.method ?? 'GET';
    const request = new Request(url, {
      method,
      headers,
      body: body.length > 0 && method !== 'GET' && method !== 'HEAD' ? body : undefined,
    });

    const response = await router.handleRequest(request, env);

    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    const responseBody = await response.arrayBuffer();
    res.end(Buffer.from(responseBody));
  } catch (err) {
    console.error('Unhandled error:', err);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
