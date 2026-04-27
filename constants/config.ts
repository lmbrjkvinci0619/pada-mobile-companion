// ─── API Config ──────────────────────────────────────────────────────────────

export const TOPSCORE_BASE_URL =
  process.env.EXPO_PUBLIC_TOPSCORE_BASE_URL ?? "https://pada.usetopscore.com";

if (!process.env.EXPO_PUBLIC_TOPSCORE_BASE_URL) {
  console.warn("EXPO_PUBLIC_TOPSCORE_BASE_URL is not set. Using fallback URL.");
}

export const TOPSCORE_OAUTH_URL =
  `${TOPSCORE_BASE_URL}/api/oauth/server`;

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn("CRITICAL: EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY is missing. Real-time features will fail.");
}

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
export const PADA_REGISTER_URL = "https://pada.org/register";

// ─── Sport ───────────────────────────────────────────────────────────────────

export const SPORT_NAME = "Ultimate Frisbee";
export const SPORT_EMOJI = "🥏";
