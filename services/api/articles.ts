import { apiClient, buildFieldsParam, MAX_PER_PAGE } from "@/lib/apiClient";
import { ensureEndpoint } from "@/lib/endpointGuard";
import type { Article } from "@/types";
import type { ApiArticle } from "@/types/api";
import { mapArticle } from "@/lib/mappers/topscore";

// ─── Articles / News ──────────────────────────────────────────────────────────

export async function fetchArticles(
  category?: string,
  signal?: AbortSignal
): Promise<Article[]> {
  const path = category ? `/api/articles?category=${category}` : "/api/articles";
  const data = await apiClient.get<ApiArticle[]>(path, { signal });
  return data.map(mapArticle);
}

export async function fetchArticleBySlug(
  slug: string,
  signal?: AbortSignal
): Promise<Article | null> {
  try {
    const data = await apiClient.get<ApiArticle>(`/api/articles/${slug}`, { signal });
    return mapArticle(data);
  } catch {
    return null;
  }
}