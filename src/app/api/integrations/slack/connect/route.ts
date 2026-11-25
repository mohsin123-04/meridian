import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect("/login");

  const params = new URLSearchParams({
    client_id: process.env.SLACK_CLIENT_ID!,
    scope: "chat:write,channels:read,groups:read",
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/slack/callback`,
    state: user.id,
  });

  return NextResponse.redirect(`https://slack.com/oauth/v2/authorize?${params}`);
}
