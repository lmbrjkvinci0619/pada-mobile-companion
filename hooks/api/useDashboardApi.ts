import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import * as dashboardApi from "@/services/api/dashboard";
import type { User, Event, Team, Registration, TeamMember } from "@/types";
import { STALE_TIME } from "@/constants/cache";

const DEFAULT_RETRY = 2;

export function useDashboard(options?: UseQueryOptions<dashboardApi.DashboardData, Error>) {
  return useQuery({
    queryKey: queryKeys.dashboard.all,
    queryFn: ({ signal }) => dashboardApi.fetchDashboardData(signal),
    retry: DEFAULT_RETRY,
    staleTime: STALE_TIME.dashboard,
    ...options,
  });
}

export function useTeamDetail(teamId: string, options?: UseQueryOptions<dashboardApi.TeamDetailData, Error>) {
  return useQuery({
    queryKey: queryKeys.dashboard.teamDetail(teamId),
    queryFn: ({ signal }) => dashboardApi.fetchTeamDetailData(teamId, signal),
    enabled: !!teamId,
    retry: DEFAULT_RETRY,
    staleTime: STALE_TIME.teamDetail,
    ...options,
  });
}

export function useEventDetail(eventId: string, options?: UseQueryOptions<dashboardApi.EventDetailData, Error>) {
  return useQuery({
    queryKey: queryKeys.dashboard.eventDetail(eventId),
    queryFn: ({ signal }) => dashboardApi.fetchEventDetailData(eventId, signal),
    enabled: !!eventId,
    retry: DEFAULT_RETRY,
    staleTime: STALE_TIME.eventDetail,
    ...options,
  });
}

// Re-export permission helpers
export {
  canUserCreateTeamAnnouncement,
  canUserReportTeamScores,
  getUserTeamRole,
  isUserTeamAdmin,
} from "@/services/api/dashboard";