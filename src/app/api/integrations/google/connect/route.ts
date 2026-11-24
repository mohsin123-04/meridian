import { createClient } from "@/lib/supabase/server";
import { getGoogleAuthUrl } from "@/lib/google";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const state = Buffer.from(JSON.stringify({ userId: user.id })).toString("base64");
  return NextResponse.redirect(getGoogleAuthUrl(state));
}
