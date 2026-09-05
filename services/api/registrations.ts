import { apiClient, buildFieldsParam, MAX_PER_PAGE } from "@/lib/apiClient";
import { ensureEndpoint } from "@/lib/endpointGuard";
import type { Registration, RegistrationStatus } from "@/types";
import type { ApiRegistration } from "@/types/api";
import { mapRegistration } from "@/lib/mappers/topscore";
import type { PaginatedResponse } from "@/types/api-response";

// ─── Registrations ────────────────────────────────────────────────────────────
// NOTE: Per endpoint verification, /api/registrations requires parameters
// (event_id, team_id, or person_id). Without params, returns 400/403.

export interface FetchRegistrationsOptions {
  page?: number;
  perPage?: number;
  eventId?: string;
  teamId?: string;
  personId?: string;
}

export async function fetchRegistrations(
  options: FetchRegistrationsOptions = {},
  signal?: AbortSignal
): Promise<PaginatedResponse<Registration>> {
  const { page = 1, perPage = 20, eventId, teamId, personId } = options;
  const safePerPage = Math.min(Math.max(1, perPage), MAX_PER_PAGE);
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(safePerPage),
  });

  // TopScore API requires at least one of these parameters for /api/registrations
  if (eventId) params.set("event_id", eventId);
  if (teamId) params.set("team_id", teamId);
  if (personId) params.set("person_id", personId);

  const { data: rawData, count } = await apiClient.getWithMeta<ApiRegistration[]>(
    `/api/registrations?${params}`,
    { signal }
  );

  const registrationsData = (Array.isArray(rawData) ? rawData : []) as ApiRegistration[];

  return {
    data: registrationsData.map(mapRegistration),
    pagination: {
      page,
      per_page: safePerPage,
      total: count ?? 0,
      total_pages: count != null && count > 0 ? Math.ceil(count / safePerPage) : 0,
    },
  };
}

export async function fetchRegistrationById(
  registrationId: string,
  signal?: AbortSignal
): Promise<Registration | null> {
  // NOTE: Per actual API testing (July 2026), /api/registrations/{id} returns 404.
  // TopScore API does not support fetching a single registration by ID directly.
  // Registrations must be fetched with context (event_id, team_id, or person_id).
  // This function will always return null because the endpoint does not exist.
  console.warn("fetchRegistrationById: /api/registrations/{id} endpoint does not exist (404). TopScore API requires event_id, team_id, or person_id to fetch registrations. Use fetchRegistrations() with proper context instead.");
  return null;
}

export async function fetchRegistrationsByPerson(
  personId: string,
  signal?: AbortSignal
): Promise<Registration[]> {
  await ensureEndpoint(`/api/persons/${personId}/registrations`, "GET");
  const { data: rawData } = await apiClient.getWithMeta<ApiRegistration[]>(
    `/api/persons/${personId}/registrations`,
    { signal }
  );
  const registrations = Array.isArray(rawData) ? rawData : [];
  return registrations.map(mapRegistration);
}

export async function fetchRegistrationsByTeam(
  teamId: string,
  signal?: AbortSignal
): Promise<Registration[]> {
  await ensureEndpoint(`/api/teams/${teamId}/registrations`, "GET");
  const { data: rawData } = await apiClient.getWithMeta<ApiRegistration[]>(
    `/api/teams/${teamId}/registrations`,
    { signal }
  );
  const registrations = Array.isArray(rawData) ? rawData : [];
  return registrations.map(mapRegistration);
}

export async function fetchRegistrationsByEvent(
  eventId: string,
  signal?: AbortSignal
): Promise<Registration[]> {
  await ensureEndpoint(`/api/events/${eventId}/registrations`, "GET");
  const { data: rawData } = await apiClient.getWithMeta<ApiRegistration[]>(
    `/api/events/${eventId}/registrations`,
    { signal }
  );
  const registrations = Array.isArray(rawData) ? rawData : [];
  return registrations.map(mapRegistration);
}

export async function updateRegistrationStatus(
  registrationId: string,
  status: RegistrationStatus,
  signal?: AbortSignal
): Promise<{ success: boolean }> {
  // NOTE: Per actual API testing (July 2026), /api/registrations/{id} returns 404.
  // TopScore API does not support direct registration status updates via API.
  // Status updates must be done through the website.
  // This function exists for API compatibility but will always fail.
  console.error("updateRegistrationStatus: /api/registrations/{id} endpoint does not exist (404). TopScore API does not support registration status updates via API. Please update registration status through the website.");
  throw new Error("Registration status updates are not supported via API. Please update your registration at pada.org.");
}