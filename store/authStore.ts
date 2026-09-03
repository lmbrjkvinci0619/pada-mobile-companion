import { create } from "zustand";
import type { User } from "@/types";
import {
  saveTokens,
  loadTokens,
  clearTokens,
  saveUser,
  loadUser,
  loginWithCredentials,
} from "@/services/auth";
import { fetchCurrentUser } from "@/services/topscore";
import { queryClient } from "@/lib/queryClient";
import { clearCache as clearApiCache, setCacheUserContext } from "@/lib/apiClient";
import { clearLoginRateLimit } from "@/lib/validation";
import { unregisterAllPushTokensForUser } from "@/services/announcements";
import {
  isBiometricEnabled,
  setBiometricEnabled as setBiometricEnabledSetting,
  authenticateWithBiometrics,
  getBiometricStatus,
} from "@/lib/biometricAuth";
import { TOPSCORE_CLIENT_ID, TOPSCORE_CLIENT_SECRET, TOPSCORE_USE_OAUTH2 } from "@/constants/config";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  biometricAvailable: boolean;
  biometricEnabled: boolean;

  initialize: () => Promise<void>;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
  setError: (msg: string | null) => void;
  refreshUser: () => Promise<void>;
  enableBiometric: (enable: boolean) => Promise<boolean>;
  authenticateWithBiometric: () => Promise<boolean>;
  checkBiometricAvailability: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  biometricAvailable: false,
  biometricEnabled: false,

  initialize: async () => {
    set({ isLoading: true });
    console.log("[Startup] authStore: initialize() started", TOPSCORE_USE_OAUTH2 ? "(OAuth2 mode)" : "(Basic Auth + api_csrf mode)");
    const initPromise = (async () => {
      try {
      console.log("[Startup] authStore: loading tokens and user");
      const [tokens, cachedUser] = await Promise.all([
        loadTokens(),
        loadUser(),
      ]);
      console.log("[Startup] authStore: tokens loaded:", tokens ? "yes" : "no", "user loaded:", cachedUser ? "yes" : "no");

      console.log("[Startup] authStore: checking biometric availability");
      const [biometricAvailable, biometricEnabled] = await Promise.all([
        getBiometricStatus().then(s => s.available),
        isBiometricEnabled(),
      ]);
      console.log("[Startup] authStore: biometric check complete:", { biometricAvailable, biometricEnabled });

      if (tokens) {
        if (cachedUser) {
          console.log("[Startup] authStore: tokens + cached user found, setting authenticated");
          const previousContext = useAuthStore.getState().user?.id ?? null;
          if (previousContext && previousContext !== cachedUser.id) {
            queryClient.clear();
            clearApiCache();
          }
          setCacheUserContext(cachedUser.id);
          set({
            user: cachedUser,
            isAuthenticated: true,
            isLoading: false,
            biometricAvailable,
            biometricEnabled
          });
          console.log("[Startup] authStore: authenticated with cached user");
        } else {
          console.log("[Startup] authStore: tokens found, no cached user, fetching current user");
          try {
            const freshUser = await fetchCurrentUser();
            console.log("[Startup] authStore: fresh user fetched:", freshUser?.id ?? "failed");
            await saveUser(freshUser);
            setCacheUserContext(freshUser.id);
            set({
              user: freshUser,
              isAuthenticated: true,
              isLoading: false,
              biometricAvailable,
              biometricEnabled
            });
          } catch (e) {
            console.error("[Startup] authStore: fetchCurrentUser failed:", e instanceof Error ? e.message : String(e));
            set({
              isAuthenticated: false,
              isLoading: false,
              biometricAvailable,
              biometricEnabled
            });
          }
        }
      } else {
        console.log("[Startup] authStore: no tokens found, not authenticated");
        set({ isAuthenticated: false, isLoading: false, biometricAvailable, biometricEnabled });
      }
      } catch (e) {
        console.error("[Startup] authStore: initialize() error:", e instanceof Error ? e.message : String(e));
        set({ isAuthenticated: false, isLoading: false });
      }
    })();

    try {
      await Promise.race([
        initPromise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Auth initialization timed out after 10s")), 10000)
        ),
      ]);
    } catch (e) {
      console.error("[Startup] authStore: initialize timed out or failed:", e instanceof Error ? e.message : String(e));
      set({ isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email: string, password: string, rememberMe: boolean = true) => {
    set({ isLoading: true, error: null });
    try {
      const previousContext = get().user?.id ?? null;

      // OAuth2 password grant: each user authenticates with their own credentials.
      // The access token is tied to that specific user's account, so each user
      // sees their own data and access level.
      const result = await loginWithCredentials(email, password, rememberMe);
      if (!result.success) {
        set({ error: result.error ?? "Login failed", isLoading: false });
        return false;
      }

      const user = await fetchCurrentUser();
      if (previousContext && previousContext !== user.id) {
        queryClient.clear();
        clearApiCache();
      }
      if (rememberMe) {
        await saveUser(user);
      }
      setCacheUserContext(user.id);
      set({ user, isAuthenticated: true, isLoading: false });
      return true;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unexpected error";
      set({ error: message, isLoading: false });
      return false;
    }
  },

  logout: async () => {
    const userId = get().user?.id;
    const userEmail = get().user?.email;
    await clearTokens();
    await queryClient.clear();
    clearApiCache();
    setCacheUserContext(null);
    set({ user: null, isAuthenticated: false, error: null });
    if (userEmail) {
      clearLoginRateLimit(userEmail.toLowerCase());
    }
    if (userId) {
      unregisterAllPushTokensForUser(userId).catch(() => {});
    }
  },

  setError: (msg) => set({ error: msg }),

  refreshUser: async () => {
    try {
      const user = await fetchCurrentUser();
      await saveUser(user);
      set({ user });
    } catch {
    }
  },

  enableBiometric: async (enable: boolean) => {
    if (enable) {
      const status = await getBiometricStatus();
      if (!status.available) {
        return false;
      }
      const result = await authenticateWithBiometrics("Authenticate to enable biometric login");
      if (!result.success) {
        return false;
      }
    }
    await setBiometricEnabledSetting(enable);
    set({ biometricEnabled: enable });
    return true;
  },

  authenticateWithBiometric: async () => {
    const result = await authenticateWithBiometrics("Authenticate to access your account");
    return result.success;
  },

  checkBiometricAvailability: async () => {
    const status = await getBiometricStatus();
    const enabled = await isBiometricEnabled();
    set({ biometricAvailable: status.available, biometricEnabled: enabled });
  },
}));