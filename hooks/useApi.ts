import { useQuery, useQueryClient, useMutation, UseQueryOptions, UseMutationOptions } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import * as topscore from "@/services/topscore";
import * as announcements from "@/services/announcements";
import type { User, Event, Team, Registration, Announcement, Article, TeamMember, EventAttendance, AppNotification, AttendanceSurvey } from "@/types";

const DEFAULT_RETRY = 2;
const AUTH_RETRY = 1;

export function useUser(options?: UseQueryOptions<User, Error, User, typeof queryKeys.auth.user>) {
  return useQuery({
    queryKey: queryKeys.auth.user,
    queryFn: () => topscore.fetchCurrentUser(),
    retry: AUTH_RETRY,
    ...options,
  });
}

export function useUserById(personId: string, options?: UseQueryOptions<User | null, Error>) {
  return useQuery({
    queryKey: queryKeys.user.byId(personId),
    queryFn: () => topscore.fetchUserById(personId),
    enabled: !!personId,
    retry: DEFAULT_RETRY,
    ...options,
  });
}

export function useEvents(teamId?: string, options?: UseQueryOptions<Event[], Error, Event[]>) {
  const queryKey = teamId
    ? queryKeys.events.byTeam(teamId)
    : queryKeys.events.all;

  return useQuery({
    queryKey,
    queryFn: () => topscore.fetchEvents(teamId),
    retry: DEFAULT_RETRY,
    ...options,
  });
}

export function useEvent(eventId: string, options?: UseQueryOptions<Event | undefined, Error>) {
  return useQuery({
    queryKey: queryKeys.events.byId(eventId),
    queryFn: () => topscore.fetchEvent(eventId),
    enabled: !!eventId,
    retry: DEFAULT_RETRY,
    ...options,
  });
}

export function useUpcomingEvents(teamId?: string, limit: number = 10, options?: UseQueryOptions<Event[], Error, Event[]>) {
  return useQuery({
    queryKey: teamId ? ["events", "upcoming", teamId] : ["events", "upcoming"],
    queryFn: () => topscore.fetchUpcomingEvents(teamId, limit),
    retry: DEFAULT_RETRY,
    ...options,
  });
}

export function usePastEvents(teamId?: string, limit: number = 10, options?: UseQueryOptions<Event[], Error, Event[]>) {
  return useQuery({
    queryKey: teamId ? ["events", "past", teamId] : ["events", "past"],
    queryFn: () => topscore.fetchPastEvents(teamId, limit),
    retry: DEFAULT_RETRY,
    ...options,
  });
}

export function useTeams(options?: UseQueryOptions<Team[], Error, Team[]>) {
  return useQuery({
    queryKey: queryKeys.teams.all,
    queryFn: () => topscore.fetchTeams(),
    retry: DEFAULT_RETRY,
    ...options,
  });
}

export function useTeam(teamId: string, options?: UseQueryOptions<Team | undefined, Error>) {
  return useQuery({
    queryKey: queryKeys.teams.byId(teamId),
    queryFn: () => topscore.fetchTeam(teamId),
    enabled: !!teamId,
    retry: DEFAULT_RETRY,
    ...options,
  });
}

export function useTeamRoster(teamId: string, options?: UseQueryOptions<TeamMember[], Error>) {
  return useQuery({
    queryKey: ["teams", teamId, "roster"],
    queryFn: () => topscore.fetchTeamRoster(teamId),
    enabled: !!teamId,
    retry: DEFAULT_RETRY,
    staleTime: 6 * 60 * 60 * 1000,
    ...options,
  });
}

export function useStandingRoster(teamId: string, options?: UseQueryOptions<TeamMember[], Error>) {
  return useQuery({
    queryKey: ["teams", teamId, "standing_roster"],
    queryFn: () => topscore.fetchStandingRoster(teamId),
    enabled: !!teamId,
    retry: DEFAULT_RETRY,
    staleTime: 6 * 60 * 60 * 1000,
    ...options,
  });
}

export function useActiveRoster(teamId: string, options?: UseQueryOptions<TeamMember[], Error>) {
  return useQuery({
    queryKey: ["teams", teamId, "active_roster"],
    queryFn: () => topscore.fetchActiveRoster(teamId),
    enabled: !!teamId,
    retry: DEFAULT_RETRY,
    staleTime: 6 * 60 * 60 * 1000,
    ...options,
  });
}

export function useRegistrations(options?: UseQueryOptions<Registration[], Error, Registration[]>) {
  return useQuery({
    queryKey: queryKeys.registrations.all,
    queryFn: () => topscore.fetchRegistrations(),
    retry: DEFAULT_RETRY,
    staleTime: 2 * 60 * 60 * 1000,
    ...options,
  });
}

export function useRegistration(registrationId: string, options?: UseQueryOptions<Registration | null, Error>) {
  return useQuery({
    queryKey: queryKeys.registrations.byId(registrationId),
    queryFn: () => topscore.fetchRegistrationById(registrationId),
    enabled: !!registrationId,
    retry: DEFAULT_RETRY,
    ...options,
  });
}

export function useEventAttendance(eventId: string, options?: UseQueryOptions<EventAttendance | null, Error>) {
  return useQuery({
    queryKey: ["events", eventId, "attendance"],
    queryFn: () => topscore.fetchEventAttendance(eventId),
    enabled: !!eventId,
    retry: DEFAULT_RETRY,
    ...options,
  });
}

export function useEventAttendanceSurvey(eventId: string, options?: UseQueryOptions<AttendanceSurvey | null, Error>) {
  return useQuery({
    queryKey: ["events", eventId, "attendance_survey"],
    queryFn: () => topscore.fetchEventAttendanceSurvey(eventId),
    enabled: !!eventId,
    retry: DEFAULT_RETRY,
    ...options,
  });
}

export function useAnnouncements(userId: string, options?: UseQueryOptions<Announcement[], Error>) {
  return useQuery({
    queryKey: queryKeys.announcements.all(userId),
    queryFn: () => announcements.fetchAnnouncements(userId).then((r) => r.data),
    enabled: !!userId,
    retry: DEFAULT_RETRY,
    staleTime: 2 * 60 * 1000,
    ...options,
  });
}

export function useAnnouncement(announcementId: string, options?: UseQueryOptions<Announcement | null, Error>) {
  return useQuery({
    queryKey: queryKeys.announcements.byId(announcementId),
    queryFn: () => announcements.fetchAnnouncementById(announcementId),
    enabled: !!announcementId && announcementId.length > 0,
    retry: DEFAULT_RETRY,
    ...options,
  });
}

export function useArticles(options?: UseQueryOptions<Article[], Error, Article[]>) {
  return useQuery({
    queryKey: queryKeys.articles.all,
    queryFn: () => topscore.fetchArticles(),
    retry: DEFAULT_RETRY,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useNotifications(options?: UseQueryOptions<AppNotification[], Error>) {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => topscore.fetchNotifications(),
    retry: DEFAULT_RETRY,
    staleTime: 1 * 60 * 1000,
    ...options,
  });
}

export function useInvalidateEvents() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["events"] });
  };
}

export function useInvalidateTeams() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["teams"] });
  };
}

export function useInvalidateRegistrations() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["registrations"] });
  };
}

export function useUpdateProfile() {
  return useMutation({
    mutationFn: ({ personId, updates }: { personId: string; updates: Partial<{ first_name: string; last_name: string; phone: string; avatar_url: string; about: string }> }) =>
      topscore.updateProfile(personId, updates),
    retry: 1,
  });
}

export function useUpdateAttendance() {
  return useMutation({
    mutationFn: ({ eventId, status, notes }: { eventId: string; status: "attending" | "declined" | "maybe"; notes?: string }) =>
      topscore.updateAttendance(eventId, status, notes),
    retry: 1,
  });
}

export function useDashboard(options?: UseQueryOptions<topscore.DashboardData, Error>) {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => topscore.fetchDashboardData(),
    retry: DEFAULT_RETRY,
    staleTime: 2 * 60 * 1000,
    ...options,
  });
}

export function useTeamDetail(teamId: string, options?: UseQueryOptions<topscore.TeamDetailData, Error>) {
  return useQuery({
    queryKey: ["team", teamId, "detail"],
    queryFn: () => topscore.fetchTeamDetailData(teamId),
    enabled: !!teamId,
    retry: DEFAULT_RETRY,
    staleTime: 6 * 60 * 60 * 1000,
    ...options,
  });
}

export function useEventDetail(eventId: string, options?: UseQueryOptions<topscore.EventDetailData, Error>) {
  return useQuery({
    queryKey: ["event", eventId, "detail"],
    queryFn: () => topscore.fetchEventDetailData(eventId),
    enabled: !!eventId,
    retry: DEFAULT_RETRY,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}