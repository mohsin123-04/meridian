import { createClient } from "@/lib/supabase/server";
import { getZoomAuthUrl } from "@/lib/zoom";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // State encodes user ID for verification in callback
  const state = Buffer.from(JSON.stringify({ userId: user.id })).toString("base64");
  const authUrl = getZoomAuthUrl(state);

  return NextResponse.redirect(authUrl);
}
