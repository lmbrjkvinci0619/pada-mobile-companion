import { supabase } from "./supabase";
import type { Announcement, AnnouncementTargetType, FetchAnnouncementsResult, FetchAnnouncementsOptions } from "@/types";
import { getValidAccessToken } from "./auth";

export async function fetchAnnouncements(
  userId: string,
  _options?: Partial<FetchAnnouncementsOptions>
): Promise<FetchAnnouncementsResult<Announcement>> {
  const { data: memberData } = await supabase
    .from("team_members")
    .select("team_id, teams!inner(id, topscore_id)")
    .eq("topscore_person_id", userId);

  const teamIds = memberData?.map(m => (m.teams as { topscore_id?: string }).topscore_id).filter(Boolean) ?? [];

  let query = supabase
    .from("announcements")
    .select("*, announcement_reads(user_id)")
    .order("created_at", { ascending: false });

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

  const announcements: Announcement[] = (data || []).map(ann => {
    const isRead = ann.announcement_reads?.some((read: { user_id: string }) => read.user_id === userId) ?? false;

    return {
      id: ann.id,
      authorId: ann.author_id,
      authorName: ann.author_name,
      authorRole: ann.author_role as Announcement["authorRole"],
      targetType: ann.target_type as Announcement["targetType"],
      targetId: ann.target_id,
      title: ann.title,
      content: ann.content,
      isUrgent: ann.is_urgent,
      isRead,
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
    targetType: data.target_type as Announcement["targetType"],
    targetId: data.target_id,
    title: data.title,
    content: data.content,
    isUrgent: data.is_urgent,
    createdAt: data.created_at,
    expiresAt: data.expires_at,
  };
}