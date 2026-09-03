/**
 * TopScore API Endpoint Verification Status
 *
 * Thin wrapper around lib/endpointCatalog.ts — this file exists for
 * backward compatibility with existing import sites.
 * New code should import from lib/endpointCatalog.ts directly.
 *
 * Verification was performed via endpoint testing on July 2, 2026.
 * See endpoint-verification-results.json for full test results.
 */

export type EndpointStatus = "VERIFIED" | "SPECULATIVE" | "BROKEN" | "REQUIRES_PARAMS";

export interface EndpointInfo {
  path: string;
  method: "GET" | "POST";
  status: EndpointStatus;
  notes?: string;
  verifiedAt?: string;
}

import {
  ENDPOINT_CATALOG,
  getEndpointRecord,
  isEndpointVerified,
  isEndpointDeprecated,
  describeEndpoint,
  type EndpointRecord,
} from "./endpointCatalog";

/** Re-export for backward compat */
export {
  ENDPOINT_CATALOG,
  getEndpointRecord,
  isEndpointVerified,
  isEndpointDeprecated,
  describeEndpoint,
};

export function getEndpointInfo(path: string, method: "GET" | "POST" = "GET"): EndpointInfo | undefined {
  const rec = getEndpointRecord(path, method);
  if (!rec) return undefined;
  return {
    path: rec.path,
    method: rec.method,
    status: rec.status as EndpointStatus,
    notes: rec.notes,
    verifiedAt: rec.verifiedAt,
  };
}

export function isEndpointBroken(path: string, method: "GET" | "POST" = "GET"): boolean {
  return isEndpointDeprecated(path, method);
}

export const VERIFIED_ENDPOINTS: Record<string, EndpointInfo> = {};
export const BROKEN_OR_PROBLEMATIC_ENDPOINTS: Record<string, EndpointInfo> = {};

for (const rec of ENDPOINT_CATALOG) {
  const key = `${rec.method}:${rec.path}`;
  const info: EndpointInfo = {
    path: rec.path,
    method: rec.method,
    status: rec.status as EndpointStatus,
    notes: rec.notes,
    verifiedAt: rec.verifiedAt,
  };
  if (rec.status === "VERIFIED" || rec.status === "REQUIRES_PARAMS") {
    VERIFIED_ENDPOINTS[key] = info;
  } else {
    BROKEN_OR_PROBLEMATIC_ENDPOINTS[key] = info;
  }
}

export const ENDPOINT_PATTERNS = {
  EVENT_BY_ID: "/api/events?id={id}",
  EVENTS_BY_TEAM: "/api/events?team_id={teamId}",
  TEAM_BY_ID: "/api/teams/show?id={id}",
  TEAMS_BY_PERSON: "/api/teams?person_id={personId}",
  TEAMS_BY_EVENT: "/api/teams?event_id={eventId}",
  PERSON_ME: "/api/persons/me",
  PERSON_BY_ID: null,
  REGISTRATIONS_BY_EVENT: "/api/registrations?event_id={eventId}",
  REGISTRATIONS_BY_PERSON: "/api/registrations?person_id={personId}",
  REGISTRATIONS_BY_TEAM: "/api/registrations?team_id={teamId}",
  SCHEDULE_EXPORT: "/api/teams/{teamId}/schedule/export",
} as const;

export const API_QUIRKS = [
  {
    issue: "RESTful path patterns don't work on pada.usetopscore.com",
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
    workaround: "Use /api/games?event_id=X for schedule",
    severity: "medium",
  },
  {
    issue: "refresh_token grant not documented in spec",
    endpoints: ["/api/oauth/server"],
    workaround: "Re-authenticate with password grant when token expires",
    severity: "low",
  },
] as const;