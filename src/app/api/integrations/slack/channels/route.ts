import { createClient } from "@/lib/supabase/server";
import { listSlackChannels } from "@/lib/slack";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: integration } = await supabase
    .from("integrations")
    .select("access_token")
    .eq("user_id", user.id)
    .eq("provider", "slack")
    .single();

  if (!integration?.access_token) {
    return NextResponse.json({ error: "Not connected" }, { status: 400 });
  }

  try {
    const channels = await listSlackChannels(integration.access_token);
    return NextResponse.json({ channels });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
