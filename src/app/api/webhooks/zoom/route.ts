import { createClient } from "@/lib/supabase/server";
import { verifyZoomWebhook, downloadZoomTranscript, refreshZoomToken } from "@/lib/zoom";
import { NextResponse } from "next/server";
import { processMeeting } from "@/lib/processor";
import crypto from "crypto";

export async function POST(request: Request) {
  const body = await request.text();
  const timestamp = request.headers.get("x-zm-request-timestamp") ?? "";
  const signature = request.headers.get("x-zm-signature") ?? "";

  const payload = JSON.parse(body);

  // Zoom URL validation handshake (required when registering webhook URL)
  if (payload.event === "endpoint.url_validation") {
    const hash = crypto
      .createHmac("sha256", process.env.ZOOM_WEBHOOK_SECRET_TOKEN!)
      .update(payload.payload.plainToken)
      .digest("hex");
    return NextResponse.json({
      plainToken: payload.payload.plainToken,
      encryptedToken: hash,
    });
  }

  if (!verifyZoomWebhook(body, timestamp, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (payload.event !== "recording.completed") {
    return NextResponse.json({ received: true });
  }

  const meetingData = payload.payload.object;
  const hostEmail = meetingData.host_email;

  const supabase = await createClient();

  // Match the Zoom host to an integration by provider_user_id (email stored at connect time)
  const { data: integration } = await supabase
    .from("integrations")
    .select("*, profiles!inner(id, workspace_id)")
    .eq("provider", "zoom")
    .eq("provider_user_id", hostEmail)
    .single();

  if (!integration) {
    console.warn("No integration found for Zoom host:", hostEmail);
    return NextResponse.json({ received: true });
  }

  const profile = (integration as any).profiles;
  if (!profile?.workspace_id) {
    return NextResponse.json({ received: true });
  }

  // Refresh token if expired
  let accessToken = integration.access_token;
  if (integration.token_expires_at && new Date(integration.token_expires_at) < new Date()) {
    const refreshed = await refreshZoomToken(integration.refresh_token);
    accessToken = refreshed.access_token;
    await supabase.from("integrations").update({
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token,
      token_expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
    }).eq("id", integration.id);
  }

  // Create or update meeting record
  const { data: meeting, error: meetingError } = await supabase
    .from("meetings")
    .upsert({
      workspace_id: profile.workspace_id,
      source: "zoom",
      external_id: String(meetingData.id),
      title: meetingData.topic,
      started_at: meetingData.start_time,
      ended_at: meetingData.end_time,
      duration_mins: meetingData.duration,
      status: "pending",
    }, { onConflict: "workspace_id,source,external_id" })
    .select("id")
    .single();

  if (meetingError || !meeting) {
    console.error("Failed to upsert meeting:", meetingError);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  // Find transcript file in recording files
  const recordingFiles: Array<{ file_type: string; download_url: string }> =
    meetingData.recording_files ?? [];
  const transcriptFile = recordingFiles.find((f) => f.file_type === "TRANSCRIPT");

  if (transcriptFile?.download_url) {
    try {
      const transcript = await downloadZoomTranscript(accessToken, transcriptFile.download_url);

      await supabase.from("meetings").update({
        transcript,
        status: "processing",
      }).eq("id", meeting.id);

      processMeeting(meeting.id, transcript, profile.workspace_id).catch(console.error);
    } catch (err) {
      console.error("Transcript download failed:", err);
      await supabase.from("meetings").update({ status: "failed" }).eq("id", meeting.id);
    }
  }

  return NextResponse.json({ received: true });
}
