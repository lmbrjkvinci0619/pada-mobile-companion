import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";
import type { Announcement, AnnouncementTargetType, AnnouncementType, FetchAnnouncementsResult, FetchAnnouncementsOptions, NotificationPreferences } from "@/types";
import { getValidAccessToken } from "./auth";
import { sanitizeString, sanitizeAnnouncementContent } from "@/lib/validation";

const HIDDEN_ANNOUNCEMENTS_KEY = "hidden_announcements";

function isSafeFilterValue(value: string): boolean {
  return typeof value === "string" && /^[A-Za-z0-9_\-:.]+$/.test(value);
}

async function getHiddenAnnouncementIds(): Promise<Set<string>> {
  try {
    const stored = await AsyncStorage.getItem(HIDDEN_ANNOUNCEMENTS_KEY);
    if (stored) {
      return new Set(JSON.parse(stored) as string[]);
    }
  } catch (err) {
    console.error("Failed to get hidden announcement IDs:", err);
  }
  return new Set();
}

async function saveHiddenAnnouncementIds(ids: Set<string>): Promise<void> {
  try {
    await AsyncStorage.setItem(HIDDEN_ANNOUNCEMENTS_KEY, JSON.stringify([...ids]));
  } catch (err) {
    console.error("Failed to save hidden announcement IDs:", err);
  }
}

export async function hideAnnouncement(announcementId: string): Promise<void> {
  const hidden = await getHiddenAnnouncementIds();
  hidden.add(announcementId);
  await saveHiddenAnnouncementIds(hidden);
}

export async function unhideAnnouncement(announcementId: string): Promise<void> {
  const hidden = await getHiddenAnnouncementIds();
  hidden.delete(announcementId);
  await saveHiddenAnnouncementIds(hidden);
}

export async function isAnnouncementHidden(announcementId: string): Promise<boolean> {
  const hidden = await getHiddenAnnouncementIds();
  return hidden.has(announcementId);
}

export async function getHiddenAnnouncementCount(): Promise<number> {
  const hidden = await getHiddenAnnouncementIds();
  return hidden.size;
}

export async function clearHiddenAnnouncements(): Promise<void> {
  await AsyncStorage.removeItem(HIDDEN_ANNOUNCEMENTS_KEY);
}

export const FETCH_ANNOUNCEMENTS_PAGE_SIZE = 50;

export async function fetchAnnouncementsByPageFromList(
  source: Announcement[],
  hiddenIds: Set<string>,
  userId: string,
  options?: Partial<FetchAnnouncementsOptions>
): Promise<FetchAnnouncementsResult<Announcement>> {
  const limit = clampLimit(options?.limit ?? FETCH_ANNOUNCEMENTS_PAGE_SIZE);
  const offset = Math.max(0, options?.offset ?? 0);

  const visible = source.filter((a) => !hiddenIds.has(a.id));
  const page = visible.slice(offset, offset + limit).map((ann) => ({
    ...ann,
    isRead: ann.isRead ?? false,
    isHidden: hiddenIds.has(ann.id),
  }));

  return {
    data: page,
    pagination: {
      total: visible.length,
      limit,
      offset,
      hasMore: offset + page.length < visible.length,
    },
  };
}

export async function fetchAnnouncements(
  userId: string,
  options?: Partial<FetchAnnouncementsOptions>
): Promise<FetchAnnouncementsResult<Announcement>> {
  const limit = clampLimit(options?.limit ?? FETCH_ANNOUNCEMENTS_PAGE_SIZE);
  const offset = Math.max(0, options?.offset ?? 0);

  const hiddenIds = await getHiddenAnnouncementIds();

  const { data: memberData } = await supabase
    .from("team_members")
    .select("team_id, teams!inner(id, topscore_id)")
    .eq("topscore_person_id", userId);

  const teamIds: string[] = [];
  if (Array.isArray(memberData)) {
    for (const m of memberData) {
      if (
        m?.team_id != null &&
        m?.teams &&
        typeof m.teams === "object" &&
        "topscore_id" in m.teams
      ) {
        const topscoreId = (m.teams as { topscore_id?: unknown }).topscore_id;
        if (typeof topscoreId === "string" && topscoreId.length > 0) {
          teamIds.push(topscoreId);
        }
      }
    }
  }

  const safeTeamIds = teamIds.filter((id) => isSafeFilterValue(id));

  const expiryOpen = "expires_at.is.null";
  const expiryActive = "expires_at.gt.now()";
  const expiryEither = `or(${expiryOpen},${expiryActive})`;

  // All PADA members see league/division-wide announcements.
  const audienceFilters: string[] = [
    `and(${expiryEither},target_type.in.(league,division))`,
  ];
  if (safeTeamIds.length > 0) {
    const joined = safeTeamIds.map((id) => `"${id}"`).join(",");
    audienceFilters.push(
      `and(${expiryEither},target_type.eq.team,target_id.in.(${joined}))`
    );
  }
  const audienceFilter = audienceFilters.join(",");

  const end = offset + limit - 1;

  const { data, error, count } = await supabase
    .from("announcements")
    .select("*, announcement_reads(user_id)", { count: "exact" })
    .or(audienceFilter)
    .order("created_at", { ascending: false })
    .range(offset, end);

  if (error) {
    console.error("Error fetching announcements:", error);
    return {
      data: [],
      pagination: { total: 0, limit, offset, hasMore: false },
    };
  }

  const announcements: Announcement[] = (data || [])
    .filter((ann) => !hiddenIds.has(ann.id))
    .map((ann) => {
      const isRead =
        ann.announcement_reads?.some((read: { user_id: string }) => read.user_id === userId) ?? false;

      return {
        id: ann.id,
        authorId: ann.author_id,
        authorName: ann.author_name,
        authorRole: ann.author_role as Announcement["authorRole"],
        announcementType: ann.announcement_type as AnnouncementType,
        targetType: ann.target_type as Announcement["targetType"],
        targetId: ann.target_id,
        title: ann.title,
        content: ann.content,
        isUrgent: ann.is_urgent,
        isRead,
        isHidden: hiddenIds.has(ann.id),
        createdAt: ann.created_at,
        expiresAt: ann.expires_at,
      };
    });

  const total = typeof count === "number"
    ? Math.max(0, count - hiddenIds.size)
    : announcements.length;
  return {
    data: announcements,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + announcements.length < total,
    },
  };
}

function clampLimit(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return FETCH_ANNOUNCEMENTS_PAGE_SIZE;
  return Math.min(Math.floor(value), 100);
}

export async function markAnnouncementAsRead(announcementId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("announcement_reads")
    .upsert(
      { announcement_id: announcementId, user_id: userId },
      { onConflict: "announcement_id,user_id" }
    );

  if (error) {
    console.error("Error marking announcement as read:", error);
  }
}

export async function createAnnouncement(payload: {
  authorId: string;
  authorName: string;
  authorRole: string;
  targetType: AnnouncementTargetType;
  targetId: string;
  title: string;
  content: string;
  isUrgent: boolean;
  announcementType?: AnnouncementType;
  expiresAt?: string;
}): Promise<boolean> {
  const token = await getValidAccessToken();
  if (!token) return false;

  try {
    const { error } = await supabase.functions.invoke("create-announcement", {
      body: {
        topscoreToken: token,
        targetType: payload.targetType,
        targetId: payload.targetId,
        title: sanitizeString(payload.title),
        content: sanitizeAnnouncementContent(payload.content),
        isUrgent: payload.isUrgent,
        announcementType: payload.announcementType || "league_longterm",
        expiresAt: payload.expiresAt || null,
      },
    });

    if (error) {
      console.error("Error creating announcement via edge function:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Unexpected error creating announcement:", err);
    return false;
  }
}

export async function fetchAnnouncementById(
  id: string,
  userId?: string
): Promise<Announcement | null> {
  const { data, error } = await supabase
    .from("announcements")
    .select("*, announcement_reads(user_id)")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  const isRead = userId
    ? (data.announcement_reads as { user_id: string }[] | undefined)?.some(
        (read) => read.user_id === userId
      ) ?? false
    : false;

  return {
    id: data.id,
    title: data.title,
    content: data.content,
    authorId: data.author_id,
    authorName: data.author_name,
    authorRole: data.author_role as Announcement["authorRole"],
    announcementType: data.announcement_type as AnnouncementType,
    targetType: data.target_type as Announcement["targetType"],
    targetId: data.target_id,
    isUrgent: data.is_urgent,
    isRead,
    createdAt: data.created_at,
    expiresAt: data.expires_at,
  };
}

export async function syncUserPreferences(
  userId: string,
  preferences: Partial<NotificationPreferences>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("user_preferences")
      .upsert({
        topscore_person_id: userId,
        push_enabled: preferences.pushEnabled ?? true,
        announcements_enabled: preferences.announcementsEnabled ?? true,
        league_announcements_enabled: preferences.leagueAnnouncementsEnabled ?? true,
        game_announcements_enabled: preferences.gameAnnouncementsEnabled ?? true,
        pada_org_announcements_enabled: preferences.padaOrgAnnouncementsEnabled ?? true,
        score_notifications_enabled: preferences.scoreNotificationsEnabled ?? true,
        schedule_reminders_enabled: preferences.scheduleRemindersEnabled ?? true,
        quiet_hours_start: preferences.quietHoursStart ?? null,
        quiet_hours_end: preferences.quietHoursEnd ?? null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "topscore_person_id",
      });

    if (error) {
      console.error("Error syncing user preferences:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Unexpected error syncing preferences:", err);
    return false;
  }
}

export async function registerPushToken(
  userId: string,
  pushToken: string,
  deviceId?: string,
  platform: string = "expo"
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("user_push_tokens")
      .upsert({
        topscore_person_id: userId,
        push_token: pushToken,
        device_id: deviceId,
        platform,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "topscore_person_id,push_token",
      });

    if (error) {
      console.error("Error registering push token:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Unexpected error registering push token:", err);
    return false;
  }
}

export async function unregisterPushToken(userId: string, pushToken: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("user_push_tokens")
      .delete()
      .eq("topscore_person_id", userId)
      .eq("push_token", pushToken);

    if (error) {
      console.error("Error unregistering push token:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Unexpected error unregistering push token:", err);
    return false;
  }
}

export async function unregisterAllPushTokensForUser(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("user_push_tokens")
      .delete()
      .eq("topscore_person_id", userId);

    if (error) {
      console.error("Error unregistering all push tokens:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Unexpected error unregistering all push tokens:", err);
    return false;
  }
}