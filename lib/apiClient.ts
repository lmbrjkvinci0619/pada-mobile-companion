import { TOPSCORE_BASE_URL, TOPSCORE_USE_OAUTH2, API_USER_AGENT, APP_USER_AGENT } from "@/constants/config";
import { getValidAccessToken } from "@/services/auth";
import { ApiError, AuthError, NetworkError } from "./errors";
import { buildApiCsrfSignature, buildSignedUrl, clearApiCsrfCache } from "./apiCsrf";

const DEFAULT_TIMEOUT = 15000;
const RETRY_DELAY_BASE = 1000;
const MAX_RETRIES = 2;
const MAX_RATE_LIMIT_RETRIES = 3;

// Re-export User-Agent values from config for backward compatibility
export { API_USER_AGENT as TOPSCORE_USER_AGENT, APP_USER_AGENT as PADA_USER_AGENT } from "@/constants/config";

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

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const inFlightRequests = new Map<string, Promise<unknown>>();
const responseCache = new Map<string, CacheEntry<unknown>>();

let cacheUserContext: string | null = null;

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
  const [pathWithoutQuery, queryString] = path.split("?");
  const normalizedPath = pathWithoutQuery.endsWith("/") ? pathWithoutQuery.slice(0, -1) : pathWithoutQuery;
  const queryPart = queryString ? `?${queryString.split("&").sort().join("&")}` : "";
  return `${method}:${normalizedPath}${queryPart}${context}`;
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

export const MAX_PER_PAGE = 100;

export function buildFieldsParam(fields: string | string[]): string {
  if (!fields) return "";
  const fieldArray = Array.isArray(fields) ? fields : [fields];
  return fieldArray.map((f) => `fields[]=${encodeURIComponent(f)}`).join("&");
}

export function buildFieldsParamFromObject(
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

function buildFormEncodedBody(body: unknown): string {
  if (!body || typeof body !== "object") {
    return "";
  }
  const params = new URLSearchParams();
  const obj = body as Record<string, unknown>;
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const v of value) {
        params.append(key, String(v));
      }
    } else {
      params.append(key, String(value));
    }
  }
  return params.toString();
}

interface ApiResponseWrapper<T> {
  status?: string | number;
  count?: number;
  result?: T;
  errors?: Array<{ message?: string; code?: string }>;
}

/**
 * Unwraps TopScore API response based on the spec (docs/topscore_api.md Section 5).
 * 
 * TopScore API response format:
 * {
 *   status: number,    // HTTP status code
 *   count: number,     // Total matching records across all pages
 *   result: T | T[],   // The data (single object OR array depending on endpoint)
 *   errors: []         // Always empty array on success
 * }
 * 
 * IMPORTANT: TopScore is inconsistent about whether result is a single object or array:
 * - Single-object endpoints (e.g., /api/me, /api/persons/me) return: { result: { ... } }
 * - List endpoints (e.g., /api/events) return: { result: [{ ... }] }
 * - Some endpoints may vary - always verify with /api/help?endpoint=X
 * 
 * @param data - Raw API response
 * @returns Unwrapped data (result field or raw data if no wrapper)
 */
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
        clearCache();
        throw new AuthError("Not authenticated");
      }
    }

    const isWriteMethod = method === "POST";
    let csrfSignedUrl: string | null = null;
    if (!skipCsrf && isWriteMethod && token && !TOPSCORE_USE_OAUTH2) {
      try {
        const csrf = await buildApiCsrfSignature();
        csrfSignedUrl = buildSignedUrl(path, token, csrf);
      } catch (err) {
        throw new ApiError(
          err instanceof Error ? err.message : "Failed to generate API signature",
          500,
          "VALIDATION_ERROR"
        );
      }
    }

    const requestUrl = csrfSignedUrl ?? `${TOPSCORE_BASE_URL}${path}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const externalSignal = signal;

    const onExternalAbort = () => controller.abort();
    if (externalSignal) {
      if (externalSignal.aborted) controller.abort();
      else externalSignal.addEventListener("abort", onExternalAbort, { once: true });
    }

    const useBasicAuth = !skipCsrf && isWriteMethod && token && !TOPSCORE_USE_OAUTH2;
    const requestBody = useBasicAuth && body ? buildFormEncodedBody(body) : body ? JSON.stringify(body) : undefined;
    const contentType = useBasicAuth ? "application/x-www-form-urlencoded" : "application/json";

    const requestHeaders: Record<string, string> = {
      "Content-Type": contentType,
      "User-Agent": API_USER_AGENT,
      ...(token && TOPSCORE_USE_OAUTH2 ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    };

    try {
      const res = await fetch(requestUrl, {
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
          clearCache();
          const newToken = await getValidAccessToken();
          if (newToken) {
            const retryUrl = csrfSignedUrl ?? `${TOPSCORE_BASE_URL}${path}`;
            const retryRes = await fetch(retryUrl, {
              method,
              headers: {
                "Content-Type": "application/json",
                "User-Agent": API_USER_AGENT,
                Authorization: `Bearer ${newToken}`,
                ...headers,
              },
              body: body ? JSON.stringify(body) : undefined,
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
            const data = unwrapResponse<T>(rawData);
            if (method === "GET" && cacheTtl > 0) {
              setCache(cacheKey, data, cacheTtl);
            }
            return data as T;
          }
          throw new AuthError("Session expired");
        }

        if (res.status === 419 && isWriteMethod && !skipCsrf && token && !TOPSCORE_USE_OAUTH2) {
          clearApiCsrfCache();
          const newCsrf = await buildApiCsrfSignature();
          const retryUrl = buildSignedUrl(path, token, newCsrf);
          const retryBody = body ? buildFormEncodedBody(body) : undefined;
          const retryRes = await fetch(retryUrl, {
            method,
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "User-Agent": API_USER_AGENT,
              ...headers,
            },
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
            const data = unwrapResponse<T>(rawData);
            return data as T;
          }

        if (res.status >= 500) {
          if (attemptIndex < MAX_RETRIES) {
            await sleep(RETRY_DELAY_BASE * Math.pow(2, attemptIndex));
            return execRequest(attemptIndex + 1);
          }
        }

        if (res.status === 429) {
          if (attemptIndex < MAX_RATE_LIMIT_RETRIES) {
            const retryAfter = parseInt(res.headers.get("Retry-After") ?? "5", 10);
            const backoffMs = (isNaN(retryAfter) ? RETRY_DELAY_BASE * Math.pow(2, attemptIndex) : retryAfter * 1000);
            await sleep(backoffMs);
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

      if (method === "GET" && attemptIndex < MAX_RETRIES) {
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

export interface ApiResponseMeta<T> {
  data: T;
  count: number;
  status: number;
}

/**
 * TopScore API Client
 * 
 * Based on TopScore API spec v1.0 (docs/topscore_api.md)
 * 
 * IMPORTANT API NOTES:
 * 
 * 1. HTTP Methods: Only GET and POST are supported. There are no PUT, PATCH, or DELETE endpoints.
 *    All modifications use POST with _method override (e.g., _method: "PUT" for updates).
 *    This is implemented automatically by apiClient.put(), apiClient.patch(), apiClient.delete().
 * 
 * 2. Authentication:
 *    - Basic Auth: Uses auth_token (client_id) as query param + api_csrf signature for POST requests
 *    - OAuth2: Uses Bearer token in Authorization header (RECOMMENDED per spec Section 3.2)
 * 
 * 3. POST Body Format: 
 *    - Basic Auth: application/x-www-form-urlencoded (handled automatically)
 *    - OAuth2: application/json
 * 
 * 4. Response Format (per spec Section 5):
 *    { status: number, count: number, result: T | T[], errors: [] }
 *    - Single-object endpoints (e.g., /api/me) return: { result: { ... } }
 *    - List endpoints (e.g., /api/events) return: { result: [{ ... }] }
 * 
 * 5. Endpoint Verification Status:
 *    - VERIFIED: Confirmed working via /api/help or actual API testing
 *    - SPECULATIVE: Marked as possible but NOT verified - needs testing via /api/help
 *    Use isVerifiedEndpoint() and needsVerification() to check endpoint status.
 * 
 * 6. CSRF Signatures (Basic Auth only):
 *    - Valid for 1 hour (3600 seconds) per spec Section 3.1
 *    - We cache for 55 minutes with 5-minute refresh buffer
 *    - Nonce must be at least 10 characters (we use 16)
 * 
 * 7. Rate Limiting:
 *    - 429 response triggers exponential backoff retry
 *    - Retry-After header respected if present
 */

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
  if (!pattern) {
    responseCache.clear();
    return;
  }
  const normalizedPattern = pattern.toLowerCase();
  for (const key of responseCache.keys()) {
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
      responseCache.delete(key);
    }
  }
}
