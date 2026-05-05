import { create } from "zustand";
import type { NotificationPreferences } from "@/types";

interface SettingsState {
  notifications: NotificationPreferences;
  displayName: string;
  hasCompletedOnboarding: boolean;
  lastSyncTimestamp: number | null;
  
  setNotifications: (notifications: Partial<NotificationPreferences>) => void;
  togglePushNotifications: () => void;
  toggleAnnouncementsNotifications: () => void;
  toggleScoreNotifications: () => void;
  toggleScheduleReminders: () => void;
  setQuietHours: (start?: string, end?: string) => void;
  setDisplayName: (name: string) => void;
  completeOnboarding: () => void;
  updateLastSync: () => void;
  resetSettings: () => void;
}

const defaultNotifications: NotificationPreferences = {
  pushEnabled: true,
  announcementsEnabled: true,
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
}));