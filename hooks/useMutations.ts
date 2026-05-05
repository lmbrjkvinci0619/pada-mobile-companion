import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as announcementsService from "@/services/announcements";
import { queryKeys } from "@/lib/queryKeys";
import type { Announcement, AnnouncementTargetType } from "@/types";

interface CreateAnnouncementPayload {
  authorId: string;
  authorName: string;
  authorRole: string;
  targetType: AnnouncementTargetType;
  targetId: string;
  title: string;
  content: string;
  isUrgent: boolean;
}

export function useCreateAnnouncement(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAnnouncementPayload) =>
      announcementsService.createAnnouncement(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.announcements.all(userId),
      });
    },
  });
}

export function useMarkAnnouncementRead(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ announcementId }: { announcementId: string }) =>
      announcementsService.markAnnouncementAsRead(announcementId, userId),

    onMutate: async ({ announcementId }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.announcements.all(userId),
      });

      const previousAnnouncements = queryClient.getQueryData<Announcement[]>(
        queryKeys.announcements.all(userId)
      );

      if (previousAnnouncements) {
        queryClient.setQueryData<Announcement[]>(
          queryKeys.announcements.all(userId),
          (old) =>
            old?.map((ann) =>
              ann.id === announcementId ? { ...ann, isRead: true } : ann
            )
        );
      }

      return { previousAnnouncements };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousAnnouncements) {
        queryClient.setQueryData<Announcement[]>(
          queryKeys.announcements.all(userId),
          context.previousAnnouncements
        );
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.announcements.all(userId),
      });
    },
  });
}