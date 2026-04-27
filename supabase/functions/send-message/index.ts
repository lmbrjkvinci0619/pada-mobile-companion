import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TOPSCORE_BASE_URL = Deno.env.get("EXPO_PUBLIC_TOPSCORE_BASE_URL") || "https://pada.usetopscore.com";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { topscoreToken, teamId, content } = await req.json();

    if (!topscoreToken || !teamId || !content) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Verify TopScore token and get user identity
    const tsRes = await fetch(`${TOPSCORE_BASE_URL}/api/persons/me`, {
      headers: {
        Authorization: `Bearer ${topscoreToken}`,
      },
    });

    if (!tsRes.ok) {
      return new Response(JSON.stringify({ error: "Invalid TopScore token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tsData = await tsRes.json();
    const person = tsData.result[0];
    const personId = person.id.toString();
    const personName = `${person.first_name} ${person.last_name}`;

    // 2. Check membership in Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get internal team ID
    const { data: teamData, error: teamError } = await supabase
      .from("teams")
      .select("id")
      .eq("topscore_id", teamId)
      .single();

    if (teamError || !teamData) {
      return new Response(JSON.stringify({ error: "Team not found in chat system" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check membership
    const { data: memberData, error: memberError } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", teamData.id)
      .eq("topscore_person_id", personId)
      .single();

    if (memberError || !memberData) {
      return new Response(JSON.stringify({ error: "You are not a member of this team chat" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Insert message using service role
    const { data: message, error: insertError } = await supabase
      .from("messages")
      .insert([
        {
          team_id: teamData.id,
          sender_id: personId,
          sender_name: personName,
          content: content,
          message_type: "text",
        },
      ])
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return new Response(JSON.stringify(message), {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
