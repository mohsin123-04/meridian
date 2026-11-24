import { createClient } from "@/lib/supabase/server";
import { generateBrief } from "@/lib/briefs";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { calendarEventId, meetingTitle, attendeeEmails } = await request.json();

  if (!calendarEventId || !meetingTitle) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("workspace_id")
    .eq("id", user.id)
    .single();

  if (!profile?.workspace_id) {
    return NextResponse.json({ error: "No workspace" }, { status: 400 });
  }

  // Check if brief already exists
  const { data: existing } = await supabase
    .from("meeting_briefs")
    .select("id, brief")
    .eq("calendar_event_id", calendarEventId)
    .eq("workspace_id", profile.workspace_id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ brief: existing.brief, cached: true });
  }

  // Fetch open action items for this workspace
  const { data: openActionItems } = await supabase
    .from("action_items")
    .select("description, owner_name, created_at, meetings(title)")
    .eq("workspace_id", profile.workspace_id)
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(20);

  // Fetch recent decisions for this workspace
  const { data: recentDecisions } = await supabase
    .from("decisions")
    .select("summary, context, topics, created_at, meetings(title)")
    .eq("workspace_id", profile.workspace_id)
    .order("created_at", { ascending: false })
    .limit(15);

  // Fetch recurring topics from meeting health
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

  const brief = await generateBrief({
    meetingTitle,
    attendees: attendeeEmails ?? [],
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

  // Store the brief
  await supabase.from("meeting_briefs").insert({
    workspace_id: profile.workspace_id,
    calendar_event_id: calendarEventId,
    brief,
    delivered: false,
  });

  return NextResponse.json({ brief, cached: false });
}
