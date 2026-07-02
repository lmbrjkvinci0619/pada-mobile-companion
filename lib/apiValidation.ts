/**
 * TopScore API Validation Utilities
 * 
 * These utilities help validate API responses and handle edge cases
 * according to the TopScore API spec v1.0 (docs/topscore_api.md).
 */

import type { TopScoreError } from "@/types/api-response";

/**
 * Verification status for API endpoints
 * - VERIFIED: Confirmed working via /api/help or actual API testing
 * - SPECULATIVE: Marked as possible but not verified - needs testing
 * - DEPRECATED: Known to be deprecated or replaced
 */
export type EndpointVerificationStatus = "VERIFIED" | "SPECULATIVE" | "DEPRECATED";

/**
 * Endpoint documentation record
 */
export interface EndpointDoc {
  path: string;
  method: "GET" | "POST";
  description: string;
  verificationStatus: EndpointVerificationStatus;
  notes?: string;
}

/**
 * All documented TopScore API endpoints with their verification status
 * 
 * VERIFIED endpoints from actual API testing (July 2026):
 * - /api/me (GET) - Auth test
 * - /api/persons/me (GET) - Current user
 * - /api/events (GET) - List events
 * - /api/events?id={id} (GET) - Get single event (NOT /api/events/{id})
 * - /api/teams (GET) - List teams (REQUIRES: event_id, person_id, or id parameter)
 * - /api/teams/show?id={id} (GET) - Get single team (NOT /api/teams/{id})
 * - /api/registrations (GET) - List registrations (REQUIRES event_id or person_id)
 * - /api/games (GET) - List games
 * - /api/games/show (GET) - Get single game
 * - /api/games/report-score (POST) - Report score
 * - /api/oauth/server (POST) - OAuth token generation
 * 
 * CORRECTED ENDPOINT PATTERNS (per actual API testing):
 * 
 * Events:
 * - GET /api/events                    - List events with pagination
 * - GET /api/events?id={id}            - Get single event by ID (NOT /api/events/{id})
 * - GET /api/events?event_id={id}       - Filter by event_id
 * 
 * Teams:
 * - GET /api/teams?event_id={id}       - Teams for an event
 * - GET /api/teams?person_id={id}      - Teams for a person
 * - GET /api/teams/show?id={id}        - Single team by ID (NOT /api/teams/{id})
 * 
 * Persons:
 * - GET /api/persons/me                - Current authenticated user (ONLY way to get user)
 * - GET /api/persons/{id}              - DOES NOT EXIST (404) - no single person getter
 * 
 * Games:
 * - GET /api/games                     - List games
 * - GET /api/games?event_id={id}       - Games for an event
 * - GET /api/games/show?id={id}        - Single game
 * - POST /api/games/report-score       - Report score
 * 
 * NOT IN API (verified 404):
 * - /api/events/{id}                   - No such endpoint
 * - /api/teams/{id}                    - No such endpoint  
 * - /api/persons/{id}                  - No such endpoint
 * - /api/schedule                      - No such endpoint
 * - /api/events/show                   - No such endpoint
 * - /api/registrations/{id}            - No such endpoint
 * - /api/registrations (without params) - Returns 400
 */
export const ENDPOINT_DOCUMENTATION: EndpointDoc[] = [
  // Verified endpoints from actual API testing (July 2026)
  { path: "/api/me", method: "GET", description: "Test authentication and get CSRF validity", verificationStatus: "VERIFIED" },
  { path: "/api/persons/me", method: "GET", description: "Get current authenticated user", verificationStatus: "VERIFIED" },
  { path: "/api/events", method: "GET", description: "List events with pagination", verificationStatus: "VERIFIED" },
  { path: "/api/events?id={id}", method: "GET", description: "Get single event by ID (uses query param, NOT /api/events/{id})", verificationStatus: "VERIFIED" },
  { path: "/api/teams", method: "GET", description: "List teams (requires event_id, person_id, or id parameter)", verificationStatus: "VERIFIED" },
  { path: "/api/teams/show?id={id}", method: "GET", description: "Get single team by ID (uses /teams/show endpoint)", verificationStatus: "VERIFIED" },
  { path: "/api/games", method: "GET", description: "List games (requires event_id parameter)", verificationStatus: "VERIFIED" },
  { path: "/api/registrations", method: "GET", description: "List registrations (requires event_id, person_id, or team_id)", verificationStatus: "VERIFIED" },
  { path: "/api/oauth/server", method: "POST", description: "OAuth2 token endpoint", verificationStatus: "VERIFIED" },
  { path: "/api/events/{id}/scores", method: "POST", description: "Report score (captains only)", verificationStatus: "VERIFIED" },

  // BROKEN endpoints - confirmed via actual API testing (July 2026) - DO NOT USE
  { path: "/api/persons/{id}", method: "GET", description: "DOES NOT EXIST - returns 404. Only /api/persons/me works.", verificationStatus: "DEPRECATED" },
  { path: "/api/events/{id}", method: "GET", description: "DOES NOT EXIST - returns 404. Use /api/events?id={id} instead", verificationStatus: "DEPRECATED" },
  { path: "/api/teams/{id}", method: "GET", description: "DOES NOT EXIST - returns 404. Use /api/teams/show?id={id} instead", verificationStatus: "DEPRECATED" },
  { path: "/api/registrations/{id}", method: "GET", description: "DOES NOT EXIST - returns 404", verificationStatus: "DEPRECATED" },
  { path: "/api/schedule", method: "GET", description: "DOES NOT EXIST - returns 404. Use /api/games?event_id=X for schedule", verificationStatus: "DEPRECATED" },

  // Speculative endpoints - need verification
  { path: "/api/family", method: "GET", description: "Get family information", verificationStatus: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/family/invite", method: "POST", description: "Invite family member", verificationStatus: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/family/{id}", method: "POST", description: "Remove family member", verificationStatus: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/memberships", method: "GET", description: "Get memberships", verificationStatus: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/memberships/purchase", method: "POST", description: "Purchase membership", verificationStatus: "SPECULATIVE", notes: "Not in official spec - requires financial access" },
  { path: "/api/events/{id}/attendance", method: "GET", description: "Get event attendance", verificationStatus: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/events/{id}/attendance", method: "POST", description: "Update attendance", verificationStatus: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/events/{id}/bracket", method: "GET", description: "Get event bracket", verificationStatus: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/events/{id}/standings", method: "GET", description: "Get event standings", verificationStatus: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/events/{id}/pools/{name}/standings", method: "GET", description: "Get pool standings", verificationStatus: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/waivers", method: "GET", description: "Get waivers", verificationStatus: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/waivers/{id}", method: "GET", description: "Get waiver by ID", verificationStatus: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/waivers/{id}/sign", method: "POST", description: "Sign waiver", verificationStatus: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/events/{id}/waivers", method: "GET", description: "Get event waivers", verificationStatus: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/polls", method: "GET", description: "Get polls", verificationStatus: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/polls/{id}", method: "GET", description: "Get poll by ID", verificationStatus: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/polls/{id}/vote", method: "POST", description: "Vote on poll", verificationStatus: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/polls", method: "POST", description: "Create poll", verificationStatus: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/notifications", method: "GET", description: "Get notifications", verificationStatus: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/notifications/{id}", method: "GET", description: "Get notification by ID", verificationStatus: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/notifications/{id}/read", method: "POST", description: "Mark notification read", verificationStatus: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/notifications/read-all", method: "POST", description: "Mark all notifications read", verificationStatus: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/notifications/{id}", method: "POST", description: "Delete notification", verificationStatus: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/mail", method: "GET", description: "Get mail messages", verificationStatus: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/mail/send", method: "POST", description: "Send mail message", verificationStatus: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/teams/{id}/practices", method: "GET", description: "Get team practices", verificationStatus: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/teams/{id}/practices", method: "POST", description: "Create practice", verificationStatus: "SPECULATIVE", notes: "Not in official spec - requires write access" },
  { path: "/api/practices/{id}", method: "GET", description: "Get practice by ID", verificationStatus: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/practices/{id}", method: "POST", description: "Update practice", verificationStatus: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/teams/{id}/roster", method: "GET", description: "Get team roster", verificationStatus: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/teams/{id}/roster/{person_id}", method: "POST", description: "Update/remove roster member", verificationStatus: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/teams/{id}/roster/invite", method: "POST", description: "Invite roster member", verificationStatus: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/teams/{id}/roster/invitations", method: "GET", description: "Get roster invitations", verificationStatus: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/teams/{id}/roster/invitations/{id}", method: "POST", description: "Cancel roster invitation", verificationStatus: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/teams/{id}/stats", method: "GET", description: "Get team stats", verificationStatus: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/teams/{id}/standings", method: "GET", description: "Get team standings", verificationStatus: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/teams/{id}/attendance", method: "GET", description: "Get team attendance", verificationStatus: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/teams/{id}/schedule/export", method: "GET", description: "Get schedule export", verificationStatus: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/teams/{id}/schedule/url", method: "GET", description: "Get calendar URL", verificationStatus: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/persons/{id}/registrations", method: "GET", description: "Get person registrations", verificationStatus: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/teams/{id}/registrations", method: "GET", description: "Get team registrations", verificationStatus: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/events/{id}/registrations", method: "GET", description: "Get event registrations", verificationStatus: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/events/{id}/roster", method: "GET", description: "Get event roster", verificationStatus: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/events/{id}/roster/settings", method: "GET", description: "Get event roster settings", verificationStatus: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/events/{id}/attendance/survey", method: "GET", description: "Get attendance survey", verificationStatus: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/events/{id}/attendance/survey", method: "POST", description: "Submit attendance survey", verificationStatus: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/articles", method: "GET", description: "Get articles", verificationStatus: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/articles/{slug}", method: "GET", description: "Get article by slug", verificationStatus: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/locations", method: "GET", description: "Get locations", verificationStatus: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/roster-invitations/{id}/respond", method: "POST", description: "Respond to roster invitation", verificationStatus: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/persons/{id}", method: "POST", description: "Update person profile", verificationStatus: "SPECULATIVE", notes: "Not in official spec - uses _method=PUT" },
  { path: "/api/persons/search", method: "GET", description: "Search persons", verificationStatus: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/teams/search", method: "GET", description: "Search teams", verificationStatus: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/registrations/{id}", method: "POST", description: "Update registration", verificationStatus: "SPECULATIVE", notes: "Not in official spec - uses _method=PUT" },
];

/**
 * Get endpoint verification status
 */
export function getEndpointStatus(path: string, method: "GET" | "POST"): EndpointVerificationStatus {
  const normalizedPath = path.replace(/\/\d+/g, "/{id}").replace(/\?.*/, "");
  const doc = ENDPOINT_DOCUMENTATION.find(
    e => e.path === normalizedPath && e.method === method
  );
  return doc?.verificationStatus ?? "SPECULATIVE";
}

/**
 * Check if an endpoint is verified (in official spec)
 */
export function isVerifiedEndpoint(path: string, method: "GET" | "POST"): boolean {
  return getEndpointStatus(path, method) === "VERIFIED";
}

/**
 * Check if an endpoint needs verification
 */
export function needsVerification(path: string, method: "GET" | "POST"): boolean {
  return getEndpointStatus(path, method) === "SPECULATIVE";
}

/**
 * Validate API response structure per spec
 */
export function validateApiResponse(response: unknown): { valid: boolean; error?: string } {
  if (response === null || response === undefined) {
    return { valid: false, error: "Response is null or undefined" };
  }
  if (typeof response !== "object") {
    return { valid: false, error: "Response is not an object" };
  }
  const r = response as Record<string, unknown>;
  if (!("status" in r)) {
    return { valid: false, error: "Response missing 'status' field" };
  }
  if (typeof r.status !== "number") {
    return { valid: false, error: "Response 'status' is not a number" };
  }
  if (!("errors" in r)) {
    return { valid: false, error: "Response missing 'errors' field" };
  }
  if (!Array.isArray(r.errors)) {
    return { valid: false, error: "Response 'errors' is not an array" };
  }
  return { valid: true };
}

/**
 * Validate error response
 */
export function validateErrorResponse(response: unknown): response is { status: number; errors: TopScoreError[] } {
  if (!validateApiResponse(response).valid) return false;
  const r = response as Record<string, unknown>;
  const status = r.status;
  const statusNum = typeof status === "number" ? status : typeof status === "string" ? parseInt(status, 10) : NaN;
  return statusNum >= 400 && Array.isArray(r.errors) && r.errors.length > 0;
}

/**
 * Get user-friendly message from TopScore error
 */
export function getErrorMessageFromResponse(response: unknown): string {
  if (!response || typeof response !== "object") {
    return "Unknown error";
  }
  const r = response as Record<string, unknown>;
  
  if (Array.isArray(r.errors) && r.errors.length > 0) {
    const firstError = r.errors[0] as Record<string, unknown>;
    if (typeof firstError.message === "string") {
      return firstError.message;
    }
  }
  
  if (typeof r.message === "string") {
    return r.message;
  }
  
  if (typeof r.error === "string") {
    return r.error;
  }
  
  if (typeof r.error_description === "string") {
    return r.error_description;
  }
  
  return "Unknown error";
}