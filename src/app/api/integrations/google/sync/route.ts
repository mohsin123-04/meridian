import { createClient } from "@/lib/supabase/server";
import {
  getMeetConferenceRecords,
  getMeetTranscripts,
  getMeetTranscriptEntries,
  refreshGoogleToken,
} from "@/lib/google";
import { processMeeting } from "@/lib/processor";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: integration } = await supabase
    .from("integrations")
    .select("*")
    .eq("user_id", user.id)
    .eq("provider", "google")
    .single();

  if (!integration) {
    return NextResponse.json({ error: "Google not connected" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("workspace_id")
    .eq("id", user.id)
    .single();

  if (!profile?.workspace_id) {
    return NextResponse.json({ error: "No workspace" }, { status: 400 });
  }

  // Refresh token if expired
  let accessToken = integration.access_token;
  if (integration.token_expires_at && new Date(integration.token_expires_at) < new Date()) {
    if (!integration.refresh_token) {
      return NextResponse.json({ error: "Token expired, reconnect Google" }, { status: 401 });
    }
    const refreshed = await refreshGoogleToken(integration.refresh_token);
    accessToken = refreshed.access_token;
    await supabase.from("integrations").update({
      access_token: refreshed.access_token,
      token_expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
    }).eq("id", integration.id);
  }

  let synced = 0;
  let errors = 0;

  try {
    const conferenceRecords = await getMeetConferenceRecords(accessToken);

    for (const record of conferenceRecords) {
      // Skip records without an end time (meeting still in progress)
      if (!record.endTime) continue;

      const externalId = record.name;

      // Skip if already processed
      const { data: existing } = await supabase
        .from("meetings")
        .select("id, status")
        .eq("workspace_id", profile.workspace_id)
        .eq("source", "google_meet")
        .eq("external_id", externalId)
        .single();

      if (existing?.status === "processed") continue;

      try {
        const transcripts = await getMeetTranscripts(accessToken, record.name);
        const completedTranscript = transcripts.find((t) => t.state === "ENDED");

        if (!completedTranscript) continue;

        const transcriptText = await getMeetTranscriptEntries(
          accessToken,
          completedTranscript.name
        );

        if (!transcriptText.trim()) continue;

        const startedAt = record.startTime;
        const endedAt = record.endTime;
        const durationMins = startedAt && endedAt
          ? Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60000)
          : null;

        const { data: meeting } = await supabase
          .from("meetings")
          .upsert({
            workspace_id: profile.workspace_id,
            source: "google_meet",
            external_id: externalId,
            started_at: startedAt,
            ended_at: endedAt,
            duration_mins: durationMins,
            transcript: transcriptText,
            status: "processing",
          }, { onConflict: "workspace_id,source,external_id" })
          .select("id")
          .single();

        if (meeting) {
          processMeeting(meeting.id, transcriptText, profile.workspace_id).catch(console.error);
          synced++;
        }
      } catch (err) {
        console.error(`Failed to process conference record ${record.name}:`, err);
        errors++;
      }
    }
  } catch (err) {
    console.error("Meet sync failed:", err);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }

  return NextResponse.json({ synced, errors });
}
