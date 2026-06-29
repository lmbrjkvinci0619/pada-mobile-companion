import { supabase } from "./supabase";
import { getValidAccessToken } from "./auth";
import { useSettingsStore } from "@/store/settingsStore";
import type { NotificationPreferences } from "@/types";

export interface UserPreferences {
  topscore_person_id: string;
  push_enabled: boolean;
  announcements_enabled: boolean;
  notification_timing: "immediate" | "batched" | "digest";
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  announcement_categories: string[];
  score_notifications_enabled: boolean;
  league_announcements_enabled: boolean;
  game_announcements_enabled: boolean;
  pada_org_announcements_enabled: boolean;
  schedule_reminders_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  displayName: string;
  emailNotifications: boolean;
  language: string;
  timezone: string;
  theme: "light" | "dark" | "system";
}

export async function fetchUserPreferences(userId: string): Promise<UserPreferences | null> {
  try {
    const token = await getValidAccessToken();

    if (token) {
      const body: Record<string, unknown> = { topscore_person_id: userId, action: "get" };
      if (token) body.topscore_token = token;

      const { data, error } = await supabase.functions.invoke("user-preferences", { body });

      if (error) {
        const errorMessage = error.message || String(error);
        if (errorMessage.includes('not authenticated') || errorMessage.includes('401')) {
          console.error("Authentication error fetching preferences:", errorMessage);
        } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          console.error("Network error fetching preferences:", errorMessage);
        } else {
          console.error("Edge function error fetching preferences:", errorMessage);
        }
        return null;
      }

      const result = data as { data: UserPreferences | null };
      return result.data || null;
    }

    const { data: directData, error: directError } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("topscore_person_id", userId)
    .single();

    if (directError) {
      if (directError.code === "PGRST116") return null;
      console.error("Error fetching user preferences directly:", directError);
      return null;
    }
    return directData as UserPreferences;
  } catch (err) {
    console.error("Unexpected error fetching user preferences:", err);
    return null;
  }
}

export async function saveUserPreferences(
  userId: string,
  preferences: Partial<NotificationPreferences>
): Promise<boolean> {
  try {
    const token = await getValidAccessToken();

    const currentPrefs = useSettingsStore.getState().notifications;

    const prefsData = {
      push_enabled: preferences.pushEnabled ?? currentPrefs.pushEnabled ?? true,
      announcements_enabled: preferences.announcementsEnabled ?? currentPrefs.announcementsEnabled ?? true,
      league_announcements_enabled: preferences.leagueAnnouncementsEnabled ?? currentPrefs.leagueAnnouncementsEnabled ?? true,
      game_announcements_enabled: preferences.gameAnnouncementsEnabled ?? currentPrefs.gameAnnouncementsEnabled ?? true,
      pada_org_announcements_enabled: preferences.padaOrgAnnouncementsEnabled ?? currentPrefs.padaOrgAnnouncementsEnabled ?? true,
      score_notifications_enabled: preferences.scoreNotificationsEnabled ?? currentPrefs.scoreNotificationsEnabled ?? true,
      schedule_reminders_enabled: preferences.scheduleRemindersEnabled ?? currentPrefs.scheduleRemindersEnabled ?? true,
      quiet_hours_start: preferences.quietHoursStart !== undefined ? preferences.quietHoursStart : (currentPrefs.quietHoursStart ?? null),
      quiet_hours_end: preferences.quietHoursEnd !== undefined ? preferences.quietHoursEnd : (currentPrefs.quietHoursEnd ?? null),
    };

    if (token) {
      const { error } = await supabase.functions.invoke("user-preferences", {
        body: { topscore_person_id: userId, topscore_token: token, action: "upsert", preferences: prefsData },
      });

      if (error) {
        console.error("Error saving preferences via edge function:", error);
        return false;
      }
    } else {
      const { error } = await supabase
      .from("user_preferences")
      .upsert({
        topscore_person_id: userId,
        ...prefsData,
        updated_at: new Date().toISOString(),
      }, { onConflict: "topscore_person_id" });

      if (error) {
        console.error("Error saving user preferences:", error);
        return false;
      }
    }

    return true;
  } catch (err) {
    console.error("Unexpected error saving user preferences:", err);
    return false;
  }
}

export async function deleteUserPreferences(userId: string): Promise<boolean> {
  try {
    const token = await getValidAccessToken();
    if (token) {
      const { error } = await supabase.functions.invoke("user-preferences", {
        body: { topscore_person_id: userId, topscore_token: token, action: "delete" },
      });

      if (error) {
        console.error("Error deleting preferences via edge function:", error);
        return false;
      }
    } else {
      const { error } = await supabase
      .from("user_preferences")
      .delete()
      .eq("topscore_person_id", userId);

      if (error) {
        console.error("Error deleting user preferences:", error);
        return false;
      }
    }

    return true;
  } catch (err) {
    console.error("Unexpected error deleting user preferences:", err);
    return false;
  }
}

export function mapDbToNotificationPreferences(dbPrefs: UserPreferences): NotificationPreferences {
  return {
    pushEnabled: dbPrefs.push_enabled ?? true,
    announcementsEnabled: dbPrefs.announcements_enabled ?? true,
    leagueAnnouncementsEnabled: dbPrefs.league_announcements_enabled ?? true,
    gameAnnouncementsEnabled: dbPrefs.game_announcements_enabled ?? true,
    padaOrgAnnouncementsEnabled: dbPrefs.pada_org_announcements_enabled ?? true,
    scoreNotificationsEnabled: dbPrefs.score_notifications_enabled ?? true,
    scheduleRemindersEnabled: dbPrefs.schedule_reminders_enabled ?? true,
    quietHoursStart: dbPrefs.quiet_hours_start || undefined,
    quietHoursEnd: dbPrefs.quiet_hours_end || undefined,
  };
}

export async function loadAndSyncPreferences(userId: string): Promise<boolean> {
  const defaultNotifs: NotificationPreferences = {
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

  try {
    const dbPrefs = await fetchUserPreferences(userId);

    const notifications = dbPrefs
    ? mapDbToNotificationPreferences(dbPrefs)
    : defaultNotifs;

    useSettingsStore.getState().setNotifications(notifications);
    useSettingsStore.getState().updateLastSync();
    return true;
  } catch {
    return false;
  }
}

export async function saveAndSyncPreferences(
  userId: string,
  preferences: Partial<NotificationPreferences>
): Promise<boolean> {
  const success = await saveUserPreferences(userId, preferences);

  if (success) {
    useSettingsStore.getState().setNotifications(preferences);
    useSettingsStore.getState().updateLastSync();
  }

  return success;
}
