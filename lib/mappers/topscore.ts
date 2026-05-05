import type { User, Registration, Team, Event, Location } from "@/types";
import type { ApiPerson, ApiRegistration, ApiTeam, ApiEvent } from "@/types/api";

export function mapPerson(data: ApiPerson): User {
  return {
    id: String(data.id),
    firstName: data.first_name,
    lastName: data.last_name,
    email: data.email,
    avatarUrl: data.avatar_url,
    role: (data.role ?? "player") as User["role"],
  };
}

export function mapRegistration(data: ApiRegistration): Registration {
  return {
    id: String(data.id),
    type: (data.type ?? "team") as Registration["type"],
    status: (data.status ?? "active") as Registration["status"],
    organizationName: data.organization_name ?? data.name ?? "",
    seasonName: data.season_name,
    startDate: data.start_date ?? "",
    endDate: data.end_date,
    teamId: data.team_id ? String(data.team_id) : undefined,
    leagueId: data.league_id ? String(data.league_id) : undefined,
    eventId: data.event_id ? String(data.event_id) : undefined,
  };
}

export function mapLocation(data: ApiEvent["location"]): Location | undefined {
  if (!data) return undefined;
  return {
    id: String(data.id ?? ""),
    name: data.name ?? "",
    address: data.address ?? "",
    city: data.city ?? "",
    state: data.state,
    zip: data.zip,
    latitude: data.latitude,
    longitude: data.longitude,
  };
}

export function mapEvent(data: ApiEvent): Event {
  return {
    id: String(data.id),
    type: (data.type ?? "game") as Event["type"],
    status: (data.status ?? "scheduled") as Event["status"],
    title: data.name ?? data.title ?? "",
    startDate: data.start_date ?? "",
    endDate: data.end_date,
    teamId: String(data.team_id ?? ""),
    teamName: data.team_name ?? "",
    opponentName: data.opponent_name,
    location: mapLocation(data.location),
    notes: data.notes,
    score: data.score
      ? {
          homeTeamName: data.score.home_team_name ?? data.team_name ?? "Home",
          awayTeamName: data.score.away_team_name ?? data.opponent_name ?? "Away",
          homeScore: data.score.home_score ?? 0,
          awayScore: data.score.away_score ?? 0,
          reportedAt: data.score.reported_at,
          reportedBy: data.score.reported_by,
        }
      : undefined,
  };
}

export function mapRoster(roster: ApiTeam["roster"]): Team["roster"] {
  if (!roster) return [];
  return roster.map((m) => {
    const person = m.person ?? (m as unknown as ApiPerson);
    return {
      id: String(m.id ?? person.id),
      personId: String(person.id),
      firstName: person.first_name,
      lastName: person.last_name,
      jerseyNumber: m.jersey_number,
      position: m.position,
      role: (m.role ?? "player") as "player" | "captain" | "coach",
      avatarUrl: person.avatar_url,
      email: person.email,
      phone: undefined,
    };
  });
}

export function mapTeam(data: ApiTeam): Team {
  return {
    id: String(data.id),
    name: data.name,
    division: data.division,
    sport: data.sport ?? "Ultimate Frisbee",
    season: data.season,
    logoUrl: data.logo_url,
    color: data.color,
    wins: data.record?.wins,
    losses: data.record?.losses,
    ties: data.record?.ties,
    roster: mapRoster(data.roster),
  };
}