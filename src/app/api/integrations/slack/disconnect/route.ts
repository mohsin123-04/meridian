import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login`);

  await supabase
    .from("integrations")
    .delete()
    .eq("user_id", user.id)
    .eq("provider", "slack");

  return NextResponse.redirect(`${origin}/dashboard/settings?success=Slack+disconnected`);
}
