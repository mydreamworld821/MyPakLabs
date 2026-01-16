import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FCMNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  userIds?: string[]; // Send to specific users
  topic?: string; // Or send to a topic
  tokens?: string[]; // Or send to specific tokens
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const firebaseServerKey = Deno.env.get("FIREBASE_SERVER_KEY");

    if (!firebaseServerKey) {
      console.error("FIREBASE_SERVER_KEY not configured");
      return new Response(
        JSON.stringify({ error: "FCM not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: FCMNotificationPayload = await req.json();
    console.log("FCM notification request:", payload);

    let tokens: string[] = [];

    // Get tokens based on the request type
    if (payload.tokens && payload.tokens.length > 0) {
      tokens = payload.tokens;
    } else if (payload.userIds && payload.userIds.length > 0) {
      // Fetch tokens for specific users
      const { data: tokenData, error } = await supabase
        .from("fcm_tokens")
        .select("token")
        .in("user_id", payload.userIds)
        .eq("is_active", true);

      if (error) {
        console.error("Error fetching FCM tokens:", error);
        return new Response(
          JSON.stringify({ error: "Failed to fetch tokens" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      tokens = tokenData?.map((t) => t.token) || [];
    }

    if (tokens.length === 0) {
      console.log("No FCM tokens found for the request");
      return new Response(
        JSON.stringify({ success: true, message: "No tokens to send to", sentCount: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending FCM notification to ${tokens.length} devices`);

    // Send notifications to each token
    const results = await Promise.allSettled(
      tokens.map(async (token) => {
        const fcmPayload = {
          to: token,
          notification: {
            title: payload.title,
            body: payload.body,
            icon: "/images/mypaklabs-logo.png",
            click_action: payload.data?.url || "/",
          },
          data: payload.data || {},
          priority: "high",
        };

        const response = await fetch("https://fcm.googleapis.com/fcm/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `key=${firebaseServerKey}`,
          },
          body: JSON.stringify(fcmPayload),
        });

        const result = await response.json();

        // Handle invalid tokens
        if (result.failure && result.results) {
          for (const res of result.results) {
            if (res.error === "NotRegistered" || res.error === "InvalidRegistration") {
              // Mark token as inactive
              await supabase
                .from("fcm_tokens")
                .update({ is_active: false })
                .eq("token", token);
              console.log("Marked invalid token as inactive:", token.substring(0, 20) + "...");
            }
          }
        }

        return { token: token.substring(0, 20) + "...", result };
      })
    );

    const successCount = results.filter((r) => r.status === "fulfilled").length;
    console.log(`FCM notification sent: ${successCount}/${tokens.length} successful`);

    return new Response(
      JSON.stringify({
        success: true,
        sentCount: successCount,
        totalTokens: tokens.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error sending FCM notification:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
