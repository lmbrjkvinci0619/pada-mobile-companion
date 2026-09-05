import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import * as authApi from "@/services/api/user";
import type { User } from "@/types";

const AUTH_RETRY = 1;

export function useUser(options?: UseQueryOptions<User, Error, User, typeof queryKeys.auth.user>) {
  return useQuery({
    queryKey: queryKeys.auth.user,
    queryFn: ({ signal }) => authApi.fetchCurrentUser(signal),
    retry: AUTH_RETRY,
    ...options,
  });
}

export function useUserById(personId: string, options?: UseQueryOptions<User | null, Error>) {
  return useQuery({
    queryKey: queryKeys.user.byId(personId),
    queryFn: ({ signal }) => authApi.fetchUserById(personId, signal),
    enabled: !!personId,
    retry: AUTH_RETRY,
    ...options,
  });
}