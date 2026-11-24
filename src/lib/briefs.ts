import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { getUpcomingCalendarEvents, refreshGoogleToken, type GoogleCalendarEvent } from "./google";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const briefSchema = {
  type: SchemaType.OBJECT,
  properties: {
    summary: { type: SchemaType.STRING },
    open_action_items: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          description: { type: SchemaType.STRING },
          owner: { type: SchemaType.STRING },
          from_meeting: { type: SchemaType.STRING },
        },
        required: ["description", "owner", "from_meeting"],
      },
    },
    relevant_decisions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          summary: { type: SchemaType.STRING },
          context: { type: SchemaType.STRING },
          made_at: { type: SchemaType.STRING },
        },
        required: ["summary", "context", "made_at"],
      },
    },
    suggested_topics: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    watch_out_for: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
  },
  required: ["summary", "open_action_items", "relevant_decisions", "suggested_topics", "watch_out_for"],
};

interface BriefContext {
  meetingTitle: string;
  attendees: string[];
  openActionItems: Array<{ description: string; owner_name: string | null; meeting_title: string | null; created_at: string }>;
  recentDecisions: Array<{ summary: string; context: string | null; topics: string[]; created_at: string; meeting_title: string | null }>;
  recurringTopics: string[];
}

export async function generateBrief(context: BriefContext) {
  const model = genAI.getGenerativeModel({
    model: "gemini-4-hydrogen",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: briefSchema as any,
    },
  });

  const prompt = `You are preparing a pre-meeting brief for someone about to join a meeting.

Meeting: ${context.meetingTitle}
Attendees: ${context.attendees.join(", ") || "Unknown"}

Open action items from past meetings with these people:
${context.openActionItems.length > 0
  ? context.openActionItems.map(a =>
    `- ${a.description} (owner: ${a.owner_name ?? "unassigned"}, from: ${a.meeting_title ?? "unknown meeting"}, ${new Date(a.created_at).toLocaleDateString()})`
  ).join("\n")
  : "None"}

Recent decisions relevant to this team:
${context.recentDecisions.length > 0
  ? context.recentDecisions.map(d =>
    `- ${d.summary} [${d.topics.join(", ")}] — ${new Date(d.created_at).toLocaleDateString()}`
  ).join("\n")
  : "None"}

Recurring unresolved topics seen in past meetings:
${context.recurringTopics.length > 0 ? context.recurringTopics.join(", ") : "None"}

Based on this context, generate a pre-meeting brief with:
- summary: 2-sentence overview of what to expect / be prepared for
- open_action_items: items that are still open and may come up
- relevant_decisions: past decisions the attendees should be aware of
- suggested_topics: 3-5 things worth raising or following up on
- watch_out_for: 2-3 potential friction points or risks to be aware of`;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
}

export async function getUpcomingMeetingsWithContext(
  supabase: any,
  userId: string,
  workspaceId: string
): Promise<Array<{ event: GoogleCalendarEvent; brief: any; alreadyGenerated: boolean }>> {
  const { data: integration } = await supabase
    .from("integrations")
    .select("*")
    .eq("user_id", userId)
    .eq("provider", "google")
    .single();

  if (!integration) return [];

  let accessToken = integration.access_token;
  if (integration.token_expires_at && new Date(integration.token_expires_at) < new Date()) {
    if (!integration.refresh_token) return [];
    const refreshed = await refreshGoogleToken(integration.refresh_token);
    accessToken = refreshed.access_token;
    await supabase.from("integrations").update({
      access_token: refreshed.access_token,
      token_expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
    }).eq("id", integration.id);
  }

  const events = await getUpcomingCalendarEvents(accessToken, 24);
  const meetEvents = events.filter(
    (e) => e.conferenceData?.conferenceSolution?.name?.toLowerCase().includes("meet") ||
           e.conferenceData?.entryPoints?.some(ep => ep.uri?.includes("meet.google.com"))
  );

  const results = [];

  for (const event of meetEvents.slice(0, 5)) {
    const { data: existingBrief } = await supabase
      .from("meeting_briefs")
      .select("brief")
      .eq("calendar_event_id", event.id)
      .maybeSingle();

    results.push({
      event,
      brief: existingBrief?.brief ?? null,
      alreadyGenerated: !!existingBrief,
    });
  }

  return results;
}
