import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // If the user was invited with a workspace_id, assign them to it
      const invitedWorkspaceId = data.user.user_metadata?.invited_workspace_id;
      if (invitedWorkspaceId) {
        await supabase
          .from("profiles")
          .update({ workspace_id: invitedWorkspaceId })
          .eq("id", data.user.id)
          .is("workspace_id", null);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
