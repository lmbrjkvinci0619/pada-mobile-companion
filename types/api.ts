export interface ApiPerson {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string;
  role?: "player" | "captain" | "coach" | "league_admin";
  phone?: string;
  is_admin?: boolean;
  is_youth?: boolean;
  date_of_birth?: string;
  gender?: string;
  city?: string;
  state?: string;
  zip?: string;
  about?: string;
  family_id?: number;
  site_permission?: SitePermission;
  org_permissions?: OrgPermission[];
}

export type SitePermission = 
  | "account_holder" 
  | "editor" 
  | "score_reporter" 
  | "coordinator" 
  | "lite_admin" 
  | "admin" 
  | "trusted_admin";

export type OrgPermission = "admin" | "trusted_admin";

export type RegistrationStatus = "accepted" | "pending" | "waitlisted" | "incomplete" | "inactive" | "interested";

export interface ApiRegistration {
  id: number;
  type?: string;
  status?: RegistrationStatus;
  organization_name?: string;
  name?: string;
  season_name?: string;
  start_date?: string;
  end_date?: string;
  team_id?: number;
  league_id?: number;
  event_id?: number;
  division?: string;
  event_roster?: ApiRosterMember[];
  payment_status?: "pending" | "paid" | "refunded" | "partial";
  amount_due?: number;
  amount_paid?: number;
}

export type TeamRole = 
  | "player" 
  | "captain" 
  | "coach" 
  | "assistant_coach" 
  | "admin" 
  | "chaperone" 
  | "volunteer" 
  | "staff";

export interface ApiTeam {
  id: number;
  name: string;
  division?: string;
  sport?: string;
  season?: string;
  logo_url?: string;
  color?: string;
  record?: {
    wins?: number;
    losses?: number;
    ties?: number;
  };
  roster?: ApiRosterMember[];
  standing_roster?: ApiRosterMember[];
  active_roster?: ApiRosterMember[];
  locations?: ApiLocation[];
  trueskill_rating?: number;
  rank?: number;
  is_registered?: boolean;
  event_count?: number;
  captain_id?: number;
}

export interface ApiRosterMember {
  id?: number;
  person?: ApiPerson;
  person_id?: number;
  jersey_number?: string;
  position?: string;
  role?: TeamRole | TeamRole[];
  roles?: TeamRole[];
  status?: "active" | "inactive" | "pending";
  joined_at?: string;
  email?: string;
  phone?: string;
}

export interface ApiEvent {
  id: number;
  type?: string;
  status?: string;
  name?: string;
  title?: string;
  start_date?: string;
  end_date?: string;
  team_id?: number;
  team_name?: string;
  opponent_id?: number;
  opponent_name?: string;
  location?: ApiLocation;
  notes?: string;
  score?: ApiScore;
  attendance?: number;
  is_home?: boolean;
  bracket_name?: string;
  pool_name?: string;
  round_number?: number;
  game_number?: number;
  division?: string;
}

export interface ApiLocation {
  id?: number;
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  latitude?: number;
  longitude?: number;
  field_count?: number;
  notes?: string;
  is_indoor?: boolean;
}

export interface ApiScore {
  home_team_name?: string;
  away_team_name?: string;
  home_score?: number;
  away_score?: number;
  reported_at?: string;
  reported_by?: string;
  is_overtime?: boolean;
  is_final?: boolean;
}

export interface ApiAnnouncement {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  author_role: "league_admin" | "team_captain";
  announcement_type?: "pada_org" | "league_longterm" | "game";
  target_type: "league" | "division" | "team";
  target_id: string;
  is_urgent: boolean;
  created_at: string;
  expires_at?: string;
}

export interface ApiArticle {
  id: number;
  title: string;
  summary?: string;
  content?: string;
  slug?: string;
  published_at?: string;
  category?: string;
  image_url?: string;
  author_name?: string;
}

export interface ApiAnnouncementCreate {
  title: string;
  content: string;
  target_type: "league" | "division" | "team";
  target_id: string;
  is_urgent: boolean;
}

export interface ApiSchedule {
  team_id: number;
  ics_url: string;
  html_url: string;
  google_calendar_url?: string;
  outlook_calendar_url?: string;
}

export interface ApiStandings {
  event_id: number;
  event_name: string;
  standings: ApiStandingEntry[];
}

export interface ApiStandingEntry {
  rank: number;
  team_id: number;
  team_name: string;
  division?: string;
  wins: number;
  losses: number;
  ties: number;
  trueskill_rating: number;
  games_behind?: number;
  point_differential?: number;
}

export interface ApiAttendance {
  event_id: number;
  event_name: string;
  event_date: string;
  team_id: number;
  records: ApiAttendanceRecord[];
  survey?: ApiAttendanceSurvey;
}

export interface ApiAttendanceRecord {
  person_id: number;
  person_name: string;
  status: "attending" | "declined" | "maybe" | "no_response";
  responded_at?: string;
  notes?: string;
  survey_responses?: ApiAttendanceSurveyResponse[];
}

export interface ApiAttendanceSurvey {
  id: number;
  name: string;
  questions: ApiAttendanceSurveyQuestion[];
  hours_available?: number;
  is_default?: boolean;
}

export interface ApiAttendanceSurveyQuestion {
  id: number;
  text: string;
  type: "yes_no" | "multiple_choice" | "text";
  options?: string[];
  point_value?: number;
  required?: boolean;
}

export interface ApiAttendanceSurveyResponse {
  question_id: number;
  answer: string | boolean;
  points?: number;
}

export interface ApiWaiver {
  id: number;
  name: string;
  description?: string;
  event_id?: number;
  product_id?: number;
  is_signed: boolean;
  signed_at?: string;
  expires_at?: string;
}

export interface ApiFamily {
  id: number;
  name: string;
  members: ApiFamilyMember[];
}

export interface ApiFamilyMember {
  person_id: number;
  name: string;
  email: string;
  role: string;
  is_primary: boolean;
}

export interface ApiMembership {
  id: number;
  type: string;
  tier?: string;
  status: "active" | "expired" | "pending";
  start_date: string;
  end_date?: string;
  organization_name?: string;
}

export interface ApiNotification {
  id: number;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read_at?: string;
  created_at: string;
}

export interface ApiPractice {
  id: number;
  team_id: number;
  name: string;
  start_date: string;
  end_date?: string;
  location?: ApiLocation;
  notes?: string;
  attendee_ids?: number[];
}

export interface ApiPoll {
  id: number;
  question: string;
  options: ApiPollOption[];
  expires_at?: string;
  total_votes?: number;
}

export interface ApiPollOption {
  id: number;
  text: string;
  votes: number;
}

export interface ApiMailMessage {
  id: number;
  subject: string;
  body: string;
  sent_at: string;
  recipient_count: number;
}

export interface ApiEventBracket {
  id: number;
  name: string;
  type: "single_elimination" | "double_elimination" | "round_robin" | "pool_play";
  rounds: ApiBracketRound[];
}

export interface ApiBracketRound {
  number: number;
  name: string;
  games: ApiBracketGame[];
}

export interface ApiBracketGame {
  id: number;
  round_number: number;
  game_number: number;
  home_team_id?: number;
  home_team_name?: string;
  away_team_id?: number;
  away_team_name?: string;
  home_score?: number;
  away_score?: number;
  is_complete: boolean;
  winner_id?: number;
  bracket_position: string;
}

export interface ApiRosterInvitation {
  id: number;
  team_id: number;
  person_email: string;
  status: "pending" | "accepted" | "declined" | "expired";
  sent_at: string;
  expires_at?: string;
  role?: TeamRole;
}

export interface ApiTeamStats {
  team_id: number;
  events_played: number;
  total_wins: number;
  total_losses: number;
  total_ties: number;
  points_for: number;
  points_against: number;
  point_differential: number;
  trueskill_rating: number;
  trueskill_deviation?: number;
}

export interface ApiEventRosterSettings {
  event_id: number;
  min_players?: number;
  max_players?: number;
  allow_waitlist?: boolean;
  roster_deadline?: string;
  can_add_players?: boolean;
  can_remove_players?: boolean;
  can_change_roles?: boolean;
}