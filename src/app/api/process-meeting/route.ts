import { createAdminClient } from "@/lib/supabase/admin";
import { processMeeting } from "@/lib/processor";
import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(request: Request) {
  const { meetingId } = await request.json();
  if (!meetingId) return NextResponse.json({ error: "Missing meetingId" }, { status: 400 });

  const admin = createAdminClient();
  const { data: meeting } = await admin
    .from("meetings")
    .select("id, transcript, workspace_id, status")
    .eq("id", meetingId)
    .single();

  if (!meeting) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!meeting.transcript) return NextResponse.json({ error: "No transcript" }, { status: 400 });
  if (meeting.status === "processed") return NextResponse.json({ status: "already_processed" });

  await admin.from("meetings").update({ status: "processing" }).eq("id", meetingId);

  await processMeeting(meetingId, meeting.transcript, meeting.workspace_id);

  return NextResponse.json({ status: "done" });
}
