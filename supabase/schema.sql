-- Teams table for syncing team rosters from TopScore
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topscore_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  division TEXT, -- division name for grouping teams
  sport TEXT DEFAULT 'Ultimate Frisbee',
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team members linking users to teams (synced from TopScore)
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  topscore_person_id TEXT NOT NULL,
  role TEXT DEFAULT 'member', -- 'player', 'captain', 'coach', 'assistant_coach', 'admin', 'chaperone', 'volunteer', 'staff'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (team_id, topscore_person_id)
);

-- Divisions table for organization-level grouping
CREATE TABLE IF NOT EXISTS divisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topscore_division_id TEXT UNIQUE NOT NULL, -- TopScore division identifier
  name TEXT NOT NULL,
  sport TEXT,
  season TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id TEXT NOT NULL, -- topscore_person_id
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL, -- 'league_admin', 'team_captain'
  announcement_type TEXT NOT NULL DEFAULT 'league_longterm', -- 'pada_org', 'league_longterm', 'game'
  target_type TEXT NOT NULL, -- 'league', 'division', 'team'
  target_id TEXT NOT NULL, -- league/division/team identifier
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_urgent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Read receipts for announcements
CREATE TABLE IF NOT EXISTS announcement_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- topscore_person_id
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (announcement_id, user_id)
);


-- User push notification preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  topscore_person_id TEXT PRIMARY KEY,
  push_enabled BOOLEAN DEFAULT TRUE,
  announcements_enabled BOOLEAN DEFAULT TRUE,
  notification_timing TEXT DEFAULT 'immediate',
  announcement_categories TEXT[] DEFAULT ARRAY['all'],
  score_notifications_enabled BOOLEAN DEFAULT TRUE,
  league_announcements_enabled BOOLEAN DEFAULT TRUE,
  game_announcements_enabled BOOLEAN DEFAULT TRUE,
  pada_org_announcements_enabled BOOLEAN DEFAULT TRUE,
  schedule_reminders_enabled BOOLEAN DEFAULT TRUE,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User push tokens for notifications
CREATE TABLE IF NOT EXISTS user_push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topscore_person_id TEXT NOT NULL,
  push_token TEXT NOT NULL,
  device_id TEXT,
  platform TEXT DEFAULT 'expo', -- 'expo', 'ios', 'android'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (topscore_person_id, push_token)
);

-- ROW LEVEL SECURITY
-- 1. Announcements Policies
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read announcements" ON announcements;
DROP POLICY IF EXISTS "No direct inserts for announcements" ON announcements;

CREATE POLICY "Anyone can read announcements" ON announcements FOR SELECT USING (true);
CREATE POLICY "No direct inserts for announcements" ON announcements FOR INSERT WITH CHECK (false);

-- Indexes for announcements
CREATE INDEX IF NOT EXISTS idx_announcements_target_type_id ON announcements(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_announcements_target_id ON announcements(target_id);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_expires_at ON announcements(expires_at);
CREATE INDEX IF NOT EXISTS idx_announcements_type ON announcements(announcement_type);
CREATE INDEX IF NOT EXISTS idx_announcements_author_id ON announcements(author_id);

-- 5. Announcement Reads - users can only see/modify their own
ALTER TABLE announcement_reads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can manage their own reads" ON announcement_reads;
DROP POLICY IF EXISTS "Users manage own announcement reads" ON announcement_reads;
CREATE POLICY "Users manage own announcement reads" ON announcement_reads
  FOR ALL USING (user_id = current_setting('request.jwt.claims', true)::json->>'topscore_person_id');

-- 6. User Preferences - defense in depth (writes go through edge function with service role)
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users manage own preferences" ON user_preferences;
CREATE POLICY "Users manage own preferences" ON user_preferences
  FOR ALL USING (topscore_person_id = current_setting('request.jwt.claims', true)::json->>'topscore_person_id');

-- 7. User Push Tokens - defense in depth (writes go through edge function with service role)
ALTER TABLE user_push_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own push tokens" ON user_push_tokens;
DROP POLICY IF EXISTS "Users manage own push tokens" ON user_push_tokens;
CREATE POLICY "Users manage own push tokens" ON user_push_tokens
  FOR ALL USING (topscore_person_id = current_setting('request.jwt.claims', true)::json->>'topscore_person_id');

-- Note: These RLS policies rely on topscore_person_id being set in JWT claims.
-- Currently the app uses edge functions with service role key for writes, so RLS is
-- defense-in-depth. Ensure Supabase JWT configuration includes topscore_person_id claim.

-- Add indexes for announcement reads (user + announcement lookups)
CREATE INDEX IF NOT EXISTS idx_announcement_reads_user_id ON announcement_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_announcement_reads_announcement_id ON announcement_reads(announcement_id);

-- Index for user push tokens
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_person_id ON user_push_tokens(topscore_person_id);

-- Indexes for team_members (critical for join performance)
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_person_id ON team_members(topscore_person_id);

-- Indexes for teams
CREATE INDEX IF NOT EXISTS idx_teams_topscore_id ON teams(topscore_id);
CREATE INDEX IF NOT EXISTS idx_teams_division ON teams(division);
