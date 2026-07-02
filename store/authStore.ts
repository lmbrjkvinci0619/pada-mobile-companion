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

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
  setError: (msg: string | null) => void;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  initialize: async () => {
    set({ isLoading: true });
    try {
      const [tokens, cachedUser] = await Promise.all([
        loadTokens(),
        loadUser(),
      ]);

      if (tokens) {
        if (cachedUser) {
          const previousContext = useAuthStore.getState().user?.id ?? null;
          if (previousContext && previousContext !== cachedUser.id) {
            queryClient.clear();
            clearApiCache();
          }
          setCacheUserContext(cachedUser.id);
          set({ user: cachedUser, isAuthenticated: true, isLoading: false });
        } else {
          try {
            const freshUser = await fetchCurrentUser();
            await saveUser(freshUser);
            setCacheUserContext(freshUser.id);
            set({ user: freshUser, isAuthenticated: true, isLoading: false });
          } catch {
            set({ isAuthenticated: false, isLoading: false });
          }
        }
      } else {
        set({ isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email: string, password: string, rememberMe: boolean = true) => {
    set({ isLoading: true, error: null });
    try {
      const previousContext = get().user?.id ?? null;

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
      // Silent fail - keep existing user on refresh failure
    }
  },
}));