import { fetchCurrentUser } from "./user";
import { fetchTeams, type FetchTeamsOptions } from "./teams";
import { fetchUpcomingEvents, fetchPastEvents } from "./events";
import { fetchRegistrations, type FetchRegistrationsOptions } from "./registrations";
import type { Team, Event, Registration, User } from "@/types";
import type { PaginatedResponse } from "@/types/api-response";

// ─── Parallel Fetching Helpers ──────────────────────────────────────────

export interface DashboardData {
  user: User;
  teams: Team[];
  events: Event[];
  registrations: Registration[];
  partialErrors: string[];
}

function extractResult<T>(result: PromiseSettledResult<T>): T | null {
  return result.status === "fulfilled" ? result.value : null;
}

function extractError(result: PromiseSettledResult<unknown>): string | null {
  if (result.status === "rejected") {
    return result.reason instanceof Error ? result.reason.message : String(result.reason);
  }
  return null;
}

export async function fetchDashboardData(
  signal?: AbortSignal
): Promise<DashboardData> {
  const results = await Promise.allSettled([
    fetchCurrentUser(signal),
    fetchTeams({}, signal),
    fetchUpcomingEvents(undefined, 10, signal),
    fetchPastEvents(undefined, 10, signal),
    fetchRegistrations({}, signal),
  ]);

  const [userResult, teamsResult, upcomingResult, pastResult, regResult] = results;

  const errors = [
    extractError(userResult),
    extractError(teamsResult),
    extractError(upcomingResult),
    extractError(pastResult),
    extractError(regResult),
  ].filter((e): e is string => e !== null);

  const user = extractResult(userResult);
  const teams = extractResult(teamsResult)?.data ?? [];
  const upcoming = extractResult(upcomingResult) ?? [];
  const past = extractResult(pastResult) ?? [];
  const registrations = extractResult(regResult)?.data ?? [];

  if (!user) {
    throw new Error("Failed to fetch current user (required for dashboard)");
  }

  return {
    user,
    teams,
    events: [...upcoming, ...past],
    registrations,
    partialErrors: errors,
  };
}

export interface TeamDetailData {
  team: Team;
  roster: import("@/types").TeamMember[];
  upcomingEvents: Event[];
  pastEvents: Event[];
  partialErrors: string[];
}

export async function fetchTeamDetailData(
  teamId: string,
  signal?: AbortSignal
): Promise<TeamDetailData> {
  const { fetchTeam, fetchTeamRoster } = await import("./teams");

  const results = await Promise.allSettled([
    fetchTeam(teamId, signal),
    fetchTeamRoster(teamId, signal),
    fetchUpcomingEvents(teamId, 10, signal),
    fetchPastEvents(teamId, 10, signal),
  ]);

  const [teamResult, rosterResult, upcomingResult, pastResult] = results;

  const errors = [
    extractError(teamResult),
    extractError(rosterResult),
    extractError(upcomingResult),
    extractError(pastResult),
  ].filter((e): e is string => e !== null);

  const team = extractResult(teamResult);
  const roster = extractResult(rosterResult) ?? [];
  const upcomingEvents = extractResult(upcomingResult) ?? [];
  const pastEvents = extractResult(pastResult) ?? [];

  if (!team) {
    throw new Error(`Team not found: ${teamId}`);
  }

  return {
    team,
    roster,
    upcomingEvents,
    pastEvents,
    partialErrors: errors,
  };
}

export interface EventDetailData {
  event: Event;
  attendance: import("@/types").EventAttendance | null;
  bracket: import("@/types").Bracket | null;
  partialErrors: string[];
}

export async function fetchEventDetailData(
  eventId: string,
  signal?: AbortSignal
): Promise<EventDetailData> {
  const { fetchEvent } = await import("./events");
  const { fetchEventAttendance } = await import("./events");
  const { fetchEventBracket } = await import("./events");

  const results = await Promise.allSettled([
    fetchEvent(eventId, signal),
    fetchEventAttendance(eventId, signal),
    fetchEventBracket(eventId, signal),
  ]);

  const [eventResult, attendanceResult, bracketResult] = results;

  const errors = [
    extractError(eventResult),
    extractError(attendanceResult),
    extractError(bracketResult),
  ].filter((e): e is string => e !== null);

  const event = extractResult(eventResult);
  const attendance = extractResult(attendanceResult);
  const bracket = extractResult(bracketResult);

  if (!event) {
    throw new Error(`Event not found: ${eventId}`);
  }

  return {
    event,
    attendance,
    bracket,
    partialErrors: errors,
  };
}

const TEAM_ADMIN_ROLES: import("@/types").TeamRole[] = ["captain", "coach", "assistant_coach", "admin"];
const SCORE_REPORTING_ROLES: import("@/types").TeamRole[] = ["captain"];

export function canUserCreateTeamAnnouncement(team: Team | undefined, user?: User | null): boolean {
  if (!team?.myMembership) {
    return false;
  }
  if (user?.isTrustedAdmin || user?.isLiteAdmin || user?.isCoordinator) {
    return true;
  }
  return TEAM_ADMIN_ROLES.includes(team.myMembership.role);
}

export function canUserReportTeamScores(team: Team | undefined, user?: User | null): boolean {
  if (!team?.myMembership) {
    return false;
  }
  if (user?.isScoreReporter || user?.isCoordinator || user?.isTrustedAdmin) {
    return true;
  }
  return SCORE_REPORTING_ROLES.includes(team.myMembership.role);
}

export function getUserTeamRole(team: Team | undefined): import("@/types").TeamRole | null {
  return team?.myMembership?.role ?? null;
}

export function isUserTeamAdmin(team: Team | undefined): boolean {
  if (!team?.myMembership) {
    return false;
  }
  return TEAM_ADMIN_ROLES.includes(team.myMembership.role);
}