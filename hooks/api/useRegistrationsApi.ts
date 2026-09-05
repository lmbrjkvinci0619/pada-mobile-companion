import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import * as regApi from "@/services/api/registrations";
import type { Registration } from "@/types";
import { STALE_TIME } from "@/constants/cache";

const DEFAULT_RETRY = 2;

export function useRegistrations(options?: regApi.FetchRegistrationsOptions, queryOptions?: UseQueryOptions<Registration[], Error, Registration[]>) {
  return useQuery({
    queryKey: queryKeys.registrations.all,
    queryFn: ({ signal }) => regApi.fetchRegistrations(options ?? {}, signal).then(r => r.data),
    retry: DEFAULT_RETRY,
    staleTime: STALE_TIME.registrations,
    ...queryOptions,
  });
}

export function useRegistration(registrationId: string, options?: UseQueryOptions<Registration | null, Error>) {
  return useQuery({
    queryKey: queryKeys.registrations.byId(registrationId),
    queryFn: ({ signal }) => regApi.fetchRegistrationById(registrationId, signal),
    enabled: !!registrationId,
    retry: DEFAULT_RETRY,
    staleTime: STALE_TIME.registrations,
    ...options,
  });
}

export function useRegistrationsByPerson(personId: string, options?: UseQueryOptions<Registration[], Error>) {
  return useQuery({
    queryKey: queryKeys.registrations.byPerson(personId),
    queryFn: ({ signal }) => regApi.fetchRegistrationsByPerson(personId, signal),
    enabled: !!personId,
    retry: DEFAULT_RETRY,
    staleTime: STALE_TIME.registrations,
    ...options,
  });
}

export function useRegistrationsByTeam(teamId: string, options?: UseQueryOptions<Registration[], Error>) {
  return useQuery({
    queryKey: queryKeys.registrations.byTeam(teamId),
    queryFn: ({ signal }) => regApi.fetchRegistrationsByTeam(teamId, signal),
    enabled: !!teamId,
    retry: DEFAULT_RETRY,
    staleTime: STALE_TIME.registrations,
    ...options,
  });
}

export function useRegistrationsByEvent(eventId: string, options?: UseQueryOptions<Registration[], Error>) {
  return useQuery({
    queryKey: queryKeys.registrations.byEvent(eventId),
    queryFn: ({ signal }) => regApi.fetchRegistrationsByEvent(eventId, signal),
    enabled: !!eventId,
    retry: DEFAULT_RETRY,
    staleTime: STALE_TIME.registrations,
    ...options,
  });
}