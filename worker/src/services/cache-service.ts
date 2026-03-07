export interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
}

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

/** Default TTL of 300s (5 min) balances freshness with reducing upstream requests. */
export function createInMemoryCacheService(): CacheService {
  const store = new Map<string, CacheEntry>();

  return {
    async get<T>(key: string): Promise<T | null> {
      const entry = store.get(key);
      if (!entry) return null;
      if (Date.now() > entry.expiresAt) {
        store.delete(key);
        return null;
      }
      return entry.value as T;
    },
    async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
      store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
    },
    async delete(key: string): Promise<void> {
      store.delete(key);
    },
  };
}

