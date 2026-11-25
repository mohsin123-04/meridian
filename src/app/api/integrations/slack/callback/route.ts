import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // user_id passed in connect route
  const error = searchParams.get("error");

  if (error || !code || !state) {
    return NextResponse.redirect(`${origin}/dashboard/settings?error=Slack+connection+failed`);
  }

  const params = new URLSearchParams({
    client_id: process.env.SLACK_CLIENT_ID!,
    client_secret: process.env.SLACK_CLIENT_SECRET!,
    code,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/slack/callback`,
  });

  const tokenRes = await fetch(`https://slack.com/api/oauth.v2.access?${params}`);
  const tokenData = await tokenRes.json();

  if (!tokenData.ok) {
    return NextResponse.redirect(
      `${origin}/dashboard/settings?error=${encodeURIComponent(tokenData.error)}`
    );
  }

  const botToken = tokenData.access_token as string;
  const teamName = (tokenData.team?.name as string) ?? "Slack";

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("workspace_id")
    .eq("id", state)
    .single();

  if (!profile?.workspace_id) {
    return NextResponse.redirect(`${origin}/dashboard/settings?error=No+workspace+found`);
  }

  await admin.from("integrations").upsert(
    {
      user_id: state,
      workspace_id: profile.workspace_id,
      provider: "slack",
      access_token: botToken,
      provider_user_id: teamName,
      status: "active",
    },
    { onConflict: "user_id,provider" }
  );

  return NextResponse.redirect(`${origin}/dashboard/settings?success=Slack+connected`);
}
