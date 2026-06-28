import { TOPSCORE_BASE_URL } from "@/constants/config";
import { getValidAccessToken } from "@/services/auth";
import { USE_MOCK_DATA } from "@/constants/mockData";
import { ApiError, AuthError, NetworkError, ErrorCode } from "./errors";

const DEFAULT_TIMEOUT = 15000;
const RETRY_DELAY_BASE = 1000;
const MAX_RETRIES = 2;

interface RequestConfig {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
  timeout?: number;
  skipAuth?: boolean;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const inFlightRequests = new Map<string, Promise<unknown>>();
const responseCache = new Map<string, CacheEntry<unknown>>();

let cacheUserContext: string | null = null;

export function setCacheUserContext(userHash: string | null): void {
  cacheUserContext = userHash;
}

export function getCacheUserContext(): string | null {
  return cacheUserContext;
}

function getCacheKey(path: string, method: string): string {
  const context = cacheUserContext ? `:${cacheUserContext}` : "";
  return `${method}:${path}${context}`;
}

function getCached<T>(key: string, ttl: number): T | null {
  const entry = responseCache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() - entry.timestamp > ttl) {
    responseCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache<T>(key: string, data: T, ttl: number): void {
  responseCache.set(key, { data, timestamp: Date.now(), ttl });
}

export function clearCache(): void {
  responseCache.clear();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request<T>(
  path: string,
  config: RequestConfig = {}
): Promise<T> {
  const {
    method = "GET",
    headers = {},
    body,
    signal,
    timeout = DEFAULT_TIMEOUT,
    skipAuth = false,
  } = config;

  let token: string | null = null;
  if (!skipAuth) {
    token = await getValidAccessToken();
    if (!token) {
      throw new AuthError("Not authenticated", ErrorCode.UNAUTHORIZED);
    }
  }

  const cacheKey = getCacheKey(path, method);
  const cacheTtl = method === "GET" ? 60000 : 0;

  if (method === "GET") {
    const cached = getCached<T>(cacheKey, cacheTtl);
    if (cached) {
      return cached;
    }

    const inFlight = inFlightRequests.get(cacheKey);
    if (inFlight) {
      return inFlight as Promise<T>;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  let retryCount = 0;

  const execRequest = async (): Promise<T> => {
    try {
      const res = await fetch(`${TOPSCORE_BASE_URL}${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const message = (err as { message?: string }).message ?? `API error ${res.status}`;

        if (res.status >= 500 && retryCount < MAX_RETRIES) {
          retryCount++;
          await sleep(RETRY_DELAY_BASE * Math.pow(2, retryCount - 1));
          return execRequest();
        }

        if (res.status === 401 && !skipAuth) {
          throw new AuthError("Session expired", ErrorCode.UNAUTHORIZED);
        }

        throw ApiError.fromStatus(res.status, message);
      }

      const data = await res.json();

      if (method === "GET" && cacheTtl > 0) {
        setCache(cacheKey, data, cacheTtl);
      }

      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof AuthError || error instanceof ApiError) {
        throw error;
      }

      if (signal?.aborted || (error instanceof Error && error.name === "AbortError")) {
        throw new NetworkError("Request aborted");
      }

      if (retryCount < MAX_RETRIES) {
        retryCount++;
        await sleep(RETRY_DELAY_BASE * Math.pow(2, retryCount - 1));
        return execRequest();
      }

      throw new NetworkError("Network error. Please check your connection.");
    }
  };

  let requestPromise: Promise<T>;

  if (method === "GET") {
    requestPromise = (async () => {
      inFlightRequests.set(cacheKey, execRequest() as unknown as Promise<T>);
      try {
        return await execRequest();
      } finally {
        inFlightRequests.delete(cacheKey);
      }
    })();
  } else {
    requestPromise = (async () => {
      try {
        return await execRequest();
      } finally {
        inFlightRequests.delete(cacheKey);
      }
    })();
  }

  return requestPromise;
}

export const apiClient = {
  get: <T>(path: string, config?: Omit<RequestConfig, "method" | "body">) =>
    request<T>(path, { ...config, method: "GET" }),

  post: <T>(path: string, body: unknown, config?: Omit<RequestConfig, "method">) =>
    request<T>(path, { ...config, method: "POST", body }),

  put: <T>(path: string, body: unknown, config?: Omit<RequestConfig, "method">) =>
    request<T>(path, { ...config, method: "PUT", body }),

  delete: <T>(path: string, config?: Omit<RequestConfig, "method" | "body">) =>
    request<T>(path, { ...config, method: "DELETE" }),
};

export function isMockEnabled(): boolean {
  return USE_MOCK_DATA;
}

export async function batchRequests<T extends Record<string, unknown>>(
  requests: Record<string, () => Promise<unknown>>
): Promise<T> {
  const entries = await Promise.allSettled(
    Object.entries(requests).map(async ([key, fn]) => {
      const data = await fn();
      return [key, data] as const;
    })
  );

  const result = {} as T;
  for (const entry of entries) {
    if (entry.status === "fulfilled") {
      const [key, data] = entry.value;
      (result as Record<string, unknown>)[key] = data;
    }
  }
  return result;
}

export function invalidateCache(pattern?: string): void {
  if (!pattern) {
    responseCache.clear();
    return;
  }
  for (const key of responseCache.keys()) {
    if (key.includes(pattern)) {
      responseCache.delete(key);
    }
  }
}