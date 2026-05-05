import { QueryClient } from "@tanstack/react-query";
import { CACHE_CONFIG, REQUEST_CONFIG } from "@/constants/cache";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: CACHE_CONFIG.defaultStaleTime,
      gcTime: CACHE_CONFIG.defaultGcTime,
      retry: REQUEST_CONFIG.maxRetries,
      retryDelay: (attemptIndex) => Math.min(REQUEST_CONFIG.retryDelayBase * 2 ** attemptIndex, REQUEST_CONFIG.maxRetryDelay),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 2,
    },
  },
});

export function invalidateQueries(queryKey: string | string[]): void {
  queryClient.invalidateQueries({ queryKey: Array.isArray(queryKey) ? queryKey : [queryKey] });
}

export async function prefetchQuery<T>(queryKey: readonly string[], queryFn: () => Promise<T>): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: [...queryKey],
    queryFn,
  });
}

export function setQueryData<T>(queryKey: string[], data: T): void {
  queryClient.setQueryData<T>(queryKey, data);
}

export function getQueryData<T>(queryKey: string[]): T | undefined {
  return queryClient.getQueryData<T>(queryKey);
}