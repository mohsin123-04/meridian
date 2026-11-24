import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL!));
  }

  await supabase
    .from("integrations")
    .delete()
    .eq("user_id", user.id)
    .eq("provider", "zoom");

  return NextResponse.redirect(
    new URL("/dashboard/settings?success=Zoom disconnected", process.env.NEXT_PUBLIC_APP_URL!)
  );
}
