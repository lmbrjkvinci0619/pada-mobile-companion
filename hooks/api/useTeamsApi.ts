import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import * as teamsApi from "@/services/api/teams";
import type { Team, TeamMember } from "@/types";
import { STALE_TIME } from "@/constants/cache";

const DEFAULT_RETRY = 2;

export function useTeams(options?: teamsApi.FetchTeamsOptions, queryOptions?: UseQueryOptions<Team[], Error, Team[]>) {
  return useQuery({
    queryKey: queryKeys.teams.all,
    queryFn: ({ signal }) => teamsApi.fetchTeams(options, signal).then(r => r.data),
    retry: DEFAULT_RETRY,
    staleTime: STALE_TIME.teams,
    ...queryOptions,
  });
}

export function useTeam(teamId: string, options?: UseQueryOptions<Team | undefined, Error>) {
  return useQuery({
    queryKey: queryKeys.teams.byId(teamId),
    queryFn: ({ signal }) => teamsApi.fetchTeam(teamId, signal),
    enabled: !!teamId,
    retry: DEFAULT_RETRY,
    staleTime: STALE_TIME.teamDetail,
    ...options,
  });
}

export function useTeamRoster(teamId: string, options?: UseQueryOptions<TeamMember[], Error>) {
  return useQuery({
    queryKey: queryKeys.teams.roster(teamId),
    queryFn: ({ signal }) => teamsApi.fetchTeamRoster(teamId, signal),
    enabled: !!teamId,
    retry: DEFAULT_RETRY,
    staleTime: STALE_TIME.roster,
    ...options,
  });
}

export function useStandingRoster(teamId: string, options?: UseQueryOptions<TeamMember[], Error>) {
  return useQuery({
    queryKey: queryKeys.teams.standingRoster(teamId),
    queryFn: ({ signal }) => teamsApi.fetchStandingRoster(teamId, signal),
    enabled: !!teamId,
    retry: DEFAULT_RETRY,
    staleTime: STALE_TIME.roster,
    ...options,
  });
}

export function useActiveRoster(teamId: string, options?: UseQueryOptions<TeamMember[], Error>) {
  return useQuery({
    queryKey: queryKeys.teams.activeRoster(teamId),
    queryFn: ({ signal }) => teamsApi.fetchActiveRoster(teamId, signal),
    enabled: !!teamId,
    retry: DEFAULT_RETRY,
    staleTime: STALE_TIME.roster,
    ...options,
  });
}

export function useTeamStats(teamId: string, options?: UseQueryOptions<import("@/types").TeamStats | null, Error>) {
  return useQuery({
    queryKey: queryKeys.teams.stats(teamId),
    queryFn: ({ signal }) => teamsApi.fetchTeamStats(teamId, signal),
    enabled: !!teamId,
    retry: DEFAULT_RETRY,
    staleTime: STALE_TIME.teamStats,
    ...options,
  });
}

export function useTeamStandings(teamId: string, options?: UseQueryOptions<import("@/types").TeamStanding[], Error>) {
  return useQuery({
    queryKey: queryKeys.teams.standings(teamId),
    queryFn: ({ signal }) => teamsApi.fetchTeamStandings(teamId, signal),
    enabled: !!teamId,
    retry: DEFAULT_RETRY,
    staleTime: STALE_TIME.standings,
    ...options,
  });
}