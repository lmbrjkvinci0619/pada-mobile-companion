import { supabase } from "./supabase";
import { Announcement, AnnouncementTargetType } from "@/types";
import { getValidAccessToken } from "./auth";

export async function fetchAnnouncements(userId: string): Promise<Announcement[]> {
  // First, get the user's teams to filter team-level announcements
  const { data: memberData } = await supabase
    .from("team_members")
    .select("team_id, teams!inner(id, topscore_id)")
    .eq("topscore_person_id", userId);

  const teamIds = memberData ? memberData.map(m => (m.teams as any).topscore_id) : [];

  // Fetch announcements:
  // target_type = 'league' OR (target_type = 'team' AND target_id IN teamIds)
  // For division we could do the same if we have division data, but falling back to league/team for now.
  let query = supabase
    .from("announcements")
    .select("*, announcement_reads(user_id)")
    .order("created_at", { ascending: false });

  if (teamIds.length > 0) {
    query = query.or(`target_type.eq.league,target_type.eq.division,and(target_type.eq.team,target_id.in.(${teamIds.join(',')}))`);
  } else {
    query = query.or("target_type.eq.league,target_type.eq.division");
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching announcements:", error);
    return [];
  }

  return (data || []).map(ann => {
    // Check if current user is in the announcement_reads array
    const isRead = ann.announcement_reads?.some((read: any) => read.user_id === userId) ?? false;

    return {
      id: ann.id,
      authorId: ann.author_id,
      authorName: ann.author_name,
      authorRole: ann.author_role as any,
      targetType: ann.target_type as any,
      targetId: ann.target_id,
      title: ann.title,
      content: ann.content,
      isUrgent: ann.is_urgent,
      isRead,
      createdAt: ann.created_at,
      expiresAt: ann.expires_at,
    };
  });
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
    authorRole: data.author_role as any,
    targetType: data.target_type as any,
    targetId: data.target_id,
    title: data.title,
    content: data.content,
    isUrgent: data.is_urgent,
    createdAt: data.created_at,
    expiresAt: data.expires_at,
  };
}
