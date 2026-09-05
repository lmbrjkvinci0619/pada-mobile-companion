import { apiClient, buildFieldsParam, MAX_PER_PAGE } from "@/lib/apiClient";
import { ensureEndpoint } from "@/lib/endpointGuard";
import type { Event, EventStatus } from "@/types";
import type { ApiEvent, ApiGame, ApiSchedule, ApiStandings, ApiPoolStandings, ApiEventBracket, ApiLocation, ApiEventRosterSettings, ApiAttendanceSurvey } from "@/types/api";
import { mapEvent, mapGame, mapScheduleExport, mapStandings, mapStandingEntry, mapEventAttendance, mapLocation, mapBracket, mapRosterMember } from "@/lib/mappers/topscore";
import type { PaginatedResponse } from "@/types/api-response";

// ─── Events / Schedule ────────────────────────────────────────────────────────
// CONFIRMED WORKING ENDPOINTS:
// - GET  /api/events                      - List events (paginated)
// - GET  /api/events?id={id}             - Event details (uses query param!)
// - GET  /api/games?event_id=X           - Games/schedule for event
// CONFIRMED BROKEN:
// - GET  /api/events/{id}                - Use /api/events?id={id}
// - GET  /api/schedule                   - Use /api/games?event_id=X

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

export async function fetchScheduleExport(
  teamId: string,
  signal?: AbortSignal
): Promise<import("@/types").ScheduleExport> {
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

// ─── Standings / Rankings ────────────────────────────────────────────────────

export async function fetchEventStandings(
  eventId: string,
  signal?: AbortSignal
): Promise<import("@/types").EventStandings> {
  await ensureEndpoint(`/api/events/${eventId}/standings`, "GET");
  const data = await apiClient.get<ApiStandings>(
    `/api/events/${eventId}/standings`,
    { signal }
  );
  return mapStandings(data);
}

export async function fetchPoolStandings(
  eventId: string,
  poolName: string,
  signal?: AbortSignal
): Promise<import("@/types").TeamStanding[]> {
  const data = await apiClient.get<ApiPoolStandings>(
    `/api/events/${eventId}/pools/${poolName}/standings`,
    { signal }
  );
  return data.standings?.map(mapStandingEntry) ?? [];
}

// ─── Attendance ────────────────────────────────────────────────────────────────

export async function fetchEventAttendance(
  eventId: string,
  signal?: AbortSignal
): Promise<import("@/types").EventAttendance | null> {
  try {
    await ensureEndpoint(`/api/events/${eventId}/attendance`, "GET");
    const data = await apiClient.get<import("@/types/api").ApiAttendance>(
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
): Promise<import("@/types").EventAttendance[]> {
  let path = `/api/teams/${teamId}/attendance`;
  const params: string[] = [];
  if (startDate) params.push(`start_date=${startDate}`);
  if (endDate) params.push(`end_date=${endDate}`);
  if (params.length > 0) path += `?${params.join("&")}`;

  await ensureEndpoint(path, "GET");
  const data = await apiClient.get<import("@/types/api").ApiAttendance[]>(path, { signal });
  return data.map(mapEventAttendance);
}

// ─── Event Attendance Survey ──────────────────────────────────────────────────

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

// ─── Event Roster ────────────────────────────────────────────────────────────

export async function fetchEventRoster(
  eventId: string,
  signal?: AbortSignal
): Promise<import("@/types").TeamMember[]> {
  await ensureEndpoint(`/api/events/${eventId}/roster`, "GET");
  const { data: rawData } = await apiClient.getWithMeta<import("@/types/api").ApiRegistration | import("@/types/api").ApiRegistration[]>(
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

// ─── Brackets / Tournaments ───────────────────────────────────────────────────

export async function fetchEventBracket(
  eventId: string,
  signal?: AbortSignal
): Promise<import("@/types").Bracket | null> {
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

// ─── Locations ────────────────────────────────────────────────────────────────

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