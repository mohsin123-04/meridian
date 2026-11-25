"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function createWorkspace(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const name = formData.get("name") as string;
  let slug = slugify(name);

  // Ensure slug uniqueness by appending random suffix if taken
  const { data: existing } = await supabase
    .from("workspaces")
    .select("id")
    .eq("slug", slug)
    .single();

  if (existing) {
    slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const admin = createAdminClient();
  const { data: workspace, error: wsError } = await admin
    .from("workspaces")
    .insert({ name, slug })
    .select("id")
    .single();

  if (wsError || !workspace) {
    redirect("/onboarding?error=Failed to create workspace");
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ workspace_id: workspace.id, role: "admin" })
    .eq("id", user.id);

  if (profileError) {
    redirect("/onboarding?error=Failed to update profile");
  }

  redirect("/dashboard");
}
