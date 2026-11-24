import { createClient } from "@/lib/supabase/server";
import { exchangeGoogleCode, getGoogleUserEmail } from "@/lib/google";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code || !state) {
    return NextResponse.redirect(`${origin}/dashboard/settings?error=google_denied`);
  }

  let userId: string;
  try {
    ({ userId } = JSON.parse(Buffer.from(state, "base64").toString()));
  } catch {
    return NextResponse.redirect(`${origin}/dashboard/settings?error=invalid_state`);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.id !== userId) {
    return NextResponse.redirect(`${origin}/login`);
  }

  try {
    const tokens = await exchangeGoogleCode(code);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
    const email = await getGoogleUserEmail(tokens.access_token);

    const { data: profile } = await supabase
      .from("profiles")
      .select("workspace_id")
      .eq("id", user.id)
      .single();

    if (!profile?.workspace_id) {
      return NextResponse.redirect(`${origin}/onboarding`);
    }

    await supabase.from("integrations").upsert({
      user_id: user.id,
      workspace_id: profile.workspace_id,
      provider: "google",
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? null,
      token_expires_at: expiresAt,
      scope: tokens.scope,
      provider_user_id: email,
    }, { onConflict: "user_id,provider" });

    return NextResponse.redirect(`${origin}/dashboard/settings?connected=google`);
  } catch (err) {
    console.error("Google OAuth error:", err);
    return NextResponse.redirect(`${origin}/dashboard/settings?error=google_failed`);
  }
}
