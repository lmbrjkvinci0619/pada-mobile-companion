import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import * as articlesApi from "@/services/api/articles";
import type { Article } from "@/types";
import { STALE_TIME } from "@/constants/cache";

const DEFAULT_RETRY = 2;

export function useArticles(options?: UseQueryOptions<Article[], Error, Article[]>) {
  return useQuery({
    queryKey: queryKeys.articles.all,
    queryFn: ({ signal }) => articlesApi.fetchArticles(undefined, signal),
    retry: DEFAULT_RETRY,
    staleTime: STALE_TIME.articles,
    ...options,
  });
}

export function useArticleBySlug(slug: string, options?: UseQueryOptions<Article | null, Error>) {
  return useQuery({
    queryKey: queryKeys.articles.bySlug(slug),
    queryFn: ({ signal }) => articlesApi.fetchArticleBySlug(slug, signal),
    enabled: !!slug,
    retry: DEFAULT_RETRY,
    staleTime: STALE_TIME.articles,
    ...options,
  });
}