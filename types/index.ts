// ─── User / Auth ────────────────────────────────────────────────────────────

export type UserRole = "player" | "captain" | "coach" | "league_admin";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // unix timestamp
}

// ─── Registrations ──────────────────────────────────────────────────────────

export type RegistrationStatus =
  | "active"
  | "pending"
  | "waitlisted"
  | "cancelled"
  | "completed";

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
}

// ─── Teams ───────────────────────────────────────────────────────────────────

export type TeamRole = "player" | "captain" | "coach";

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
  captainId?: string;
  supabaseTeamId?: string;
  wins?: number;
  losses?: number;
  ties?: number;
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
}

export interface GameScore {
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  reportedAt?: string;
  reportedBy?: string;
}

export interface Event {
  id: string;
  type: EventType;
  status: EventStatus;
  title: string;
  startDate: string;  // ISO 8601
  endDate?: string;
  location?: Location;
  teamId: string;
  teamName: string;
  opponentId?: string;
  opponentName?: string;
  notes?: string;
  score?: GameScore;
}

// ─── Announcements ───────────────────────────────────────────────────────────

export type AnnouncementTargetType = "league" | "division" | "team";
export type AnnouncementAuthorRole = "league_admin" | "team_captain";

export interface PaginationParams {
  limit?: number; // Default: 50, max: 100
  offset?: number; // For cursor-based pagination
}

export interface FetchAnnouncementsResult<T> {
  data: T[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: AnnouncementAuthorRole;
  targetType: AnnouncementTargetType;
  targetId: string;
  isUrgent: boolean;
  isRead?: boolean;
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
  scoreNotificationsEnabled: boolean;
  scheduleRemindersEnabled: boolean;
  quietHoursStart?: string; // "HH:mm"
  quietHoursEnd?: string;
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
