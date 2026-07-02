/**
 * TopScore API Response Types
 * 
 * These types represent the raw API responses from TopScore before mapping to internal types.
 * Per TopScore API spec v1.0 (docs/topscore_api.md), all API responses follow this format:
 * {
 *   status: number,     // HTTP status code
 *   count: number,      // Total matching records (for pagination)
 *   result: T | T[],    // The data payload
 *   errors: []          // Always empty on success
 * }
 */

import type {
  ApiPerson,
  ApiRegistration,
  ApiTeam,
  ApiEvent,
  ApiArticle,
  ApiSchedule,
  ApiStandings,
  ApiAttendance,
  ApiPractice,
  ApiWaiver,
  ApiFamily,
  ApiMembership,
  ApiNotification,
  ApiPoll,
  ApiMailMessage,
  ApiEventBracket,
  ApiLocation,
  ApiRosterInvitation,
  ApiTeamStats,
  ApiEventRosterSettings,
  ApiAttendanceSurvey,
} from "./api";

/**
 * Base response wrapper for all TopScore API responses
 */
export interface TopScoreResponse<T> {
  status: number;
  count: number;
  result: T;
  errors: TopScoreError[];
}

/**
 * TopScore error object
 */
export interface TopScoreError {
  message: string;
  field: string | null;
  data: Record<string, unknown> | null;
}

/**
 * Paginated response with metadata
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

/**
 * Single object response (e.g., /api/persons/me, /api/events/{id})
 */
export type SingleObjectResponse<T> = 
  | { status: 200; count: 1; result: T; errors: [] }
  | { status: number; count?: number; result?: never; errors: TopScoreError[] };

/**
 * Array response (e.g., /api/events, /api/teams)
 */
export type ArrayResponse<T> = 
  | { status: 200; count: number; result: T[]; errors: [] }
  | { status: number; count?: number; result?: never; errors: TopScoreError[] };

/**
 * Verified endpoints from TopScore API spec v1.0 and ACTUAL TESTING (July 2026):
 *
 * CONFIRMED WORKING (via actual API testing):
 * - GET  /api/me                          - Auth test (returns { person_id, api_csrf_valid })
 * - GET  /api/persons/me                  - Current user profile
 * - GET  /api/events                      - List events (with pagination)
 * - GET  /api/events?id={id}              - Event details (uses query param, NOT path param!)
 * - GET  /api/teams?event_id=X            - Teams for event
 * - GET  /api/teams?person_id=X          - Teams for person
 * - GET  /api/teams/show?id={id}         - Team details (uses /teams/show?id= pattern!)
 * - GET  /api/games?event_id=X           - Games/schedule for event
 * - POST /api/oauth/server                - OAuth token generation
 *
 * CONFIRMED BROKEN (returns 404 - DO NOT USE):
 * - GET  /api/events/{id}                - DOES NOT EXIST, use ?id= query parameter
 * - GET  /api/persons/{id}                - DOES NOT EXIST, only /api/persons/me works
 * - GET  /api/teams/{id}                 - DOES NOT EXIST, use /api/teams/show?id=
 * - GET  /api/schedule                   - DOES NOT EXIST
 *
 * REQUIRES AUTHENTICATION (returns 403/400 without auth or params):
 * - GET  /api/registrations             - Requires event_id, team_id, or person_id param
 *
 * SPECULATIVE (NOT YET TESTED - verify with /api/help?endpoint=X):
 * - GET  /api/teams/{id}/schedule/export - Schedule export for team
 * - GET  /api/events/{id}/standings       - Event standings
 * - GET  /api/teams/{id}/standings        - Team standings
 * - POST /api/events/{id}/scores          - Score reporting (captains only)
 * - All family, membership, waiver, poll, mail, notification endpoints
 */

// ─── API Response Type Guards ─────────────────────────────────────────────────

/**
 * Type guard to check if response is a successful single-object response
 */
export function isSingleObjectResponse<T>(response: unknown): response is { status: 200; count: 1; result: T; errors: [] } {
  if (!response || typeof response !== "object") return false;
  const r = response as Record<string, unknown>;
  return r.status === 200 && r.count === 1 && "result" in r && !Array.isArray(r.result) && Array.isArray(r.errors) && r.errors.length === 0;
}

/**
 * Type guard to check if response is a successful array response
 */
export function isArrayResponse<T>(response: unknown): response is { status: 200; count: number; result: T[]; errors: [] } {
  if (!response || typeof response !== "object") return false;
  const r = response as Record<string, unknown>;
  return r.status === 200 && "result" in r && Array.isArray(r.result) && Array.isArray(r.errors) && r.errors.length === 0;
}

/**
 * Type guard to check if response has an error
 */
export function isErrorResponse(response: unknown): response is { status: number; count?: number; result?: never; errors: TopScoreError[] } {
  if (!response || typeof response !== "object") return false;
  const r = response as Record<string, unknown>;
  return Array.isArray(r.errors) && r.errors.length > 0;
}

/**
 * Extract result from API response, handling both single-object and array responses
 */
export function extractResult<T>(response: unknown): T {
  if (isSingleObjectResponse<T>(response)) {
    return response.result;
  }
  if (isArrayResponse<T>(response)) {
    return response.result as T;
  }
  if (isErrorResponse(response)) {
    throw new Error(response.errors[0]?.message ?? "API error");
  }
  if (response && typeof response === "object") {
    const r = response as Record<string, unknown>;
    if ("result" in r) {
      return r.result as T;
    }
  }
  throw new Error("Invalid API response format");
}

// ─── API-specific response extractors ────────────────────────────────────────

export interface ApiMeResponse {
  person_id: number;
  api_csrf_valid: boolean;
}

export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

export interface OAuthErrorResponse {
  error: string;
  error_description: string;
}