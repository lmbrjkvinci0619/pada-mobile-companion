import { create } from "zustand";
import type { User, AuthTokens } from "@/types";
import {
  saveTokens,
  loadTokens,
  clearTokens,
  saveUser,
  loadUser,
  loginWithCredentials,
} from "@/services/auth";
import { fetchCurrentUser } from "@/services/topscore";
import { USE_MOCK_DATA } from "@/constants/mockData";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setError: (msg: string | null) => void;
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
        // Auto-authenticate in mock mode
        const user = await fetchCurrentUser();
        await saveUser(user);
        set({ user, isAuthenticated: true, isLoading: false });
        return;
      }

      const tokens = await loadTokens();
      if (tokens) {
        const user = await loadUser();
        if (user) {
          set({ user, isAuthenticated: true, isLoading: false });
        } else {
          // Fetch fresh user profile
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

      const user = await fetchCurrentUser();
      await saveUser(user);
      set({ user, isAuthenticated: true, isLoading: false });
      return true;
    } catch (e: any) {
      set({ error: e.message ?? "Unexpected error", isLoading: false });
      return false;
    }
  },

  logout: async () => {
    await clearTokens();
    set({ user: null, isAuthenticated: false, error: null });
  },

  setError: (msg) => set({ error: msg }),
}));
