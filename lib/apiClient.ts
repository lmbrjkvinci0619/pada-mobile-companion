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
let invalidatingAuthContext = false;

export function setCacheUserContext(userHash: string | null): void {
  if (cacheUserContext !== userHash) {
    responseCache.clear();
  }
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

  const cacheKey = getCacheKey(path, method);
  const cacheTtl = method === "GET" ? 60000 : 0;

  if (method === "GET") {
    const cached = getCached<T>(cacheKey, cacheTtl);
    if (cached) return cached;

    const inFlight = inFlightRequests.get(cacheKey) as Promise<T> | undefined;
    if (inFlight) return inFlight;
  }

  const execRequest = async (attemptIndex: number): Promise<T> => {
    let token: string | null = null;
    if (!skipAuth) {
      token = await getValidAccessToken();
      if (!token) {
        throw new AuthError("Not authenticated", ErrorCode.UNAUTHORIZED);
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const externalSignal = signal;

    const onExternalAbort = () => controller.abort();
    if (externalSignal) {
      if (externalSignal.aborted) controller.abort();
      else externalSignal.addEventListener("abort", onExternalAbort, { once: true });
    }

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
      if (externalSignal) externalSignal.removeEventListener("abort", onExternalAbort);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const message = (err as { message?: string }).message ?? `API error ${res.status}`;

        if (res.status === 401 && !skipAuth) {
          if (!invalidatingAuthContext) {
            invalidatingAuthContext = true;
            clearCache();
            invalidatingAuthContext = false;
          }
          throw new AuthError("Session expired", ErrorCode.UNAUTHORIZED);
        }

        if (res.status >= 500 && attemptIndex < MAX_RETRIES) {
          await sleep(RETRY_DELAY_BASE * Math.pow(2, attemptIndex));
          return execRequest(attemptIndex + 1);
        }

        throw ApiError.fromStatus(res.status, message);
      }

      const responseText = await res.text();
      const data = responseText.length > 0 ? JSON.parse(responseText) : ({} as T);
      if (method === "GET" && cacheTtl > 0) {
        setCache(cacheKey, data, cacheTtl);
      }

      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (externalSignal) externalSignal.removeEventListener("abort", onExternalAbort);

      if (error instanceof AuthError || error instanceof ApiError) {
        throw error;
      }

      const isAbort = error instanceof Error && error.name === "AbortError";
      if (signal?.aborted || isAbort) {
        throw new NetworkError("Request aborted");
      }

      if (attemptIndex < MAX_RETRIES) {
        await sleep(RETRY_DELAY_BASE * Math.pow(2, attemptIndex));
        return execRequest(attemptIndex + 1);
      }

      throw new NetworkError("Network error. Please check your connection.");
    }
  };

  let requestPromise: Promise<T>;

  if (method === "GET") {
    let resolveInflight!: (value: T) => void;
    let rejectInflight!: (reason: unknown) => void;
    requestPromise = new Promise<T>((resolve, reject) => {
      resolveInflight = resolve;
      rejectInflight = reject;
    });

    inFlightRequests.set(cacheKey, requestPromise as unknown as Promise<unknown>);

    execRequest(0)
      .then((data) => {
        inFlightRequests.delete(cacheKey);
        resolveInflight(data);
      })
      .catch((err) => {
        inFlightRequests.delete(cacheKey);
        rejectInflight(err);
      });
  } else {
    requestPromise = execRequest(0);
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
