import * as SecureStore from "expo-secure-store";

const SAFE_KEY_PREFIX = "padahub_";

function safeKey(key: string): string {
  const safeName = key.replace(/[^a-zA-Z0-9-]/g, "_");
  return `${SAFE_KEY_PREFIX}${safeName}`;
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
      await SecureStore.setItemAsync(safeKey(key), value, {
        keychainService: "padahub-supabase",
      });
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