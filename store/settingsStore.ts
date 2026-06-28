import { create } from "zustand";
import type { NotificationPreferences, UserRole } from "@/types";
import { fetchUserPreferences, saveUserPreferences, mapDbToNotificationPreferences, loadAndSyncPreferences, saveAndSyncPreferences } from "@/services/preferences";

export type NotificationTiming = "immediate" | "batched" | "digest";
export type ThemeMode = "light" | "dark" | "system";

interface DisplaySettings {
  theme: ThemeMode;
  language: string;
  timezone: string;
}

interface SettingsState {
  notifications: NotificationPreferences;
  displayName: string;
  hasCompletedOnboarding: boolean;
  lastSyncTimestamp: number | null;
  isLoadingPreferences: boolean;
  isSyncing: boolean;
  preferencesError: string | null;
  
  setNotifications: (notifications: Partial<NotificationPreferences>) => void;
  togglePushNotifications: () => void;
  toggleAnnouncementsNotifications: () => void;
  toggleLeagueAnnouncements: () => void;
  toggleGameAnnouncements: () => void;
  togglePadaOrgAnnouncements: () => void;
  toggleScoreNotifications: () => void;
  toggleScheduleReminders: () => void;
  setQuietHours: (start?: string, end?: string) => void;
  setDisplayName: (name: string) => void;
  completeOnboarding: () => void;
  updateLastSync: () => void;
  resetSettings: () => void;
  
  loadPreferences: (userId: string) => Promise<void>;
  savePreferences: (userId: string) => Promise<boolean>;
  syncPreferences: (userId: string) => Promise<void>;
}

const defaultNotifications: NotificationPreferences = {
  pushEnabled: true,
  announcementsEnabled: true,
  leagueAnnouncementsEnabled: true,
  gameAnnouncementsEnabled: true,
  padaOrgAnnouncementsEnabled: true,
  scoreNotificationsEnabled: true,
  scheduleRemindersEnabled: true,
  quietHoursStart: undefined,
  quietHoursEnd: undefined,
};

const initialState = {
  notifications: defaultNotifications,
  displayName: "",
  hasCompletedOnboarding: false,
  lastSyncTimestamp: null,
  isLoadingPreferences: false,
  isSyncing: false,
  preferencesError: null,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...initialState,

  setNotifications: (updates) => {
    set((state) => ({
      notifications: { ...state.notifications, ...updates },
    }));
  },

  togglePushNotifications: () => {
    set((state) => ({
      notifications: {
        ...state.notifications,
        pushEnabled: !state.notifications.pushEnabled,
      },
    }));
  },

  toggleAnnouncementsNotifications: () => {
    set((state) => ({
      notifications: {
        ...state.notifications,
        announcementsEnabled: !state.notifications.announcementsEnabled,
      },
    }));
  },

  toggleLeagueAnnouncements: () => {
    set((state) => ({
      notifications: {
        ...state.notifications,
        leagueAnnouncementsEnabled: !state.notifications.leagueAnnouncementsEnabled,
      },
    }));
  },

  toggleGameAnnouncements: () => {
    set((state) => ({
      notifications: {
        ...state.notifications,
        gameAnnouncementsEnabled: !state.notifications.gameAnnouncementsEnabled,
      },
    }));
  },

  togglePadaOrgAnnouncements: () => {
    set((state) => ({
      notifications: {
        ...state.notifications,
        padaOrgAnnouncementsEnabled: !state.notifications.padaOrgAnnouncementsEnabled,
      },
    }));
  },

  toggleScoreNotifications: () => {
    set((state) => ({
      notifications: {
        ...state.notifications,
        scoreNotificationsEnabled: !state.notifications.scoreNotificationsEnabled,
      },
    }));
  },

  toggleScheduleReminders: () => {
    set((state) => ({
      notifications: {
        ...state.notifications,
        scheduleRemindersEnabled: !state.notifications.scheduleRemindersEnabled,
      },
    }));
  },

  setQuietHours: (start, end) => {
    set((state) => ({
      notifications: {
        ...state.notifications,
        quietHoursStart: start,
        quietHoursEnd: end,
      },
    }));
  },

  setDisplayName: (name) => set({ displayName: name }),

  completeOnboarding: () => set({ hasCompletedOnboarding: true }),

  updateLastSync: () => set({ lastSyncTimestamp: Date.now() }),

  resetSettings: () => set(initialState),

  loadPreferences: async (userId: string) => {
    set({ isLoadingPreferences: true, preferencesError: null });
    try {
      const success = await loadAndSyncPreferences(userId);
      if (!success) {
        set({ preferencesError: "Failed to load preferences" });
      }
    } catch (err) {
      set({ preferencesError: "Failed to load preferences" });
      console.error("Error loading preferences:", err);
    } finally {
      set({ isLoadingPreferences: false });
    }
  },

  savePreferences: async (userId: string) => {
    set({ isSyncing: true, preferencesError: null });
    try {
      const success = await saveAndSyncPreferences(userId, get().notifications);
      if (!success) {
        set({ preferencesError: "Failed to save preferences" });
      }
      return success;
    } catch (err) {
      set({ preferencesError: "Failed to save preferences" });
      console.error("Error saving preferences:", err);
      return false;
    } finally {
      set({ isSyncing: false });
    }
  },

  syncPreferences: async (userId: string) => {
    const { notifications, lastSyncTimestamp } = get();
    
    if (!lastSyncTimestamp) {
      await get().loadPreferences(userId);
      return;
    }

    const timeSinceLastSync = Date.now() - lastSyncTimestamp;
    const fiveMinutes = 5 * 60 * 1000;
    
    if (timeSinceLastSync > fiveMinutes) {
      await get().loadPreferences(userId);
    }
  },
}));