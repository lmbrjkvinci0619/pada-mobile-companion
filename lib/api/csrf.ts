import { buildApiCsrfSignature, buildSignedUrl, clearApiCsrfCache } from "@/lib/apiCsrf";
import { normalizeTopScoreBaseUrl } from "@/lib/urlUtils";
import { getValidAccessToken } from "@/services/auth";
import { TOPSCORE_USE_OAUTH2, TOPSCORE_CLIENT_ID } from "@/constants/config";

interface CsrfRequestConfig {
  path: string;
  method: "GET" | "POST";
  body?: unknown;
  signal?: AbortSignal;
  headers?: Record<string, string>;
  timeout?: number;
}

export class CsrfManager {
  private token: string | null = null;

  async getToken(): Promise<string | null> {
    if (!this.token) {
      this.token = await getValidAccessToken();
    }
    return this.token;
  }

  clearToken(): void {
    this.token = null;
  }

  async prepareRequest(config: CsrfRequestConfig): Promise<{
    url: string;
    body: string | undefined;
    headers: Record<string, string>;
    contentType: string;
  }> {
    const token = await this.getToken();
    const isWriteMethod = config.method === "POST";
    const useBasicAuth = isWriteMethod && token && !TOPSCORE_USE_OAUTH2;

    let requestUrl: string;
    let requestBody: string | undefined;
    let contentType: string;

    if (useBasicAuth) {
      // For Basic Auth POST, we need CSRF signature
      const csrf = await buildApiCsrfSignature();
      requestUrl = buildSignedUrl(config.path, token!, csrf);
      requestBody = config.body ? this.buildFormEncodedBody(config.body) : undefined;
      contentType = "application/x-www-form-urlencoded";
    } else if (config.method === "GET" && token && !TOPSCORE_USE_OAUTH2) {
      // For Basic Auth GET, add auth_token query param
      const [pathWithoutHash, hash] = config.path.split("#");
      const [purePath, existingQuery = ""] = pathWithoutHash.split("?");
      const base = `${normalizeTopScoreBaseUrl()}${purePath}`;
      const params = new URLSearchParams(existingQuery);
      params.set("auth_token", token);
      const qs = params.toString();
      requestUrl = `${base}?${qs}${hash ? `#${hash}` : ""}`;
      requestBody = undefined;
      contentType = "application/json";
    } else {
      // OAuth2 or no auth
      requestUrl = `${normalizeTopScoreBaseUrl()}${config.path}`;
      requestBody = config.body ? JSON.stringify(config.body) : undefined;
      contentType = "application/json";
    }

    const requestHeaders: Record<string, string> = {
      "Content-Type": contentType,
      "User-Agent": "Pada.org Mobile App/1.0",
      ...(token && TOPSCORE_USE_OAUTH2 ? { Authorization: `Bearer ${token}` } : {}),
      ...config.headers,
    };

    return { url: requestUrl, body: requestBody, headers: requestHeaders, contentType };
  }

  async handle419Retry(
    config: CsrfRequestConfig,
    token: string,
    originalFn: () => Promise<Response>
  ): Promise<Response> {
    clearApiCsrfCache();
    const newCsrf = await buildApiCsrfSignature();
    const retryUrl = buildSignedUrl(config.path, token, newCsrf);
    const retryBody = config.body ? this.buildFormEncodedBody(config.body) : undefined;

    return fetch(retryUrl, {
      method: config.method,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Pada.org Mobile App/1.0",
        ...config.headers,
      },
      body: retryBody,
      signal: config.signal,
    });
  }

  private buildFormEncodedBody(body: unknown): string {
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
}