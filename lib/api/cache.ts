export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

let cacheUserContext: string | null = null;

function getCacheKey(path: string, method: string): string {
  const context = cacheUserContext ? `:${cacheUserContext}` : "";
  const [pathWithoutQuery, queryString] = path.split("?");
  const normalizedPath = pathWithoutQuery.endsWith("/") ? pathWithoutQuery.slice(0, -1) : pathWithoutQuery;
  const queryPart = queryString ? `?${queryString.split("&").sort().join("&")}` : "";
  return `${method}:${normalizedPath}${queryPart}${context}`;
}

function getCached<T>(key: string, ttl: number): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() - entry.timestamp > ttl) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache<T>(key: string, data: T, ttl: number): void {
  cache.set(key, { data, timestamp: Date.now(), ttl });
}

const cache = new Map<string, CacheEntry<unknown>>();
const inFlightRequests = new Map<string, Promise<unknown>>();

export class CacheManager {
  static setUserContext(userHash: string | null): void {
    if (cacheUserContext !== userHash) {
      cache.clear();
    }
    cacheUserContext = userHash;
  }

  static getUserContext(): string | null {
    return cacheUserContext;
  }

  static getCacheKey(path: string, method: string): string {
    const context = cacheUserContext ? `:${cacheUserContext}` : "";
    const [pathWithoutQuery, queryString] = path.split("?");
    const normalizedPath = pathWithoutQuery.endsWith("/") ? pathWithoutQuery.slice(0, -1) : pathWithoutQuery;
    const queryPart = queryString ? `?${queryString.split("&").sort().join("&")}` : "";
    return `${method}:${normalizedPath}${queryPart}${context}`;
  }

  static get<T>(key: string, ttl: number): T | null {
    return getCached(key, ttl);
  }

  static set<T>(key: string, data: T, ttl: number): void {
    setCache(key, data, ttl);
  }

  static clear(pattern?: string): void {
    if (!pattern) {
      cache.clear();
      return;
    }
    const normalizedPattern = pattern.toLowerCase();
    for (const key of cache.keys()) {
      const separatorIdx = key.indexOf(":");
      if (separatorIdx < 0) continue;
      const pathPart = key.slice(separatorIdx + 1);
      const questionIdx = pathPart.indexOf("?");
      const path = questionIdx >= 0 ? pathPart.slice(0, questionIdx) : pathPart;
      const pathLower = path.toLowerCase();
      const patternSegments = normalizedPattern.split("/").filter(Boolean);
      const pathSegments = pathLower.split("/").filter(Boolean);
      let match = true;
      for (let i = 0; i < patternSegments.length; i++) {
        if (patternSegments[i] !== pathSegments[i]) {
          match = false;
          break;
        }
      }
      if (match) {
        cache.delete(key);
      }
    }
  }

  static getInFlight<T>(key: string): Promise<T> | undefined {
    return inFlightRequests.get(key) as Promise<T> | undefined;
  }

  static setInFlight<T>(key: string, promise: Promise<T>): void {
    inFlightRequests.set(key, promise as Promise<unknown>);
  }

  static deleteInFlight(key: string): void {
    inFlightRequests.delete(key);
  }
}