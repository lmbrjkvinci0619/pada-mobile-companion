import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// TopScore API configuration - must match the mobile app's EXPO_PUBLIC_TOPSCORE_BASE_URL
// Default: https://pada.usetopscore.com (without /api suffix - paths are appended)
const TOPSCORE_BASE_URL = Deno.env.get("EXPO_PUBLIC_TOPSCORE_BASE_URL") ?? "https://pada.usetopscore.com";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const ANNOUNCEMENT_TARGET_TYPES: readonly string[] = ["league", "division", "team"];
const ANNOUNCEMENT_TYPES: readonly string[] = ["pada_org", "league_longterm", "game"];
const VALID_AUTH_ROLES: readonly string[] = ["league_admin", "team_captain", "captain", "coach", "team_admin"];

function normalizeRole(role: string): "league_admin" | "team_captain" {
  switch (role) {
    case "league_admin":
    case "admin":
    case "lite_admin":
    case "trusted_admin":
      return "league_admin";
    case "team_captain":
    case "captain":
    case "coach":
    case "team_admin":
      return "team_captain";
    case "assistant_coach":
    case "chaperone":
    case "volunteer":
    case "staff":
    case "player":
    default:
      return "team_captain";
  }
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { topscoreToken, targetType, targetId, title, content, isUrgent, announcementType, expiresAt } = await req.json();

    if (!topscoreToken || !targetType || !targetId || !title || !content) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const finalAnnouncementType = announcementType || "league_longterm";
    if (!ANNOUNCEMENT_TYPES.includes(finalAnnouncementType)) {
      return new Response(JSON.stringify({ error: `Invalid announcement_type. Must be one of: ${ANNOUNCEMENT_TYPES.join(", ")}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate target type
    if (!ANNOUNCEMENT_TARGET_TYPES.includes(targetType)) {
      return new Response(JSON.stringify({ error: `Invalid target_type. Must be one of: ${ANNOUNCEMENT_TARGET_TYPES.join(", ")}` }), {
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

    const tsData = await tsRes.json() as { result?: { person_id?: number; first_name?: string; last_name?: string; role?: string; is_admin?: boolean }; status?: string | number };
    const person = tsData.result;
    if (!person || !person.person_id) {
      return new Response(JSON.stringify({ error: "Invalid TopScore response" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const personId = String(person.person_id);
    const personName = `${person.first_name ?? ""} ${person.last_name ?? ""}`.trim();

    // PADA org announcements require league_admin role and are always global
    let finalTargetType = targetType;
    let finalTargetId = targetId;
    if (finalAnnouncementType === "pada_org") {
      if (!person.is_admin) {
        return new Response(JSON.stringify({ error: "Only league admins can create PADA organization announcements" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      finalTargetType = "league";
      finalTargetId = "pada-global";
    }
    
    // 2. Check permissions
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    let canCreate = false;
    let authorRole: string = "member";

    if (finalTargetType === "team") {
      // Check if user is a captain of this team in our DB
      const { data: memberData } = await supabase
        .from("team_members")
        .select("role, teams!inner(id, topscore_id)")
        .eq("topscore_person_id", personId)
        .eq("teams.topscore_id", finalTargetId)
        .single();

      if (memberData && VALID_AUTH_ROLES.includes(memberData.role)) {
        canCreate = true;
        authorRole = normalizeRole(memberData.role);
      }
    } else if (finalTargetType === "league" || finalTargetType === "division") {
      // For league/division, check if user has admin status in TopScore
      if (person.is_admin) {
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

    // 3. Insert announcement with proper pagination handling
    const insertResult = await supabase
      .from("announcements")
      .insert([
        {
          author_id: personId,
          author_name: personName,
          author_role: authorRole,
          announcement_type: finalAnnouncementType,
          target_type: finalTargetType,
          target_id: finalTargetId,
          title: title,
          content: content,
          is_urgent: isUrgent || false,
          expires_at: expiresAt || null,
        },
      ])
      .select()
      .single();

    if (insertResult.error) {
      throw insertResult.error;
    }

    return new Response(JSON.stringify(insertResult.data), {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error(err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    
    // Add pagination info for large result sets
    if (errorMessage.includes("too many results")) {
      return new Response(JSON.stringify({ 
        error: "Pagination limit exceeded",
        details: errorMessage,
        suggestion: "Increase the 'limit' parameter or use cursor-based pagination"
      }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
