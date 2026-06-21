import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";
import type { Announcement, AnnouncementTargetType, AnnouncementType, FetchAnnouncementsResult, FetchAnnouncementsOptions, NotificationPreferences } from "@/types";
import { getValidAccessToken } from "./auth";

const HIDDEN_ANNOUNCEMENTS_KEY = "hidden_announcements";

async function getHiddenAnnouncementIds(): Promise<Set<string>> {
  try {
    const stored = await AsyncStorage.getItem(HIDDEN_ANNOUNCEMENTS_KEY);
    if (stored) {
      return new Set(JSON.parse(stored) as string[]);
    }
  } catch {}
  return new Set();
}

async function saveHiddenAnnouncementIds(ids: Set<string>): Promise<void> {
  try {
    await AsyncStorage.setItem(HIDDEN_ANNOUNCEMENTS_KEY, JSON.stringify([...ids]));
  } catch {}
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

export async function fetchAnnouncements(
  userId: string,
  _options?: Partial<FetchAnnouncementsOptions>
): Promise<FetchAnnouncementsResult<Announcement>> {
  const hiddenIds = await getHiddenAnnouncementIds();

  const { data: memberData } = await supabase
    .from("team_members")
    .select("team_id, teams!inner(id, topscore_id)")
    .eq("topscore_person_id", userId);

  const teamIds = memberData?.map(m => (m.teams as { topscore_id?: string }).topscore_id).filter(Boolean) ?? [];

  let query = supabase
    .from("announcements")
    .select("*, announcement_reads(user_id)")
    .order("created_at", { ascending: false })
    .or(`expires_at.is.null,expires_at.gt.now`);

  if (teamIds.length > 0) {
    const teamIdFilter = teamIds.join(',');
    query = query.or(`target_type.eq.league,target_type.eq.division,and(target_type.eq.team,target_id.in.(${teamIdFilter}))`);
  } else {
    query = query.or("target_type.eq.league,target_type.eq.division");
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching announcements:", error);
    return { data: [], pagination: { total: 0, limit: 50, offset: 0, hasMore: false } };
  }

  const announcements: Announcement[] = (data || [])
    .filter(ann => !hiddenIds.has(ann.id))
    .map(ann => {
      const isRead = ann.announcement_reads?.some((read: { user_id: string }) => read.user_id === userId) ?? false;

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

  return {
    data: announcements,
    pagination: {
      total: announcements.length,
      limit: 50,
      offset: 0,
      hasMore: false,
    },
  };
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
        title: payload.title,
        content: payload.content,
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

export async function fetchAnnouncementById(id: string): Promise<Announcement | null> {
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    authorId: data.author_id,
    authorName: data.author_name,
    authorRole: data.author_role as Announcement["authorRole"],
    announcementType: data.announcement_type as AnnouncementType,
    targetType: data.target_type as Announcement["targetType"],
    targetId: data.target_id,
    title: data.title,
    content: data.content,
    isUrgent: data.is_urgent,
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
        push_enabled: preferences.pushEnabled,
        league_announcements_enabled: preferences.leagueAnnouncementsEnabled,
        game_announcements_enabled: preferences.gameAnnouncementsEnabled,
        pada_org_announcements_enabled: preferences.padaOrgAnnouncementsEnabled,
        score_notifications_enabled: preferences.scoreNotificationsEnabled,
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