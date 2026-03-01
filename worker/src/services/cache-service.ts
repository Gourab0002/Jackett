export interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
}

export function createCacheService(kvNamespace: KVNamespace): CacheService {
  return {
    async get<T>(key: string): Promise<T | null> {
      const value = await kvNamespace.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    },
    /** Default TTL of 300s (5 min) balances freshness with reducing upstream requests. */
    async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
      await kvNamespace.put(key, JSON.stringify(value), { expirationTtl: ttlSeconds });
    },
    async delete(key: string): Promise<void> {
      await kvNamespace.delete(key);
    },
  };
}
