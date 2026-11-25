import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("meetings")
    .select("status")
    .eq("id", id)
    .single();

  return NextResponse.json({ status: data?.status ?? null });
}
