import { createClient } from "@/lib/supabase/server";
import { exchangeZoomCode } from "@/lib/zoom";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code || !state) {
    return NextResponse.redirect(`${origin}/dashboard/settings?error=zoom_denied`);
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
    const tokens = await exchangeZoomCode(code);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    const { data: profile } = await supabase
      .from("profiles")
      .select("workspace_id")
      .eq("id", user.id)
      .single();

    if (!profile?.workspace_id) {
      return NextResponse.redirect(`${origin}/onboarding`);
    }

    // Fetch Zoom user profile to get their email for webhook matching
    const zoomUserRes = await fetch("https://api.zoom.us/v2/users/me", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const zoomUser = zoomUserRes.ok ? await zoomUserRes.json() : {};

    await supabase.from("integrations").upsert({
      user_id: user.id,
      workspace_id: profile.workspace_id,
      provider: "zoom",
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: expiresAt,
      scope: tokens.scope,
      provider_user_id: zoomUser.email ?? null,
    }, { onConflict: "user_id,provider" });

    return NextResponse.redirect(`${origin}/dashboard/settings?connected=zoom`);
  } catch (err) {
    console.error("Zoom OAuth error:", err);
    return NextResponse.redirect(`${origin}/dashboard/settings?error=zoom_failed`);
  }
}
