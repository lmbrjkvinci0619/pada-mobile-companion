// ─── API Config ──────────────────────────────────────────────────────────────

export const TOPSCORE_BASE_URL =
  process.env.EXPO_PUBLIC_TOPSCORE_BASE_URL ?? "https://pada.usetopscore.com";

if (!process.env.EXPO_PUBLIC_TOPSCORE_BASE_URL) {
  console.warn("EXPO_PUBLIC_TOPSCORE_BASE_URL is not set. Using fallback URL.");
}

export const TOPSCORE_OAUTH_URL =
  process.env.EXPO_PUBLIC_TOPSCORE_OAUTH_URL ??
  `${TOPSCORE_BASE_URL}/api/oauth/server`;

if (!process.env.EXPO_PUBLIC_TOPSCORE_OAUTH_URL) {
  console.warn(
    "EXPO_PUBLIC_TOPSCORE_OAUTH_URL is not set. Using fallback URL. " +
    "Verify this matches the OAuth endpoint at yoursite.com/u/oauth-key"
  );
}

// ─── TopScore OAuth ───────────────────────────────────────────────────────────

export const TOPSCORE_CLIENT_ID = process.env.EXPO_PUBLIC_TOPSCORE_CLIENT_ID ?? "";
export const TOPSCORE_CLIENT_SECRET = process.env.EXPO_PUBLIC_TOPSCORE_CLIENT_SECRET ?? "";

// Determines whether to use OAuth2 Bearer tokens (true) or Basic Auth with CSRF (false).
// Defaults to true (OAuth2) when TopScore credentials are configured.
// Set to false only if using Basic Auth with api_csrf signatures instead of OAuth2.
// TopScore API spec v1.0 documents OAuth2 as the recommended authentication method.
export const TOPSCORE_USE_OAUTH2 = process.env.EXPO_PUBLIC_TOPSCORE_USE_OAUTH2 !== "false" && !!TOPSCORE_CLIENT_ID;

// ─── Supabase ────────────────────────────────────────────────────────────────

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn("CRITICAL: EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY is missing. Real-time features will fail.");
}

// ─── Expo / EAS Config ───────────────────────────────────────────────────────
// Project ID for Expo push notifications.
// For managed workflow, this is automatically detected from app.json.
// For custom builds (e.g., EAS), you may need to set this explicitly.
// Can also be configured in app.json under expo.extra.eas.projectId.
export const EXPO_PROJECT_ID = process.env.EXPO_PUBLIC_PROJECT_ID;

// ─── Cache TTLs (milliseconds) ───────────────────────────────────────────────

export const CACHE_TTL = {
  userProfile: 24 * 60 * 60 * 1000,   // 24 hours
  schedule:     1 * 60 * 60 * 1000,   // 1 hour
  roster:       6 * 60 * 60 * 1000,   // 6 hours
  registrations: 2 * 60 * 60 * 1000,  // 2 hours
  teams:         6 * 60 * 60 * 1000,  // 6 hours
} as const;

// ─── Session ─────────────────────────────────────────────────────────────────

export const SESSION_DURATION_DAYS = 30;

// ─── Pagination ──────────────────────────────────────────────────────────────

export const PAGE_SIZE = 20;

// ─── App ─────────────────────────────────────────────────────────────────────

export const APP_NAME = "PadaHub";
export const APP_VERSION = "1.0.0";
export const PADA_ORG_URL = "https://pada.org";
export const PADA_REGISTER_URL = "https://pada.org/e";

// ─── User Agent ──────────────────────────────────────────────────────────────
// Used in API requests to identify the client to TopScore's servers.
// Per API spec Section 2, include a descriptive User-Agent to pass bot filters.
export const API_USER_AGENT = "TopScore API v1.0.0";
export const APP_USER_AGENT = "Pada.org Mobile App/1.0";

// ─── Sport ───────────────────────────────────────────────────────────────────

export const SPORT_NAME = "Ultimate Frisbee";
export const SPORT_EMOJI = "🥏";
