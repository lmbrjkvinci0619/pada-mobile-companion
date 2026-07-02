import * as SecureStore from "expo-secure-store";
import { TOPSCORE_OAUTH_URL, TOPSCORE_BASE_URL, SESSION_DURATION_DAYS, TOPSCORE_CLIENT_ID, TOPSCORE_CLIENT_SECRET, API_USER_AGENT } from "@/constants/config";
import type { AuthTokens, User } from "@/types";
import { checkLoginRateLimit, recordFailedLogin, clearLoginRateLimit } from "@/lib/validation";

const TOKEN_KEY = "padahub_tokens";
const USER_KEY = "padahub_user";

let memoryTokens: AuthTokens | null = null;
let memoryOnlySession = false;
let refreshLock: Promise<string | null> | null = null;

export async function saveTokens(tokens: AuthTokens): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(tokens));
}

export async function loadTokens(): Promise<AuthTokens | null> {
  if (memoryTokens) {
    return memoryTokens;
  }
  try {
    const raw = await SecureStore.getItemAsync(TOKEN_KEY);
    return raw ? (JSON.parse(raw) as AuthTokens) : null;
  } catch {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    return null;
  }
}

export async function clearTokens(): Promise<void> {
  memoryTokens = null;
  memoryOnlySession = false;
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}

export async function saveUser(user: User): Promise<void> {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function loadUser(): Promise<User | null> {
  try {
    const raw = await SecureStore.getItemAsync(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    await SecureStore.deleteItemAsync(USER_KEY);
    return null;
  }
}

export interface LoginResult {
  success: boolean;
  error?: string;
}

interface OAuthErrorResponse {
  error?: string;
  error_description?: string;
}

interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
}

interface OAuthResponse {
  status: number;
  count: number;
  result: OAuthTokenResponse[];
  errors: unknown[];
}

function unwrapOAuthResponse(data: unknown): OAuthTokenResponse {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid OAuth response");
  }
  const d = data as Record<string, unknown>;
  if ("result" in d && Array.isArray(d.result) && d.result.length > 0) {
    const first = d.result[0];
    if (typeof first === "object" && first !== null) {
      return first as OAuthTokenResponse;
    }
  }
  if ("access_token" in d) {
    return d as unknown as OAuthTokenResponse;
  }
  throw new Error("Invalid OAuth response: missing result or access_token");
}

export async function loginWithCredentials(
  email: string,
  password: string,
  rememberMe: boolean = true
): Promise<LoginResult> {
  const identifier = email.trim().toLowerCase();
  const rateLimit = checkLoginRateLimit(identifier);

  if (!rateLimit.allowed) {
    const minutes = Math.ceil((rateLimit.retryAfterMs ?? 0) / 60000);
    return {
      success: false,
      error: `Too many login attempts. Please try again in ${minutes} minute(s).`,
    };
  }

  try {
    const body = new URLSearchParams({
      grant_type: "password",
      username: identifier,
      password,
      client_id: TOPSCORE_CLIENT_ID,
      client_secret: TOPSCORE_CLIENT_SECRET,
    });

    const res = await fetch(TOPSCORE_OAUTH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": API_USER_AGENT,
      },
      body: body.toString(),
    });

    if (!res.ok) {
      recordFailedLogin(identifier);
      const err = await res.json().catch(() => ({})) as OAuthErrorResponse;
      return {
        success: false,
        error: "Invalid email or password.",
      };
    }

    clearLoginRateLimit(identifier);

    const rawData = await res.json() as OAuthResponse;
    const tokenData = unwrapOAuthResponse(rawData);
    const expiry =
      Date.now() + (tokenData.expires_in ?? SESSION_DURATION_DAYS * 86400) * 1000;

    const tokens: AuthTokens = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: expiry,
    };

    if (rememberMe) {
      await saveTokens(tokens);
    } else {
      memoryTokens = tokens;
      memoryOnlySession = true;
    }

    return { success: true };
  } catch {
    return { success: false, error: "Unable to connect. Please check your network." };
  }
}

export function isTokenExpired(tokens: AuthTokens): boolean {
  const EXPIRY_BUFFER_MS = 5 * 60 * 1000;
  return Date.now() >= tokens.expiresAt - EXPIRY_BUFFER_MS;
}

export async function getValidAccessToken(): Promise<string | null> {
  const tokens = await loadTokens();
  if (!tokens) return null;
  if (!isTokenExpired(tokens)) return tokens.accessToken;

  /**
   * NOTE: Token Refresh (per TopScore API spec v1.0)
   *
   * The TopScore API spec ONLY documents:
   * - client_credentials grant (server-to-server)
   * - password grant (user authentication)
   *
   * The spec does NOT document refresh_token grant.
   * TopScore may NOT support refresh_token grant - the spec suggests re-authenticating
   * with password grant before token expiry.
   *
   * If refresh fails, the user must re-enter credentials (loginWithCredentials).
   *
   * IMPORTANT: We attempt refresh_token grant as a fallback since some TopScore
   * implementations may support it even though it's not in the spec. If this fails,
   * we clear tokens and require re-authentication.
   */
  if (!tokens.refreshToken) {
    console.warn("No refresh token available - user will need to re-authenticate when token expires. Per TopScore API spec v1.0, only password grant is documented for user authentication.");
    await clearTokens();
    return null;
  }

  if (refreshLock) {
    return refreshLock;
  }

  refreshLock = (async () => {
    try {
      /**
       * Attempting refresh_token grant - NOT DOCUMENTED in API spec.
       * Per TopScore API spec v1.0 Section 3.2, only client_credentials and password
       * grants are documented. However, some implementations may support refresh_token.
       *
       * We attempt this as a best-effort fallback. If it fails, we clear credentials
       * and require the user to re-authenticate with password grant.
       */
      const body = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: tokens.refreshToken!,
        client_id: TOPSCORE_CLIENT_ID,
        client_secret: TOPSCORE_CLIENT_SECRET,
      });
      const res = await fetch(TOPSCORE_OAUTH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": API_USER_AGENT,
        },
        body: body.toString(),
      });

      if (res.ok) {
        const rawData = await res.json() as OAuthResponse;
        const tokenData = unwrapOAuthResponse(rawData);
        const expiry = Date.now() + (tokenData.expires_in ?? 3600) * 1000;
        const newTokens: AuthTokens = {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token ?? tokens.refreshToken,
          expiresAt: expiry,
        };
        if (memoryOnlySession) {
          memoryTokens = newTokens;
        } else {
          await saveTokens(newTokens);
        }
        return tokenData.access_token;
      }

      if (res.status === 401 || res.status === 403) {
        console.warn("Token refresh rejected - TopScore does not support refresh_token grant per the API spec. User must re-authenticate with password grant.");
      } else {
        const errorData = await res.json().catch(() => ({})) as Record<string, unknown>;
        const errorMsg = errorData.error_description || errorData.error || `HTTP ${res.status}`;
        console.warn(`Token refresh failed (${res.status}): ${errorMsg}`);
      }
    } catch (error) {
      console.error("Token refresh error:", error instanceof Error ? error.message : "Unknown error");
    }

    console.warn("Token refresh failed - clearing credentials. User will need to re-authenticate with password grant.");
    await clearTokens();
    return null;
  })();

  const result = await refreshLock;
  refreshLock = null;
  return result;
}

/**
 * Test authentication using the /api/me endpoint (per TopScore API spec v1.0 Section 3.1)
 * Returns true if auth is valid, false otherwise.
 *
 * IMPORTANT: TopScore API returns result as an array for /api/me endpoint:
 * { status: 200, count: 1, result: [{ person_id: 12345, api_csrf_valid: true }], errors: [] }
 *
 * Single-object endpoints like /api/me return result as [object], not just object.
 */
export async function testAuthentication(token: string): Promise<{ valid: boolean; personId?: number; csrfValid?: boolean }> {
  try {
    const res = await fetch(`${TOPSCORE_BASE_URL}/api/me`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "User-Agent": API_USER_AGENT,
      },
    });
    const data = await res.json() as {
      status?: number;
      result?: Array<{ person_id?: number; api_csrf_valid?: boolean }>;
      errors?: Array<{ message?: string }>;
    };

    if (data.status === 200 && Array.isArray(data.result) && data.result.length > 0) {
      const firstResult = data.result[0];
      return {
        valid: true,
        personId: firstResult.person_id,
        csrfValid: firstResult.api_csrf_valid,
      };
    }
    if (data.errors && data.errors.length > 0) {
      console.warn("Authentication test error:", data.errors[0].message);
    }
    return { valid: false };
  } catch (error) {
    console.error("Authentication test failed:", error instanceof Error ? error.message : "Unknown error");
    return { valid: false };
  }
}