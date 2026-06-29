import * as SecureStore from "expo-secure-store";
import { TOPSCORE_OAUTH_URL, SESSION_DURATION_DAYS } from "@/constants/config";
import type { AuthTokens, User } from "@/types";
import { checkLoginRateLimit, recordFailedLogin, clearLoginRateLimit } from "@/lib/validation";

const TOKEN_KEY = "padahub_tokens";
const USER_KEY = "padahub_user";

let memoryTokens: AuthTokens | null = null;
let memoryOnlySession = false;

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
      client_id: process.env.EXPO_PUBLIC_TOPSCORE_CLIENT_ID ?? "",
      client_secret: process.env.EXPO_PUBLIC_TOPSCORE_CLIENT_SECRET ?? "",
    });

    const res = await fetch(TOPSCORE_OAUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
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

    const data = await res.json() as { access_token: string; refresh_token?: string; expires_in?: number };
    const expiry =
      Date.now() + (data.expires_in ?? SESSION_DURATION_DAYS * 86400) * 1000;

    const tokens: AuthTokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
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
  return Date.now() >= tokens.expiresAt - 60_000;
}

export async function getValidAccessToken(): Promise<string | null> {
  const tokens = await loadTokens();
  if (!tokens) return null;
  if (!isTokenExpired(tokens)) return tokens.accessToken;

  if (tokens.refreshToken) {
    try {
      const body = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: tokens.refreshToken,
        client_id: process.env.EXPO_PUBLIC_TOPSCORE_CLIENT_ID ?? "",
        client_secret: process.env.EXPO_PUBLIC_TOPSCORE_CLIENT_SECRET ?? "",
      });
      const res = await fetch(TOPSCORE_OAUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
      
      if (res.ok) {
        const data = await res.json();
        const expiry = Date.now() + (data.expires_in ?? 3600) * 1000;
        const newTokens = { ...tokens, accessToken: data.access_token, refreshToken: data.refresh_token ?? tokens.refreshToken, expiresAt: expiry };
        if (memoryOnlySession) {
          memoryTokens = newTokens;
        } else {
          await saveTokens(newTokens);
        }
        return data.access_token;
      }
      
      if (res.status === 401 || res.status === 403) {
        console.warn("Token refresh rejected - clearing credentials");
        await clearTokens();
        return null;
      }
      
      console.warn("Token refresh failed with status:", res.status);
    } catch (error) {
      console.error("Token refresh error:", error instanceof Error ? error.message : "Unknown error");
    }
  }

  console.warn("No refresh token available - clearing credentials");
  await clearTokens();
  return null;
}