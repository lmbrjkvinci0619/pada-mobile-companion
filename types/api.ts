export interface ApiPerson {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string;
  role?: "player" | "captain" | "coach" | "league_admin";
}

export interface ApiRegistration {
  id: number;
  type?: string;
  status?: string;
  organization_name?: string;
  name?: string;
  season_name?: string;
  start_date?: string;
  end_date?: string;
  team_id?: number;
  league_id?: number;
  event_id?: number;
}

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
}

export interface ApiRosterMember {
  id?: number;
  person?: ApiPerson;
  jersey_number?: string;
  position?: string;
  role?: string;
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
  opponent_name?: string;
  location?: ApiLocation;
  notes?: string;
  score?: ApiScore;
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
}

export interface ApiScore {
  home_team_name?: string;
  away_team_name?: string;
  home_score?: number;
  away_score?: number;
  reported_at?: string;
  reported_by?: string;
}

export interface ApiAnnouncement {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  author_role: "league_admin" | "team_captain";
  target_type: "league" | "division" | "team";
  target_id: string;
  is_urgent: boolean;
  created_at: string;
  expires_at?: string;
}

export interface ApiAnnouncementCreate {
  title: string;
  content: string;
  target_type: "league" | "division" | "team";
  target_id: string;
  is_urgent: boolean;
}