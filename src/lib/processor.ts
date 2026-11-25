import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";
import { postMeetingSummary } from "@/lib/slack";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const extractionSchema = {
  type: SchemaType.OBJECT,
  properties: {
    decisions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          summary: { type: SchemaType.STRING },
          context: { type: SchemaType.STRING },
          topics: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        },
        required: ["summary", "context", "topics"],
      },
    },
    action_items: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          description: { type: SchemaType.STRING },
          owner_name: { type: SchemaType.STRING },
          due_date: { type: SchemaType.STRING },
        },
        required: ["description", "owner_name"],
      },
    },
    health: {
      type: SchemaType.OBJECT,
      properties: {
        efficiency_score: { type: SchemaType.INTEGER },
        recurring_topics: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        dominant_speaker: { type: SchemaType.STRING },
        summary: { type: SchemaType.STRING },
      },
      required: ["efficiency_score", "recurring_topics", "dominant_speaker", "summary"],
    },
    participants: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          talk_time_pct: { type: SchemaType.INTEGER },
        },
        required: ["name", "talk_time_pct"],
      },
    },
    title: { type: SchemaType.STRING },
  },
  required: ["decisions", "action_items", "health", "participants", "title"],
};

const PROMPT = `You are an expert meeting analyst. Analyze the following meeting transcript and extract structured information.

For decisions: Extract every concrete decision made. Include a one-sentence summary, the context/reasoning behind it, and relevant topic tags (e.g. "product", "hiring", "engineering", "budget").

For action items: Extract every task assigned or committed to. Include who owns it and an estimated due date if mentioned (ISO format YYYY-MM-DD, or omit if not mentioned).

For health:
- efficiency_score: 0-100 based on how focused and productive the meeting was (100 = every minute was valuable, 0 = complete waste of time)
- recurring_topics: topics that seemed like they've been discussed before without resolution (e.g. "deployment process", "team capacity")
- dominant_speaker: name of the person who spoke the most
- summary: 2-3 sentence summary of the meeting

For participants: Estimate talk time percentage for each participant (must sum to 100).

For title: Generate a concise meeting title if one isn't obvious from the transcript.

TRANSCRIPT:
`;

export async function processMeeting(
  meetingId: string,
  transcript: string,
  workspaceId: string
): Promise<void> {
  const supabase = await createClient();

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-3.8-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: extractionSchema as any,
      },
    });

    let result;
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        result = await model.generateContent(PROMPT + transcript);
        break;
      } catch (err: any) {
        if (err?.status === 503 && attempt < 3) {
          await new Promise(r => setTimeout(r, 3000 * (attempt + 1)));
          continue;
        }
        throw err;
      }
    }
    if (!result) throw new Error("Gemini failed after retries");
    const text = result.response.text();
    const extracted = JSON.parse(text);

    // Update meeting title if we generated one
    if (extracted.title) {
      await supabase
        .from("meetings")
        .update({ title: extracted.title })
        .eq("id", meetingId)
        .is("title", null);
    }

    // Insert decisions
    if (extracted.decisions?.length > 0) {
      await supabase.from("decisions").insert(
        extracted.decisions.map((d: any) => ({
          meeting_id: meetingId,
          workspace_id: workspaceId,
          summary: d.summary,
          context: d.context,
          topics: d.topics ?? [],
        }))
      );
    }

    // Insert action items
    if (extracted.action_items?.length > 0) {
      await supabase.from("action_items").insert(
        extracted.action_items.map((a: any) => ({
          meeting_id: meetingId,
          workspace_id: workspaceId,
          description: a.description,
          owner_name: a.owner_name || null,
          due_date: a.due_date || null,
          status: "open",
        }))
      );
    }

    // Insert meeting health
    const health = extracted.health;
    await supabase.from("meeting_health").upsert({
      meeting_id: meetingId,
      workspace_id: workspaceId,
      efficiency_score: health.efficiency_score,
      decision_count: extracted.decisions?.length ?? 0,
      action_item_count: extracted.action_items?.length ?? 0,
      recurring_topics: health.recurring_topics ?? [],
      dominant_speaker: health.dominant_speaker,
    }, { onConflict: "meeting_id" });

    // Insert participants with talk time
    if (extracted.participants?.length > 0) {
      const { data: meeting } = await supabase
        .from("meetings")
        .select("duration_mins")
        .eq("id", meetingId)
        .single();

      const totalSecs = (meeting?.duration_mins ?? 60) * 60;

      await supabase.from("meeting_participants").insert(
        extracted.participants.map((p: any) => ({
          meeting_id: meetingId,
          name: p.name,
          talk_time_secs: Math.round((p.talk_time_pct / 100) * totalSecs),
        }))
      );
    }

    // Mark meeting as processed
    await supabase
      .from("meetings")
      .update({ status: "processed" })
      .eq("id", meetingId);

    // Post summary to Slack if workspace has an integration with a channel configured
    try {
      const { data: slackIntegration } = await supabase
        .from("integrations")
        .select("access_token, refresh_token")
        .eq("workspace_id", workspaceId)
        .eq("provider", "slack")
        .not("refresh_token", "is", null)
        .limit(1)
        .single();

      if (slackIntegration?.access_token && slackIntegration?.refresh_token) {
        const { data: meetingRow } = await supabase
          .from("meetings")
          .select("id, title, started_at")
          .eq("id", meetingId)
          .single();

        if (meetingRow) {
          await postMeetingSummary({
            botToken: slackIntegration.access_token,
            channelId: slackIntegration.refresh_token,
            meetingId: meetingRow.id,
            title: meetingRow.title,
            startedAt: meetingRow.started_at,
            decisions: extracted.decisions ?? [],
            actionItems: extracted.action_items ?? [],
            efficiencyScore: extracted.health?.efficiency_score ?? null,
            appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "",
          });
        }
      }
    } catch (slackErr) {
      console.error("Slack post failed (non-fatal):", slackErr);
    }

  } catch (err) {
    console.error(`AI processing failed for meeting ${meetingId}:`, err);
    await supabase
      .from("meetings")
      .update({ status: "failed" })
      .eq("id", meetingId);
  }
}
