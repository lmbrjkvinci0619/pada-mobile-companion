import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import * as announcementsApi from "@/services/announcements";
import type { Announcement } from "@/types";
import { STALE_TIME } from "@/constants/cache";

const DEFAULT_RETRY = 2;

export function useAnnouncements(userId: string, options?: UseQueryOptions<Announcement[], Error>) {
  return useQuery({
    queryKey: queryKeys.announcements.all(userId || "none"),
    queryFn: () => announcementsApi.fetchAnnouncements(userId).then((r) => r.data),
    enabled: !!userId,
    retry: DEFAULT_RETRY,
    staleTime: STALE_TIME.announcements,
    ...options,
  });
}

export function useAnnouncement(announcementId: string, options?: UseQueryOptions<Announcement | null, Error>) {
  return useQuery({
    queryKey: queryKeys.announcements.byId(announcementId),
    queryFn: () => announcementsApi.fetchAnnouncementById(announcementId),
    enabled: !!announcementId && announcementId.length > 0,
    retry: DEFAULT_RETRY,
    staleTime: STALE_TIME.announcements,
    ...options,
  });
}