import { apiClient } from "@/lib/apiClient";

/**
 * IMPORTANT: TopScore API Discovery
 *
 * Per TopScore API spec v1.0, every endpoint is self-documenting via /api/help.
 * Use this module to:
 * 1. Fetch full API documentation (/api/help)
 * 2. Validate specific endpoints (/api/help?endpoint=X)
 * 3. Discover available fields and parameters
 *
 * NOTE: Many endpoints in the codebase are marked "SPECULATIVE" - they are inferred
 * from pada.org feature needs but NOT documented in the official API spec.
 * Always validate speculative endpoints against /api/help before production use.
 */

export interface EndpointDoc {
  endpoint: string;
  method: "GET" | "POST";
  description: string;
  parameters?: Record<string, {
    type: string;
    default?: unknown;
    max?: number;
    description?: string;
  }>;
  fields?: Record<string, { type: string; description?: string }>;
}

export interface ApiHelpResponse {
  endpoint: string;
  method: string;
  description?: string;
  parameters?: Record<string, unknown>;
  fields?: Record<string, unknown>;
}

let cachedDocs: EndpointDoc[] | null = null;
let docsCacheTime: number = 0;
const DOCS_CACHE_TTL_MS = 60 * 60 * 1000;

/**
 * Fetch full API documentation from /api/help
 * This returns all available endpoints and their documentation.
 */
export async function fetchApiDocumentation(forceRefresh: boolean = false): Promise<EndpointDoc[]> {
  if (!forceRefresh && cachedDocs && Date.now() - docsCacheTime < DOCS_CACHE_TTL_MS) {
    return cachedDocs;
  }

  try {
    const response = await apiClient.getRaw<ApiHelpResponse[]>("/api/help");
    cachedDocs = (Array.isArray(response) ? response : []) as EndpointDoc[];
    docsCacheTime = Date.now();
    return cachedDocs;
  } catch (error) {
    console.error("Failed to fetch API documentation:", error);
    if (cachedDocs) {
      return cachedDocs;
    }
    return [];
  }
}

/**
 * Get documentation for a specific endpoint.
 * This validates if an endpoint exists and returns its parameters and fields.
 */
export async function getEndpointDocumentation(endpoint: string): Promise<EndpointDoc | null> {
  const docs = await fetchApiDocumentation();
  const normalizedEndpoint = endpoint.startsWith("/api") ? endpoint : `/api${endpoint}`;

  return docs.find((doc) => doc.endpoint === normalizedEndpoint) ?? null;
}

/**
 * Validate if a specific endpoint is documented in the TopScore API.
 * Returns true if the endpoint exists in /api/help documentation.
 */
export async function isEndpointValid(endpoint: string): Promise<boolean> {
  const doc = await getEndpointDocumentation(endpoint);
  return doc !== null;
}

/**
 * Known endpoints from the TopScore API spec v1.0 (July 2026)
 * These are documented and should be reliable.
 */
const DOCUMENTED_ENDPOINTS = [
  "/api/me",
  "/api/oauth/server",
  "/api/help",
  "/api/events",
  "/api/events/{id}",
  "/api/persons",
  "/api/persons/{id}",
  "/api/persons/me",
  "/api/registrations",
  "/api/teams",
  "/api/schedule",
];

/**
 * Endpoints that are used by the app but are NOT documented in the official spec.
 * These should be validated against /api/help before production use.
 */
const SPECULATIVE_ENDPOINTS = [
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
  "/api/articles/{id}",
];

/**
 * Validate multiple endpoints at once.
 * Returns categorized results: valid (in spec), speculative (not in spec), unknown (not found).
 */
export async function validateEndpoints(): Promise<{
  valid: string[];
  speculative: string[];
  invalid: string[];
  unknown: string[];
}> {
  const docs = await fetchApiDocumentation();
  const validEndpoints = new Set(docs.map((d) => d.endpoint));

  const endpointsToCheck = [...DOCUMENTED_ENDPOINTS, ...SPECULATIVE_ENDPOINTS];

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
      // Check if any similar endpoint exists (handles {id} placeholders)
      const pattern = endpoint.replace(/\{[^}]+\}/g, "[^/]+");
      const regex = new RegExp(`^${pattern}$`);
      const hasMatch = Array.from(validEndpoints).some((e) => regex.test(e));

      if (hasMatch) {
        result.speculative.push(endpoint);
      } else {
        result.invalid.push(endpoint);
      }
    }
  }

  // Add any discovered endpoints not in our lists
  for (const docEndpoint of docs.map((d) => d.endpoint)) {
    if (!endpointsToCheck.includes(docEndpoint) && !DOCUMENTED_ENDPOINTS.includes(docEndpoint)) {
      result.unknown.push(docEndpoint);
    }
  }

  return result;
}

/**
 * Check if an endpoint is speculative (not in official spec but may exist).
 */
export function isSpeculativeEndpoint(endpoint: string): boolean {
  return SPECULATIVE_ENDPOINTS.some((se) => {
    const pattern = se.replace(/\{[^}]+\}/g, "[^/]+");
    return new RegExp(`^${pattern}$`).test(endpoint);
  });
}

/**
 * Clear the documentation cache.
 * Call this if you suspect endpoint availability has changed.
 */
export function clearDocsCache(): void {
  cachedDocs = null;
  docsCacheTime = 0;
}