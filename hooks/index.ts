// Re-export all domain hooks
export * from "./api/useAuthApi";
export * from "./api/useTeamsApi";
export * from "./api/useEventsApi";
export * from "./api/useRegistrationsApi";
export * from "./api/useAnnouncementsApi";
export * from "./api/useArticlesApi";
export * from "./api/useDashboardApi";

// Re-export other hooks
export { useAuthRedirect } from "./useAuthRedirect";
export { useErrorHandler } from "./useErrorHandler";
export { useCreateAnnouncement, useMarkAnnouncementRead } from "./useMutations";
export { useOffline } from "./useOffline";