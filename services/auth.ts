import * as SecureStore from "expo-secure-store";
import { TOPSCORE_OAUTH_URL, SESSION_DURATION_DAYS } from "@/constants/config";
import type { AuthTokens, User } from "@/types";

const TOKEN_KEY = "padahub_tokens";
const USER_KEY  = "padahub_user";

// ─── Token Storage ────────────────────────────────────────────────────────────

export async function saveTokens(tokens: AuthTokens): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(tokens));
}

export async function loadTokens(): Promise<AuthTokens | null> {
  const raw = await SecureStore.getItemAsync(TOKEN_KEY);
  return raw ? (JSON.parse(raw) as AuthTokens) : null;
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}

// ─── User Cache ───────────────────────────────────────────────────────────────

export async function saveUser(user: User): Promise<void> {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function loadUser(): Promise<User | null> {
  const raw = await SecureStore.getItemAsync(USER_KEY);
  return raw ? (JSON.parse(raw) as User) : null;
}

// ─── OAuth2 Login ─────────────────────────────────────────────────────────────

export interface LoginResult {
  success: boolean;
  error?: string;
}

export async function loginWithCredentials(
  email: string,
  password: string,
): Promise<LoginResult> {
  try {
    const body = new URLSearchParams({
      grant_type: "password",
      username: email,
      password,
      client_id: process.env.EXPO_PUBLIC_TOPSCORE_CLIENT_ID ?? "pada_mobile",
      client_secret: process.env.EXPO_PUBLIC_TOPSCORE_CLIENT_SECRET ?? "",
    });

    const res = await fetch(TOPSCORE_OAUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: (err as any).error_description ?? "Invalid credentials" };
    }

    const data = await res.json();
    const expiry = Date.now() + (data.expires_in ?? SESSION_DURATION_DAYS * 86400) * 1000;

    await saveTokens({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: expiry,
    });

    return { success: true };
  } catch (e) {
    return { success: false, error: "Network error. Please try again." };
  }
}

// ─── Token Validation ─────────────────────────────────────────────────────────

export function isTokenExpired(tokens: AuthTokens): boolean {
  return Date.now() >= tokens.expiresAt - 60_000; // 1-min buffer
}

export async function getValidAccessToken(): Promise<string | null> {
  const tokens = await loadTokens();
  if (!tokens) return null;
  if (!isTokenExpired(tokens)) return tokens.accessToken;

  // Attempt refresh
  if (tokens.refreshToken) {
    try {
      const body = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: tokens.refreshToken,
        client_id: process.env.EXPO_PUBLIC_TOPSCORE_CLIENT_ID ?? "pada_mobile",
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
        await saveTokens({ ...tokens, accessToken: data.access_token, expiresAt: expiry });
        return data.access_token;
      }
    } catch {}
  }

  await clearTokens();
  return null;
}
