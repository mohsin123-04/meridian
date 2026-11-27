"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateProfile(formData: FormData) {
  const fullName = (formData.get("full_name") as string)?.trim();
  if (!fullName) redirect("/dashboard/settings?error=Name cannot be empty");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", user.id);

  if (error) redirect(`/dashboard/settings?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/dashboard");
  redirect("/dashboard/settings?success=Profile updated");
}

export async function inviteTeammate(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  if (!email) redirect("/dashboard/settings?error=Email is required");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("workspace_id")
    .eq("id", user.id)
    .single();

  if (!profile?.workspace_id) redirect("/dashboard/settings?error=No workspace found");

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { invited_workspace_id: profile.workspace_id },
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
  });

  if (error) {
    redirect(`/dashboard/settings?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard/settings?success=Invite sent");
}

export async function saveSlackChannel(formData: FormData) {
  const channelId = (formData.get("channel_id") as string)?.trim();
  if (!channelId) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("integrations")
    .update({ refresh_token: channelId })
    .eq("user_id", user.id)
    .eq("provider", "slack");

  revalidatePath("/dashboard/settings");
}

export async function renameWorkspace(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  if (!name) redirect("/dashboard/settings?error=Workspace name cannot be empty");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("workspace_id")
    .eq("id", user.id)
    .single();

  if (!profile?.workspace_id) redirect("/dashboard/settings?error=No workspace found");

  const admin = createAdminClient();
  const { error } = await admin
    .from("workspaces")
    .update({ name })
    .eq("id", profile.workspace_id);

  if (error) redirect(`/dashboard/settings?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/dashboard");
  redirect("/dashboard/settings?success=Workspace renamed");
}
