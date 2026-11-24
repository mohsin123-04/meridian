import { createClient } from "@/lib/supabase/server";
import { getUpcomingCalendarEvents, refreshGoogleToken } from "@/lib/google";
import { generateBrief } from "@/lib/briefs";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("workspace_id")
    .eq("id", user.id)
    .single();

  if (!profile?.workspace_id) return NextResponse.json({ briefs: [] });

  const { data: integration } = await supabase
    .from("integrations")
    .select("*")
    .eq("user_id", user.id)
    .eq("provider", "google")
    .single();

  if (!integration) return NextResponse.json({ briefs: [] });

  let accessToken = integration.access_token;
  if (integration.token_expires_at && new Date(integration.token_expires_at) < new Date()) {
    if (!integration.refresh_token) return NextResponse.json({ briefs: [] });
    const refreshed = await refreshGoogleToken(integration.refresh_token);
    accessToken = refreshed.access_token;
    await supabase.from("integrations").update({
      access_token: refreshed.access_token,
      token_expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
    }).eq("id", integration.id);
  }

  const events = await getUpcomingCalendarEvents(accessToken, 24);

  // Only events with Google Meet links
  const meetEvents = events.filter((e) =>
    e.conferenceData?.conferenceSolution?.name?.toLowerCase().includes("meet") ||
    e.conferenceData?.entryPoints?.some((ep) => ep.uri?.includes("meet.google.com"))
  );

  const briefs = [];

  for (const event of meetEvents.slice(0, 5)) {
    const startTime = event.start.dateTime ? new Date(event.start.dateTime) : null;
    const minsUntilStart = startTime
      ? Math.round((startTime.getTime() - Date.now()) / 60000)
      : null;

    // Check for existing brief
    const { data: existing } = await supabase
      .from("meeting_briefs")
      .select("brief, generated_at")
      .eq("calendar_event_id", event.id)
      .eq("workspace_id", profile.workspace_id)
      .maybeSingle();

    let brief = existing?.brief ?? null;

    // Auto-generate if meeting is within 60 minutes and no brief exists
    if (!brief && minsUntilStart !== null && minsUntilStart <= 60 && minsUntilStart >= 0) {
      const { data: openActionItems } = await supabase
        .from("action_items")
        .select("description, owner_name, created_at, meetings(title)")
        .eq("workspace_id", profile.workspace_id)
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(20);

      const { data: recentDecisions } = await supabase
        .from("decisions")
        .select("summary, context, topics, created_at, meetings(title)")
        .eq("workspace_id", profile.workspace_id)
        .order("created_at", { ascending: false })
        .limit(15);

      const { data: healthRecords } = await supabase
        .from("meeting_health")
        .select("recurring_topics")
        .eq("workspace_id", profile.workspace_id)
        .order("created_at", { ascending: false })
        .limit(10);

      const recurringTopics = [
        ...new Set(
          (healthRecords ?? [])
            .flatMap((h: { recurring_topics: string[] }) => h.recurring_topics)
            .filter(Boolean)
        ),
      ] as string[];

      try {
        brief = await generateBrief({
          meetingTitle: event.summary ?? "Untitled Meeting",
          attendees: (event.attendees ?? []).map((a) => a.email),
          openActionItems: (openActionItems ?? []).map((a: any) => ({
            description: a.description,
            owner_name: a.owner_name,
            meeting_title: a.meetings?.title ?? null,
            created_at: a.created_at,
          })),
          recentDecisions: (recentDecisions ?? []).map((d: any) => ({
            summary: d.summary,
            context: d.context,
            topics: d.topics ?? [],
            created_at: d.created_at,
            meeting_title: d.meetings?.title ?? null,
          })),
          recurringTopics,
        });

        await supabase.from("meeting_briefs").insert({
          workspace_id: profile.workspace_id,
          calendar_event_id: event.id,
          brief,
          delivered: true,
        });
      } catch (err) {
        console.error("Failed to auto-generate brief:", err);
      }
    }

    briefs.push({
      eventId: event.id,
      title: event.summary ?? "Untitled Meeting",
      startTime: event.start.dateTime,
      minsUntilStart,
      attendees: event.attendees ?? [],
      brief,
    });
  }

  return NextResponse.json({ briefs });
}
