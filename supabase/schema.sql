-- Teams table for chat group management and score reporting
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topscore_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team members linking users to teams (synced from TopScore)
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  topscore_person_id TEXT NOT NULL,
  role TEXT DEFAULT 'member', -- 'member', 'captain', 'coach', 'admin'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (team_id, topscore_person_id)
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL, -- topscore_person_id
  sender_name TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text', -- 'text', 'image', 'location'
  attachment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Message reactions for quick responses
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- topscore_person_id
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (message_id, user_id, emoji)
);

-- Pinned messages for team captains
CREATE TABLE IF NOT EXISTS pinned_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  pinned_by TEXT NOT NULL, -- topscore_person_id
  pinned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (team_id, message_id)
);

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id TEXT NOT NULL, -- topscore_person_id
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL, -- 'league_admin', 'team_captain'
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
  notification_timing TEXT DEFAULT 'immediate', -- 'immediate', 'batched', 'digest'
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  team_chat_enabled BOOLEAN DEFAULT TRUE,
  announcement_categories TEXT[] DEFAULT ARRAY['all'],
  score_notifications_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROW LEVEL SECURITY
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read messages" ON messages;
DROP POLICY IF EXISTS "No direct inserts" ON messages;
DROP POLICY IF EXISTS "Team members can read/insert messages" ON messages;

-- 3. Messages Policies
-- Read access remains public (or restricted if you add Auth)
CREATE POLICY "Anyone can read messages" ON messages FOR SELECT USING (true);

-- Disable direct inserts. All inserts MUST go through the Edge Function
-- which uses the service_role key to bypass RLS after verification.
CREATE POLICY "No direct inserts" ON messages FOR INSERT WITH CHECK (false);

-- 4. Announcements Policies
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read announcements" ON announcements;
DROP POLICY IF EXISTS "No direct inserts for announcements" ON announcements;

CREATE POLICY "Anyone can read announcements" ON announcements FOR SELECT USING (true);
CREATE POLICY "No direct inserts for announcements" ON announcements FOR INSERT WITH CHECK (false);

-- 5. Announcement Reads
ALTER TABLE announcement_reads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can manage their own reads" ON announcement_reads;
CREATE POLICY "Anyone can manage their own reads" ON announcement_reads FOR ALL USING (true);

-- 6. User Preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own preferences" ON user_preferences;
CREATE POLICY "Users can manage their own preferences" ON user_preferences FOR ALL USING (true);
