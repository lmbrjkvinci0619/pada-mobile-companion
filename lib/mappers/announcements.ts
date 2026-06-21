import type { Announcement, AnnouncementTargetType, AnnouncementAuthorRole, AnnouncementType } from "@/types";
import type { ApiAnnouncement } from "@/types/api";

interface RawAnnouncementWithReads {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  author_role: string;
  announcement_type?: string;
  target_type: string;
  target_id: string;
  is_urgent: boolean;
  created_at: string;
  expires_at?: string;
  announcement_reads?: { user_id: string }[];
}

export function mapAnnouncement(
  data: RawAnnouncementWithReads,
  userId: string
): Announcement {
  const isRead = data.announcement_reads?.some(
    (read) => read.user_id === userId
  ) ?? false;

  return {
    id: data.id,
    title: data.title,
    content: data.content,
    authorId: data.author_id,
    authorName: data.author_name,
    authorRole: data.author_role as AnnouncementAuthorRole,
    announcementType: (data.announcement_type || "league_longterm") as AnnouncementType,
    targetType: data.target_type as AnnouncementTargetType,
    targetId: data.target_id,
    isUrgent: data.is_urgent,
    isRead,
    createdAt: data.created_at,
    expiresAt: data.expires_at,
  };
}

export function mapAnnouncementDetail(data: ApiAnnouncement): Announcement {
  return {
    id: data.id,
    title: data.title,
    content: data.content,
    authorId: data.author_id,
    authorName: data.author_name,
    authorRole: data.author_role,
    announcementType: (data.announcement_type || "league_longterm") as AnnouncementType,
    targetType: data.target_type,
    targetId: data.target_id,
    isUrgent: data.is_urgent,
    isRead: true,
    createdAt: data.created_at,
    expiresAt: data.expires_at,
  };
}