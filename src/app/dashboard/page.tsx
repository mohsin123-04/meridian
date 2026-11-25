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

  const [{ data: meetings }, { data: decisions }, { data: integrations }] = await Promise.all([
    supabase
      .from("meetings")
      .select("id, title, started_at, status, source, duration_mins")
      .eq("workspace_id", workspaceId)
      .order("started_at", { ascending: false })
      .limit(8),
    supabase
      .from("decisions")
      .select("id, summary, created_at, meeting_id")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("integrations")
      .select("provider")
      .eq("user_id", user.id),
  ]);

  const hasGoogle = integrations?.some((i: { provider: string }) => i.provider === "google");
  const hasZoom = integrations?.some((i: { provider: string }) => i.provider === "zoom");
  const hasAnyIntegration = hasGoogle || hasZoom;

  return (
    <div className="p-8">
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
            className="shrink-0 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs font-medium transition-colors"
          >
            Go to Settings
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent meetings */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-medium text-white/40 uppercase tracking-widest">Recent Meetings</h2>
            <Link href="/dashboard/meetings" className="text-xs text-white/30 hover:text-white transition-colors">
              View all
            </Link>
          </div>

          {!meetings?.length ? (
            <EmptyState
              message={hasAnyIntegration ? "No meetings captured yet." : "Connect an integration to capture meetings."}
            />
          ) : (
            <div className="space-y-2">
              {meetings.map((m) => (
                <MeetingRow key={m.id} meeting={m} />
              ))}
            </div>
          )}
        </section>

        {/* Recent decisions */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-medium text-white/40 uppercase tracking-widest">Recent Decisions</h2>
            <Link href="/dashboard/decisions" className="text-xs text-white/30 hover:text-white transition-colors">
              View all
            </Link>
          </div>

          {!decisions?.length ? (
            <EmptyState message="Decisions extracted from meetings will appear here." />
          ) : (
            <div className="space-y-2">
              {decisions.map((d) => (
                <DecisionRow key={d.id} decision={d} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function MeetingRow({ meeting }: { meeting: { id: string; title: string | null; started_at: string | null; status: string | null; source: string | null; duration_mins: number | null } }) {
  const statusColor =
    meeting.status === "processed"
      ? "text-emerald-400"
      : meeting.status === "failed"
      ? "text-red-400"
      : "text-amber-400";

  const statusLabel =
    meeting.status === "processed"
      ? "Processed"
      : meeting.status === "failed"
      ? "Failed"
      : "Pending";

  const sourceLabel =
    meeting.source === "google_meet" ? "Google Meet" : meeting.source === "zoom" ? "Zoom" : null;

  return (
    <Link
      href={`/dashboard/meetings/${meeting.id}`}
      className="flex items-center justify-between gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 hover:bg-white/[0.05] transition-colors"
    >
      <div className="min-w-0">
        <p className="text-sm truncate">{meeting.title ?? "Untitled meeting"}</p>
        <p className="text-xs text-white/35 mt-0.5">
          {meeting.started_at ? new Date(meeting.started_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
          {meeting.duration_mins ? ` · ${meeting.duration_mins}m` : ""}
          {sourceLabel ? ` · ${sourceLabel}` : ""}
        </p>
      </div>
      <span className={`shrink-0 text-xs ${statusColor}`}>{statusLabel}</span>
    </Link>
  );
}

function DecisionRow({ decision }: { decision: { id: string; summary: string | null; created_at: string } }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
      <p className="text-sm leading-snug line-clamp-2">{decision.summary ?? "No summary"}</p>
      <p className="text-xs text-white/35 mt-1.5">
        {new Date(decision.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
      </p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-8 text-center">
      <p className="text-sm text-white/25">{message}</p>
    </div>
  );
}
