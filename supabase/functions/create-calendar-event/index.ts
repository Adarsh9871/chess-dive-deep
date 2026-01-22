import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CalendarEventRequest {
  title: string;
  description?: string;
  startDateTime: string; // ISO format
  endDateTime: string; // ISO format
  attendees?: string[]; // Email addresses
  classId?: string; // Optional class ID to update with meet link
}

// Get OAuth access token using refresh token
async function getAccessToken(): Promise<string> {
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
  const refreshToken = Deno.env.get("GOOGLE_REFRESH_TOKEN");

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Google OAuth credentials not configured");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Failed to get access token:", error);
    throw new Error("Failed to get Google access token");
  }

  const data = await response.json();
  return data.access_token;
}

// Create Google Calendar event with Meet link
async function createCalendarEvent(
  accessToken: string,
  event: CalendarEventRequest
): Promise<{ eventId: string; meetLink: string; htmlLink: string }> {
  const calendarEvent = {
    summary: event.title,
    description: event.description || "",
    start: {
      dateTime: event.startDateTime,
      timeZone: "UTC",
    },
    end: {
      dateTime: event.endDateTime,
      timeZone: "UTC",
    },
    conferenceData: {
      createRequest: {
        requestId: crypto.randomUUID(),
        conferenceSolutionKey: {
          type: "hangoutsMeet",
        },
      },
    },
    attendees: event.attendees?.map((email) => ({ email })) || [],
    reminders: {
      useDefault: false,
      overrides: [
        { method: "email", minutes: 60 },
        { method: "popup", minutes: 15 },
      ],
    },
  };

  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(calendarEvent),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("Failed to create calendar event:", error);
    throw new Error("Failed to create Google Calendar event");
  }

  const data = await response.json();
  
  return {
    eventId: data.id,
    meetLink: data.hangoutLink || data.conferenceData?.entryPoints?.[0]?.uri || "",
    htmlLink: data.htmlLink,
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: CalendarEventRequest = await req.json();
    console.log("Creating calendar event:", body);

    // Get access token
    const accessToken = await getAccessToken();

    // Create calendar event
    const result = await createCalendarEvent(accessToken, body);
    console.log("Calendar event created:", result);

    // If classId provided, update the class with the meet link
    if (body.classId && result.meetLink) {
      const { error: updateError } = await supabase
        .from("classes")
        .update({ meet_link: result.meetLink })
        .eq("id", body.classId);

      if (updateError) {
        console.error("Failed to update class with meet link:", updateError);
      } else {
        console.log("Updated class with meet link");
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        eventId: result.eventId,
        meetLink: result.meetLink,
        calendarLink: result.htmlLink,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error creating calendar event:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create calendar event";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
