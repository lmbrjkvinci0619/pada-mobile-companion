// ─── User / Auth ────────────────────────────────────────────────────────────

export type UserRole = "player" | "captain" | "coach" | "assistant_coach" | "admin" | "team_admin" | "league_admin" | "site_admin";

export type SitePermission =
  | "account_holder"
  | "editor"
  | "score_reporter"
  | "coordinator"
  | "lite_admin"
  | "admin"
  | "trusted_admin";

export type OrgPermission = "admin" | "trusted_admin";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  role: UserRole;
  phone?: string;
  isYouth?: boolean;
  dateOfBirth?: string;
  gender?: string;
  city?: string;
  state?: string;
  zip?: string;
  about?: string;
  address?: string;
  emergencyContact?: string;
  familyId?: string;
  sitePermission?: SitePermission;
  sitePermissions?: SitePermission[];
  orgPermissions?: OrgPermission[];
  isSiteEditor?: boolean;
  isScoreReporter?: boolean;
  isCoordinator?: boolean;
  isLiteAdmin?: boolean;
  isAdmin?: boolean;
  isTrustedAdmin?: boolean;
  organizationId?: number;
  organizationName?: string;
  status?: "active" | "pending" | "suspended";
  createdAt?: string;
  lastLogin?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // unix timestamp
}

export interface Family {
  id: string;
  name: string;
  members: FamilyMember[];
}

export interface FamilyMember {
  personId: string;
  name: string;
  email: string;
  role: string;
  isPrimary: boolean;
}

export interface Membership {
  id: string;
  type: string;
  tier?: string;
  status: "active" | "expired" | "pending";
  startDate: string;
  endDate?: string;
  organizationName?: string;
}

// ─── Registrations ──────────────────────────────────────────────────────────

export type RegistrationStatus =
  | "accepted"
  | "pending"
  | "waitlisted"
  | "incomplete"
  | "inactive"
  | "interested"
  | "active"
  | "paid"
  | "refunded"
  | "partial";

export type RegistrationType = "team" | "league" | "event";

export interface Registration {
  id: string;
  type: RegistrationType;
  status: RegistrationStatus;
  organizationName: string;
  seasonName?: string;
  startDate: string;  // ISO 8601
  endDate?: string;
  teamId?: string;
  leagueId?: string;
  eventId?: string;
  division?: string;
}

// ─── Teams ───────────────────────────────────────────────────────────────────

export type TeamRole = 
  | "player" 
  | "captain" 
  | "coach" 
  | "assistant_coach" 
  | "admin" 
  | "chaperone" 
  | "volunteer" 
  | "staff";

export type TeamAdminRole = "captain" | "coach" | "assistant_coach" | "admin";

export type PlayingRole = "player" | "captain";

export type CoachRole = "coach" | "assistant_coach";

export interface TeamMember {
  id: string;
  personId: string;
  firstName: string;
  lastName: string;
  jerseyNumber?: string;
  position?: string;
  role: TeamRole;
  avatarUrl?: string;
  email?: string;
  phone?: string;
  status?: string;
  joinedAt?: string;
}

export type RosterType = "active" | "standing" | "event";

export interface TeamRoster {
  type: RosterType;
  teamId: string;
  eventId?: string;
  members: TeamMember[];
  updatedAt: string;
}

export interface Team {
  id: string;
  name: string;
  division?: string;
  sport: string;
  season?: string;
  logoUrl?: string;
  color?: string;        // hex
  roster?: TeamMember[];
  standingRoster?: TeamMember[];
  activeRoster?: TeamMember[];
  captainId?: string;
  supabaseTeamId?: string;
  wins?: number;
  losses?: number;
  ties?: number;
  trueskillRating?: number;
  rank?: number;
  isRegistered?: boolean;
  locations?: Location[];
  eventCount?: number;
  myMembership?: {
    role: TeamRole;
    joinedAt?: string;
    status?: "active" | "inactive" | "pending";
  };
}

export interface TeamStanding {
  rank: number;
  teamId: string;
  teamName: string;
  division?: string;
  wins: number;
  losses: number;
  ties: number;
  trueskillRating: number;
  gamesBehind?: number;
  pointDifferential?: number;
}

export interface TeamStats {
  teamId: string;
  eventsPlayed: number;
  totalWins: number;
  totalLosses: number;
  totalTies: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDifferential: number;
  trueskillRating: number;
  trueskillDeviation?: number;
}

export interface RosterMember {
  id?: string;
  person?: User;
  personId?: string;
  jerseyNumber?: string;
  position?: string;
  role?: TeamRole | TeamRole[];
  roles?: TeamRole[];
  status?: "active" | "inactive" | "pending";
  joinedAt?: string;
  email?: string;
  phone?: string;
}

export interface EventRosterSettings {
  eventId: string;
  minPlayers?: number;
  maxPlayers?: number;
  allowWaitlist?: boolean;
  rosterDeadline?: string;
  canAddPlayers?: boolean;
  canRemovePlayers?: boolean;
  canChangeRoles?: boolean;
}

export interface EventStandings {
  eventId: string;
  eventName: string;
  standings: TeamStanding[];
}

// ─── Events / Schedule ───────────────────────────────────────────────────────

export type EventType = "game" | "practice" | "tournament" | "other";
export type EventStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "postponed";

export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state?: string;
  zip?: string;
  latitude?: number;
  longitude?: number;
  fieldCount?: number;
  notes?: string;
  isIndoor?: boolean;
}

export interface GameScore {
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  reportedAt?: string;
  reportedBy?: string;
  isOvertime?: boolean;
  isFinal?: boolean;
}

export interface Event {
  id: string;
  type: EventType;
  status: EventStatus;
  title: string;
  startDate?: string;  // ISO 8601
  endDate?: string;
  location?: Location;
  teamId?: string;
  teamName?: string;
  opponentId?: string;
  opponentName?: string;
  notes?: string;
  score?: GameScore;
  attendance?: number;
  isHome?: boolean;
  bracketName?: string;
  poolName?: string;
  roundNumber?: number;
  gameNumber?: number;
  division?: string;
}

export interface ScheduleExport {
  teamId: string;
  icsUrl: string;
  htmlUrl: string;
  googleCalendarUrl?: string;
  outlookCalendarUrl?: string;
}

// ─── Attendance ─────────────────────────────────────────────────────────────

export type AttendanceStatus = "attending" | "declined" | "maybe" | "no_response";

export interface AttendanceSurvey {
  id: string;
  name: string;
  questions: AttendanceSurveyQuestion[];
  hoursAvailable?: number;
  isDefault?: boolean;
}

export interface AttendanceSurveyQuestion {
  id: string;
  text: string;
  type: "yes_no" | "multiple_choice" | "text";
  options?: string[];
  pointValue?: number;
  required?: boolean;
}

export interface AttendanceRecord {
  personId: string;
  personName: string;
  status: AttendanceStatus;
  respondedAt?: string;
  notes?: string;
  surveyResponses?: AttendanceSurveyResponse[];
}

export interface AttendanceSurveyResponse {
  questionId: number;
  answer: string | boolean;
  points?: number;
}

export interface EventAttendance {
  eventId: string;
  eventName: string;
  eventDate: string;
  teamId: string;
  records: AttendanceRecord[];
  survey?: AttendanceSurvey;
}

// ─── Practice ────────────────────────────────────────────────────────────────

export interface Practice {
  id: string;
  teamId: string;
  name: string;
  startDate: string;
  endDate?: string;
  location?: Location;
  notes?: string;
  attendeeIds?: string[];
}

// ─── Announcements ───────────────────────────────────────────────────────────

export type AnnouncementTargetType = "league" | "division" | "team";
export type AnnouncementAuthorRole = "league_admin" | "team_captain";
export type AnnouncementType = "pada_org" | "league_longterm" | "game";

export interface PaginationParams {
  page?: number;
  per_page?: number;
  limit?: number;
  offset?: number;
}

export interface FetchAnnouncementsResult<T> {
  data: T[];
  pagination?: {
    total: number;
    limit?: number;
    offset?: number;
    hasMore?: boolean;
    page?: number;
    per_page?: number;
    total_pages?: number;
  };
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: AnnouncementAuthorRole;
  announcementType: AnnouncementType;
  targetType: AnnouncementTargetType;
  targetId: string;
  isUrgent: boolean;
  isRead?: boolean;
  isHidden?: boolean;
  createdAt: string;
  expiresAt?: string;
}

export type FetchAnnouncementsOptions = PaginationParams & {
  userId: string;
  teamIds?: string[]; // Optional filter for specific teams
};

// ─── Notifications ───────────────────────────────────────────────────────────

export interface NotificationPreferences {
  pushEnabled: boolean;
  announcementsEnabled: boolean;
  leagueAnnouncementsEnabled: boolean;
  gameAnnouncementsEnabled: boolean;
  padaOrgAnnouncementsEnabled: boolean;
  scoreNotificationsEnabled: boolean;
  scheduleRemindersEnabled: boolean;
  quietHoursStart?: string; // "HH:mm"
  quietHoursEnd?: string;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  readAt?: string;
  createdAt: string;
}

// ─── Calendar ────────────────────────────────────────────────────────────────

export type CalendarSubscriptionType =
  | "team"
  | "all_teams"
  | "individual_event";

export interface CalendarSubscription {
  id: string;
  subscriptionType: CalendarSubscriptionType;
  teamId?: string;
  eventId?: string;
  icsToken: string;
  createdAt: string;
  lastSyncedAt?: string;
}

// ─── Articles / News ─────────────────────────────────────────────────────────

export interface Article {
  id: string;
  title: string;
  summary?: string;
  content?: string;
  slug?: string;
  publishedAt?: string;
  category?: string;
  imageUrl?: string;
  authorName?: string;
}

// ─── Waivers ─────────────────────────────────────────────────────────────────

export interface Waiver {
  id: string;
  name: string;
  description?: string;
  eventId?: string;
  productId?: string;
  isSigned: boolean;
  signedAt?: string;
  expiresAt?: string;
}

// ─── Polls / Voting ──────────────────────────────────────────────────────────

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  expiresAt?: string;
  totalVotes?: number;
}

// ─── Mail / Communications ────────────────────────────────────────────────────

export interface MailMessage {
  id: string;
  subject: string;
  body: string;
  sentAt: string;
  recipientCount: number;
}

// ─── Brackets / Tournaments ──────────────────────────────────────────────────

export type BracketType = "single_elimination" | "double_elimination" | "round_robin" | "pool_play";

export interface BracketGame {
  id: string;
  roundNumber: number;
  gameNumber: number;
  homeTeamId?: string;
  homeTeamName?: string;
  awayTeamId?: string;
  awayTeamName?: string;
  homeScore?: number;
  awayScore?: number;
  isComplete: boolean;
  winnerId?: string;
  bracketPosition: string;
}

export interface BracketRound {
  number: number;
  name: string;
  games: BracketGame[];
}

export interface Bracket {
  id: string;
  name: string;
  type: BracketType;
  rounds: BracketRound[];
}
