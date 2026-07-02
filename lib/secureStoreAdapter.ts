import * as SecureStore from "expo-secure-store";

const SAFE_KEY_PREFIX = "padahub_";

function safeKey(key: string): string {
  // SecureStore keys allow only [A-Za-z0-9._-]. Replace any other character with
  // "_" (preserving uniqueness for most callers), then append a short hash of
  // the original key so that distinct names that sanitize to the same string
  // (e.g. "sb.token.1" and "sb_token_1") cannot collide.
  let cleaned = "";
  const hashInput = key.replace(/[^A-Za-z0-9._-]/g, "");
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  const hashStr = hash.toString(36);
  const unsafeCount = key.length - hashInput.length;
  cleaned = hashInput.length > 0 ? hashInput.replace(/[^A-Za-z0-9._-]/g, "_") : "k";
  return `${SAFE_KEY_PREFIX}${cleaned}_h${hashStr}_u${unsafeCount}`;
}

export const secureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(safeKey(key));
    } catch (err) {
      console.error(`SecureStore getItem failed for key ${key}:`, err);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(safeKey(key), value);
    } catch (err) {
      console.error(`SecureStore setItem failed for key ${key}:`, err);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(safeKey(key));
    } catch (err) {
      console.error(`SecureStore removeItem failed for key ${key}:`, err);
    }
  },
};