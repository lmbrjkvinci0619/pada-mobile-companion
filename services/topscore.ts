import { TOPSCORE_BASE_URL, CACHE_TTL } from "@/constants/config";
import { getValidAccessToken } from "./auth";
import type { User, Registration, Team, Event, Location } from "@/types";
import {
  USE_MOCK_DATA,
  MOCK_USER,
  MOCK_REGISTRATIONS,
  MOCK_TEAMS,
  MOCK_EVENTS,
} from "@/constants/mockData";

// ─── Base Request ─────────────────────────────────────────────────────────────

async function topscoreGet<T>(path: string): Promise<T> {
  if (USE_MOCK_DATA) {
    throw new Error("USE_MOCK_DATA: should not reach topscoreGet");
  }
  const token = await getValidAccessToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${TOPSCORE_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).message ?? `API error ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ─── Me / Profile ─────────────────────────────────────────────────────────────

export async function fetchCurrentUser(): Promise<User> {
  if (USE_MOCK_DATA) return MOCK_USER;

  const data = await topscoreGet<any>("/api/persons/me");
  return {
    id: String(data.id),
    firstName: data.first_name,
    lastName: data.last_name,
    email: data.email,
    avatarUrl: data.avatar_url,
    role: data.role ?? "player",
  };
}

// ─── Registrations ────────────────────────────────────────────────────────────

export async function fetchRegistrations(): Promise<Registration[]> {
  if (USE_MOCK_DATA) return MOCK_REGISTRATIONS;
  const data = await topscoreGet<any[]>("/api/registrations");
  return data.map((r) => ({
    id: String(r.id),
    type: r.type ?? "team",
    status: r.status ?? "active",
    organizationName: r.organization_name ?? r.name,
    seasonName: r.season_name,
    startDate: r.start_date,
    endDate: r.end_date,
    teamId: r.team_id ? String(r.team_id) : undefined,
    leagueId: r.league_id ? String(r.league_id) : undefined,
    eventId: r.event_id ? String(r.event_id) : undefined,
  }));
}

// ─── Teams ────────────────────────────────────────────────────────────────────

export async function fetchTeams(): Promise<Team[]> {
  if (USE_MOCK_DATA) return MOCK_TEAMS;
  const data = await topscoreGet<any[]>("/api/teams?fields=locations,roster");
  return data.map((t) => ({
    id: String(t.id),
    name: t.name,
    division: t.division,
    sport: t.sport ?? "Ultimate Frisbee",
    season: t.season,
    logoUrl: t.logo_url,
    color: t.color,
  }));
}

export async function fetchTeam(teamId: string): Promise<Team | undefined> {
  if (USE_MOCK_DATA) return MOCK_TEAMS.find((t) => t.id === teamId);
  const data = await topscoreGet<any>(`/api/teams/${teamId}?fields=roster,locations`);
  return {
    id: String(data.id),
    name: data.name,
    division: data.division,
    sport: data.sport ?? "Ultimate Frisbee",
    season: data.season,
    roster: data.roster ?? [],
  };
}

// ─── Events ──────────────────────────────────────────────────────────────────

export async function fetchEvents(teamId?: string): Promise<Event[]> {
  if (USE_MOCK_DATA) {
    return teamId ? MOCK_EVENTS.filter((e) => e.teamId === teamId) : MOCK_EVENTS;
  }
  const path = teamId
    ? `/api/events?team_id=${teamId}&fields=locations`
    : `/api/events?fields=locations`;
  const data = await topscoreGet<any[]>(path);
  return data.map((e) => ({
    id: String(e.id),
    type: e.type ?? "game",
    status: e.status ?? "scheduled",
    title: e.name ?? e.title,
    startDate: e.start_date,
    endDate: e.end_date,
    teamId: String(e.team_id),
    teamName: e.team_name ?? "",
    opponentName: e.opponent_name,
    location: e.location
      ? {
          id: String(e.location.id),
          name: e.location.name,
          address: e.location.address,
          city: e.location.city,
          state: e.location.state,
          zip: e.location.zip,
          latitude: e.location.latitude,
          longitude: e.location.longitude,
        }
      : undefined,
    notes: e.notes,
  }));
}

export async function fetchEvent(eventId: string): Promise<Event | undefined> {
  if (USE_MOCK_DATA) return MOCK_EVENTS.find((e) => e.id === eventId);
  const data = await topscoreGet<any>(`/api/events/${eventId}?fields=locations`);
  return {
    id: String(data.id),
    type: data.type ?? "game",
    status: data.status ?? "scheduled",
    title: data.name ?? data.title,
    startDate: data.start_date,
    endDate: data.end_date,
    teamId: String(data.team_id),
    teamName: data.team_name ?? "",
    opponentName: data.opponent_name,
    location: data.location,
    notes: data.notes,
    score: data.score,
  };
}
