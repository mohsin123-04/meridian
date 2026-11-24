export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, workspace_id, workspaces(name)")
    .eq("id", user.id)
    .single();

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Meridian</h1>
            <p className="text-white/40 text-sm mt-0.5">
              {/* @ts-expect-error supabase join type */}
              {profile?.workspaces?.name ?? "Your workspace"}
            </p>
          </div>
          <form action={signOut}>
            <button type="submit" className="text-sm text-white/40 hover:text-white transition-colors">
              Sign out
            </button>
          </form>
        </div>

        <div className="text-center py-24 text-white/20">
          <p className="text-lg">Dashboard coming soon.</p>
          <p className="text-sm mt-2">Auth is wired up. Next: integrations.</p>
        </div>
      </div>
    </main>
  );
}
