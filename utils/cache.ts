import { createMMKV } from "react-native-mmkv";

const storage = createMMKV({ id: "cache-storage" });

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const CACHE_PREFIX = "cache_";
const MAX_CACHE_ENTRIES = 50;
const EVICTION_THRESHOLD = 0.8;
let cacheCleanupScheduled = false;

function scheduleCacheCleanup(): void {
  if (cacheCleanupScheduled) return;
  cacheCleanupScheduled = true;
  setTimeout(() => {
    const now = Date.now();
    const keys = storage.getAllKeys().filter((k: string) => k.startsWith(CACHE_PREFIX));
    
    for (const key of keys) {
      try {
        const raw = storage.getString(key);
        if (raw) {
          const entry: CacheEntry<unknown> = JSON.parse(raw);
          if (now - entry.timestamp > entry.ttl) {
            storage.remove(key);
          }
        }
      } catch {
        storage.remove(key);
      }
    }
    cacheCleanupScheduled = false;
  }, 60000);
}

function evictEntries(keysToKeep: number): void {
  const keys = storage.getAllKeys().filter((k: string) => k.startsWith(CACHE_PREFIX));
  if (keys.length <= keysToKeep) return;

  const entries: Array<{ key: string; timestamp: number }> = [];
  
  for (const key of keys) {
    try {
      const raw = storage.getString(key);
      if (raw) {
        const entry: CacheEntry<unknown> = JSON.parse(raw);
        entries.push({ key, timestamp: entry.timestamp });
      }
    } catch {
      storage.remove(key);
    }
  }

  entries.sort((a, b) => a.timestamp - b.timestamp);
  
  const toRemove = entries.slice(0, keys.length - keysToKeep);
  for (const { key } of toRemove) {
    storage.remove(key);
  }
}

export function getCached<T>(key: string): T | null {
  try {
    const fullKey = CACHE_PREFIX + key;
    const entry = storage.getString(fullKey);
    if (!entry) return null;

    const cached: CacheEntry<T> = JSON.parse(entry);
    if (Date.now() - cached.timestamp > cached.ttl) {
      storage.remove(fullKey);
      return null;
    }
    return cached.data;
  } catch {
    return null;
  }
}

export function setCache<T>(key: string, data: T, ttl: number): void {
  try {
    const fullKey = CACHE_PREFIX + key;
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    
    const serialized = JSON.stringify(entry);
    
    const currentCount = storage.getAllKeys().filter((k: string) => k.startsWith(CACHE_PREFIX)).length;
    if (currentCount >= MAX_CACHE_ENTRIES) {
      evictEntries(Math.floor(MAX_CACHE_ENTRIES * EVICTION_THRESHOLD));
    }

    storage.set(fullKey, serialized);
    scheduleCacheCleanup();
  } catch {
    // Silently fail
  }
}

export function invalidateCache(key: string): void {
  try {
    const fullKey = CACHE_PREFIX + key;
    storage.remove(fullKey);
  } catch {
    // Silently fail
  }
}

export function clearCache(): void {
  try {
    const keys = storage.getAllKeys().filter((k: string) => k.startsWith(CACHE_PREFIX));
    for (const key of keys) {
      storage.remove(key);
    }
  } catch {
    // Silently fail
  }
}

export function getCacheMetadata(): { count: number; sizeBytes: number } {
  const keys = storage.getAllKeys().filter((k: string) => k.startsWith(CACHE_PREFIX));
  let size = 0;
  
  for (const key of keys) {
    const raw = storage.getString(key);
    if (raw) {
      size += raw.length;
    }
  }
  
  return { count: keys.length, sizeBytes: size };
}