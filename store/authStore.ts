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
import { USE_MOCK_DATA } from "@/constants/mockData";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
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
      if (USE_MOCK_DATA) {
        const user = await fetchCurrentUser();
        await saveUser(user);
        set({ user, isAuthenticated: true, isLoading: false });
        return;
      }

      const [tokens, cachedUser] = await Promise.all([
        loadTokens(),
        loadUser(),
      ]);

      if (tokens) {
        if (cachedUser) {
          set({ user: cachedUser, isAuthenticated: true, isLoading: false });
        } else {
          const freshUser = await fetchCurrentUser();
          await saveUser(freshUser);
          set({ user: freshUser, isAuthenticated: true, isLoading: false });
        }
      } else {
        set({ isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      if (USE_MOCK_DATA) {
        const user = await fetchCurrentUser();
        await saveUser(user);
        set({ user, isAuthenticated: true, isLoading: false });
        return true;
      }

      const result = await loginWithCredentials(email, password);
      if (!result.success) {
        set({ error: result.error ?? "Login failed", isLoading: false });
        return false;
      }

      const [user] = await Promise.all([
        fetchCurrentUser(),
        loadTokens(),
      ]);
      await saveUser(user);
      set({ user, isAuthenticated: true, isLoading: false });
      return true;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unexpected error";
      set({ error: message, isLoading: false });
      return false;
    }
  },

logout: async () => {
    await clearTokens();
    await queryClient.clear();
    set({ user: null, isAuthenticated: false, error: null });
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