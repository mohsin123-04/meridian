export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function MeetingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("workspace_id")
    .eq("id", user.id)
    .single();

  if (!profile?.workspace_id) redirect("/onboarding");

  const { data: meetings } = await supabase
    .from("meetings")
    .select(`
      id, title, started_at, ended_at, duration_mins, status, source,
      meeting_health ( efficiency_score, decision_count, action_item_count )
    `)
    .eq("workspace_id", profile.workspace_id)
    .order("started_at", { ascending: false })
    .limit(50);

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold tracking-tight mb-1">Meetings</h1>
      <p className="text-white/40 text-sm mb-8">All captured meetings, ordered by most recent.</p>

      {!meetings?.length ? (
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-16 text-center">
          <p className="text-sm text-white/25">No meetings captured yet.</p>
          <p className="text-xs text-white/20 mt-1">Connect Google Meet or Zoom in Settings to start.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {meetings.map((m) => (
            <MeetingRow key={m.id} meeting={m} />
          ))}
        </div>
      )}
    </div>
  );
}

type MeetingWithHealth = {
  id: string;
  title: string | null;
  started_at: string | null;
  duration_mins: number | null;
  status: string | null;
  source: string | null;
  meeting_health: { efficiency_score: number | null; decision_count: number | null; action_item_count: number | null }[] | null;
};

function MeetingRow({ meeting }: { meeting: MeetingWithHealth }) {
  const statusColor =
    meeting.status === "processed" ? "text-emerald-400" :
    meeting.status === "failed" ? "text-red-400" : "text-amber-400";

  const sourceLabel =
    meeting.source === "google_meet" ? "Google Meet" :
    meeting.source === "zoom" ? "Zoom" : "Manual";

  const health = Array.isArray(meeting.meeting_health)
    ? meeting.meeting_health[0]
    : meeting.meeting_health;

  return (
    <Link
      href={`/dashboard/meetings/${meeting.id}`}
      className="flex items-center gap-4 bg-white/[0.03] border border-white/[0.06] rounded-xl px-5 py-4 hover:bg-white/[0.05] transition-colors"
    >
      {/* Score badge */}
      <div className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-white/[0.05]">
        {health?.efficiency_score != null ? (
          <span className={`text-sm font-semibold ${scoreColor(health.efficiency_score)}`}>
            {health.efficiency_score}
          </span>
        ) : (
          <span className="text-white/20 text-xs">—</span>
        )}
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{meeting.title ?? "Untitled meeting"}</p>
        <p className="text-xs text-white/35 mt-0.5">
          {meeting.started_at
            ? new Date(meeting.started_at).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
            : "—"}
          {meeting.duration_mins ? ` · ${meeting.duration_mins}m` : ""}
          {` · ${sourceLabel}`}
        </p>
      </div>

      {/* Stats */}
      {health && meeting.status === "processed" && (
        <div className="shrink-0 flex items-center gap-4 text-xs text-white/35">
          {health.decision_count != null && (
            <span>{health.decision_count} decision{health.decision_count !== 1 ? "s" : ""}</span>
          )}
          {health.action_item_count != null && (
            <span>{health.action_item_count} action{health.action_item_count !== 1 ? "s" : ""}</span>
          )}
        </div>
      )}

      <span className={`shrink-0 text-xs ${statusColor} capitalize`}>
        {meeting.status ?? "pending"}
      </span>
    </Link>
  );
}

function scoreColor(score: number) {
  if (score >= 75) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  return "text-red-400";
}
