import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY, APP_NAME } from "@/constants/config";
import { secureStoreAdapter } from "@/lib/secureStoreAdapter";
import { USE_MOCK_DATA } from "@/constants/mockData";

let _client: SupabaseClient | null = null;
let _warnedMissingConfig = false;

function warnMissingConfig(): void {
  if (_warnedMissingConfig) return;
  _warnedMissingConfig = true;
  console.warn(
    `[${APP_NAME}] EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY is missing. ` +
      "Supabase-backed features (announcements, push tokens) are disabled."
  );
}

export function getSupabaseConfig(): { url: string; anonKey: string } | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  return { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY };
}

function initClient(): SupabaseClient {
  if (_client) return _client;

  const cfg = getSupabaseConfig();
  if (!cfg) {
    if (!USE_MOCK_DATA) warnMissingConfig();
    throw new Error("Supabase is not configured (set EXPO_PUBLIC_SUPABASE_URL/_ANON_KEY)");
  }

  _client = createClient(cfg.url, cfg.anonKey, {
    auth: {
      storage: secureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  return _client;
}

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, _receiver) {
    const client = initClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig() !== null;
}

export function resetSupabaseClient(): void {
  _client = null;
  _warnedMissingConfig = false;
}
