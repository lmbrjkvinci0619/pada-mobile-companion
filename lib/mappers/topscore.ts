import type {
  User,
  Registration,
  Team,
  Event,
  Location,
  Article,
  TeamMember,
  TeamStanding,
  EventStandings,
  EventAttendance,
  AttendanceRecord,
  ScheduleExport,
  Practice,
  Waiver,
  Family,
  FamilyMember,
  Membership,
  AppNotification,
  Poll,
  PollOption,
  MailMessage,
  Bracket,
  BracketRound,
  BracketGame,
  BracketType,
} from "@/types";
import type {
  ApiPerson,
  ApiRegistration,
  ApiTeam,
  ApiEvent,
  ApiGame,
  ApiArticle,
  ApiRosterMember,
  ApiStandingEntry,
  ApiStandings,
  ApiAttendance,
  ApiAttendanceRecord,
  ApiSchedule,
  ApiPractice,
  ApiWaiver,
  ApiFamily,
  ApiFamilyMember,
  ApiMembership,
  ApiNotification,
  ApiPoll,
  ApiPollOption,
  ApiMailMessage,
  ApiEventBracket,
  ApiBracketRound,
  ApiBracketGame,
  ApiLocation,
} from "@/types/api";

export function mapPerson(data: ApiPerson): User {
  const sitePermission = data.site_permission ?? data.site_permissions?.[0];
  const orgPermissions = data.org_permissions ?? [];
  const sitePermissions = data.site_permissions ?? (data.site_permission ? [data.site_permission] : []);

  const isSiteEditor = sitePermissions.includes("editor");
  const isScoreReporter = sitePermissions.includes("score_reporter");
  const isCoordinator = sitePermissions.includes("coordinator");
  const isLiteAdmin = sitePermissions.includes("lite_admin");
  const isAdmin =
    sitePermissions.includes("admin") ||
    data.is_admin === true;
  const isTrustedAdmin =
    sitePermissions.includes("trusted_admin") ||
    orgPermissions.includes("trusted_admin");

  return {
    id: String(data.person_id),
    firstName: data.first_name,
    lastName: data.last_name,
    email: data.email,
    avatarUrl: data.avatar_url ?? data.profile_picture,
    role: (data.role ?? "player") as User["role"],
    phone: data.phone ?? data.phone_number,
    isYouth: data.is_youth,
    dateOfBirth: data.date_of_birth,
    gender: data.gender,
    city: data.city,
    state: data.state,
    zip: data.zip,
    about: data.about,
    address: data.address,
    emergencyContact: data.emergency_contact,
    familyId: data.family_id != null ? String(data.family_id) : undefined,
    sitePermission: sitePermission,
    sitePermissions: sitePermissions.length > 0 ? sitePermissions : undefined,
    orgPermissions: orgPermissions.length > 0 ? orgPermissions : undefined,
    isSiteEditor,
    isScoreReporter,
    isCoordinator,
    isLiteAdmin,
    isAdmin,
    isTrustedAdmin,
    organizationId: data.organization_id,
    organizationName: data.organization_name,
    status: data.status,
    createdAt: data.created_at,
    lastLogin: data.last_login,
  };
}

const VALID_REGISTRATION_STATUSES: Registration["status"][] = ["accepted", "pending", "waitlisted", "incomplete", "inactive", "interested", "active", "paid", "refunded", "partial"];
const VALID_REGISTRATION_TYPES: Registration["type"][] = ["team", "league", "event"];

function mapRegistrationStatus(status: string | undefined): Registration["status"] {
  if (!status) {
    return "pending";
  }
  if (VALID_REGISTRATION_STATUSES.includes(status as Registration["status"])) {
    return status as Registration["status"];
  }
  console.warn(`Unknown registration status "${status}" from TopScore API. Defaulting to "pending". Known statuses: ${VALID_REGISTRATION_STATUSES.join(", ")}`);
  return "pending";
}

function mapRegistrationType(type: string | undefined): Registration["type"] {
  if (!type) {
    return "league";
  }
  if (VALID_REGISTRATION_TYPES.includes(type as Registration["type"])) {
    return type as Registration["type"];
  }
  return "league";
}

export function mapRegistration(data: ApiRegistration): Registration {
  const registrationId = data.registration_id ?? data.id;
  if (registrationId == null) {
    console.warn("mapRegistration: Missing registration_id and id:", data);
  }
  return {
    id: String(registrationId ?? "unknown"),
    type: mapRegistrationType(data.type),
    status: mapRegistrationStatus(data.status),
    organizationName: data.organization_name ?? data.name ?? "",
    seasonName: data.season_name,
    startDate: data.start_date ?? "",
    endDate: data.end_date,
    teamId: data.team_id != null ? String(data.team_id) : undefined,
    leagueId: data.league_id != null ? String(data.league_id) : undefined,
    eventId: data.event_id != null ? String(data.event_id) : undefined,
    division: data.division,
  };
}

export function mapLocation(data: ApiLocation | null | undefined): Location | undefined {
  if (!data) return undefined;
  if (data.id == null) {
    console.warn("Location missing id:", data);
    return undefined;
  }
  return {
    id: String(data.id),
    name: data.name ?? "",
    address: data.address ?? "",
    city: data.city ?? "",
    state: data.state,
    zip: data.zip,
    latitude: data.latitude,
    longitude: data.longitude,
    fieldCount: data.field_count,
    notes: data.notes,
    isIndoor: data.is_indoor,
  };
}

export function mapScore(data: ApiEvent["score"]): Event["score"] {
  if (data == null) return undefined;
  return {
    homeTeamName: data.home_team_name ?? "",
    awayTeamName: data.away_team_name ?? "",
    homeScore: data.home_score ?? 0,
    awayScore: data.away_score ?? 0,
    reportedAt: data.reported_at,
    reportedBy: data.reported_by,
    isOvertime: data.is_overtime,
    isFinal: data.is_final,
  };
}

const VALID_EVENT_TYPES: Event["type"][] = ["game", "practice", "tournament", "other"];
const VALID_EVENT_STATUSES: Event["status"][] = ["scheduled", "in_progress", "completed", "cancelled", "postponed"];

function mapEventType(type: string | undefined): Event["type"] {
  if (!type) {
    return "other";
  }
  if (VALID_EVENT_TYPES.includes(type as Event["type"])) {
    return type as Event["type"];
  }
  console.warn(`Unknown event type "${type}" from TopScore API. Defaulting to "other". Known types: ${VALID_EVENT_TYPES.join(", ")}`);
  return "other";
}

function mapEventStatus(status: string | undefined): Event["status"] {
  if (!status) {
    return "scheduled";
  }
  if (VALID_EVENT_STATUSES.includes(status as Event["status"])) {
    return status as Event["status"];
  }
  console.warn(`Unknown event status "${status}" from TopScore API. Defaulting to "scheduled". Known statuses: ${VALID_EVENT_STATUSES.join(", ")}`);
  return "scheduled";
}

export function mapEvent(data: ApiEvent): Event {
  const title = data.name ?? data.title;
  const fallbackTitle = data.team_name && data.opponent_name
    ? `${data.team_name} vs ${data.opponent_name}`
    : data.team_name
      ? data.team_name
      : data.opponent_name
        ? data.opponent_name
        : "Untitled Event";

  return {
    id: String(data.id),
    type: mapEventType(data.type),
    status: mapEventStatus(data.status),
    title: title ?? fallbackTitle,
    startDate: data.start_date,
    endDate: data.end_date,
    teamId: data.team_id != null ? String(data.team_id) : undefined,
    teamName: data.team_name,
    opponentId: data.opponent_id != null ? String(data.opponent_id) : undefined,
    opponentName: data.opponent_name,
    location: mapLocation(data.location),
    notes: data.notes,
    attendance: data.attendance,
    score: mapScore(data.score),
    isHome: data.is_home,
    bracketName: data.bracket_name,
    poolName: data.pool_name,
    roundNumber: data.round_number,
    gameNumber: data.game_number,
    division: data.division,
  };
}

export function mapGame(data: ApiGame): Event {
  const fallbackTitle = data.home_team_name && data.away_team_name
    ? `${data.home_team_name} vs ${data.away_team_name}`
    : data.home_team_name
      ? data.home_team_name
      : data.away_team_name
        ? data.away_team_name
        : "Untitled Game";

  const score = (data.home_score !== undefined || data.away_score !== undefined)
    ? {
        homeTeamName: data.home_team_name ?? "",
        awayTeamName: data.away_team_name ?? "",
        homeScore: data.home_score ?? 0,
        awayScore: data.away_score ?? 0,
        isOvertime: data.is_overtime,
        isFinal: data.is_final,
      }
    : undefined;

  return {
    id: String(data.id),
    type: "game",
    status: mapEventStatus(data.status),
    title: fallbackTitle,
    startDate: data.start_date ?? data.scheduled_date,
    endDate: data.end_date,
    teamId: data.home_team_id != null ? String(data.home_team_id) : undefined,
    teamName: data.home_team_name,
    opponentId: data.away_team_id != null ? String(data.away_team_id) : undefined,
    opponentName: data.away_team_name,
    location: mapLocation(data.location),
    notes: data.notes,
    score: score,
    isHome: undefined,
    bracketName: data.bracket_name,
    poolName: data.pool_name,
    roundNumber: data.round_number,
    gameNumber: data.game_number,
    division: data.division,
  };
}

export function mapRosterMember(m: ApiRosterMember | ApiPerson): TeamMember {
  const person = "person" in m && m.person ? m.person : (m as ApiPerson);
  const rosterMember = "jersey_number" in m ? m : null;

  const ROLE_PRIORITY: TeamMember["role"][] = ["captain", "coach", "assistant_coach", "player", "admin", "chaperone", "volunteer", "staff"];
  const VALID_ROLES = new Set(ROLE_PRIORITY);
  const ROLE_ALIASES: Record<string, TeamMember["role"]> = {
    team_admin: "admin",
    team_captain: "captain",
  };

  let role: TeamMember["role"] = "player";
  const rawRole = rosterMember?.role;
  if (rawRole !== undefined) {
    if (Array.isArray(rawRole)) {
      const validRoles = rawRole
        .map((r) => ROLE_ALIASES[r] ?? r)
        .filter((r) => VALID_ROLES.has(r as TeamMember["role"])) as TeamMember["role"][];
      if (validRoles.length > 0) {
        validRoles.sort((a, b) => ROLE_PRIORITY.indexOf(a) - ROLE_PRIORITY.indexOf(b));
        role = validRoles[0];
      } else {
        const invalidRoles = rawRole.filter((r) => !VALID_ROLES.has(r as TeamMember["role"]));
        if (invalidRoles.length > 0) {
          console.warn(`Unknown team roles received from API: ${invalidRoles.join(", ")}. Defaulting to "player".`);
        }
      }
    } else {
      const normalizedRole = ROLE_ALIASES[rawRole] ?? rawRole;
      if (VALID_ROLES.has(normalizedRole as TeamMember["role"])) {
        role = normalizedRole as TeamMember["role"];
      } else {
        console.warn(`Unknown team role received from API: "${rawRole}". Defaulting to "player".`);
      }
    }
  }

  const personId = rosterMember?.person_id ?? person.person_id;
  if (personId == null) {
    console.warn("mapRosterMember: Missing person_id", { rosterMember, person });
    return {
      id: String(rosterMember?.id ?? "unknown"),
      personId: "unknown",
      firstName: person.first_name ?? "Unknown",
      lastName: person.last_name ?? "Member",
      jerseyNumber: rosterMember?.jersey_number,
      position: rosterMember?.position,
      role: "player",
      avatarUrl: person.avatar_url,
      email: person.email,
      phone: person.phone,
      status: rosterMember?.status,
      joinedAt: rosterMember?.joined_at,
    };
  }
  return {
    id: String(rosterMember?.id ?? personId),
    personId: String(personId),
    firstName: person.first_name,
    lastName: person.last_name,
    jerseyNumber: rosterMember?.jersey_number,
    position: rosterMember?.position,
    role,
    avatarUrl: person.avatar_url,
    email: person.email,
    phone: person.phone,
    status: rosterMember?.status,
    joinedAt: rosterMember?.joined_at,
  };
}

export function mapRoster(roster: ApiTeam["roster"]): TeamMember[] {
  if (!roster) return [];
  return roster.map(mapRosterMember);
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
    roster: data.roster ? mapRoster(data.roster) : undefined,
    standingRoster: data.standing_roster ? mapRoster(data.standing_roster) : undefined,
    activeRoster: data.active_roster ? mapRoster(data.active_roster) : undefined,
    locations: data.locations
      ? (data.locations.map((loc) => mapLocation(loc)).filter((loc): loc is Location => loc !== undefined))
      : undefined,
    trueskillRating: data.trueskill_rating,
    rank: data.rank,
    captainId: data.captain_id != null ? String(data.captain_id) : undefined,
    isRegistered: data.is_registered,
    eventCount: data.event_count,
    myMembership: data.my_membership ? {
      role: data.my_membership.role,
      joinedAt: data.my_membership.joined_at,
      status: data.my_membership.status,
    } : undefined,
  };
}

export function mapArticle(data: ApiArticle): Article {
  return {
    id: String(data.id),
    title: data.title,
    summary: data.summary,
    content: data.content,
    slug: data.slug,
    publishedAt: data.published_at,
    category: data.category,
    imageUrl: data.image_url,
    authorName: data.author_name,
  };
}

export function mapFamilyMember(data: ApiFamilyMember): FamilyMember {
  return {
    personId: String(data.person_id),
    name: data.name,
    email: data.email,
    role: data.role,
    isPrimary: data.is_primary,
  };
}

export function mapFamily(data: ApiFamily): Family {
  return {
    id: String(data.id),
    name: data.name,
    members: data.members?.map(mapFamilyMember) ?? [],
  };
}

export function mapMembership(data: ApiMembership): Membership {
  return {
    id: String(data.id),
    type: data.type,
    tier: data.tier,
    status: data.status as Membership["status"],
    startDate: data.start_date,
    endDate: data.end_date,
    organizationName: data.organization_name,
  };
}

export function mapAttendanceRecord(data: ApiAttendanceRecord): AttendanceRecord {
  return {
    personId: String(data.person_id),
    personName: data.person_name,
    status: data.status as AttendanceRecord["status"],
    respondedAt: data.responded_at,
    notes: data.notes,
  };
}

export function mapEventAttendance(data: ApiAttendance): EventAttendance {
  return {
    eventId: String(data.event_id),
    eventName: data.event_name,
    eventDate: data.event_date,
    teamId: String(data.team_id),
    records: data.records?.map(mapAttendanceRecord) ?? [],
    survey: data.survey ? {
      id: String(data.survey.id),
      name: data.survey.name,
      questions: data.survey.questions.map((q) => ({
        id: String(q.id),
        text: q.text,
        type: (["yes_no", "multiple_choice", "text"].includes(q.type) ? q.type : "text") as "yes_no" | "multiple_choice" | "text",
        options: q.options,
        pointValue: q.point_value ?? undefined,
        required: q.required,
      })),
      hoursAvailable: data.survey.hours_available,
      isDefault: data.survey.is_default,
    } : undefined,
  };
}

export function mapScheduleExport(data: ApiSchedule): ScheduleExport {
  return {
    teamId: String(data.team_id),
    icsUrl: data.ics_url ?? "",
    htmlUrl: data.html_url ?? "",
    googleCalendarUrl: data.google_calendar_url,
    outlookCalendarUrl: data.outlook_calendar_url,
  };
}

export function mapStandingEntry(data: ApiStandingEntry): TeamStanding {
  return {
    rank: data.rank,
    teamId: String(data.team_id),
    teamName: data.team_name,
    division: data.division,
    wins: data.wins,
    losses: data.losses,
    ties: data.ties,
    trueskillRating: data.trueskill_rating,
    gamesBehind: data.games_behind,
    pointDifferential: data.point_differential,
  };
}

export function mapStandings(data: ApiStandings): EventStandings {
  return {
    eventId: String(data.event_id),
    eventName: data.event_name,
    standings: data.standings?.map(mapStandingEntry) ?? [],
  };
}

export function mapPractice(data: ApiPractice): Practice {
  return {
    id: String(data.id),
    teamId: String(data.team_id),
    name: data.name,
    startDate: data.start_date,
    endDate: data.end_date,
    location: data.location ? mapLocation(data.location) : undefined,
    notes: data.notes,
    attendeeIds: data.attendee_ids?.map(String),
  };
}

export function mapWaiver(data: ApiWaiver): Waiver {
  return {
    id: String(data.id),
    name: data.name,
    description: data.description,
    eventId: data.event_id != null ? String(data.event_id) : undefined,
    productId: data.product_id != null ? String(data.product_id) : undefined,
    isSigned: data.is_signed,
    signedAt: data.signed_at,
    expiresAt: data.expires_at,
  };
}

export function mapPollOption(data: ApiPollOption): PollOption {
  return {
    id: String(data.id),
    text: data.text,
    votes: data.votes,
  };
}

export function mapPoll(data: ApiPoll): Poll {
  return {
    id: String(data.id),
    question: data.question,
    options: data.options?.map(mapPollOption) ?? [],
    expiresAt: data.expires_at,
    totalVotes: data.total_votes,
  };
}

export function mapNotification(data: ApiNotification): AppNotification {
  return {
    id: String(data.id),
    type: data.type,
    title: data.title,
    body: data.body,
    data: data.data,
    readAt: data.read_at,
    createdAt: data.created_at,
  };
}

export function mapBracketGame(data: ApiBracketGame): BracketGame {
  return {
    id: String(data.id),
    roundNumber: data.round_number,
    gameNumber: data.game_number,
    homeTeamId: data.home_team_id != null ? String(data.home_team_id) : undefined,
    homeTeamName: data.home_team_name,
    awayTeamId: data.away_team_id != null ? String(data.away_team_id) : undefined,
    awayTeamName: data.away_team_name,
    homeScore: data.home_score,
    awayScore: data.away_score,
    isComplete: data.is_complete,
    winnerId: data.winner_id != null ? String(data.winner_id) : undefined,
    bracketPosition: data.bracket_position,
  };
}

export function mapBracketRound(data: ApiBracketRound): BracketRound {
  return {
    number: data.number,
    name: data.name,
    games: data.games?.map(mapBracketGame) ?? [],
  };
}

export function mapBracket(data: ApiEventBracket): Bracket {
  const VALID_BRACKET_TYPES: BracketType[] = ["single_elimination", "double_elimination", "round_robin", "pool_play"];
  const type = VALID_BRACKET_TYPES.includes(data.type as BracketType)
    ? data.type as BracketType
    : "single_elimination";

  return {
    id: String(data.id),
    name: data.name,
    type,
    rounds: data.rounds?.map(mapBracketRound) ?? [],
  };
}

export function mapMailMessage(data: ApiMailMessage): MailMessage {
  return {
    id: String(data.id),
    subject: data.subject,
    body: data.body,
    sentAt: data.sent_at,
    recipientCount: data.recipient_count,
  };
}