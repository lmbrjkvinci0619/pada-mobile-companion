import { apiClient } from "@/lib/apiClient";
import type { User, Team } from "@/types";
import type { ApiPerson, ApiTeam } from "@/types/api";
import { mapPerson, mapTeam } from "@/lib/mappers/topscore";

// ─── Search ─────────────────────────────────────────────────────────────────

export async function searchPeople(
  query: string,
  limit: number = 20,
  signal?: AbortSignal
): Promise<User[]> {
  const data = await apiClient.get<ApiPerson[]>(
    `/api/persons/search?q=${encodeURIComponent(query)}&limit=${limit}`,
    { signal }
  );
  if (!Array.isArray(data)) {
    console.warn("searchPeople: Expected array response, got:", typeof data);
    return [];
  }
  return data.map(mapPerson);
}

export async function searchTeams(
  query: string,
  limit: number = 20,
  signal?: AbortSignal
): Promise<Team[]> {
  const data = await apiClient.get<ApiTeam[]>(
    `/api/teams/search?q=${encodeURIComponent(query)}&limit=${limit}`,
    { signal }
  );
  if (!Array.isArray(data)) {
    console.warn("searchTeams: Expected array response, got:", typeof data);
    return [];
  }
  return data.map(mapTeam);
}