export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthUser, getProfile } from "@/lib/dal";

export default async function DashboardPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const profile = await getProfile();
  if (!profile?.workspace_id) redirect("/onboarding");

  const workspaceId = profile.workspace_id;
  const supabase = await createClient();

  const [
    { data: meetings },
    { data: decisions },
    { data: actionItems },
    { data: integrations },
  ] = await Promise.all([
    supabase
      .from("meetings")
      .select("id, title, started_at, status, duration_mins")
      .eq("workspace_id", workspaceId)
      .order("started_at", { ascending: false })
      .limit(6),
    supabase
      .from("decisions")
      .select("id, summary, created_at, meeting_id")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("action_items")
      .select("id, status")
      .eq("workspace_id", workspaceId)
      .eq("status", "open"),
    supabase
      .from("integrations")
      .select("provider")
      .eq("user_id", user.id),
  ]);

  const hasGoogle = integrations?.some((i) => i.provider === "google");
  const hasZoom = integrations?.some((i) => i.provider === "zoom");
  const hasAnyIntegration = hasGoogle || hasZoom;

  const name = profile?.full_name?.split(" ")[0] ?? null;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const processedCount = meetings?.filter((m) => m.status === "processed").length ?? 0;
  const openActions = actionItems?.length ?? 0;
  const totalDecisions = decisions?.length ?? 0;

  return (
    <div className="p-8 max-w-5xl">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight">
          {greeting}{name ? `, ${name}` : ""}.
        </h1>
        <p className="text-sm text-white/35 mt-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Setup banner */}
      {!hasAnyIntegration && (
        <div className="mb-8 flex items-center justify-between gap-4 bg-violet-600/10 border border-violet-500/20 rounded-xl px-5 py-4">
          <div>
            <p className="text-sm font-medium text-violet-300">Connect your first integration</p>
            <p className="text-xs text-white/40 mt-0.5">
              Link Google Meet or Zoom to start capturing meetings automatically.
            </p>
          </div>
          <Link
            href="/dashboard/settings"
            className="shrink-0 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 active:scale-95 text-xs font-medium transition-all"
          >
            Go to Settings
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-6 mb-8 text-sm">
        <StatChip value={processedCount} label="meetings processed" href="/dashboard/meetings" />
        <span className="text-white/[0.08]">·</span>
        <StatChip value={totalDecisions} label="recent decisions" href="/dashboard/decisions" />
        <span className="text-white/[0.08]">·</span>
        <StatChip value={openActions} label="open actions" href="/dashboard/action-items" accent={openActions > 0} />
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-5 gap-6">

        {/* Meetings — wider column */}
        <section className="col-span-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-medium text-white/40 uppercase tracking-widest">Recent Meetings</h2>
            <Link href="/dashboard/meetings" className="text-xs text-white/25 hover:text-white/60 transition-colors">
              View all
            </Link>
          </div>

          {!meetings?.length ? (
            <EmptyState message={hasAnyIntegration ? "No meetings yet." : "Connect an integration to start."} />
          ) : (
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
              {meetings.map((m, i) => (
                <Link
                  key={m.id}
                  href={`/dashboard/meetings/${m.id}`}
                  className={`flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] active:bg-white/[0.06] transition-colors ${i < meetings.length - 1 ? "border-b border-white/[0.05]" : ""}`}
                >
                  <StatusDot status={m.status} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{m.title ?? "Untitled meeting"}</p>
                  </div>
                  <p className="shrink-0 text-xs text-white/30">
                    {m.started_at
                      ? new Date(m.started_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                      : "—"}
                    {m.duration_mins ? ` · ${m.duration_mins}m` : ""}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Decisions — narrower column */}
        <section className="col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-medium text-white/40 uppercase tracking-widest">Recent Decisions</h2>
            <Link href="/dashboard/decisions" className="text-xs text-white/25 hover:text-white/60 transition-colors">
              View all
            </Link>
          </div>

          {!decisions?.length ? (
            <EmptyState message="Decisions will appear here after meetings are processed." />
          ) : (
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
              {decisions.map((d, i) => (
                <Link
                  key={d.id}
                  href={`/dashboard/meetings/${d.meeting_id}`}
                  className={`block px-4 py-3 hover:bg-white/[0.04] active:bg-white/[0.06] transition-colors ${i < decisions.length - 1 ? "border-b border-white/[0.05]" : ""}`}
                >
                  <p className="text-sm leading-snug line-clamp-2 text-white/80">{d.summary}</p>
                  <p className="text-xs text-white/25 mt-1.5">
                    {new Date(d.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}

function StatChip({ value, label, href, accent }: { value: number; label: string; href: string; accent?: boolean }) {
  return (
    <Link href={href} className="hover:opacity-80 transition-opacity">
      <span className={`font-semibold ${accent && value > 0 ? "text-amber-400" : "text-white"}`}>{value}</span>
      <span className="text-white/35 ml-1.5">{label}</span>
    </Link>
  );
}

function StatusDot({ status }: { status: string | null }) {
  const color =
    status === "processed" ? "bg-emerald-400"
    : status === "failed" ? "bg-red-400"
    : "bg-amber-400";
  return <div className={`shrink-0 w-1.5 h-1.5 rounded-full ${color} opacity-70`} />;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-8 text-center">
      <p className="text-sm text-white/20">{message}</p>
    </div>
  );
}
