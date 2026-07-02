/**
 * TopScore API Endpoint Verification Status
 *
 * This module tracks which API endpoints have been verified against
 * the actual TopScore API at pada.usetopscore.com.
 *
 * Verification was performed via endpoint testing on July 2, 2026.
 * See endpoint-verification-results.json for full test results.
 *
 * Status meanings:
 * - VERIFIED: Confirmed working with actual API testing
 * - SPECULATIVE: Not tested, based on TopScore API conventions
 * - BROKEN: Tested but returns error (404, 403, etc.)
 * - REQUIRES_PARAMS: Needs specific parameters to work
 */

export type EndpointStatus = "VERIFIED" | "SPECULATIVE" | "BROKEN" | "REQUIRES_PARAMS";

export interface EndpointInfo {
  path: string;
  method: "GET" | "POST";
  status: EndpointStatus;
  notes?: string;
  verifiedAt?: string;
}

/**
 * Verified endpoints from actual API testing (July 2026)
 */
export const VERIFIED_ENDPOINTS: Record<string, EndpointInfo> = {
  "/api/persons/me": {
    path: "/api/persons/me",
    method: "GET",
    status: "VERIFIED",
    notes: "Returns current authenticated user",
    verifiedAt: "2026-07-02",
  },
  "/api/events": {
    path: "/api/events",
    method: "GET",
    status: "VERIFIED",
    notes: "Works with pagination, returns event list",
    verifiedAt: "2026-07-02",
  },
  "/api/teams": {
    path: "/api/teams",
    method: "GET",
    status: "VERIFIED",
    notes: "Requires event_id or person_id parameter",
    verifiedAt: "2026-07-02",
  },
  "/api/games": {
    path: "/api/games",
    method: "GET",
    status: "VERIFIED",
    notes: "Works with event_id parameter, returns game list",
    verifiedAt: "2026-07-02",
  },
};

/**
 * Endpoints that return errors or require specific parameters
 */
export const BROKEN_OR_PROBLEMATIC_ENDPOINTS: Record<string, EndpointInfo> = {
  "/api/events/{id}": {
    path: "/api/events/{id}",
    method: "GET",
    status: "BROKEN",
    notes: "Returns 404. Use /api/events?id={id} instead",
    verifiedAt: "2026-07-02",
  },
  "/api/persons/{id}": {
    path: "/api/persons/{id}",
    method: "GET",
    status: "BROKEN",
    notes: "Returns 404. Only /api/persons/me is available for user data",
    verifiedAt: "2026-07-02",
  },
  "/api/teams/{id}": {
    path: "/api/teams/{id}",
    method: "GET",
    status: "BROKEN",
    notes: "Returns 404. Use /api/teams/show?id={id} instead",
    verifiedAt: "2026-07-02",
  },
  "/api/schedule": {
    path: "/api/schedule",
    method: "GET",
    status: "BROKEN",
    notes: "Returns 404. Schedule export may require different endpoint pattern",
    verifiedAt: "2026-07-02",
  },
  "/api/registrations": {
    path: "/api/registrations",
    method: "GET",
    status: "REQUIRES_PARAMS",
    notes: "Returns 400/403 without event_id, team_id, or person_id parameter",
    verifiedAt: "2026-07-02",
  },
};

/**
 * Check if an endpoint is verified to work
 */
export function isEndpointVerified(path: string): boolean {
  return path in VERIFIED_ENDPOINTS;
}

/**
 * Check if an endpoint is known to be broken
 */
export function isEndpointBroken(path: string): boolean {
  return path in BROKEN_OR_PROBLEMATIC_ENDPOINTS;
}

/**
 * Get endpoint info if available
 */
export function getEndpointInfo(path: string): EndpointInfo | undefined {
  return VERIFIED_ENDPOINTS[path] ?? BROKEN_OR_PROBLEMATIC_ENDPOINTS[path];
}

/**
 * Common TopScore API endpoint patterns
 */
export const ENDPOINT_PATTERNS = {
  // Events - use query parameter pattern
  EVENT_BY_ID: "/api/events?id={id}",
  EVENTS_BY_TEAM: "/api/events?team_id={teamId}",

  // Teams - use show endpoint with query parameter
  TEAM_BY_ID: "/api/teams/show?id={id}",
  TEAMS_BY_PERSON: "/api/teams?person_id={personId}",
  TEAMS_BY_EVENT: "/api/teams?event_id={eventId}",

  // Persons - only me endpoint works
  PERSON_ME: "/api/persons/me",
  PERSON_BY_ID: null, // Does not exist

  // Registrations - needs context parameter
  REGISTRATIONS_BY_EVENT: "/api/registrations?event_id={eventId}",
  REGISTRATIONS_BY_PERSON: "/api/registrations?person_id={personId}",
  REGISTRATIONS_BY_TEAM: "/api/registrations?team_id={teamId}",

  // Schedule - may not exist
  SCHEDULE_EXPORT: "/api/teams/{teamId}/schedule/export",
} as const;

/**
 * Known TopScore API quirks and workarounds
 */
export const API_QUIRKS = [
  {
    issue: "RESTful path patterns don't work",
    endpoints: ["/api/events/{id}", "/api/teams/{id}", "/api/persons/{id}"],
    workaround: "Use query parameter pattern: /api/resource?id={id}",
    severity: "high",
  },
  {
    issue: "/api/registrations requires parameters",
    endpoints: ["/api/registrations"],
    workaround: "Always pass event_id, team_id, or person_id",
    severity: "high",
  },
  {
    issue: "/api/schedule endpoint doesn't exist",
    endpoints: ["/api/schedule"],
    workaround: "Calendar sync may require different implementation",
    severity: "medium",
  },
  {
    issue: "refresh_token grant not documented in spec",
    endpoints: ["/api/oauth/server"],
    workaround: "Re-authenticate with password grant when token expires",
    severity: "low",
  },
] as const;