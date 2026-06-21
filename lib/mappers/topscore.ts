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
  return {
    id: String(data.id),
    firstName: data.first_name,
    lastName: data.last_name,
    email: data.email,
    avatarUrl: data.avatar_url,
    role: (data.role ?? "player") as User["role"],
    phone: data.phone,
    isAdmin: data.is_admin,
    isYouth: data.is_youth,
    dateOfBirth: data.date_of_birth,
    gender: data.gender,
    city: data.city,
    state: data.state,
    zip: data.zip,
    about: data.about,
    familyId: data.family_id ? String(data.family_id) : undefined,
    sitePermission: data.site_permission,
    orgPermissions: data.org_permissions,
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

export function mapLocation(data: ApiLocation | undefined): Location | undefined {
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
    fieldCount: data.field_count,
    notes: data.notes,
    isIndoor: data.is_indoor,
  };
}

export function mapScore(data: ApiEvent["score"]): Event["score"] {
  if (!data) return undefined;
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
    opponentId: data.opponent_id ? String(data.opponent_id) : undefined,
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
  };
}

export function mapRosterMember(m: ApiRosterMember): TeamMember {
  const person = m.person ?? ({} as ApiPerson);
  return {
    id: String(m.id ?? person.id),
    personId: String(m.person_id ?? person.id),
    firstName: person.first_name,
    lastName: person.last_name,
    jerseyNumber: m.jersey_number,
    position: m.position,
    role: (m.role ?? "player") as TeamMember["role"],
    avatarUrl: person.avatar_url,
    email: person.email,
    phone: person.phone,
    status: m.status,
    joinedAt: m.joined_at,
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
    roster: mapRoster(data.roster),
    standingRoster: data.standing_roster ? mapRoster(data.standing_roster) : undefined,
    activeRoster: data.active_roster ? mapRoster(data.active_roster) : undefined,
    locations: data.locations?.map((loc) => mapLocation(loc) as Location),
    trueskillRating: data.trueskill_rating,
    rank: data.rank,
    captainId: data.captain_id ? String(data.captain_id) : undefined,
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
  };
}

export function mapScheduleExport(data: ApiSchedule): ScheduleExport {
  return {
    teamId: String(data.team_id),
    icsUrl: data.ics_url,
    htmlUrl: data.html_url,
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
    eventId: data.event_id ? String(data.event_id) : undefined,
    productId: data.product_id ? String(data.product_id) : undefined,
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
    homeTeamId: data.home_team_id ? String(data.home_team_id) : undefined,
    homeTeamName: data.home_team_name,
    awayTeamId: data.away_team_id ? String(data.away_team_id) : undefined,
    awayTeamName: data.away_team_name,
    homeScore: data.home_score,
    awayScore: data.away_score,
    isComplete: data.is_complete,
    winnerId: data.winner_id ? String(data.winner_id) : undefined,
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
  return {
    id: String(data.id),
    name: data.name,
    type: data.type as BracketType,
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