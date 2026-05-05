export const CACHE_CONFIG = {
  defaultStaleTime: 60 * 1000,
  defaultGcTime: 5 * 60 * 1000,
  maxCacheEntries: 50,
  cacheEvictionThreshold: 0.8,
} as const;

export const STALE_TIME = {
  user: 24 * 60 * 60 * 1000,
  schedule: 60 * 60 * 1000,
  roster: 6 * 60 * 60 * 1000,
  registrations: 2 * 60 * 60 * 1000,
  teams: 6 * 60 * 60 * 1000,
  announcements: 2 * 60 * 1000,
} as const;

export const REQUEST_CONFIG = {
  pendingRequestTTL: 30_000,
  requestCleanupInterval: 10_000,
  maxRetries: 3,
  retryDelayBase: 1000,
  maxRetryDelay: 30_000,
} as const;