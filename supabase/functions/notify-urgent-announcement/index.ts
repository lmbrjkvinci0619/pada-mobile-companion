import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// This edge function is meant to be triggered by a Supabase Webhook
// whenever a new row is inserted into the `announcements` table.
// It checks if `is_urgent` is true, and if so, sends a push notification.

serve(async (req) => {
  try {
    const payload = await req.json();
    const announcement = payload.record;

    if (!announcement || !announcement.is_urgent) {
      return new Response(JSON.stringify({ message: "Not urgent, skipped." }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // In a real implementation, you would:
    // 1. Fetch user push tokens from a `user_push_tokens` table based on the `target_id`
    //    (e.g., all users in the team, division, or league).
    // 2. Send the push notification via Expo Push API or Firebase Cloud Messaging.
    
    // Example Expo Push API integration:
    /*
    const expoPushUrl = "https://exp.host/--/api/v2/push/send";
    const messages = tokens.map(token => ({
      to: token,
      sound: 'default',
      title: '🚨 ' + announcement.title,
      body: announcement.content,
      data: { announcementId: announcement.id },
    }));

    await fetch(expoPushUrl, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });
    */

    console.log("Urgent announcement push notification simulated for:", announcement.title);

    return new Response(JSON.stringify({ message: "Push notification sent." }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});
