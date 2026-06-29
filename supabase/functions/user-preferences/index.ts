import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TOPSCORE_BASE_URL = Deno.env.get("EXPO_PUBLIC_TOPSCORE_BASE_URL") || "https://pada.usetopscore.com";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PreferencesPayload {
  topscore_person_id: string;
  topscore_token: string;
  action: "get" | "upsert" | "delete";
  preferences?: {
    push_enabled?: boolean;
    notification_timing?: "immediate" | "batched" | "digest";
    quiet_hours_start?: string | null;
    quiet_hours_end?: string | null;
    announcement_categories?: string[];
    score_notifications_enabled?: boolean;
    league_announcements_enabled?: boolean;
    game_announcements_enabled?: boolean;
    pada_org_announcements_enabled?: boolean;
    schedule_reminders_enabled?: boolean;
  };
}

async function validateTopScoreToken(token: string): Promise<{ personId: string; role: string } | null> {
  try {
    const tsRes = await fetch(`${TOPSCORE_BASE_URL}/api/persons/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!tsRes.ok) return null;
    const tsData = await tsRes.json();
    const person = tsData.result[0];
    return { personId: person.id.toString(), role: person.role };
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload: PreferencesPayload = await req.json();
    const { topscore_person_id, topscore_token, action, preferences } = payload;

    if (!topscore_person_id || !topscore_token) {
      return new Response(JSON.stringify({ error: "Missing user ID or token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validatedUser = await validateTopScoreToken(topscore_token);
    if (!validatedUser) {
      return new Response(JSON.stringify({ error: "Invalid TopScore token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (validatedUser.personId !== topscore_person_id) {
      return new Response(JSON.stringify({ error: "Unauthorized: token does not match user ID" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    if (action === "get") {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("topscore_person_id", topscore_person_id)
        .single();

      if (error && error.code !== "PGRST116") {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ data: data || null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "upsert") {
      if (!preferences) {
        return new Response(JSON.stringify({ error: "Missing preferences data" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const upsertData = {
        topscore_person_id,
        push_enabled: preferences.push_enabled ?? true,
        notification_timing: preferences.notification_timing ?? "immediate",
        quiet_hours_start: preferences.quiet_hours_start,
        quiet_hours_end: preferences.quiet_hours_end,
        announcement_categories: preferences.announcement_categories ?? ["all"],
        score_notifications_enabled: preferences.score_notifications_enabled ?? true,
        league_announcements_enabled: preferences.league_announcements_enabled ?? true,
        game_announcements_enabled: preferences.game_announcements_enabled ?? true,
        pada_org_announcements_enabled: preferences.pada_org_announcements_enabled ?? true,
        schedule_reminders_enabled: preferences.schedule_reminders_enabled ?? true,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("user_preferences")
        .upsert(upsertData, { onConflict: "topscore_person_id" })
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ data }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      const { error } = await supabase
        .from("user_preferences")
        .delete()
        .eq("topscore_person_id", topscore_person_id);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ message: "Preferences deleted" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});