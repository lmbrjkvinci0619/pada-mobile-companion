import { apiClient, buildFieldsParam, MAX_PER_PAGE } from "@/lib/apiClient";
import { ensureEndpoint } from "@/lib/endpointGuard";
import type {
  User,
  Registration,
  Team,
  TeamMember,
  TeamRole,
  Event,
  Article,
  TeamStanding,
  EventStandings,
  EventAttendance,
  ScheduleExport,
  Practice,
  Waiver,
  Family,
  Membership,
  AppNotification,
  Poll,
  MailMessage,
  Bracket,
} from "@/types";
import type {
  ApiPerson,
  ApiRegistration,
  ApiTeam,
  ApiEvent,
  ApiGame,
  ApiArticle,
  ApiSchedule,
  ApiStandings,
  ApiPoolStandings,
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
} from "@/types/api";
import {
  mapPerson,
  mapRegistration,
  mapTeam,
  mapEvent,
  mapGame,
  mapArticle,
  mapScheduleExport,
  mapStandings,
  mapStandingEntry,
  mapEventAttendance,
  mapPractice,
  mapWaiver,
  mapFamily,
  mapMembership,
  mapNotification,
  mapPoll,
  mapMailMessage,
  mapBracket,
  mapRosterMember,
  mapRoster,
  mapLocation,
} from "@/lib/mappers/topscore";

// ─── User / Profile ──────────────────────────────────────────────────────────
// All TopScore endpoints in this module MUST be validated against /api/help
// before being used in production.
//
// IMPORTANT: TopScore API uses NON-STANDARD REST patterns.
//   - Single resource endpoints use query params: /api/events?id=X NOT /api/events/{id}
//   - Team detail uses: /api/teams/show?id=X NOT /api/teams/{id}
//
// CONFIRMED WORKING ENDPOINTS (verified via actual API testing July 2026):
// - GET  /api/persons/me                  - Current user profile
// - GET  /api/events                      - List events (paginated)
// - GET  /api/events?id={id}             - Event details (uses query param!)
// - GET  /api/teams?event_id=X           - Teams for event
// - GET  /api/teams?person_id=X          - Teams for person
// - GET  /api/teams/show?id={id}         - Team details (uses /teams/show endpoint!)
// - GET  /api/games?event_id=X           - Games/schedule for event
// - GET  /api/registrations              - With event_id/team_id/person_id param
// - POST /api/events/{id}/scores         - Score reporting (captains only)
//
// CONFIRMED BROKEN (DO NOT USE - return 404):
// - GET  /api/events/{id}                - Use /api/events?id={id}
// - GET  /api/persons/{id}              - Does not exist, only /api/persons/me works
// - GET  /api/teams/{id}                 - Use /api/teams/show?id={id}
// - GET  /api/schedule                   - Use /api/games?event_id=X
//
// SPECULATIVE ENDPOINTS (NOT verified - may return 404, verify with /api/help):
// - Family: /api/family, /api/family/invite, /api/family/{id}
// - Memberships: /api/memberships, /api/memberships/purchase
// - Event attendance: /api/events/{id}/attendance
// - Score management: /api/events/{id}/scores (PUT)
// - Brackets: /api/events/{id}/bracket
// - Standings: /api/events/{id}/standings, /api/events/{id}/pools/{name}/standings
// - Waivers: /api/waivers, /api/waivers/{id}, /api/waivers/{id}/sign, /api/events/{id}/waivers
// - Polls: /api/polls, /api/polls/{id}, /api/polls/{id}/vote, POST /api/polls
// - Mail: /api/mail, /api/mail/send
// - Notifications: /api/notifications, /api/notifications/{id}, /api/notifications/{id}/read
// - Practices: /api/teams/{id}/practices, /api/practices/{id}
// - Roster: /api/teams/{id}/roster, /api/teams/{id}/roster/{person_id}
// - Team stats: /api/teams/{id}/stats
// - Articles: /api/articles, /api/articles/{slug}
// - Locations: /api/locations
// - Search: /api/persons/search, /api/teams/search
// - Registration update: /api/registrations/{id} with _method: "PUT"
//
// NOTE: PadaHub is primarily read-only except for score reporting by captains.
//
// API Note: TopScore API only supports GET and POST methods. All modifications
// use POST with _method override (e.g., _method: "PUT"). The apiClient handles
// this automatically. POST requests also require api_csrf signature when using
// Basic Auth (handled automatically by apiClient).

export async function fetchCurrentUser(signal?: AbortSignal): Promise<User> {
  const rawData = await apiClient.getRaw<{ result?: ApiPerson | ApiPerson[]; status?: number }>("/api/persons/me", { signal });
  const result = rawData?.result;
  if (!result) {
    throw new Error("Invalid response from /api/persons/me: expected person object");
  }
  const person = Array.isArray(result) ? result[0] : result;
  if (!person || typeof person !== "object") {
    throw new Error("Invalid person data from /api/persons/me");
  }
  return mapPerson(person);
}

export async function fetchUserById(personId: string, signal?: AbortSignal): Promise<User | null> {
  // NOTE: Per actual API testing (July 2026), /api/persons/{id} returns 404.
  // The TopScore API only allows fetching the current user via /api/persons/me.
  // There is NO endpoint to fetch arbitrary user profiles by ID.
  //
  // ALTERNATIVES:
  // 1. Use searchPeople(query) to find users by name/email
  // 2. Use /api/teams/show?id=X to get roster with person details
  // 3. Use /api/events/{id}/roster to get event roster members
  //
  // This function is kept for compatibility but will always return null.
  console.warn("fetchUserById: /api/persons/{id} endpoint does not exist (404). Per API testing July 2026, only /api/persons/me is available for user data. Use searchPeople() or roster endpoints instead.");
  return null;
}

export async function updateProfile(
  personId: string,
  updates: Partial<{
    first_name: string;
    last_name: string;
    phone_number: string;
    avatar_url: string;
    about: string;
    emergency_contact: string;
    address: string;
    city: string;
    state: string;
    zip: string;
  }>,
  signal?: AbortSignal
): Promise<User> {
  // NOTE: Per actual API testing (July 2026), /api/persons/{id} returns 404.
  // TopScore API does NOT support direct profile updates via API.
  // Profile updates must be done through the website at pada.org.
  // This function exists for API compatibility but will always fail.
  console.error("updateProfile: /api/persons/{id} endpoint does not exist (404). TopScore API does not support profile updates via API. Please update profile through the website.");
  throw new Error("Profile updates are not supported via API. Please update your profile at pada.org.");
}

// ─── Family ──────────────────────────────────────────────────────────────────

export async function fetchFamily(signal?: AbortSignal): Promise<Family | null> {
  try {
    await ensureEndpoint("/api/family", "GET");
    const data = await apiClient.get<ApiFamily>("/api/family", { signal });
    return mapFamily(data);
  } catch (e) {
    console.warn("fetchFamily failed:", e);
    return null;
  }
}

export async function addFamilyMember(
  email: string,
  relationship: string,
  signal?: AbortSignal
): Promise<{ success: boolean; message: string }> {
  await ensureEndpoint("/api/family/invite", "POST");
  const data = await apiClient.post<{ success: boolean; message: string }>(
    "/api/family/invite",
    { email, relationship },
    { signal }
  );
  return data;
}

export async function removeFamilyMember(
  personId: string,
  signal?: AbortSignal
): Promise<{ success: boolean }> {
  await ensureEndpoint(`/api/family/${personId}`, "POST");
  return apiClient.post<{ success: boolean }>(`/api/family/${personId}`, { _method: "DELETE" }, { signal });
}

// ─── Memberships ─────────────────────────────────────────────────────────────

export async function fetchMemberships(signal?: AbortSignal): Promise<Membership[]> {
  await ensureEndpoint("/api/memberships", "GET");
  const data = await apiClient.get<ApiMembership[]>("/api/memberships", { signal });
  return data.map(mapMembership);
}

export async function purchaseMembership(
  membershipType: string,
  paymentToken: string,
  signal?: AbortSignal
): Promise<{ success: boolean; membership_id?: string; error?: string }> {
  await ensureEndpoint("/api/memberships/purchase", "POST");
  return apiClient.post<{ success: boolean; membership_id?: string; error?: string }>(
    "/api/memberships/purchase",
    { type: membershipType, payment_token: paymentToken },
    { signal }
  );
}

// ─── Registrations ────────────────────────────────────────────────────────────
// NOTE: Per endpoint verification, /api/registrations requires parameters
// (event_id, team_id, or person_id). Without params, returns 400/403.
// The app should provide context when fetching registrations.

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

// ─── Teams ────────────────────────────────────────────────────────────────────

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
    // NOTE: Per actual API testing, /api/teams/{id} does NOT exist (404).
    // Correct pattern is /api/teams/show?id={id} using query parameter.
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
  // NOTE: Per actual API testing, /api/teams/{id} does NOT exist (404).
  // Correct pattern is /api/teams/show?id={id}.
  const fieldsPart = buildFieldsParam("roster");
  const data = await apiClient.get<ApiTeam>(
    `/api/teams/show?id=${teamId}&${fieldsPart}`,
    { signal }
  );
  return mapRoster(data.roster);
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

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

// ─── Events / Schedule ────────────────────────────────────────────────────────

export interface FetchEventsOptions {
  teamId?: string;
  page?: number;
  perPage?: number;
}

export async function fetchEvents(
  options: FetchEventsOptions = {},
  signal?: AbortSignal
): Promise<PaginatedResponse<Event>> {
  const { teamId, page = 1, perPage = 20 } = options;
  const safePerPage = Math.min(Math.max(1, perPage), MAX_PER_PAGE);
  const fieldsPart = buildFieldsParam(["locations", "scores"]);
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(safePerPage),
  });
  if (teamId) params.set("team_id", teamId);

  const { data: rawData, count } = await apiClient.getWithMeta<ApiEvent[]>(
    `/api/events?${params}&${fieldsPart}`,
    { signal }
  );

  const eventsData = (Array.isArray(rawData) ? rawData : []) as ApiEvent[];

  return {
    data: eventsData.map(mapEvent),
    pagination: {
      page,
      per_page: safePerPage,
      total: count ?? 0,
      total_pages: count != null && count > 0 ? Math.ceil(count / safePerPage) : 0,
    },
  };
}

export async function fetchEvent(eventId: string, signal?: AbortSignal): Promise<Event | undefined> {
  try {
    // NOTE: Per actual API testing, /api/events/{id} does NOT exist (404).
    // Correct pattern is /api/events?id={id} using query parameter.
    const fieldsPart = buildFieldsParam(["locations", "scores"]);
    const data = await apiClient.get<ApiEvent>(
      `/api/events?id=${eventId}&${fieldsPart}`,
      { signal }
    );
    return mapEvent(data);
  } catch {
    return undefined;
  }
}

export async function fetchUpcomingEvents(
  teamId?: string,
  limit: number = 10,
  signal?: AbortSignal
): Promise<Event[]> {
  const fieldsPart = buildFieldsParam(["locations", "scores"]);
  const perPageVal = String(Math.min(Math.max(limit * 4, 50), 100));
  let path: string;
  if (teamId) {
    const params = new URLSearchParams({
      team_id: teamId,
      page: "1",
      per_page: perPageVal,
    });
    path = `/api/events?${params}&${fieldsPart}`;
  } else {
    const params = new URLSearchParams({
      page: "1",
      per_page: perPageVal,
    });
    path = `/api/events?${params}&${fieldsPart}`;
  }

  const data = await apiClient.get<ApiEvent[]>(path, { signal });
  const nowIso = new Date().toISOString();
  return data
    .filter((e) => {
      if (!e.start_date) return false;
      return e.start_date >= nowIso &&
        (e.status === undefined || e.status === "scheduled" || e.status === "in_progress");
    })
    .map(mapEvent)
    .sort((a, b) => (a.startDate ?? "").localeCompare(b.startDate ?? ""))
    .slice(0, limit);
}

export async function fetchPastEvents(
  teamId?: string,
  limit: number = 10,
  signal?: AbortSignal
): Promise<Event[]> {
  const fieldsPart = buildFieldsParam(["locations", "scores"]);
  const perPageVal = String(Math.min(Math.max(limit * 4, 50), 100));
  let path: string;
  if (teamId) {
    const params = new URLSearchParams({
      team_id: teamId,
      page: "1",
      per_page: perPageVal,
    });
    path = `/api/events?${params}&${fieldsPart}`;
  } else {
    const params = new URLSearchParams({
      page: "1",
      per_page: perPageVal,
    });
    path = `/api/events?${params}&${fieldsPart}`;
  }

  const data = await apiClient.get<ApiEvent[]>(path, { signal });
  const nowIso = new Date().toISOString();
  return data
    .filter((e) => {
      if (!e.start_date) return false;
      return e.start_date < nowIso || e.status === "completed";
    })
    .map(mapEvent)
    .sort((a, b) => (b.startDate ?? "").localeCompare(a.startDate ?? ""))
    .slice(0, limit);
}

// ─── Schedule Export / Calendar Sync ─────────────────────────────────────────
// NOTE: Per endpoint verification (July 2026), /api/schedule returns 404.
// The /api/teams/{teamId}/schedule/export endpoint is SPECULATIVE - not in official
// spec and may return 404. This function has fallback behavior that returns empty
// URLs rather than crashing when the endpoint is unavailable.

export async function fetchScheduleExport(
  teamId: string,
  signal?: AbortSignal
): Promise<ScheduleExport> {
  // Per TopScore API spec, schedule export endpoint pattern should be:
  // GET /api/teams/{id}/schedule/export
  // However endpoint testing shows /api/schedule returns 404.
  // The /api/teams/{teamId}/schedule/export is marked SPECULATIVE - not verified.
  // This function may fail if the endpoint doesn't exist on the server.
  try {
    await ensureEndpoint(`/api/teams/${teamId}/schedule/export`, "GET");
    const { data } = await apiClient.getWithMeta<ApiSchedule>(
      `/api/teams/${teamId}/schedule/export`,
      { signal }
    );
    return mapScheduleExport(data);
  } catch (error) {
    console.warn("fetchScheduleExport: Team schedule export endpoint unavailable or returned error.", error instanceof Error ? error.message : "Unknown error");
    return {
      teamId: teamId,
      icsUrl: "",
      htmlUrl: "",
      googleCalendarUrl: undefined,
      outlookCalendarUrl: undefined,
    };
  }
}

export async function generateCalendarUrl(
  teamId: string,
  type: "google" | "outlook" | "ics",
  signal?: AbortSignal
): Promise<string> {
  await ensureEndpoint(`/api/teams/${teamId}/schedule/url`, "GET");
  const data = await apiClient.get<{ url: string }>(
    `/api/teams/${teamId}/schedule/url?type=${type}`,
    { signal }
  );
  return data.url;
}

// ─── Games / Schedule ────────────────────────────────────────────────────────
// NOTE: Per endpoint verification (July 2026), /api/games with event_id parameter
// is a VERIFIED working endpoint that returns game/schedule data.

export interface FetchGamesOptions {
  eventId: string;
  page?: number;
  perPage?: number;
}

export async function fetchGames(
  options: FetchGamesOptions,
  signal?: AbortSignal
): Promise<PaginatedResponse<Event>> {
  const { eventId, page = 1, perPage = 20 } = options;
  const safePerPage = Math.min(Math.max(1, perPage), MAX_PER_PAGE);
  const params = new URLSearchParams({
    event_id: eventId,
    page: String(page),
    per_page: String(safePerPage),
  });

  const { data: rawData, count } = await apiClient.getWithMeta<ApiGame[]>(
    `/api/games?${params}`,
    { signal }
  );

  const gamesData = (Array.isArray(rawData) ? rawData : []) as ApiGame[];

  return {
    data: gamesData.map(mapGame),
    pagination: {
      page,
      per_page: safePerPage,
      total: count ?? 0,
      total_pages: count != null && count > 0 ? Math.ceil(count / safePerPage) : 0,
    },
  };
}

export async function fetchGameById(
  gameId: string,
  signal?: AbortSignal
): Promise<Event | null> {
  try {
    const data = await apiClient.get<ApiGame>(
      `/api/games/show?id=${gameId}`,
      { signal }
    );
    return mapGame(data);
  } catch {
    return null;
  }
}

// ─── Standings / Rankings ─────────────────────────────────────────────────────

export async function fetchEventStandings(
  eventId: string,
  signal?: AbortSignal
): Promise<EventStandings> {
  await ensureEndpoint(`/api/events/${eventId}/standings`, "GET");
  const data = await apiClient.get<ApiStandings>(
    `/api/events/${eventId}/standings`,
    { signal }
  );
  return mapStandings(data);
}

export async function fetchTeamStandings(
  teamId: string,
  signal?: AbortSignal
): Promise<TeamStanding[]> {
  await ensureEndpoint(`/api/teams/${teamId}/standings`, "GET");
  const data = await apiClient.get<ApiStandings>(
    `/api/teams/${teamId}/standings`,
    { signal }
  );
  return data.standings?.map(mapStandingEntry) ?? [];
}

// ─── Attendance ────────────────────────────────────────────────────────────────

export async function fetchEventAttendance(
  eventId: string,
  signal?: AbortSignal
): Promise<EventAttendance | null> {
  try {
    await ensureEndpoint(`/api/events/${eventId}/attendance`, "GET");
    const data = await apiClient.get<ApiAttendance>(
      `/api/events/${eventId}/attendance`,
      { signal }
    );
    return mapEventAttendance(data);
  } catch (e) {
    console.warn("fetchEventAttendance failed:", e);
    return null;
  }
}

export async function updateAttendance(
  eventId: string,
  status: "attending" | "declined" | "maybe",
  notes?: string,
  signal?: AbortSignal
): Promise<{ success: boolean }> {
  await ensureEndpoint(`/api/events/${eventId}/attendance`, "POST");
  return apiClient.post<{ success: boolean }>(
    `/api/events/${eventId}/attendance`,
    { status, notes, _method: "PUT" },
    { signal }
  );
}

export async function fetchTeamAttendance(
  teamId: string,
  startDate?: string,
  endDate?: string,
  signal?: AbortSignal
): Promise<EventAttendance[]> {
  let path = `/api/teams/${teamId}/attendance`;
  const params: string[] = [];
  if (startDate) params.push(`start_date=${startDate}`);
  if (endDate) params.push(`end_date=${endDate}`);
  if (params.length > 0) path += `?${params.join("&")}`;

  await ensureEndpoint(path, "GET");
  const data = await apiClient.get<ApiAttendance[]>(path, { signal });
  return data.map(mapEventAttendance);
}

// ─── Practice ─────────────────────────────────────────────────────────────────

export async function fetchPractices(
  teamId: string,
  signal?: AbortSignal
): Promise<Practice[]> {
  await ensureEndpoint(`/api/teams/${teamId}/practices`, "GET");
  const data = await apiClient.get<ApiPractice[]>(`/api/teams/${teamId}/practices`, { signal });
  return data.map(mapPractice);
}

export async function createPractice(
  teamId: string,
  practice: {
    name: string;
    start_date: string;
    end_date?: string;
    location_id?: number;
    notes?: string;
  },
  signal?: AbortSignal
): Promise<Practice> {
  await ensureEndpoint(`/api/teams/${teamId}/practices`, "POST");
  const data = await apiClient.post<ApiPractice>(
    `/api/teams/${teamId}/practices`,
    {
      name: practice.name,
      start_date: practice.start_date,
      end_date: practice.end_date,
      location_id: practice.location_id,
      notes: practice.notes,
    },
    { signal }
  );
  return mapPractice(data);
}

export async function updatePractice(
  practiceId: string,
  updates: Partial<{
    name: string;
    start_date: string;
    end_date: string;
    location_id: number;
    notes: string;
  }>,
  signal?: AbortSignal
): Promise<Practice> {
  await ensureEndpoint(`/api/practices/${practiceId}`, "POST");
  const data = await apiClient.post<ApiPractice>(
    `/api/practices/${practiceId}`,
    { ...updates, _method: "PUT" },
    { signal }
  );
  return mapPractice(data);
}

export async function deletePractice(
  practiceId: string,
  signal?: AbortSignal
): Promise<{ success: boolean }> {
  await ensureEndpoint(`/api/practices/${practiceId}`, "POST");
  return apiClient.post<{ success: boolean }>(`/api/practices/${practiceId}`, { _method: "DELETE" }, { signal });
}

export async function updatePracticeAttendance(
  practiceId: string,
  status: "attending" | "declined" | "maybe",
  signal?: AbortSignal
): Promise<{ success: boolean }> {
  await ensureEndpoint(`/api/practices/${practiceId}/attendance`, "POST");
  return apiClient.post<{ success: boolean }>(
    `/api/practices/${practiceId}/attendance`,
    { status },
    { signal }
  );
}

// ─── Score Reporting ──────────────────────────────────────────────────────────

export async function reportScore(
  gameId: string,
  homeScore: number,
  awayScore: number,
  isOvertime: boolean = false,
  status?: import("@/types").EventStatus,
  signal?: AbortSignal
): Promise<{ success: boolean; score_id?: string }> {
  if (!gameId) {
    throw new Error("gameId is required");
  }
  if (homeScore < 0 || awayScore < 0) {
    throw new Error("Scores must be non-negative");
  }
  const payload: Record<string, unknown> = {
    game_id: gameId,
    home_score: homeScore,
    away_score: awayScore,
    is_overtime: isOvertime,
  };

  if (status === "completed") {
    payload.is_final = true;
  }

  return apiClient.post<{ success: boolean; score_id?: string }>(
    "/api/games/report-score",
    payload,
    { signal }
  );
}

export async function updateScore(
  gameId: string,
  homeScore: number,
  awayScore: number,
  isOvertime: boolean = false,
  status?: import("@/types").EventStatus,
  signal?: AbortSignal
): Promise<{ success: boolean }> {
  if (!gameId) {
    throw new Error("gameId is required");
  }
  if (homeScore < 0 || awayScore < 0) {
    throw new Error("Scores must be non-negative");
  }
  await ensureEndpoint("/api/games/report-score", "POST");
  const payload: Record<string, unknown> = {
    game_id: gameId,
    home_score: homeScore,
    away_score: awayScore,
    is_overtime: isOvertime,
  };

  if (status === "completed") {
    payload.is_final = true;
  }

  return apiClient.post<{ success: boolean }>(
    "/api/games/report-score",
    { ...payload, _method: "PUT" },
    { signal }
  );
}

// ─── Articles / News ──────────────────────────────────────────────────────────

export async function fetchArticles(
  category?: string,
  signal?: AbortSignal
): Promise<Article[]> {
  const path = category ? `/api/articles?category=${category}` : "/api/articles";
  const data = await apiClient.get<ApiArticle[]>(path, { signal });
  return data.map(mapArticle);
}

export async function fetchArticleBySlug(
  slug: string,
  signal?: AbortSignal
): Promise<Article | null> {
  try {
    const data = await apiClient.get<ApiArticle>(`/api/articles/${slug}`, { signal });
    return mapArticle(data);
  } catch {
    return null;
  }
}

// ─── Waivers ─────────────────────────────────────────────────────────────────

export async function fetchWaivers(signal?: AbortSignal): Promise<Waiver[]> {
  await ensureEndpoint("/api/waivers", "GET");
  const data = await apiClient.get<ApiWaiver[]>("/api/waivers", { signal });
  return data.map(mapWaiver);
}

export async function fetchUnsignedWaivers(signal?: AbortSignal): Promise<Waiver[]> {
  await ensureEndpoint("/api/waivers?unsigned=true", "GET");
  const data = await apiClient.get<ApiWaiver[]>("/api/waivers?unsigned=true", { signal });
  return data.map(mapWaiver);
}

export async function signWaiver(
  waiverId: string,
  signature: string,
  signal?: AbortSignal
): Promise<{ success: boolean; waiver_id: string }> {
  return apiClient.post<{ success: boolean; waiver_id: string }>(
    `/api/waivers/${waiverId}/sign`,
    { signature },
    { signal }
  );
}

export async function fetchEventWaivers(
  eventId: string,
  signal?: AbortSignal
): Promise<Waiver[]> {
  await ensureEndpoint(`/api/events/${eventId}/waivers`, "GET");
  const data = await apiClient.get<ApiWaiver[]>(`/api/events/${eventId}/waivers`, { signal });
  return data.map(mapWaiver);
}

// ─── Polls / Voting ──────────────────────────────────────────────────────────

export async function fetchPolls(
  teamId?: string,
  eventId?: string,
  signal?: AbortSignal
): Promise<Poll[]> {
  let path = "/api/polls";
  const params: string[] = [];
  if (teamId) params.push(`team_id=${teamId}`);
  if (eventId) params.push(`event_id=${eventId}`);
  if (params.length > 0) path += `?${params.join("&")}`;

  await ensureEndpoint(path, "GET");
  const data = await apiClient.get<ApiPoll[]>(path, { signal });
  return data.map(mapPoll);
}

export async function fetchPoll(pollId: string, signal?: AbortSignal): Promise<Poll | null> {
  try {
    const data = await apiClient.get<ApiPoll>(`/api/polls/${pollId}`, { signal });
    return mapPoll(data);
  } catch {
    return null;
  }
}

export async function votePoll(
  pollId: string,
  optionId: number,
  signal?: AbortSignal
): Promise<{ success: boolean; votes: number }> {
  await ensureEndpoint(`/api/polls/${pollId}/vote`, "POST");
  return apiClient.post<{ success: boolean; votes: number }>(
    `/api/polls/${pollId}/vote`,
    { option_id: optionId, _method: "PUT" },
    { signal }
  );
}

export async function createPoll(
  data: {
    question: string;
    options: string[];
    team_id?: number;
    event_id?: number;
    expires_at?: string;
  },
  signal?: AbortSignal
): Promise<Poll> {
  await ensureEndpoint("/api/polls", "POST");
  const result = await apiClient.post<ApiPoll>("/api/polls", data, { signal });
  return mapPoll(result);
}

// ─── Mail / Communications ──────────────────────────────────────────────────

export async function fetchMailMessages(
  folder: "inbox" | "sent" = "inbox",
  signal?: AbortSignal
): Promise<MailMessage[]> {
  const data = await apiClient.get<ApiMailMessage[]>(`/api/mail?folder=${folder}`, { signal });
  return data.map(mapMailMessage);
}

export async function sendMailMessage(
  recipients: number[],
  subject: string,
  body: string,
  signal?: AbortSignal
): Promise<{ success: boolean; message_id?: string }> {
  await ensureEndpoint("/api/mail/send", "POST");
  return apiClient.post<{ success: boolean; message_id?: string }>(
    "/api/mail/send",
    { recipients, subject, body },
    { signal }
  );
}

// ─── Notifications ───────────────────────────────────────────────────────────

export async function fetchNotifications(
  limit: number = 50,
  signal?: AbortSignal
): Promise<AppNotification[]> {
  const data = await apiClient.get<ApiNotification[]>(`/api/notifications?limit=${limit}`, { signal });
  return data.map(mapNotification);
}

export async function markNotificationRead(
  notificationId: string,
  signal?: AbortSignal
): Promise<{ success: boolean }> {
  await ensureEndpoint(`/api/notifications/${notificationId}/read`, "POST");
  return apiClient.post<{ success: boolean }>(
    `/api/notifications/${notificationId}/read`,
    { _method: "PUT" },
    { signal }
  );
}

export async function markAllNotificationsRead(
  signal?: AbortSignal
): Promise<{ success: boolean }> {
  await ensureEndpoint("/api/notifications/read-all", "POST");
  return apiClient.post<{ success: boolean }>(
    "/api/notifications/read-all",
    {},
    { signal }
  );
}

export async function deleteNotification(
  notificationId: string,
  signal?: AbortSignal
): Promise<{ success: boolean }> {
  await ensureEndpoint(`/api/notifications/${notificationId}`, "POST");
  return apiClient.post<{ success: boolean }>(
    `/api/notifications/${notificationId}`,
    { _method: "DELETE" },
    { signal }
  );
}

// ─── Brackets / Tournaments ───────────────────────────────────────────────────

export async function fetchEventBracket(
  eventId: string,
  signal?: AbortSignal
): Promise<Bracket | null> {
  try {
    const data = await apiClient.get<ApiEventBracket>(
      `/api/events/${eventId}/bracket`,
      { signal }
    );
    return mapBracket(data);
  } catch {
    return null;
  }
}

export async function fetchPoolStandings(
  eventId: string,
  poolName: string,
  signal?: AbortSignal
): Promise<TeamStanding[]> {
  const data = await apiClient.get<ApiPoolStandings>(
    `/api/events/${eventId}/pools/${poolName}/standings`,
    { signal }
  );
  return data.standings?.map(mapStandingEntry) ?? [];
}

// ─── Locations ───────────────────────────────────────────────────────────────

export async function fetchLocations(
  organizationId?: number,
  signal?: AbortSignal
): Promise<import("@/types").Location[]> {
  const path = organizationId
    ? `/api/locations?organization_id=${organizationId}`
    : "/api/locations";
  const { data: rawData } = await apiClient.getWithMeta<ApiLocation[]>(path, { signal });
  const locationsData = Array.isArray(rawData) ? rawData : [];
  return locationsData
    .map((loc) => mapLocation(loc))
    .filter((loc): loc is import("@/types").Location => loc !== undefined);
}

// ─── Roster Management ─────────────────────────────────────────────────────

export async function fetchStandingRoster(
  teamId: string,
  signal?: AbortSignal
): Promise<import("@/types").TeamMember[]> {
  // NOTE: Per actual API testing, /api/teams/{id} does NOT exist (404).
  // Correct pattern is /api/teams/show?id={id}.
  const fieldsPart = buildFieldsParam("standing_roster");
  const { data } = await apiClient.getWithMeta<ApiTeam>(
    `/api/teams/show?id=${teamId}&${fieldsPart}`,
    { signal }
  );
  return mapTeam(data).standingRoster ?? ([] as import("@/types").TeamMember[]);
}

export async function fetchActiveRoster(
  teamId: string,
  signal?: AbortSignal
): Promise<import("@/types").TeamMember[]> {
  // NOTE: Per actual API testing, /api/teams/{id} does NOT exist (404).
  // Correct pattern is /api/teams/show?id={id}.
  const fieldsPart = buildFieldsParam("active_roster");
  const { data } = await apiClient.getWithMeta<ApiTeam>(
    `/api/teams/show?id=${teamId}&${fieldsPart}`,
    { signal }
  );
  return mapTeam(data).activeRoster ?? ([] as import("@/types").TeamMember[]);
}

export async function fetchEventRoster(
  eventId: string,
  signal?: AbortSignal
): Promise<import("@/types").TeamMember[]> {
  await ensureEndpoint(`/api/events/${eventId}/roster`, "GET");
  const { data: rawData } = await apiClient.getWithMeta<ApiRegistration | ApiRegistration[]>(
    `/api/events/${eventId}/roster`,
    { signal }
  );

  if (!rawData) {
    return [];
  }

  const registrations = Array.isArray(rawData) ? rawData : [rawData];
  const allRosterMembers: import("@/types/api").ApiRosterMember[] = [];

  for (const reg of registrations) {
    if (reg && Array.isArray(reg.event_roster)) {
      allRosterMembers.push(...reg.event_roster);
    }
  }

  return allRosterMembers.map(mapRosterMember) as import("@/types").TeamMember[];
}

export async function inviteRosterMember(
  teamId: string,
  email: string,
  role: import("@/types").TeamRole,
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
): Promise<ApiRosterInvitation[]> {
  await ensureEndpoint(`/api/teams/${teamId}/roster/invitations`, "GET");
  return apiClient.get<ApiRosterInvitation[]>(
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

// ─── Team Stats ─────────────────────────────────────────────────────────────

export async function fetchTeamStats(
  teamId: string,
  signal?: AbortSignal
): Promise<import("@/types").TeamStats | null> {
  try {
    await ensureEndpoint(`/api/teams/${teamId}/stats`, "GET");
    const data = await apiClient.get<ApiTeamStats>(
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

// ─── Attendance Surveys ──────────────────────────────────────────────────────

export async function fetchEventAttendanceSurvey(
  eventId: string,
  signal?: AbortSignal
): Promise<import("@/types").AttendanceSurvey | null> {
  try {
    await ensureEndpoint(`/api/events/${eventId}/attendance/survey`, "GET");
    const data = await apiClient.get<ApiAttendanceSurvey>(
      `/api/events/${eventId}/attendance/survey`,
      { signal }
    );
    return {
      id: String(data.id),
      name: data.name,
      questions: data.questions.map((q) => ({
        id: String(q.id),
        text: q.text,
        type: q.type as "yes_no" | "multiple_choice" | "text",
        options: q.options,
        pointValue: q.point_value,
        required: q.required,
      })),
      hoursAvailable: data.hours_available,
      isDefault: data.is_default,
    };
  } catch {
    return null;
  }
}

export async function submitAttendanceSurveyResponse(
  eventId: string,
  responses: Array<{ question_id: number; answer: string | boolean }>,
  signal?: AbortSignal
): Promise<{ success: boolean }> {
  await ensureEndpoint(`/api/events/${eventId}/attendance/survey`, "POST");
  return apiClient.post<{ success: boolean }>(
    `/api/events/${eventId}/attendance/survey`,
    { responses },
    { signal }
  );
}

export async function fetchEventRosterSettings(
  eventId: string,
  signal?: AbortSignal
): Promise<import("@/types").EventRosterSettings | null> {
  try {
    await ensureEndpoint(`/api/events/${eventId}/roster/settings`, "GET");
    const data = await apiClient.get<ApiEventRosterSettings>(
      `/api/events/${eventId}/roster/settings`,
      { signal }
    );
    return {
      eventId: String(data.event_id),
      minPlayers: data.min_players,
      maxPlayers: data.max_players,
      allowWaitlist: data.allow_waitlist,
      rosterDeadline: data.roster_deadline,
      canAddPlayers: data.can_add_players,
      canRemovePlayers: data.can_remove_players,
      canChangeRoles: data.can_change_roles,
    };
  } catch {
    return null;
  }
}

// ─── Registration Management ────────────────────────────────────────────────

export async function fetchRegistrationsByPerson(
  personId: string,
  signal?: AbortSignal
): Promise<import("@/types").Registration[]> {
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
): Promise<import("@/types").Registration[]> {
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
): Promise<import("@/types").Registration[]> {
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
  status: import("@/types").RegistrationStatus,
  signal?: AbortSignal
): Promise<{ success: boolean }> {
  // NOTE: Per actual API testing (July 2026), /api/registrations/{id} returns 404.
  // TopScore API does not support direct registration status updates via API.
  // Status updates must be done through the website.
  // This function exists for API compatibility but will always fail.
  console.error("updateRegistrationStatus: /api/registrations/{id} endpoint does not exist (404). TopScore API does not support registration status updates via API. Please update registration status through the website.");
  throw new Error("Registration status updates are not supported via API. Please update your registration at pada.org.");
}

// ─── Search ─────────────────────────────────────────────────────────────────

export async function searchPeople(
  query: string,
  limit: number = 20,
  signal?: AbortSignal
): Promise<import("@/types").User[]> {
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
): Promise<import("@/types").Team[]> {
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

// ─── Parallel Fetching Helpers ──────────────────────────────────────────

export interface DashboardData {
  user: User;
  teams: Team[];
  events: Event[];
  registrations: Registration[];
}

export async function fetchDashboardData(
  signal?: AbortSignal
): Promise<DashboardData> {
  let user: User;
  let teamsResult: PaginatedResponse<Team>;
  let events: Event[];
  let registrationsResult: PaginatedResponse<Registration>;

  try {
    [user, teamsResult, events, registrationsResult] = await Promise.all([
      fetchCurrentUser(signal),
      fetchTeams({}, signal),
      fetchUpcomingEvents(undefined, 10, signal),
      fetchRegistrations({}, signal),
    ]);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    throw error;
  }

  return { user, teams: teamsResult.data, events, registrations: registrationsResult.data };
}

export interface TeamDetailData {
  team: Team;
  roster: TeamMember[];
  upcomingEvents: Event[];
  pastEvents: Event[];
}

export async function fetchTeamDetailData(
  teamId: string,
  signal?: AbortSignal
): Promise<TeamDetailData> {
  let team: Team | undefined;
  let roster: TeamMember[];
  let upcomingEvents: Event[];
  let pastEvents: Event[];

  try {
    [team, roster, upcomingEvents, pastEvents] = await Promise.all([
      fetchTeam(teamId, signal),
      fetchTeamRoster(teamId, signal),
      fetchUpcomingEvents(teamId, 10, signal),
      fetchPastEvents(teamId, 10, signal),
    ]);
  } catch (error) {
    console.error(`Error fetching team detail data for team ${teamId}:`, error);
    throw error;
  }

  if (!team) {
    throw new Error(`Team not found: ${teamId}`);
  }

  return {
    team,
    roster,
    upcomingEvents,
    pastEvents,
  };
}

export interface EventDetailData {
  event: Event;
  attendance: EventAttendance | null;
  bracket: Bracket | null;
}

export async function fetchEventDetailData(
  eventId: string,
  signal?: AbortSignal
): Promise<EventDetailData> {
  const [event, attendance, bracket] = await Promise.all([
    fetchEvent(eventId, signal),
    fetchEventAttendance(eventId, signal),
    fetchEventBracket(eventId, signal),
  ]);

  if (!event) {
    throw new Error(`Event not found: ${eventId}`);
  }

  return {
    event,
    attendance,
    bracket,
  };
}

const TEAM_ADMIN_ROLES: TeamRole[] = ["captain", "coach", "assistant_coach", "admin"];

const SCORE_REPORTING_ROLES: TeamRole[] = ["captain"];

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

export function getUserTeamRole(team: Team | undefined): TeamRole | null {
  return team?.myMembership?.role ?? null;
}

export function isUserTeamAdmin(team: Team | undefined): boolean {
  if (!team?.myMembership) {
    return false;
  }
  return TEAM_ADMIN_ROLES.includes(team.myMembership.role);
}