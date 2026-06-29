import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const EXPO_ACCESS_TOKEN = Deno.env.get("EXPO_ACCESS_TOKEN");

interface AnnouncementRecord {
  id: string;
  title: string;
  content: string;
  announcement_type: string;
  target_type: string;
  target_id: string;
  is_urgent: boolean;
}

interface PushTokenRecord {
  topscore_person_id: string;
  push_token: string;
}

serve(async (req) => {
  try {
    const payload = await req.json();
    const announcement: AnnouncementRecord = payload.record;

    if (!announcement) {
      return new Response(JSON.stringify({ error: "No announcement record found" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const targetType = announcement.target_type;
    const targetId = announcement.target_id;
    const announcementType = announcement.announcement_type;

    let userIds: string[] = [];

    if (targetType === "team" && targetId) {
      const { data: teamMembers } = await supabase
        .from("team_members")
        .select("topscore_person_id")
        .eq("team_id", targetId);
      userIds = teamMembers?.map(m => m.topscore_person_id) ?? [];
    } else if (targetType === "division" && targetId) {
      const { data: divisionMembers } = await supabase
        .from("team_members")
        .select("topscore_person_id, teams!inner(division)")
        .eq("teams.division", targetId);
      userIds = divisionMembers?.map(m => m.topscore_person_id) ?? [];
    } else if (targetType === "league") {
      const { data: leagueMembers } = await supabase
        .from("team_members")
        .select("topscore_person_id");
      userIds = [...new Set(leagueMembers?.map(m => m.topscore_person_id) ?? [])];
    }

    if (userIds.length === 0) {
      return new Response(JSON.stringify({ message: "No users to notify" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: tokens } = await supabase
      .from("user_push_tokens")
      .select("topscore_person_id, push_token")
      .in("topscore_person_id", userIds);

    if (!tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ message: "No push tokens found for users" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const userIdsWithTokens = new Set(tokens.map(t => t.topscore_person_id));

    const { data: preferences } = await supabase
      .from("user_preferences")
      .select("topscore_person_id, push_enabled, quiet_hours_start, quiet_hours_end, league_announcements_enabled, game_announcements_enabled, pada_org_announcements_enabled")
      .in("topscore_person_id", [...userIdsWithTokens]);

    const prefMap = new Map(preferences?.map(p => [p.topscore_person_id, p]) ?? []);

    const enabledTokens: PushTokenRecord[] = [];
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);

    for (const token of tokens) {
      const pref = prefMap.get(token.topscore_person_id);
      if (!pref?.push_enabled) continue;

      if (announcementType === "game" && pref.game_announcements_enabled === false) continue;
      if (announcementType === "league_longterm" && pref.league_announcements_enabled === false) continue;
      if (announcementType === "pada_org" && pref.pada_org_announcements_enabled === false) continue;

      if (pref.quiet_hours_start && pref.quiet_hours_end) {
        if (currentTime >= pref.quiet_hours_start && currentTime <= pref.quiet_hours_end) {
          continue;
        }
      }

      enabledTokens.push({ topscore_person_id: token.topscore_person_id, push_token: token.push_token });
    }

    if (enabledTokens.length === 0) {
      return new Response(JSON.stringify({ message: "No users with notifications enabled" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const badgeCount = await getUnreadCount(supabase, announcement.id);

    const messages = enabledTokens.map(t => ({
      to: t.push_token,
      sound: "default",
      title: announcement.is_urgent ? "🚨 " + announcement.title : announcement.title,
      body: announcement.content.slice(0, 200),
      data: { announcementId: announcement.id, type: announcementType },
      badge: badgeCount,
      channelId: announcement.is_urgent ? "urgent" : "default",
    }));

    if (EXPO_ACCESS_TOKEN) {
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": `Bearer ${EXPO_ACCESS_TOKEN}`,
        },
        body: JSON.stringify(messages.length > 1 ? messages : messages[0]),
      });

      const result = await response.json();
      console.log("Push notification result:", JSON.stringify(result));
    } else {
      console.log("EXPO_ACCESS_TOKEN not set, skipping push. Would send:", JSON.stringify(messages));
    }

    return new Response(JSON.stringify({
      message: "Push notifications sent",
      recipientCount: enabledTokens.length,
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Push notification error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});

async function getUnreadCount(supabase: ReturnType<typeof createClient>, announcementId: string): Promise<number> {
  const { count } = await supabase
    .from("announcement_reads")
    .select("*", { count: "exact", head: true })
    .neq("announcement_id", announcementId);
  return count ?? 0;
}