/**
 * TopScore API Endpoint Catalog
 *
 * Single source of truth for TopScore API endpoint metadata.
 * Compiled from:
 *   - docs/topscore_api.md (official spec, July 2026)
 *   - Actual endpoint verification testing (July 2026)
 *   - /api/help live discovery
 *
 * Verification status legend:
 *   VERIFIED       Confirmed working via live API testing or /api/help
 *   DEPRECATED     Returns 404 on pada.usetopscore.com — do NOT use
 *   SPECULATIVE    Not in official spec, not tested — may or may not exist
 *   REQUIRES_PARAMS Works only with specific query parameters
 *
 * Per-API-note: TopScore uses NON-STANDARD REST patterns.
 * Single-resource lookups use query params: /api/events?id=X NOT /api/events/{id}
 */

export type EndpointStatus = "VERIFIED" | "DEPRECATED" | "SPECULATIVE" | "REQUIRES_PARAMS";

export interface EndpointRecord {
  path: string;
  method: "GET" | "POST";
  status: EndpointStatus;
  verifiedAt?: string;
  notes?: string;
}

/** Endpoints confirmed working on pada.usetopscore.com (July 2026) */
const VERIFIED: EndpointRecord[] = [
  {
    path: "/api/me",
    method: "GET",
    status: "VERIFIED",
    verifiedAt: "2026-07-02",
    notes: "Basic Auth test — returns { person_id, api_csrf_valid }",
  },
  {
    path: "/api/oauth/server",
    method: "POST",
    status: "VERIFIED",
    verifiedAt: "2026-07-02",
    notes: "OAuth2 token generation (client_credentials + password grants)",
  },
  {
    path: "/api/help",
    method: "GET",
    status: "VERIFIED",
    verifiedAt: "2026-07-02",
    notes: "Returns full API documentation",
  },
  {
    path: "/api/persons/me",
    method: "GET",
    status: "VERIFIED",
    verifiedAt: "2026-07-02",
    notes: "Current authenticated user profile — ONLY way to fetch user data",
  },
  {
    path: "/api/events",
    method: "GET",
    status: "VERIFIED",
    verifiedAt: "2026-07-02",
    notes: "List events with pagination. Uses query params for filters.",
  },
  {
    path: "/api/events",
    method: "GET",
    status: "VERIFIED",
    verifiedAt: "2026-07-02",
    notes: "Single event by id: /api/events?id={id} (NOT /api/events/{id})",
  },
  {
    path: "/api/teams",
    method: "GET",
    status: "VERIFIED",
    verifiedAt: "2026-07-02",
    notes: "List teams — REQUIRES event_id, person_id, or id parameter",
  },
  {
    path: "/api/teams/show",
    method: "GET",
    status: "VERIFIED",
    verifiedAt: "2026-07-02",
    notes: "Single team: /api/teams/show?id={id} (NOT /api/teams/{id})",
  },
  {
    path: "/api/games",
    method: "GET",
    status: "VERIFIED",
    verifiedAt: "2026-07-02",
    notes: "Games for event: /api/games?event_id={id}",
  },
  {
    path: "/api/games/show",
    method: "GET",
    status: "VERIFIED",
    verifiedAt: "2026-07-02",
    notes: "Single game: /api/games/show?id={id}",
  },
  {
    path: "/api/games/report-score",
    method: "POST",
    status: "VERIFIED",
    verifiedAt: "2026-07-02",
    notes: "Score reporting — captains only",
  },
  {
    path: "/api/registrations",
    method: "GET",
    status: "REQUIRES_PARAMS",
    verifiedAt: "2026-07-02",
    notes: "Needs event_id, team_id, or person_id parameter — returns 400/403 without",
  },
];

/** Endpoints confirmed to return 404 on pada.usetopscore.com — DO NOT USE */
const DEPRECATED: EndpointRecord[] = [
  {
    path: "/api/events/{id}",
    method: "GET",
    status: "DEPRECATED",
    verifiedAt: "2026-07-02",
    notes: "Returns 404. Use /api/events?id={id} instead.",
  },
  {
    path: "/api/persons/{id}",
    method: "GET",
    status: "DEPRECATED",
    verifiedAt: "2026-07-02",
    notes: "Returns 404. Only /api/persons/me is available for user data.",
  },
  {
    path: "/api/teams/{id}",
    method: "GET",
    status: "DEPRECATED",
    verifiedAt: "2026-07-02",
    notes: "Returns 404. Use /api/teams/show?id={id} instead.",
  },
  {
    path: "/api/registrations/{id}",
    method: "GET",
    status: "DEPRECATED",
    verifiedAt: "2026-07-02",
    notes: "Returns 404. Registrations require context params.",
  },
  {
    path: "/api/schedule",
    method: "GET",
    status: "DEPRECATED",
    verifiedAt: "2026-07-02",
    notes: "Returns 404. Use /api/games?event_id=X for schedule data.",
  },
];

/** Endpoints not in official spec, not tested — may exist */
const SPECULATIVE: EndpointRecord[] = [
  // Family
  { path: "/api/family", method: "GET", status: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/family/invite", method: "POST", status: "SPECULATIVE", notes: "Not in official spec" },
  // Memberships
  { path: "/api/memberships", method: "GET", status: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/memberships/purchase", method: "POST", status: "SPECULATIVE", notes: "Not in official spec — requires financial access" },
  // Event sub-resources
  { path: "/api/events/{id}/attendance", method: "GET", status: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/events/{id}/attendance", method: "POST", status: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/events/{id}/bracket", method: "GET", status: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/events/{id}/standings", method: "GET", status: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/events/{id}/pools/{name}/standings", method: "GET", status: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/events/{id}/scores", method: "POST", status: "SPECULATIVE", notes: "Score reporting — app uses this endpoint. Alternative: /api/games/report-score (VERIFIED) accepts game_id instead of event_id. Use POST with is_final flag for finalizing scores." },
  { path: "/api/events/{id}/roster", method: "GET", status: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/events/{id}/roster/settings", method: "GET", status: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/events/{id}/attendance/survey", method: "GET", status: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/events/{id}/attendance/survey", method: "POST", status: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/events/{id}/waivers", method: "GET", status: "SPECULATIVE", notes: "Not in official spec" },
  // Team sub-resources
  { path: "/api/teams/{id}/practices", method: "GET", status: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/teams/{id}/practices", method: "POST", status: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/practices/{id}", method: "GET", status: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/practices/{id}", method: "POST", status: "SPECULATIVE", notes: "Not in official spec — uses _method=PUT" },
  { path: "/api/practices/{id}/attendance", method: "POST", status: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/teams/{id}/roster", method: "GET", status: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/teams/{id}/roster/{person_id}", method: "POST", status: "SPECULATIVE", notes: "Not in official spec — uses _method" },
  { path: "/api/teams/{id}/roster/invite", method: "POST", status: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/teams/{id}/roster/invitations", method: "GET", status: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/teams/{id}/roster/invitations/{id}", method: "POST", status: "SPECULATIVE", notes: "Not in official spec — uses _method=DELETE" },
  { path: "/api/teams/{id}/stats", method: "GET", status: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/teams/{id}/standings", method: "GET", status: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/teams/{id}/attendance", method: "GET", status: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/teams/{id}/schedule/export", method: "GET", status: "SPECULATIVE", notes: "Schedule export — not in official spec, needs verification with /api/help. May 404." },
  { path: "/api/teams/{id}/schedule/url", method: "GET", status: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/teams/{id}/registrations", method: "GET", status: "SPECULATIVE", notes: "Not in official spec" },
  // Registrations by context
  { path: "/api/persons/{id}/registrations", method: "GET", status: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/events/{id}/registrations", method: "GET", status: "SPECULATIVE", notes: "Not in official spec" },
  // Profiles
  { path: "/api/persons/{id}", method: "POST", status: "SPECULATIVE", notes: "Not in official spec — uses _method=PUT" },
  { path: "/api/persons/search", method: "GET", status: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/teams/search", method: "GET", status: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/registrations/{id}", method: "POST", status: "SPECULATIVE", notes: "Not in official spec — uses _method=PUT" },
  // Waivers
  { path: "/api/waivers", method: "GET", status: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/waivers/{id}/sign", method: "POST", status: "SPECULATIVE", notes: "Not in official spec" },
  // Polls
  { path: "/api/polls", method: "GET", status: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/polls", method: "POST", status: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/polls/{id}", method: "GET", status: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/polls/{id}/vote", method: "POST", status: "SPECULATIVE", notes: "Not in official spec — uses _method=PUT" },
  // Mail
  { path: "/api/mail", method: "GET", status: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/mail/send", method: "POST", status: "SPECULATIVE", notes: "Not in official spec" },
  // Notifications
  { path: "/api/notifications", method: "GET", status: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/notifications/{id}", method: "GET", status: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/notifications/{id}/read", method: "POST", status: "SPECULATIVE", notes: "Not in official spec — uses _method=PUT" },
  { path: "/api/notifications/read-all", method: "POST", status: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/notifications/{id}", method: "POST", status: "SPECULATIVE", notes: "Not in official spec — uses _method=DELETE" },
  // Misc
  { path: "/api/articles", method: "GET", status: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/articles/{slug}", method: "GET", status: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/locations", method: "GET", status: "SPECULATIVE", notes: "Not in official spec" },
  { path: "/api/roster-invitations/{id}/respond", method: "POST", status: "SPECULATIVE", notes: "Not in official spec" },
];

/** All known endpoints in priority order: VERIFIED > DEPRECATED > SPECULATIVE */
export const ENDPOINT_CATALOG: EndpointRecord[] = [...VERIFIED, ...DEPRECATED, ...SPECULATIVE];

/**
 * Normalize a concrete path (with numeric IDs) to its template form for catalog lookup.
 * e.g. "/api/events/42" -> "/api/events/{id}"
 */
function toTemplatePath(path: string): string {
  return path.replace(/\/\d+(?=\/|$)/g, "/{id}");
}

const catalogByPath = new Map<string, EndpointRecord>();
for (const rec of ENDPOINT_CATALOG) {
  const key = `${rec.method}:${rec.path}`;
  catalogByPath.set(key, rec);
}

/** Look up an endpoint record by concrete path + method */
export function getEndpointRecord(
  path: string,
  method: "GET" | "POST"
): EndpointRecord | undefined {
  const directKey = `${method}:${path}`;
  if (catalogByPath.has(directKey)) return catalogByPath.get(directKey);
  const templateKey = `${method}:${toTemplatePath(path)}`;
  return catalogByPath.get(templateKey);
}

/** Is this endpoint confirmed working? */
export function isEndpointVerified(path: string, method: "GET" | "POST"): boolean {
  return getEndpointRecord(path, method)?.status === "VERIFIED";
}

/** Is this endpoint known to return 404? */
export function isEndpointDeprecated(path: string, method: "GET" | "POST"): boolean {
  return getEndpointRecord(path, method)?.status === "DEPRECATED";
}

/** Is this endpoint not in the official spec? */
export function isEndpointSpeculative(path: string, method: "GET" | "POST"): boolean {
  return getEndpointRecord(path, method)?.status === "SPECULATIVE";
}

/** Does this endpoint require specific query params? */
export function isEndpointRequiresParams(path: string, method: "GET" | "POST"): boolean {
  return getEndpointRecord(path, method)?.status === "REQUIRES_PARAMS";
}

/** Quick summary for debugging */
export function describeEndpoint(path: string, method: "GET" | "POST"): string {
  const rec = getEndpointRecord(path, method);
  if (!rec) return "UNKNOWN — not in catalog";
  return `[${rec.status}] ${rec.notes ?? rec.path}`;
}