"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthUser, getProfile } from "@/lib/dal";
import { redirect } from "next/navigation";

export async function uploadTranscript(formData: FormData) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const profile = await getProfile();
  if (!profile?.workspace_id) redirect("/onboarding");

  const title = (formData.get("title") as string)?.trim() || null;
  const transcript = (formData.get("transcript") as string)?.trim();
  const durationMins = parseInt(formData.get("duration_mins") as string) || null;

  if (!transcript) redirect("/dashboard/meetings/new?error=Transcript is required");

  const admin = createAdminClient();

  const { data: meeting, error } = await admin
    .from("meetings")
    .insert({
      workspace_id: profile.workspace_id,
      title,
      transcript,
      duration_mins: durationMins,
      status: "processing",
      source: "manual",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !meeting) redirect("/dashboard/meetings/new?error=Failed to create meeting");

  redirect(`/dashboard/meetings/${meeting.id}?process=1`);
}
