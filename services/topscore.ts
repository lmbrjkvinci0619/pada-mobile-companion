import { apiClient, isMockEnabled } from "@/lib/apiClient";
import type {
  User,
  Registration,
  Team,
  TeamMember,
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
  ApiArticle,
  ApiSchedule,
  ApiStandings,
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
  mapArticle,
  mapScheduleExport,
  mapStandings,
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
} from "@/lib/mappers/topscore";
import {
  MOCK_USER,
  MOCK_REGISTRATIONS,
  MOCK_TEAMS,
  MOCK_EVENTS,
  MOCK_ARTICLES,
} from "@/constants/mockData";

// ─── User / Profile ──────────────────────────────────────────────────────────

export async function fetchCurrentUser(signal?: AbortSignal): Promise<User> {
  if (isMockEnabled()) return MOCK_USER;

  const data = await apiClient.get<ApiPerson>("/api/persons/me", { signal });
  return mapPerson(data);
}

export async function fetchUserById(personId: string, signal?: AbortSignal): Promise<User | null> {
  if (isMockEnabled()) return MOCK_USER;

  try {
    const data = await apiClient.get<ApiPerson>(`/api/persons/${personId}`, { signal });
    return mapPerson(data);
  } catch {
    return null;
  }
}

export async function updateProfile(
  personId: string,
  updates: Partial<{
    first_name: string;
    last_name: string;
    phone: string;
    avatar_url: string;
    about: string;
  }>,
  signal?: AbortSignal
): Promise<User> {
  const data = await apiClient.put<ApiPerson>(
    `/api/persons/${personId}`,
    updates,
    { signal }
  );
  return mapPerson(data);
}

// ─── Family ──────────────────────────────────────────────────────────────────

export async function fetchFamily(signal?: AbortSignal): Promise<Family | null> {
  if (isMockEnabled()) return null;

  try {
    const data = await apiClient.get<ApiFamily>("/api/family", { signal });
    return mapFamily(data);
  } catch {
    return null;
  }
}

export async function addFamilyMember(
  email: string,
  relationship: string,
  signal?: AbortSignal
): Promise<{ success: boolean; message: string }> {
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
  return apiClient.delete<{ success: boolean }>(`/api/family/${personId}`, { signal });
}

// ─── Memberships ─────────────────────────────────────────────────────────────

export async function fetchMemberships(signal?: AbortSignal): Promise<Membership[]> {
  if (isMockEnabled()) return [];

  const data = await apiClient.get<ApiMembership[]>("/api/memberships", { signal });
  return data.map(mapMembership);
}

export async function purchaseMembership(
  membershipType: string,
  paymentToken: string,
  signal?: AbortSignal
): Promise<{ success: boolean; membership_id?: string; error?: string }> {
  return apiClient.post<{ success: boolean; membership_id?: string; error?: string }>(
    "/api/memberships/purchase",
    { type: membershipType, payment_token: paymentToken },
    { signal }
  );
}

// ─── Registrations ────────────────────────────────────────────────────────────

export async function fetchRegistrations(signal?: AbortSignal): Promise<Registration[]> {
  if (isMockEnabled()) return MOCK_REGISTRATIONS;

  const data = await apiClient.get<ApiRegistration[]>("/api/registrations", { signal });
  return data.map(mapRegistration);
}

export async function fetchRegistrationById(
  registrationId: string,
  signal?: AbortSignal
): Promise<Registration | null> {
  if (isMockEnabled()) return MOCK_REGISTRATIONS.find((r) => r.id === registrationId) ?? null;

  try {
    const data = await apiClient.get<ApiRegistration>(`/api/registrations/${registrationId}`, { signal });
    return mapRegistration(data);
  } catch {
    return null;
  }
}

// ─── Teams ────────────────────────────────────────────────────────────────────

export async function fetchTeams(signal?: AbortSignal): Promise<Team[]> {
  if (isMockEnabled()) return MOCK_TEAMS;

  const data = await apiClient.get<ApiTeam[]>(
    "/api/teams?fields=locations,roster,record",
    { signal }
  );
  return data.map(mapTeam);
}

export async function fetchTeam(teamId: string, signal?: AbortSignal): Promise<Team | undefined> {
  if (isMockEnabled()) return MOCK_TEAMS.find((t) => t.id === teamId);

  try {
    const data = await apiClient.get<ApiTeam>(
      `/api/teams/${teamId}?fields=roster,locations,record`,
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
  if (isMockEnabled()) {
    const team = MOCK_TEAMS.find((t) => t.id === teamId);
    return team?.roster ?? [];
  }

  const data = await apiClient.get<ApiTeam>(
    `/api/teams/${teamId}?fields=roster`,
    { signal }
  );
  return mapTeam(data).roster ?? [];
}

export async function updateTeamMemberRole(
  teamId: string,
  personId: string,
  role: string,
  signal?: AbortSignal
): Promise<{ success: boolean }> {
  return apiClient.put<{ success: boolean }>(
    `/api/teams/${teamId}/roster/${personId}`,
    { role },
    { signal }
  );
}

export async function removeTeamMember(
  teamId: string,
  personId: string,
  signal?: AbortSignal
): Promise<{ success: boolean }> {
  return apiClient.delete<{ success: boolean }>(
    `/api/teams/${teamId}/roster/${personId}`,
    { signal }
  );
}

// ─── Events / Schedule ────────────────────────────────────────────────────────

export async function fetchEvents(teamId?: string, signal?: AbortSignal): Promise<Event[]> {
  if (isMockEnabled()) {
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
  if (isMockEnabled()) return MOCK_EVENTS.find((e) => e.id === eventId);

  try {
    const data = await apiClient.get<ApiEvent>(
      `/api/events/${eventId}?fields=locations,scores`,
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
  const path = teamId
    ? `/api/events?team_id=${teamId}&status=scheduled&upcoming=true&limit=${limit}&fields=locations,scores`
    : `/api/events?status=scheduled&upcoming=true&limit=${limit}&fields=locations,scores`;

  const data = await apiClient.get<ApiEvent[]>(path, { signal });
  return data.map(mapEvent);
}

export async function fetchPastEvents(
  teamId?: string,
  limit: number = 10,
  signal?: AbortSignal
): Promise<Event[]> {
  const path = teamId
    ? `/api/events?team_id=${teamId}&status=completed&limit=${limit}&fields=locations,scores`
    : `/api/events?status=completed&limit=${limit}&fields=locations,scores`;

  const data = await apiClient.get<ApiEvent[]>(path, { signal });
  return data.map(mapEvent);
}

// ─── Schedule Export / Calendar Sync ─────────────────────────────────────────

export async function fetchScheduleExport(
  teamId: string,
  signal?: AbortSignal
): Promise<ScheduleExport> {
  if (isMockEnabled()) {
    return {
      teamId,
      icsUrl: `https://example.com/teams/${teamId}/schedule.ics`,
      htmlUrl: `https://example.com/teams/${teamId}/schedule`,
      googleCalendarUrl: `https://calendar.google.com/calendar/r?cid=https://example.com/teams/${teamId}/schedule.ics`,
      outlookCalendarUrl: `https://outlook.live.com/calendar/0?cid=https://example.com/teams/${teamId}/schedule.ics`,
    };
  }

  const data = await apiClient.get<ApiSchedule>(`/api/teams/${teamId}/schedule/export`, { signal });
  return mapScheduleExport(data);
}

export async function generateCalendarUrl(
  teamId: string,
  type: "google" | "outlook" | "ics",
  signal?: AbortSignal
): Promise<string> {
  const data = await apiClient.get<{ url: string }>(
    `/api/teams/${teamId}/schedule/url?type=${type}`,
    { signal }
  );
  return data.url;
}

// ─── Standings / Rankings ─────────────────────────────────────────────────────

export async function fetchEventStandings(
  eventId: string,
  signal?: AbortSignal
): Promise<EventStandings> {
  if (isMockEnabled()) {
    return {
      eventId,
      eventName: "Sample Event",
      standings: [],
    };
  }

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
  if (isMockEnabled()) return [];

  const data = await apiClient.get<ApiStandings>(
    `/api/teams/${teamId}/standings`,
    { signal }
  );
  return data.standings?.map((entry) => ({
    rank: entry.rank,
    teamId: String(entry.team_id),
    teamName: entry.team_name,
    division: entry.division,
    wins: entry.wins,
    losses: entry.losses,
    ties: entry.ties,
    trueskillRating: entry.trueskill_rating,
    gamesBehind: entry.games_behind,
    pointDifferential: entry.point_differential,
  })) ?? [];
}

// ─── Attendance ────────────────────────────────────────────────────────────────

export async function fetchEventAttendance(
  eventId: string,
  signal?: AbortSignal
): Promise<EventAttendance | null> {
  if (isMockEnabled()) {
    return {
      eventId,
      eventName: "Sample Event",
      eventDate: new Date().toISOString(),
      teamId: "1",
      records: [],
    };
  }

  try {
    const data = await apiClient.get<ApiAttendance>(
      `/api/events/${eventId}/attendance`,
      { signal }
    );
    return mapEventAttendance(data);
  } catch {
    return null;
  }
}

export async function updateAttendance(
  eventId: string,
  status: "attending" | "declined" | "maybe",
  notes?: string,
  signal?: AbortSignal
): Promise<{ success: boolean }> {
  return apiClient.post<{ success: boolean }>(
    `/api/events/${eventId}/attendance`,
    { status, notes },
    { signal }
  );
}

export async function fetchTeamAttendance(
  teamId: string,
  startDate?: string,
  endDate?: string,
  signal?: AbortSignal
): Promise<EventAttendance[]> {
  if (isMockEnabled()) return [];

  let path = `/api/teams/${teamId}/attendance`;
  const params: string[] = [];
  if (startDate) params.push(`start_date=${startDate}`);
  if (endDate) params.push(`end_date=${endDate}`);
  if (params.length > 0) path += `?${params.join("&")}`;

  const data = await apiClient.get<ApiAttendance[]>(path, { signal });
  return data.map(mapEventAttendance);
}

// ─── Practice ─────────────────────────────────────────────────────────────────

export async function fetchPractices(
  teamId: string,
  signal?: AbortSignal
): Promise<Practice[]> {
  if (isMockEnabled()) return [];

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
  const data = await apiClient.post<ApiPractice>(
    `/api/teams/${teamId}/practices`,
    practice,
    { signal }
  );
  return mapPractice(data);
}

export async function updatePractice(
  practiceId: string,
  updates: Partial<{
    name: string;
    start_date: string;
    end_date?: string;
    location_id?: number;
    notes?: string;
  }>,
  signal?: AbortSignal
): Promise<Practice> {
  const data = await apiClient.put<ApiPractice>(
    `/api/practices/${practiceId}`,
    updates,
    { signal }
  );
  return mapPractice(data);
}

export async function deletePractice(
  practiceId: string,
  signal?: AbortSignal
): Promise<{ success: boolean }> {
  return apiClient.delete<{ success: boolean }>(`/api/practices/${practiceId}`, { signal });
}

export async function updatePracticeAttendance(
  practiceId: string,
  status: "attending" | "declined" | "maybe",
  signal?: AbortSignal
): Promise<{ success: boolean }> {
  return apiClient.post<{ success: boolean }>(
    `/api/practices/${practiceId}/attendance`,
    { status },
    { signal }
  );
}

// ─── Score Reporting ──────────────────────────────────────────────────────────

export async function reportScore(
  eventId: string,
  homeScore: number,
  awayScore: number,
  isOvertime: boolean = false,
  signal?: AbortSignal
): Promise<{ success: boolean; score_id?: string }> {
  return apiClient.post<{ success: boolean; score_id?: string }>(
    `/api/events/${eventId}/scores`,
    {
      home_score: homeScore,
      away_score: awayScore,
      is_overtime: isOvertime,
    },
    { signal }
  );
}

export async function updateScore(
  eventId: string,
  homeScore: number,
  awayScore: number,
  signal?: AbortSignal
): Promise<{ success: boolean }> {
  return apiClient.put<{ success: boolean }>(
    `/api/events/${eventId}/scores`,
    {
      home_score: homeScore,
      away_score: awayScore,
    },
    { signal }
  );
}

// ─── Articles / News ──────────────────────────────────────────────────────────

export async function fetchArticles(
  category?: string,
  signal?: AbortSignal
): Promise<Article[]> {
  if (isMockEnabled()) return MOCK_ARTICLES;

  const path = category ? `/api/articles?category=${category}` : "/api/articles";
  const data = await apiClient.get<ApiArticle[]>(path, { signal });
  return data.map(mapArticle);
}

export async function fetchArticleBySlug(
  slug: string,
  signal?: AbortSignal
): Promise<Article | null> {
  if (isMockEnabled()) return MOCK_ARTICLES[0];

  try {
    const data = await apiClient.get<ApiArticle>(`/api/articles/${slug}`, { signal });
    return mapArticle(data);
  } catch {
    return null;
  }
}

// ─── Waivers ─────────────────────────────────────────────────────────────────

export async function fetchWaivers(signal?: AbortSignal): Promise<Waiver[]> {
  if (isMockEnabled()) return [];

  const data = await apiClient.get<ApiWaiver[]>("/api/waivers", { signal });
  return data.map(mapWaiver);
}

export async function fetchUnsignedWaivers(signal?: AbortSignal): Promise<Waiver[]> {
  if (isMockEnabled()) return [];

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
  if (isMockEnabled()) return [];

  const data = await apiClient.get<ApiWaiver[]>(`/api/events/${eventId}/waivers`, { signal });
  return data.map(mapWaiver);
}

// ─── Polls / Voting ──────────────────────────────────────────────────────────

export async function fetchPolls(
  teamId?: string,
  eventId?: string,
  signal?: AbortSignal
): Promise<Poll[]> {
  if (isMockEnabled()) return [];

  let path = "/api/polls";
  const params: string[] = [];
  if (teamId) params.push(`team_id=${teamId}`);
  if (eventId) params.push(`event_id=${eventId}`);
  if (params.length > 0) path += `?${params.join("&")}`;

  const data = await apiClient.get<ApiPoll[]>(path, { signal });
  return data.map(mapPoll);
}

export async function fetchPoll(pollId: string, signal?: AbortSignal): Promise<Poll | null> {
  if (isMockEnabled()) return null;

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
  return apiClient.post<{ success: boolean; votes: number }>(
    `/api/polls/${pollId}/vote`,
    { option_id: optionId },
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
  const result = await apiClient.post<ApiPoll>("/api/polls", data, { signal });
  return mapPoll(result);
}

// ─── Mail / Communications ──────────────────────────────────────────────────

export async function fetchMailMessages(
  folder: "inbox" | "sent" = "inbox",
  signal?: AbortSignal
): Promise<MailMessage[]> {
  if (isMockEnabled()) return [];

  const data = await apiClient.get<ApiMailMessage[]>(`/api/mail?folder=${folder}`, { signal });
  return data.map(mapMailMessage);
}

export async function sendMailMessage(
  recipients: number[],
  subject: string,
  body: string,
  signal?: AbortSignal
): Promise<{ success: boolean; message_id?: string }> {
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
  if (isMockEnabled()) return [];

  const data = await apiClient.get<ApiNotification[]>(`/api/notifications?limit=${limit}`, { signal });
  return data.map(mapNotification);
}

export async function markNotificationRead(
  notificationId: string,
  signal?: AbortSignal
): Promise<{ success: boolean }> {
  return apiClient.put<{ success: boolean }>(
    `/api/notifications/${notificationId}/read`,
    {},
    { signal }
  );
}

export async function markAllNotificationsRead(
  signal?: AbortSignal
): Promise<{ success: boolean }> {
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
  return apiClient.delete<{ success: boolean }>(
    `/api/notifications/${notificationId}`,
    { signal }
  );
}

// ─── Brackets / Tournaments ───────────────────────────────────────────────────

export async function fetchEventBracket(
  eventId: string,
  signal?: AbortSignal
): Promise<Bracket | null> {
  if (isMockEnabled()) return null;

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
  if (isMockEnabled()) return [];

  const data = await apiClient.get<ApiStandings>(
    `/api/events/${eventId}/pools/${poolName}/standings`,
    { signal }
  );
  return data.standings?.map((entry) => ({
    rank: entry.rank,
    teamId: String(entry.team_id),
    teamName: entry.team_name,
    division: entry.division,
    wins: entry.wins,
    losses: entry.losses,
    ties: entry.ties,
    trueskillRating: entry.trueskill_rating,
    gamesBehind: entry.games_behind,
    pointDifferential: entry.point_differential,
  })) ?? [];
}

// ─── Locations ───────────────────────────────────────────────────────────────

export async function fetchLocations(
  organizationId?: number,
  signal?: AbortSignal
): Promise<import("@/types").Location[]> {
  if (isMockEnabled()) return [];

  const path = organizationId
    ? `/api/locations?organization_id=${organizationId}`
    : "/api/locations";
  const data = await apiClient.get<ApiLocation[]>(path, { signal });
  return data.filter(Boolean).map((loc) => ({
    id: String(loc.id ?? ""),
    name: loc.name ?? "",
    address: loc.address ?? "",
    city: loc.city ?? "",
    state: loc.state,
    zip: loc.zip,
    latitude: loc.latitude,
    longitude: loc.longitude,
    fieldCount: loc.field_count,
    notes: loc.notes,
    isIndoor: loc.is_indoor,
  }));
}

// ─── Roster Management ─────────────────────────────────────────────────────

export async function fetchStandingRoster(
  teamId: string,
  signal?: AbortSignal
): Promise<import("@/types").TeamMember[]> {
  if (isMockEnabled()) return [];

  const data = await apiClient.get<ApiTeam>(
    `/api/teams/${teamId}?fields=standing_roster`,
    { signal }
  );
  return mapTeam(data).standingRoster ?? ([] as import("@/types").TeamMember[]);
}

export async function fetchActiveRoster(
  teamId: string,
  signal?: AbortSignal
): Promise<import("@/types").TeamMember[]> {
  if (isMockEnabled()) return [];

  const data = await apiClient.get<ApiTeam>(
    `/api/teams/${teamId}?fields=active_roster`,
    { signal }
  );
  return mapTeam(data).activeRoster ?? ([] as import("@/types").TeamMember[]);
}

export async function fetchEventRoster(
  eventId: string,
  signal?: AbortSignal
): Promise<import("@/types").TeamMember[]> {
  if (isMockEnabled()) return [];

  const data = await apiClient.get<ApiRegistration>(
    `/api/events/${eventId}/roster`,
    { signal }
  );
  return (data.event_roster ?? []).map(mapRosterMember) as import("@/types").TeamMember[];
}

export async function inviteRosterMember(
  teamId: string,
  email: string,
  role: import("@/types").TeamRole,
  signal?: AbortSignal
): Promise<{ success: boolean; invitation_id?: string }> {
  return apiClient.post<{ success: boolean; invitation_id?: string }>(
    `/api/teams/${teamId}/roster/invite`,
    { email, role },
    { signal }
  );
}

export async function respondToRosterInvitation(
  invitationId: string,
  response: "accepted" | "declined",
  signal?: AbortSignal
): Promise<{ success: boolean }> {
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
  if (isMockEnabled()) return [];

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
  return apiClient.delete<{ success: boolean }>(
    `/api/teams/${teamId}/roster/invitations/${invitationId}`,
    { signal }
  );
}

// ─── Team Stats ─────────────────────────────────────────────────────────────

export async function fetchTeamStats(
  teamId: string,
  signal?: AbortSignal
): Promise<import("@/types").TeamStats | null> {
  if (isMockEnabled()) return null;

  try {
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
  if (isMockEnabled()) return null;

  try {
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
  if (isMockEnabled()) return null;

  try {
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
  if (isMockEnabled()) return MOCK_REGISTRATIONS;

  const data = await apiClient.get<ApiRegistration[]>(
    `/api/persons/${personId}/registrations`,
    { signal }
  );
  return data.map(mapRegistration);
}

export async function fetchRegistrationsByTeam(
  teamId: string,
  signal?: AbortSignal
): Promise<import("@/types").Registration[]> {
  if (isMockEnabled()) return [];

  const data = await apiClient.get<ApiRegistration[]>(
    `/api/teams/${teamId}/registrations`,
    { signal }
  );
  return data.map(mapRegistration);
}

export async function fetchRegistrationsByEvent(
  eventId: string,
  signal?: AbortSignal
): Promise<import("@/types").Registration[]> {
  if (isMockEnabled()) return [];

  const data = await apiClient.get<ApiRegistration[]>(
    `/api/events/${eventId}/registrations`,
    { signal }
  );
  return data.map(mapRegistration);
}

export async function updateRegistrationStatus(
  registrationId: string,
  status: import("@/types").RegistrationStatus,
  signal?: AbortSignal
): Promise<{ success: boolean }> {
  return apiClient.put<{ success: boolean }>(
    `/api/registrations/${registrationId}`,
    { status },
    { signal }
  );
}

// ─── Search ─────────────────────────────────────────────────────────────────

export async function searchPeople(
  query: string,
  limit: number = 20,
  signal?: AbortSignal
): Promise<import("@/types").User[]> {
  if (isMockEnabled()) return [];

  const data = await apiClient.get<ApiPerson[]>(
    `/api/persons/search?q=${encodeURIComponent(query)}&limit=${limit}`,
    { signal }
  );
  return data.map(mapPerson);
}

export async function searchTeams(
  query: string,
  limit: number = 20,
  signal?: AbortSignal
): Promise<import("@/types").Team[]> {
  if (isMockEnabled()) return [];

  const data = await apiClient.get<ApiTeam[]>(
    `/api/teams/search?q=${encodeURIComponent(query)}&limit=${limit}`,
    { signal }
  );
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
  const [user, teams, events, registrations] = await Promise.all([
    fetchCurrentUser(signal),
    fetchTeams(signal),
    fetchUpcomingEvents(undefined, 10, signal),
    fetchRegistrations(signal),
  ]);

  return { user, teams, events, registrations };
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
  const [team, roster, upcomingEvents, pastEvents] = await Promise.all([
    fetchTeam(teamId, signal),
    fetchTeamRoster(teamId, signal),
    fetchUpcomingEvents(teamId, 10, signal),
    fetchPastEvents(teamId, 10, signal),
  ]);

  return {
    team: team!,
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

  return {
    event: event!,
    attendance,
    bracket,
  };
}