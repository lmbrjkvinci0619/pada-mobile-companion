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
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { topscoreToken, targetType, targetId, title, content, isUrgent } = await req.json();

    if (!topscoreToken || !targetType || !targetId || !title || !content) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Verify TopScore token
    const tsRes = await fetch(`${TOPSCORE_BASE_URL}/api/persons/me`, {
      headers: { Authorization: `Bearer ${topscoreToken}` },
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
    
    // 2. Check permissions
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    let canCreate = false;
    let authorRole = "member";

    if (targetType === "team") {
      // Check if user is a captain of this team in our DB
      const { data: memberData } = await supabase
        .from("team_members")
        .select("role, teams!inner(id, topscore_id)")
        .eq("topscore_person_id", personId)
        .eq("teams.topscore_id", targetId)
        .single();

      if (memberData && (memberData.role === "captain" || memberData.role === "admin")) {
        canCreate = true;
        authorRole = memberData.role;
      }
    } else if (targetType === "league" || targetType === "division") {
      // For league/division, check if user has global admin role in our DB or TopScore
      // For now, checking if they have ANY 'admin' role in team_members as a proxy, 
      // or we could check TopScore profile.
      if (person.role === "admin" || person.is_admin) {
        canCreate = true;
        authorRole = "league_admin";
      }
    }

    if (!canCreate) {
      return new Response(JSON.stringify({ error: "Unauthorized to create this announcement" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Insert announcement
    const { data: announcement, error: insertError } = await supabase
      .from("announcements")
      .insert([
        {
          author_id: personId,
          author_name: personName,
          author_role: authorRole,
          target_type: targetType,
          target_id: targetId,
          title: title,
          content: content,
          is_urgent: isUrgent || false,
        },
      ])
      .select()
      .single();

    if (insertError) throw insertError;

    return new Response(JSON.stringify(announcement), {
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
