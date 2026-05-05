import { apiClient, isMockEnabled } from "@/lib/apiClient";
import type { User, Registration, Team, Event } from "@/types";
import type { ApiPerson, ApiRegistration, ApiTeam, ApiEvent } from "@/types/api";
import {
  USE_MOCK_DATA,
  MOCK_USER,
  MOCK_REGISTRATIONS,
  MOCK_TEAMS,
  MOCK_EVENTS,
} from "@/constants/mockData";
import {
  mapPerson,
  mapRegistration,
  mapEvent,
  mapTeam,
} from "@/lib/mappers/topscore";

export async function fetchCurrentUser(signal?: AbortSignal): Promise<User> {
  if (USE_MOCK_DATA) return MOCK_USER;

  const data = await apiClient.get<ApiPerson>("/api/persons/me", { signal });
  return mapPerson(data);
}

export async function fetchRegistrations(signal?: AbortSignal): Promise<Registration[]> {
  if (USE_MOCK_DATA) return MOCK_REGISTRATIONS;

  const data = await apiClient.get<ApiRegistration[]>("/api/registrations", { signal });
  return data.map(mapRegistration);
}

export async function fetchTeams(signal?: AbortSignal): Promise<Team[]> {
  if (USE_MOCK_DATA) return MOCK_TEAMS;

  const data = await apiClient.get<ApiTeam[]>(
    "/api/teams?fields=locations,roster,record",
    { signal }
  );
  return data.map(mapTeam);
}

export async function fetchTeam(teamId: string, signal?: AbortSignal): Promise<Team | undefined> {
  if (USE_MOCK_DATA) return MOCK_TEAMS.find((t) => t.id === teamId);

  const data = await apiClient.get<ApiTeam>(
    `/api/teams/${teamId}?fields=roster,locations,record`,
    { signal }
  );
  return mapTeam(data);
}

export async function fetchEvents(teamId?: string, signal?: AbortSignal): Promise<Event[]> {
  if (USE_MOCK_DATA) {
    return teamId
      ? MOCK_EVENTS.filter((e) => e.teamId === teamId)
      : MOCK_EVENTS;
  }

  const path = teamId
    ? `/api/events?team_id=${teamId}&fields=locations,scores`
    : `/api/events?fields=locations,scores`;

  const data = await apiClient.get<ApiEvent[]>(path, { signal });
  return data.map(mapEvent);
}

export async function fetchEvent(eventId: string, signal?: AbortSignal): Promise<Event | undefined> {
  if (USE_MOCK_DATA) return MOCK_EVENTS.find((e) => e.id === eventId);

  const data = await apiClient.get<ApiEvent>(
    `/api/events/${eventId}?fields=locations,scores`,
    { signal }
  );
  return mapEvent(data);
}