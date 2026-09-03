/**
 * TopScore API Discovery
 *
 * Per API spec §8, every endpoint is self-documenting via /api/help.
 * This module provides live endpoint discovery via /api/help.
 *
 * Static endpoint catalog is centralized in lib/endpointCatalog.ts.
 * This module re-exports from it and adds live /api/help fetching.
 */

import { apiClient } from "@/lib/apiClient";
export {
  ENDPOINT_CATALOG,
  getEndpointRecord,
  isEndpointVerified,
  isEndpointDeprecated,
  isEndpointSpeculative,
  describeEndpoint,
  type EndpointRecord,
} from "@/lib/endpointCatalog";

export interface ApiHelpResponse {
  endpoint: string;
  method: string;
  description?: string;
  parameters?: Record<string, unknown>;
  fields?: Record<string, unknown>;
}

let cachedDocs: ApiHelpResponse[] | null = null;
let docsCacheTime: number = 0;
const DOCS_CACHE_TTL_MS = 60 * 60 * 1000;

/**
 * Fetch full API documentation from /api/help.
 * Results are cached for DOCS_CACHE_TTL_MS.
 */
export async function fetchApiDocumentation(
  forceRefresh: boolean = false
): Promise<ApiHelpResponse[]> {
  if (
    !forceRefresh &&
    cachedDocs &&
    Date.now() - docsCacheTime < DOCS_CACHE_TTL_MS
  ) {
    return cachedDocs;
  }

  try {
    const response = await apiClient.getRaw<ApiHelpResponse[]>("/api/help");
    cachedDocs = Array.isArray(response) ? response : [];
    docsCacheTime = Date.now();
    return cachedDocs;
  } catch (error) {
    console.error("Failed to fetch API documentation:", error);
    if (cachedDocs) return cachedDocs;
    return [];
  }
}

/**
 * Get documentation for a specific endpoint from live /api/help.
 */
export async function getEndpointDocumentation(
  endpoint: string
): Promise<ApiHelpResponse | null> {
  const docs = await fetchApiDocumentation();
  const normalizedEndpoint = endpoint.startsWith("/api")
    ? endpoint
    : `/api${endpoint}`;
  return docs.find((doc) => doc.endpoint === normalizedEndpoint) ?? null;
}

/**
 * Validate if an endpoint is documented in the TopScore API.
 */
export async function isEndpointValid(endpoint: string): Promise<boolean> {
  const doc = await getEndpointDocumentation(endpoint);
  return doc !== null;
}

/**
 * Validate multiple endpoints against live /api/help.
 * Returns categorized results.
 */
export async function validateEndpoints(): Promise<{
  valid: string[];
  speculative: string[];
  invalid: string[];
  unknown: string[];
}> {
  const docs = await fetchApiDocumentation();
  const validEndpoints = new Set(docs.map((d) => d.endpoint));

  const endpointsToCheck = [
    "/api/me",
    "/api/oauth/server",
    "/api/help",
    "/api/events",
    "/api/persons/me",
    "/api/registrations",
    "/api/teams",
    "/api/games",
    "/api/games/show",
    "/api/games/report-score",
    "/api/schedule",
    "/api/family",
    "/api/family/invite",
    "/api/memberships",
    "/api/memberships/purchase",
    "/api/teams/{id}/roster",
    "/api/teams/{id}/roster/invite",
    "/api/teams/{id}/roster/{personId}",
    "/api/teams/{id}/schedule/export",
    "/api/teams/{id}/schedule/url",
    "/api/teams/{id}/attendance",
    "/api/teams/{id}/practices",
    "/api/events/{id}/standings",
    "/api/events/{id}/attendance",
    "/api/events/{id}/bracket",
    "/api/events/{id}/waivers",
    "/api/events/{id}/pools/{pool}/standings",
    "/api/events/{id}/scores",
    "/api/events/{id}/roster",
    "/api/events/{id}/roster/settings",
    "/api/events/{id}/attendance/survey",
    "/api/practices/{id}",
    "/api/practices/{id}/attendance",
    "/api/waivers",
    "/api/waivers/{id}/sign",
    "/api/polls",
    "/api/polls/{id}",
    "/api/polls/{id}/vote",
    "/api/mail",
    "/api/mail/send",
    "/api/notifications",
    "/api/notifications/{id}",
    "/api/notifications/{id}/read",
    "/api/notifications/read-all",
    "/api/roster-invitations/{id}/respond",
    "/api/teams/{id}/stats",
    "/api/teams/{id}/standings",
    "/api/locations",
    "/api/articles",
    "/api/articles/{slug}",
  ];

  const result = {
    valid: [] as string[],
    speculative: [] as string[],
    invalid: [] as string[],
    unknown: [] as string[],
  };

  for (const endpoint of endpointsToCheck) {
    if (validEndpoints.has(endpoint)) {
      result.valid.push(endpoint);
    } else {
      const pattern = endpoint.replace(/\{[^}]+\}/g, "[^/]+");
      const regex = new RegExp(`^${pattern}$`);
      const hasMatch = Array.from(validEndpoints).some((e) =>
        regex.test(e)
      );

      if (hasMatch) {
        result.speculative.push(endpoint);
      } else {
        result.invalid.push(endpoint);
      }
    }
  }

  for (const docEndpoint of docs.map((d) => d.endpoint)) {
    if (
      !endpointsToCheck.includes(docEndpoint) &&
      !validEndpoints.has(docEndpoint)
    ) {
      result.unknown.push(docEndpoint);
    }
  }

  return result;
}

/**
 * Check if an endpoint is speculative (used in app but not in official spec).
 */
export function isSpeculativeEndpoint(endpoint: string): boolean {
  const speculativePatterns = [
    "/api/family",
    "/api/family/invite",
    "/api/memberships",
    "/api/memberships/purchase",
    "/api/teams/{id}/roster",
    "/api/teams/{id}/roster/invite",
    "/api/teams/{id}/roster/{personId}",
    "/api/teams/{id}/schedule/export",
    "/api/teams/{id}/schedule/url",
    "/api/teams/{id}/attendance",
    "/api/teams/{id}/practices",
    "/api/events/{id}/standings",
    "/api/events/{id}/attendance",
    "/api/events/{id}/bracket",
    "/api/events/{id}/waivers",
    "/api/events/{id}/pools/{pool}/standings",
    "/api/events/{id}/scores",
    "/api/events/{id}/roster",
    "/api/events/{id}/roster/settings",
    "/api/events/{id}/attendance/survey",
    "/api/practices/{id}",
    "/api/practices/{id}/attendance",
    "/api/waivers",
    "/api/waivers/{id}/sign",
    "/api/polls",
    "/api/polls/{id}",
    "/api/polls/{id}/vote",
    "/api/mail",
    "/api/mail/send",
    "/api/notifications",
    "/api/notifications/{id}",
    "/api/notifications/{id}/read",
    "/api/notifications/read-all",
    "/api/roster-invitations/{id}/respond",
    "/api/teams/{id}/stats",
    "/api/teams/{id}/standings",
    "/api/locations",
    "/api/articles",
    "/api/articles/{slug}",
  ];

  return speculativePatterns.some((se) => {
    const pattern = se.replace(/\{[^}]+\}/g, "[^/]+");
    return new RegExp(`^${pattern}$`).test(endpoint);
  });
}

/**
 * Clear the live /api/help documentation cache.
 */
export function clearDocsCache(): void {
  cachedDocs = null;
  docsCacheTime = 0;
}