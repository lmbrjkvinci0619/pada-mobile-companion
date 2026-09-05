import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import * as eventsApi from "@/services/api/events";
import type { Event } from "@/types";
import { STALE_TIME } from "@/constants/cache";

const DEFAULT_RETRY = 2;

export function useEvents(options?: eventsApi.FetchEventsOptions, queryOptions?: UseQueryOptions<Event[], Error, Event[]>) {
  const queryKey = options?.teamId
    ? queryKeys.events.byTeam(options.teamId)
    : queryKeys.events.all;

  return useQuery({
    queryKey,
    queryFn: ({ signal }) => eventsApi.fetchEvents(options, signal).then(r => r.data),
    retry: DEFAULT_RETRY,
    staleTime: STALE_TIME.events,
    ...queryOptions,
  });
}

export function useEvent(eventId: string, options?: UseQueryOptions<Event | undefined, Error>) {
  return useQuery({
    queryKey: queryKeys.events.byId(eventId),
    queryFn: ({ signal }) => eventsApi.fetchEvent(eventId, signal),
    enabled: !!eventId,
    retry: DEFAULT_RETRY,
    staleTime: STALE_TIME.eventDetail,
    ...options,
  });
}

export function useUpcomingEvents(teamId?: string, limit: number = 10, options?: UseQueryOptions<Event[], Error, Event[]>) {
  return useQuery({
    queryKey: queryKeys.events.byTeam(teamId ?? "", "upcoming"),
    queryFn: ({ signal }) => eventsApi.fetchUpcomingEvents(teamId, limit, signal),
    retry: DEFAULT_RETRY,
    staleTime: STALE_TIME.upcomingEvents,
    ...options,
  });
}

export function usePastEvents(teamId?: string, limit: number = 10, options?: UseQueryOptions<Event[], Error, Event[]>) {
  return useQuery({
    queryKey: queryKeys.events.byTeam(teamId ?? "", "past"),
    queryFn: ({ signal }) => eventsApi.fetchPastEvents(teamId, limit, signal),
    retry: DEFAULT_RETRY,
    staleTime: STALE_TIME.pastEvents,
    ...options,
  });
}

export function useScheduleExport(teamId: string, options?: UseQueryOptions<import("@/types").ScheduleExport, Error>) {
  return useQuery({
    queryKey: queryKeys.teams.scheduleExport(teamId),
    queryFn: ({ signal }) => eventsApi.fetchScheduleExport(teamId, signal),
    enabled: !!teamId,
    retry: DEFAULT_RETRY,
    staleTime: STALE_TIME.scheduleExport,
    ...options,
  });
}

export function useGames(eventId: string, options?: eventsApi.FetchGamesOptions, queryOptions?: UseQueryOptions<Event[], Error, Event[]>) {
  return useQuery({
    queryKey: queryKeys.games.all(eventId),
    queryFn: ({ signal }) => eventsApi.fetchGames({ ...options, eventId }, signal).then(r => r.data),
    retry: DEFAULT_RETRY,
    staleTime: STALE_TIME.game,
    ...queryOptions,
  });
}

export function useGameById(gameId: string, options?: UseQueryOptions<Event | null, Error>) {
  return useQuery({
    queryKey: queryKeys.games.byId(gameId),
    queryFn: ({ signal }) => eventsApi.fetchGameById(gameId, signal),
    enabled: !!gameId,
    retry: DEFAULT_RETRY,
    staleTime: STALE_TIME.game,
    ...options,
  });
}

export function useEventStandings(eventId: string, options?: UseQueryOptions<import("@/types").EventStandings, Error>) {
  return useQuery({
    queryKey: queryKeys.events.standings(eventId),
    queryFn: ({ signal }) => eventsApi.fetchEventStandings(eventId, signal),
    enabled: !!eventId,
    retry: DEFAULT_RETRY,
    staleTime: STALE_TIME.standings,
    ...options,
  });
}

export function useEventAttendance(eventId: string, options?: UseQueryOptions<import("@/types").EventAttendance | null, Error>) {
  return useQuery({
    queryKey: queryKeys.events.attendance(eventId),
    queryFn: ({ signal }) => eventsApi.fetchEventAttendance(eventId, signal),
    enabled: !!eventId,
    retry: DEFAULT_RETRY,
    staleTime: STALE_TIME.attendance,
    ...options,
  });
}

export function useEventAttendanceSurvey(eventId: string, options?: UseQueryOptions<import("@/types").AttendanceSurvey | null, Error>) {
  return useQuery({
    queryKey: queryKeys.events.attendanceSurvey(eventId),
    queryFn: ({ signal }) => eventsApi.fetchEventAttendanceSurvey(eventId, signal),
    enabled: !!eventId,
    retry: DEFAULT_RETRY,
    staleTime: STALE_TIME.attendanceSurvey,
    ...options,
  });
}

export function useEventRoster(eventId: string, options?: UseQueryOptions<import("@/types").TeamMember[], Error>) {
  return useQuery({
    queryKey: queryKeys.events.roster(eventId),
    queryFn: ({ signal }) => eventsApi.fetchEventRoster(eventId, signal),
    enabled: !!eventId,
    retry: DEFAULT_RETRY,
    staleTime: STALE_TIME.roster,
    ...options,
  });
}

export function useEventBracket(eventId: string, options?: UseQueryOptions<import("@/types").Bracket | null, Error>) {
  return useQuery({
    queryKey: queryKeys.events.bracket(eventId),
    queryFn: ({ signal }) => eventsApi.fetchEventBracket(eventId, signal),
    enabled: !!eventId,
    retry: DEFAULT_RETRY,
    staleTime: STALE_TIME.bracket,
    ...options,
  });
}

export function useLocations(organizationId?: number, options?: UseQueryOptions<import("@/types").Location[], Error>) {
  return useQuery({
    queryKey: queryKeys.locations.all(organizationId),
    queryFn: ({ signal }) => eventsApi.fetchLocations(organizationId, signal),
    retry: DEFAULT_RETRY,
    staleTime: STALE_TIME.locations,
    ...options,
  });
}