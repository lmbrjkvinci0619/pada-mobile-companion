import { useQuery, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import * as topscore from "@/services/topscore";
import * as announcements from "@/services/announcements";
import type { User, Event, Team, Registration, Announcement } from "@/types";

export function useUser(options?: UseQueryOptions<User, Error, User, typeof queryKeys.auth.user>) {
  return useQuery({
    queryKey: queryKeys.auth.user,
    queryFn: () => topscore.fetchCurrentUser(),
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
    ...options,
  });
}

export function useEvent(eventId: string, options?: UseQueryOptions<Event | undefined, Error>) {
  return useQuery({
    queryKey: queryKeys.events.byId(eventId),
    queryFn: () => topscore.fetchEvent(eventId),
    ...options,
  });
}

export function useTeams(options?: UseQueryOptions<Team[], Error, Team[]>) {
  return useQuery({
    queryKey: queryKeys.teams.all,
    queryFn: () => topscore.fetchTeams(),
    ...options,
  });
}

export function useTeam(teamId: string, options?: UseQueryOptions<Team | undefined, Error>) {
  return useQuery({
    queryKey: queryKeys.teams.byId(teamId),
    queryFn: () => topscore.fetchTeam(teamId),
    ...options,
  });
}

export function useRegistrations(options?: UseQueryOptions<Registration[], Error, Registration[]>) {
  return useQuery({
    queryKey: queryKeys.registrations.all,
    queryFn: () => topscore.fetchRegistrations(),
    ...options,
  });
}

export function useAnnouncements(userId: string, options?: UseQueryOptions<Announcement[], Error>) {
  return useQuery({
    queryKey: queryKeys.announcements.all(userId),
    queryFn: () => announcements.fetchAnnouncements(userId).then((r) => r.data),
    enabled: !!userId,
    ...options,
  });
}

export function useAnnouncement(announcementId: string, options?: UseQueryOptions<Announcement | null, Error>) {
  return useQuery({
    queryKey: queryKeys.announcements.byId(announcementId),
    queryFn: () => announcements.fetchAnnouncementById(announcementId),
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