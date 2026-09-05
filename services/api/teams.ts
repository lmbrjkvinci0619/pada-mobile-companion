import { apiClient, buildFieldsParam, MAX_PER_PAGE } from "@/lib/apiClient";
import { ensureEndpoint } from "@/lib/endpointGuard";
import type { Team, TeamMember, TeamRole } from "@/types";
import type { ApiTeam } from "@/types/api";
import { mapTeam, mapRoster, mapRosterMember, mapLocation, mapStandingEntry } from "@/lib/mappers/topscore";
import type { PaginatedResponse } from "@/types/api-response";

// ─── Teams ────────────────────────────────────────────────────────────────────
// CONFIRMED WORKING ENDPOINTS:
// - GET  /api/teams                      - List teams (paginated)
// - GET  /api/teams/show?id={id}         - Team details (uses /teams/show endpoint!)
// - GET  /api/teams?event_id=X           - Teams for event
// - GET  /api/teams?person_id=X          - Teams for person
// CONFIRMED BROKEN:
// - GET  /api/teams/{id}                 - Use /api/teams/show?id={id}

export interface FetchTeamsOptions {
  page?: number;
  perPage?: number;
  organizationId?: number;
}

export async function fetchTeams(
  options: FetchTeamsOptions = {},
  signal?: AbortSignal
): Promise<PaginatedResponse<Team>> {
  const { page = 1, perPage = 20, organizationId } = options;
  const safePerPage = Math.min(Math.max(1, perPage), MAX_PER_PAGE);
  const fieldsPart = buildFieldsParam(["locations", "roster", "record", "my_membership"]);
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(safePerPage),
  });
  if (organizationId) {
    params.set("organization_id", String(organizationId));
  }

  const { data: rawData, count } = await apiClient.getWithMeta<ApiTeam[]>(
    `/api/teams?${params}&${fieldsPart}`,
    { signal }
  );

  const teamsData = (Array.isArray(rawData) ? rawData : []) as ApiTeam[];

  return {
    data: teamsData.map(mapTeam),
    pagination: {
      page,
      per_page: safePerPage,
      total: count ?? 0,
      total_pages: count != null && count > 0 ? Math.ceil(count / safePerPage) : 0,
    },
  };
}

export async function fetchTeam(teamId: string, signal?: AbortSignal): Promise<Team | undefined> {
  try {
    const fieldsPart = buildFieldsParam(["roster", "locations", "record", "my_membership"]);
    const data = await apiClient.get<ApiTeam>(
      `/api/teams/show?id=${teamId}&${fieldsPart}`,
      { signal }
    );
    return mapTeam(data);
  } catch {
    return undefined;
  }
}

export async function fetchTeamRoster(
  teamId: string,
  signal?: AbortSignal
): Promise<TeamMember[]> {
  const fieldsPart = buildFieldsParam("roster");
  const data = await apiClient.get<ApiTeam>(
    `/api/teams/show?id=${teamId}&${fieldsPart}`,
    { signal }
  );
  return mapRoster(data.roster);
}

export async function fetchStandingRoster(
  teamId: string,
  signal?: AbortSignal
): Promise<TeamMember[]> {
  const fieldsPart = buildFieldsParam("standing_roster");
  const { data } = await apiClient.getWithMeta<ApiTeam>(
    `/api/teams/show?id=${teamId}&${fieldsPart}`,
    { signal }
  );
  return mapTeam(data).standingRoster ?? [];
}

export async function fetchActiveRoster(
  teamId: string,
  signal?: AbortSignal
): Promise<TeamMember[]> {
  const fieldsPart = buildFieldsParam("active_roster");
  const { data } = await apiClient.getWithMeta<ApiTeam>(
    `/api/teams/show?id=${teamId}&${fieldsPart}`,
    { signal }
  );
  return mapTeam(data).activeRoster ?? [];
}

export async function updateTeamMemberRole(
  teamId: string,
  personId: string,
  role: string,
  signal?: AbortSignal
): Promise<{ success: boolean }> {
  await ensureEndpoint(`/api/teams/${teamId}/roster/${personId}`, "POST");
  return apiClient.post<{ success: boolean }>(
    `/api/teams/${teamId}/roster/${personId}`,
    { role, _method: "PUT" },
    { signal }
  );
}

export async function removeTeamMember(
  teamId: string,
  personId: string,
  signal?: AbortSignal
): Promise<{ success: boolean }> {
  await ensureEndpoint(`/api/teams/${teamId}/roster/${personId}`, "POST");
  return apiClient.delete<{ success: boolean }>(
    `/api/teams/${teamId}/roster/${personId}`,
    { signal }
  );
}

export async function inviteRosterMember(
  teamId: string,
  email: string,
  role: TeamRole,
  signal?: AbortSignal
): Promise<{ success: boolean; invitation_id?: string }> {
  await ensureEndpoint(`/api/teams/${teamId}/roster/invite`, "POST");
  return apiClient.post<{ success: boolean; invitation_id?: string }>(
    `/api/teams/${teamId}/roster/invite`,
    { person_email: email, role },
    { signal }
  );
}

export async function respondToRosterInvitation(
  invitationId: string,
  response: "accepted" | "declined",
  signal?: AbortSignal
): Promise<{ success: boolean }> {
  await ensureEndpoint(`/api/roster-invitations/${invitationId}/respond`, "POST");
  return apiClient.post<{ success: boolean }>(
    `/api/roster-invitations/${invitationId}/respond`,
    { response },
    { signal }
  );
}

export async function fetchRosterInvitations(
  teamId: string,
  signal?: AbortSignal
): Promise<import("@/types/api").ApiRosterInvitation[]> {
  await ensureEndpoint(`/api/teams/${teamId}/roster/invitations`, "GET");
  return apiClient.get<import("@/types/api").ApiRosterInvitation[]>(
    `/api/teams/${teamId}/roster/invitations`,
    { signal }
  );
}

export async function cancelRosterInvitation(
  teamId: string,
  invitationId: string,
  signal?: AbortSignal
): Promise<{ success: boolean }> {
  await ensureEndpoint(`/api/teams/${teamId}/roster/invitations/${invitationId}`, "POST");
  return apiClient.post<{ success: boolean }>(
    `/api/teams/${teamId}/roster/invitations/${invitationId}`,
    { _method: "DELETE" },
    { signal }
  );
}

export async function fetchTeamStats(
  teamId: string,
  signal?: AbortSignal
): Promise<import("@/types").TeamStats | null> {
  try {
    await ensureEndpoint(`/api/teams/${teamId}/stats`, "GET");
    const data = await apiClient.get<import("@/types/api").ApiTeamStats>(
      `/api/teams/${teamId}/stats`,
      { signal }
    );
    return {
      teamId: String(data.team_id),
      eventsPlayed: data.events_played,
      totalWins: data.total_wins,
      totalLosses: data.total_losses,
      totalTies: data.total_ties,
      pointsFor: data.points_for,
      pointsAgainst: data.points_against,
      pointDifferential: data.point_differential,
      trueskillRating: data.trueskill_rating,
      trueskillDeviation: data.trueskill_deviation,
    };
  } catch {
    return null;
  }
}

export async function fetchTeamStandings(
  teamId: string,
  signal?: AbortSignal
): Promise<import("@/types").TeamStanding[]> {
  await ensureEndpoint(`/api/teams/${teamId}/standings`, "GET");
  const data = await apiClient.get<import("@/types/api").ApiStandings>(
    `/api/teams/${teamId}/standings`,
    { signal }
  );
  return data.standings?.map(mapStandingEntry) ?? [];
}

// Re-export for mappers
export { mapStandingEntry } from "@/lib/mappers/topscore";