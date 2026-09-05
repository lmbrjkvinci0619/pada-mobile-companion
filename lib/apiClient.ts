import { TOPSCORE_BASE_URL, APP_USER_AGENT, TOPSCORE_USE_OAUTH2, TOPSCORE_CLIENT_ID } from "@/constants/config";
import { getValidAccessToken } from "@/services/auth";
import { ApiError, AuthError, NetworkError } from "./errors";
import { CacheManager } from "./api/cache";
import { RetryPolicy, DEFAULT_RETRY_CONFIG, sleep } from "./api/retry";
import { CsrfManager } from "./api/csrf";
import { normalizeTopScoreBaseUrl } from "./urlUtils";

const DEFAULT_TIMEOUT = 15000;
const MIN_TIMEOUT = 5000;
const MAX_TIMEOUT = 60000;

// Re-export constants for backward compatibility
export { TOPSCORE_USE_OAUTH2, TOPSCORE_CLIENT_ID } from "@/constants/config";
export { APP_USER_AGENT as PADA_USER_AGENT } from "@/constants/config";

export const MAX_PER_PAGE = 100;

interface RequestConfig {
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
  timeout?: number;
  skipAuth?: boolean;
  skipCsrf?: boolean;
  raw?: boolean;
}

interface ApiResponseWrapper<T> {
  status?: string | number;
  count?: number;
  result?: T;
  errors?: Array<{ message?: string; code?: string }>;
}

function getErrorMessageFromBody(err: unknown, status: number): string {
  if (err && typeof err === "object") {
    const e = err as Record<string, unknown>;
    if ("message" in e && typeof e.message === "string" && e.message.length > 0) {
      return e.message;
    }
    if ("errors" in e && Array.isArray(e.errors) && e.errors.length > 0) {
      const firstError = e.errors[0] as Record<string, unknown>;
      if (typeof firstError.message === "string") {
        return firstError.message;
      }
    }
    if ("error" in e && typeof e.error === "string") {
      return e.error;
    }
    if ("error_description" in e && typeof e.error_description === "string") {
      return e.error_description;
    }
  }
  return `API error ${status}`;
}

interface ApiErrorDetail {
  message: string;
  field?: string | null;
  data?: unknown;
}

function extractErrorDetails(err: unknown): ApiErrorDetail {
  if (err && typeof err === "object") {
    const e = err as Record<string, unknown>;
    if ("errors" in e && Array.isArray(e.errors) && e.errors.length > 0) {
      const firstError = e.errors[0] as Record<string, unknown>;
      return {
        message: typeof firstError.message === "string" ? firstError.message : "Unknown error",
        field: firstError.field !== undefined ? String(firstError.field) : undefined,
        data: firstError.data ?? undefined,
      };
    }
    if ("message" in e && typeof e.message === "string") {
      return { message: e.message, field: undefined, data: undefined };
    }
  }
  return { message: "Unknown error", field: undefined, data: undefined };
}

function buildFieldsParam(fields: string | string[]): string {
  if (!fields) return "";
  const fieldArray = Array.isArray(fields) ? fields : [fields];
  return fieldArray.map((f) => `fields[]=${encodeURIComponent(f)}`).join("&");
}

function buildFieldsParamFromObject(
  obj: Record<string, string | string[] | undefined>
): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) continue;
    const valueArray = Array.isArray(value) ? value : [value];
    for (const v of valueArray) {
      parts.push(`${encodeURIComponent(key)}[]=${encodeURIComponent(v)}`);
    }
  }
  return parts.join("&");
}

function unwrapResponse<T>(data: unknown): T {
  if (data === null || data === undefined) {
    return data as T;
  }
  if (Array.isArray(data)) {
    return data as unknown as T;
  }
  if (typeof data === "object") {
    const d = data as Record<string, unknown>;
    const status = d.status;
    const statusNum = typeof status === "number" ? status
                     : typeof status === "string" ? parseInt(status, 10)
                     : NaN;

    if (isNaN(statusNum)) {
      if ("result" in d) {
        return d.result as T;
      }
      return d as T;
    }

    if (statusNum >= 400) {
      const errorDetails = extractErrorDetails(d);
      throw ApiError.fromStatus(statusNum, errorDetails.message, errorDetails.field, errorDetails.data);
    }

    if ("result" in d) {
      return d.result as T;
    }

    return d as T;
  }
  return data as T;
}

const csrfManager = new CsrfManager();
const retryPolicy = new RetryPolicy(DEFAULT_RETRY_CONFIG);

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
    skipCsrf = false,
  } = config;

  const clampedTimeout = Math.min(Math.max(timeout, MIN_TIMEOUT), MAX_TIMEOUT);

  const cacheKey = CacheManager.getCacheKey(path, method);
  const cacheTtl = method === "GET" ? 60000 : 0;

  if (method === "GET") {
    const cached = CacheManager.get<T>(cacheKey, cacheTtl);
    if (cached) return cached;

    const inFlight = CacheManager.getInFlight<T>(cacheKey);
    if (inFlight) return inFlight;
  }

  const execRequest = async (attemptIndex: number): Promise<T> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), clampedTimeout);
    const externalSignal = signal;

    const onExternalAbort = () => controller.abort();
    if (externalSignal) {
      if (externalSignal.aborted) controller.abort();
      else externalSignal.addEventListener("abort", onExternalAbort, { once: true });
    }

    try {
      const { url, body: requestBody, headers: requestHeaders } = await csrfManager.prepareRequest({
        path,
        method,
        body,
        signal: controller.signal,
        headers,
        timeout: clampedTimeout,
      });

      const res = await fetch(url, {
        method,
        headers: requestHeaders,
        body: requestBody,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (externalSignal) externalSignal.removeEventListener("abort", onExternalAbort);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const message = getErrorMessageFromBody(err, res.status);
        const errorDetails = extractErrorDetails(err);

        if (res.status === 401 && !skipAuth && TOPSCORE_USE_OAUTH2) {
          CacheManager.clear();
          csrfManager.clearToken();
          const newToken = await getValidAccessToken();
          if (newToken) {
            const { url: retryUrl, body: retryBody, headers: retryHeaders } = await csrfManager.prepareRequest({
              path,
              method,
              body,
              headers,
            });
            const retryRes = await fetch(retryUrl, {
              method,
              headers: retryHeaders,
              body: retryBody,
              signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (externalSignal) externalSignal.removeEventListener("abort", onExternalAbort);

            if (!retryRes.ok) {
              const err = await retryRes.json().catch(() => ({}));
              const message = getErrorMessageFromBody(err, retryRes.status);
              const errorDetails = extractErrorDetails(err);
              throw ApiError.fromStatus(retryRes.status, message, errorDetails.field, errorDetails.data);
            }
            const responseText = await retryRes.text();
            const rawData = responseText.length > 0 ? JSON.parse(responseText) : {};
            const data = config.raw ? rawData : unwrapResponse<T>(rawData);
            if (method === "GET" && cacheTtl > 0 && !config.raw) {
              CacheManager.set(cacheKey, data, cacheTtl);
            }
            return data as T;
          }
          throw new AuthError("Session expired");
        }

        if (res.status === 419 && method === "POST" && !skipCsrf) {
          const token = await getValidAccessToken();
          if (token) {
            try {
              const retryRes = await csrfManager.handle419Retry(
                { path, method, body, headers, signal: controller.signal },
                token,
                () => fetch(url, { method, headers: requestHeaders, body: requestBody, signal: controller.signal })
              );
              clearTimeout(timeoutId);
              if (externalSignal) externalSignal.removeEventListener("abort", onExternalAbort);

              if (!retryRes.ok) {
                const err = await retryRes.json().catch(() => ({}));
                const message = getErrorMessageFromBody(err, retryRes.status);
                const errorDetails = extractErrorDetails(err);
                throw ApiError.fromStatus(retryRes.status, message, errorDetails.field, errorDetails.data);
              }
              const responseText = await retryRes.text();
              const rawData = responseText.length > 0 ? JSON.parse(responseText) : {};
              const data = unwrapResponse<T>(rawData);
              return data as T;
            } catch (csrfError) {
              clearTimeout(timeoutId);
              if (externalSignal) externalSignal.removeEventListener("abort", onExternalAbort);
              throw csrfError;
            }
          }
        }

        if (res.status >= 500) {
          const shouldRetry = retryPolicy.shouldRetry(attemptIndex, null, false, true);
          if (shouldRetry) {
            const delay = retryPolicy.getDelay(attemptIndex);
            await sleep(delay);
            return execRequest(attemptIndex + 1);
          }
        }

        if (res.status === 429) {
          const shouldRetry = retryPolicy.shouldRetry(attemptIndex, null, true, false);
          if (shouldRetry) {
            const delay = retryPolicy.getDelay(attemptIndex, res.headers.get("Retry-After") ?? undefined);
            await sleep(delay);
            return execRequest(attemptIndex + 1);
          }
        }

        throw ApiError.fromStatus(res.status, message, errorDetails.field, errorDetails.data);
      }

      const responseText = await res.text();
      let rawData: Record<string, unknown> = {};
      try {
        rawData = responseText.length > 0 ? JSON.parse(responseText) : {};
      } catch {
        if (!res.ok) {
          throw ApiError.fromStatus(res.status, `Request failed with status ${res.status}`);
        }
        rawData = {};
      }
      const data = config.raw ? rawData : unwrapResponse<T>(rawData);
      if (method === "GET" && cacheTtl > 0 && !config.raw) {
        CacheManager.set(cacheKey, data, cacheTtl);
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

      const shouldRetry = retryPolicy.shouldRetry(0, error, false, true);
      if (method === "GET" && shouldRetry) {
        const delay = retryPolicy.getDelay(0);
        await sleep(delay);
        return execRequest(1);
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

    CacheManager.setInFlight(cacheKey, requestPromise as unknown as Promise<unknown>);

    execRequest(0)
      .then((data) => {
        CacheManager.deleteInFlight(cacheKey);
        resolveInflight(data);
      })
      .catch((err) => {
        CacheManager.deleteInFlight(cacheKey);
        rejectInflight(err);
      });
  } else {
    requestPromise = execRequest(0);
  }

  return requestPromise;
}

export interface ApiResponseMeta<T> {
  data: T;
  count: number;
  status: number;
}

export function buildFormEncodedBody(body: unknown): string {
  if (!body || typeof body !== "object") {
    return "";
  }
  const params = new URLSearchParams();
  const obj = body as Record<string, unknown>;
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const v of value) {
        params.append(`${key}[]`, String(v));
      }
    } else {
      params.append(key, String(value));
    }
  }
  return params.toString();
}

export const apiClient = {
  get: <T>(path: string, config?: Omit<RequestConfig, "method" | "body">) =>
    request<T>(path, { ...config, method: "GET" }),
  getRaw: <T>(path: string, config?: Omit<RequestConfig, "method" | "body">) =>
    request<T>(path, { ...config, method: "GET", raw: true }),
  getWithMeta: async <T>(path: string, config?: Omit<RequestConfig, "method" | "body">): Promise<ApiResponseMeta<T>> => {
    const response = await request<{ result?: T; count?: number; status?: number }>(path, { ...config, method: "GET", raw: true });
    return {
      data: (response as { result?: T }).result ?? (response as T),
      count: (response as { count?: number }).count ?? 0,
      status: (response as { status?: number }).status ?? 200,
    };
  },
  post: <T>(path: string, body: unknown, config?: Omit<RequestConfig, "method">) =>
    request<T>(path, { ...config, method: "POST", body }),
  put: <T>(path: string, body: unknown, config?: Omit<RequestConfig, "method">) =>
    request<T>(path, { ...config, method: "POST", body: { ...(body as object), _method: "PUT" } }),
  patch: <T>(path: string, body: unknown, config?: Omit<RequestConfig, "method">) =>
    request<T>(path, { ...config, method: "POST", body: { ...(body as object), _method: "PATCH" } }),
  delete: <T>(path: string, body?: unknown, config?: Omit<RequestConfig, "method" | "body">) =>
    request<T>(path, { ...config, method: "POST", body: { _method: "DELETE", ...(body as object) } }),
};

export function isMockEnabled(): boolean {
  if (typeof process !== "undefined" && process.env && process.env.EXPO_PUBLIC_USE_MOCK_DATA) {
    return process.env.EXPO_PUBLIC_USE_MOCK_DATA === "true";
  }
  return false;
}

export function invalidateCache(pattern?: string): void {
  CacheManager.clear(pattern);
}

export function setCacheUserContext(userHash: string | null): void {
  CacheManager.setUserContext(userHash);
}

export function getCacheUserContext(): string | null {
  return CacheManager.getUserContext();
}

export function clearCache(): void {
  CacheManager.clear();
}

export { buildFieldsParam, buildFieldsParamFromObject };