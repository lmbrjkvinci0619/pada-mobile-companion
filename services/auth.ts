import * as SecureStore from "expo-secure-store";
import { TOPSCORE_OAUTH_URL, SESSION_DURATION_DAYS, TOPSCORE_CLIENT_ID, TOPSCORE_CLIENT_SECRET, APP_USER_AGENT, TOPSCORE_USE_OAUTH2 } from "@/constants/config";
import type { AuthTokens, User } from "@/types";
import { checkLoginRateLimit, recordFailedLogin, clearLoginRateLimit } from "@/lib/validation";
import { normalizeTopScoreBaseUrl } from "@/lib/urlUtils";
import { randomSessionId, SecureBuffer } from "@/lib/security";
import {
  logSecurityEvent,
  SecurityEventType,
  setDeviceIdentifier,
  getDeviceFingerprint,
} from "@/lib/securityAudit";

/**
 * TopScore OAuth2 Authentication
 *
 * IMPORTANT NOTES ON TOKEN REFRESH (per TopScore API spec v1.0):
 *
 * 1. The TopScore API spec only documents two OAuth2 grant types:
 *    - client_credentials (server-to-server)
 *    - password (user authentication)
 *
 * 2. The spec does NOT document refresh_token grant. If TopScore returns a
 *    refresh_token, it may or may not be usable. If refresh fails with
 *    "unsupported_grant_type", the server doesn't support refresh tokens.
 *
 * 3. When refresh fails:
 *    - 401/403: Refresh token is invalid/expired → tokens cleared, user logged out
 *    - unsupported_grant_type: Server doesn't support refresh → tokens cleared
 *    - Network/5xx errors: Temporary failure → no automatic logout, retry on next call
 *
 * 4. For better UX, the app should store user credentials securely to attempt
 *    silent re-authentication when refresh fails. However, storing credentials
 *    in a mobile app has security implications.
 *
 * 5. Production recommendation: Use a trusted backend proxy that handles OAuth2
 *    token refresh securely, or implement OAuth2 PKCE flow if supported.
 */

const TOKEN_KEY = "padahub_tokens";
const USER_KEY = "padahub_user";
const SESSION_KEY = "padahub_session_id";
const BIOMETRIC_KEY = "padahub_biometric_enabled";
const DEVICE_FP_KEY = "padahub_device_fp";

let memoryTokens: AuthTokens | null = null;
let memoryOnlySession = false;
let refreshLock: Promise<string | null> | null = null;
let hasWarnedPasswordGrant = false;
let currentSessionId: string | null = null;
let refreshFailureCount = 0;
const MAX_REFRESH_FAILURES = 3;
const REFRESH_COOLDOWN_MS = 5000;
let lastRefreshFailure: number | null = null;

function warnPasswordGrant(): void {
  if (hasWarnedPasswordGrant) return;
  hasWarnedPasswordGrant = true;
  console.warn(
    "[SECURITY WARNING] OAuth 'password' grant is being used from the mobile client. " +
    "Per docs/topscore_api.md §3.2, this grant is intended for server-side use only. " +
    "Client credentials (client_id/client_secret) are embedded in the app bundle and " +
    "can be extracted. This is a KNOWN LIMITATION of the mobile app architecture. " +
    "For production use, implement one of: " +
    "(1) Trusted backend proxy that handles token exchange, " +
    "(2) OAuth2 PKCE flow (if supported by TopScore), " +
    "(3) Basic Auth with api_csrf signatures (TOPSCORE_USE_OAUTH2=false)"
  );
}

export async function saveTokens(tokens: AuthTokens): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(tokens));
  const sessionId = await getOrCreateSessionId();
  await SecureStore.setItemAsync(`${TOKEN_KEY}_session`, sessionId);
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
  refreshFailureCount = 0;
  lastRefreshFailure = null;
  if (refreshLock) {
    refreshLock = null;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
  await SecureStore.deleteItemAsync(SESSION_KEY);
  await SecureStore.deleteItemAsync(DEVICE_FP_KEY);
  currentSessionId = null;
}

export async function saveDeviceFingerprint(): Promise<void> {
  const fp = getDeviceFingerprint();
  await SecureStore.setItemAsync(DEVICE_FP_KEY, fp);
}

export async function getStoredDeviceFingerprint(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(DEVICE_FP_KEY);
  } catch {
    return null;
  }
}

export async function checkDeviceFingerprintChange(): Promise<boolean> {
  const stored = await getStoredDeviceFingerprint();
  if (!stored) return true;
  const current = getDeviceFingerprint();
  return stored !== current;
}

async function getOrCreateSessionId(): Promise<string> {
  if (currentSessionId) return currentSessionId;
  try {
    const stored = await SecureStore.getItemAsync(SESSION_KEY);
    if (stored) {
      currentSessionId = stored;
      return stored;
    }
  } catch {
  }
  currentSessionId = randomSessionId();
  await SecureStore.setItemAsync(SESSION_KEY, currentSessionId);
  return currentSessionId;
}

export async function getSessionId(): Promise<string | null> {
  if (currentSessionId) return currentSessionId;
  try {
    const stored = await SecureStore.getItemAsync(SESSION_KEY);
    if (stored) {
      currentSessionId = stored;
      return stored;
    }
  } catch {
  }
  return null;
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
  warnPasswordGrant();
  const identifier = email.trim().toLowerCase();
  const rateLimit = checkLoginRateLimit(identifier);

  if (!rateLimit.allowed) {
    const minutes = Math.ceil((rateLimit.retryAfterMs ?? 0) / 60000);
    return {
      success: false,
      error: `Too many login attempts. Please try again in ${minutes} minute(s).`,
    };
  }

  const passwordBuffer = new SecureBuffer();
  let tokenData: OAuthTokenResponse | null = null;

  try {
    passwordBuffer.set(password);

    const body = new URLSearchParams({
      grant_type: "password",
      username: identifier,
      password: passwordBuffer.getAndClear(),
      client_id: TOPSCORE_CLIENT_ID,
      client_secret: TOPSCORE_CLIENT_SECRET,
    });
    const res = await fetch(TOPSCORE_OAUTH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": APP_USER_AGENT,
      },
      body: body.toString(),
    });

    if (!res.ok) {
      recordFailedLogin(identifier);
      logSecurityEvent(SecurityEventType.LOGIN_FAILURE, {
        metadata: { reason: "invalid_credentials" },
      });
      return {
        success: false,
        error: "Invalid email or password.",
      };
    }

    clearLoginRateLimit(identifier);

    const fpChanged = await checkDeviceFingerprintChange();
    if (fpChanged) {
      logSecurityEvent(SecurityEventType.LOGIN_SUCCESS, {
        metadata: { rememberMe, deviceFingerprintChanged: true },
      });
    } else {
      logSecurityEvent(SecurityEventType.LOGIN_SUCCESS, {
        metadata: { rememberMe },
      });
    }

    const rawData = await res.json() as OAuthResponse;
    tokenData = unwrapOAuthResponse(rawData);
    const expiry =
      Date.now() + (tokenData.expires_in ?? SESSION_DURATION_DAYS * 86400) * 1000;

    const tokens: AuthTokens = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: expiry,
    };

    if (rememberMe) {
      await saveTokens(tokens);
      await saveDeviceFingerprint();
    } else {
      memoryTokens = tokens;
      memoryOnlySession = true;
    }

    return { success: true };
  } catch (error) {
    console.error("[auth] loginWithCredentials error:", error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error("[auth] Stack:", error.stack.split('\n').slice(0, 5).join('\n'));
    }
    return { success: false, error: `Unable to connect: ${error instanceof Error ? error.message : "Unknown error"}` };
  } finally {
    passwordBuffer.clear();
  }
}

export function isTokenExpired(tokens: AuthTokens): boolean {
  const EXPIRY_BUFFER_MS = 5 * 60 * 1000;
  return Date.now() >= tokens.expiresAt - EXPIRY_BUFFER_MS;
}

export async function loginWithClientCredentials(
  rememberMe: boolean = true
): Promise<LoginResult> {
  if (!TOPSCORE_CLIENT_ID || !TOPSCORE_CLIENT_SECRET) {
    return { success: false, error: "OAuth credentials not configured. Set EXPO_PUBLIC_TOPSCORE_CLIENT_ID and EXPO_PUBLIC_TOPSCORE_CLIENT_SECRET." };
  }

  try {
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: TOPSCORE_CLIENT_ID,
      client_secret: TOPSCORE_CLIENT_SECRET,
    });

    const res = await fetch(TOPSCORE_OAUTH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": APP_USER_AGENT,
      },
      body: body.toString(),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({})) as Record<string, unknown>;
      const errorMsg = (errorData.error_description as string) || (errorData.error as string) || `HTTP ${res.status}`;
      console.error("Client credentials grant failed:", errorMsg);
      return { success: false, error: `Authentication failed: ${errorMsg}` };
    }

    const rawData = await res.json() as OAuthResponse;
    const tokenData = unwrapOAuthResponse(rawData);
    const expiry = Date.now() + (tokenData.expires_in ?? 3600) * 1000;
    const tokens: AuthTokens = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token ?? "",
      expiresAt: expiry,
    };

    if (rememberMe) {
      await saveTokens(tokens);
    } else {
      memoryTokens = tokens;
      memoryOnlySession = true;
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Network error" };
  }
}

export async function getValidAccessToken(): Promise<string | null> {
  // In Basic Auth mode, the "token" is the client_id itself.
  // Requests are authenticated by HMAC-signing with client_secret, not by bearer tokens.
  if (!TOPSCORE_USE_OAUTH2) {
    return TOPSCORE_CLIENT_ID || null;
  }

  const tokens = await loadTokens();
  if (!tokens) return null;
  if (!isTokenExpired(tokens)) return tokens.accessToken;

  if (lastRefreshFailure !== null && Date.now() - lastRefreshFailure < REFRESH_COOLDOWN_MS) {
    return null;
  }

  if (!tokens.refreshToken) {
    if (refreshFailureCount >= MAX_REFRESH_FAILURES) {
      console.warn("No refresh token and max re-auth failures reached - clearing credentials");
      await clearTokens();
      return null;
    }
    refreshFailureCount++;
    lastRefreshFailure = Date.now();
    console.log("Token expired, attempting client_credentials grant re-authentication");
    const result = await loginWithClientCredentials(true);
    if (result.success) {
      refreshFailureCount = 0;
      lastRefreshFailure = null;
      const newTokens = await loadTokens();
      return newTokens?.accessToken ?? null;
    }
    return null;
  }

  if (refreshLock) {
    return refreshLock;
  }

  refreshLock = (async () => {
    try {
      const currentTokens = await loadTokens();
      if (!currentTokens || !currentTokens.refreshToken) {
        return null;
      }

      const body = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: currentTokens.refreshToken,
        client_id: TOPSCORE_CLIENT_ID,
        client_secret: TOPSCORE_CLIENT_SECRET,
      });
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(TOPSCORE_OAUTH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": APP_USER_AGENT,
      },
      body: body.toString(),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

      if (res.ok) {
        refreshFailureCount = 0;
        lastRefreshFailure = null;
        logSecurityEvent(SecurityEventType.TOKEN_REFRESH_SUCCESS);
        const rawData = await res.json() as OAuthResponse;
        const tokenData = unwrapOAuthResponse(rawData);
        const expiry = Date.now() + (tokenData.expires_in ?? 3600) * 1000;
        const newTokens: AuthTokens = {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token ?? currentTokens.refreshToken,
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
        logSecurityEvent(SecurityEventType.TOKEN_REFRESH_FAILURE, {
          metadata: { reason: "refresh_token_invalid" },
        });
        console.warn("Refresh token rejected (401/403) - clearing credentials. User must re-authenticate.");
        await clearTokens();
        return null;
      }

      const errorData = await res.json().catch(() => ({})) as Record<string, unknown>;
      const error = errorData.error as string | undefined;
      const errorMsg = errorData.error_description || error || `HTTP ${res.status}`;

      if (error === "unsupported_grant_type") {
        logSecurityEvent(SecurityEventType.TOKEN_REFRESH_FAILURE, {
          metadata: { reason: "unsupported_grant_type" },
        });
        console.warn(`Refresh token grant not supported by server (${errorMsg}). Password grant re-auth required.`);
        await clearTokens();
        return null;
      }

      logSecurityEvent(SecurityEventType.TOKEN_REFRESH_FAILURE, {
        metadata: { status: res.status, reason: errorMsg },
      });
      console.warn(`Token refresh failed (${res.status}): ${errorMsg}. Will retry on next call.`);
      lastRefreshFailure = Date.now();
      return null;
    } catch (error) {
      logSecurityEvent(SecurityEventType.TOKEN_REFRESH_FAILURE, {
        metadata: { reason: error instanceof Error ? error.message : "unknown" },
      });
      console.warn("Token refresh error (network/server issue). Will retry on next call:", error instanceof Error ? error.message : "Unknown error");
      lastRefreshFailure = Date.now();
      return null;
    }
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
    const res = await fetch(`${normalizeTopScoreBaseUrl()}/api/me`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "User-Agent": APP_USER_AGENT,
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