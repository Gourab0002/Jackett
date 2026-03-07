import { describe, it, expect, beforeEach } from 'vitest';
import { Router, type Env } from '../src/router.js';
import { IndexerManager } from '../src/indexers/indexer-manager.js';
import { ExampleIndexer } from '../src/indexers/example-indexer.js';

function createMockEnv(apiKey = ''): Env {
  return {
    API_KEY: apiKey,
  };
}

function createRequest(path: string, base = 'https://test.example.com'): Request {
  return new Request(`${base}${path}`);
}

describe('Router', () => {
  let router: Router;
  let manager: IndexerManager;
  let env: Env;

  beforeEach(() => {
    manager = new IndexerManager();
    router = new Router(manager);
    env = createMockEnv();
  });

  describe('health endpoint', () => {
    it('returns 200 with status ok', async () => {
      const req = createRequest('/api/v2.0/health');
      const res = await router.handleRequest(req, env);
      expect(res.status).toBe(200);
      const body = await res.json() as { status: string };
      expect(body.status).toBe('ok');
    });

    it('does not require API key', async () => {
      const envWithKey = createMockEnv('secret-key');
      const req = createRequest('/api/v2.0/health');
      const res = await router.handleRequest(req, envWithKey);
      expect(res.status).toBe(200);
    });
  });

  describe('API key validation', () => {
    it('returns 401 for missing API key when required', async () => {
      const envWithKey = createMockEnv('secret-key');
      const req = createRequest('/api/v2.0/indexers');
      const res = await router.handleRequest(req, envWithKey);
      expect(res.status).toBe(401);
    });

    it('returns 401 for wrong API key', async () => {
      const envWithKey = createMockEnv('secret-key');
      const req = createRequest('/api/v2.0/indexers?apikey=wrong-key');
      const res = await router.handleRequest(req, envWithKey);
      expect(res.status).toBe(401);
    });

    it('succeeds with correct API key', async () => {
      const envWithKey = createMockEnv('secret-key');
      const req = createRequest('/api/v2.0/indexers?apikey=secret-key');
      const res = await router.handleRequest(req, envWithKey);
      expect(res.status).toBe(200);
    });

    it('accepts passkey parameter', async () => {
      const envWithKey = createMockEnv('secret-key');
      const req = createRequest('/api/v2.0/indexers?passkey=secret-key');
      const res = await router.handleRequest(req, envWithKey);
      expect(res.status).toBe(200);
    });

    it('allows access when no API key is configured', async () => {
      const req = createRequest('/api/v2.0/indexers');
      const res = await router.handleRequest(req, env);
      expect(res.status).toBe(200);
    });
  });

  describe('indexer list', () => {
    it('returns empty array when no indexers registered', async () => {
      const req = createRequest('/api/v2.0/indexers');
      const res = await router.handleRequest(req, env);
      expect(res.status).toBe(200);
      const body = await res.json() as unknown[];
      expect(body).toEqual([]);
    });

    it('returns registered indexers', async () => {
      const indexer = new ExampleIndexer();
      indexer.isConfigured = true;
      manager.registerIndexer(indexer);

      const req = createRequest('/api/v2.0/indexers');
      const res = await router.handleRequest(req, env);
      expect(res.status).toBe(200);
      const body = await res.json() as Array<{ id: string; name: string }>;
      expect(body).toHaveLength(1);
      expect(body[0].id).toBe('example');
      expect(body[0].name).toBe('Example Indexer');
    });

    it('handles trailing slash', async () => {
      const req = createRequest('/api/v2.0/indexers/');
      const res = await router.handleRequest(req, env);
      expect(res.status).toBe(200);
    });
  });

  describe('torznab caps', () => {
    it('returns capabilities XML', async () => {
      const indexer = new ExampleIndexer();
      manager.registerIndexer(indexer);

      const req = createRequest('/api/v2.0/indexers/example/results/torznab?t=caps');
      const res = await router.handleRequest(req, env);
      expect(res.status).toBe(200);
      const contentType = res.headers.get('Content-Type');
      expect(contentType).toContain('xml');
      const body = await res.text();
      expect(body).toContain('<caps>');
      expect(body).toContain('<server title="Jackett"/>');
    });

    it('returns 404 for unknown indexer', async () => {
      const req = createRequest('/api/v2.0/indexers/unknown/results/torznab?t=caps');
      const res = await router.handleRequest(req, env);
      expect(res.status).toBe(404);
      const body = await res.text();
      expect(body).toContain('Indexer not found');
    });
  });

  describe('server config', () => {
    it('returns server configuration', async () => {
      const req = createRequest('/api/v2.0/server/config');
      const res = await router.handleRequest(req, env);
      expect(res.status).toBe(200);
      const body = await res.json() as { runtime: string; app_version: string };
      expect(body.runtime).toBe('nodejs');
      expect(body.app_version).toBe('1.0.0');
    });

    it('masks API key in response', async () => {
      const envWithKey = createMockEnv('my-secret');
      const req = createRequest('/api/v2.0/server/config?apikey=my-secret');
      const res = await router.handleRequest(req, envWithKey);
      const body = await res.json() as { api_key: string };
      expect(body.api_key).toBe('***');
    });
  });

  describe('unknown routes', () => {
    it('returns 404 for unknown path', async () => {
      const req = createRequest('/api/v2.0/unknown');
      const res = await router.handleRequest(req, env);
      expect(res.status).toBe(404);
    });
  });
});
