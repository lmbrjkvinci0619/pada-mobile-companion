import { TOPSCORE_BASE_URL } from "@/constants/config";
import { getValidAccessToken } from "@/services/auth";
import { USE_MOCK_DATA } from "@/constants/mockData";
import { ApiError, AuthError, NetworkError, ErrorCode } from "./errors";

interface RequestConfig {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
}

async function request<T>(path: string, config: RequestConfig = {}): Promise<T> {
  const { method = "GET", headers = {}, body, signal } = config;

  const token = await getValidAccessToken();
  if (!token) {
    throw new AuthError("Not authenticated", ErrorCode.UNAUTHORIZED);
  }

  if (signal?.aborted) {
    throw new NetworkError("Request aborted");
  }

  const controller = new AbortController();
  if (signal) {
    signal.addEventListener("abort", () => controller.abort());
  }

  try {
    const res = await fetch(`${TOPSCORE_BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const message = (err as { message?: string }).message ?? `API error ${res.status}`;
      throw ApiError.fromStatus(res.status, message);
    }

    return res.json() as Promise<T>;
  } catch (error) {
    if (error instanceof ApiError || error instanceof AuthError) {
      throw error;
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new NetworkError("Request aborted");
    }
    throw new NetworkError("Network error. Please check your connection.");
  }
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