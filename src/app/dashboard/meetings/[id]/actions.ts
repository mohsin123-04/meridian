"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { processMeeting } from "@/lib/processor";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function reprocessMeeting(formData: FormData) {
  const meetingId = formData.get("id") as string;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: meeting } = await supabase
    .from("meetings")
    .select("id, transcript, workspace_id")
    .eq("id", meetingId)
    .single();

  if (!meeting?.transcript) {
    redirect(`/dashboard/meetings/${meetingId}`);
  }

  const admin = createAdminClient();

  await Promise.all([
    admin.from("decisions").delete().eq("meeting_id", meetingId),
    admin.from("action_items").delete().eq("meeting_id", meetingId),
    admin.from("meeting_health").delete().eq("meeting_id", meetingId),
    admin.from("meeting_participants").delete().eq("meeting_id", meetingId),
  ]);

  await admin
    .from("meetings")
    .update({ status: "processing" })
    .eq("id", meetingId);

  processMeeting(meetingId, meeting.transcript, meeting.workspace_id).catch(console.error);

  revalidatePath(`/dashboard/meetings/${meetingId}`);
}
