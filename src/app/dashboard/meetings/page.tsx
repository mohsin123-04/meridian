export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthUser, getProfile } from "@/lib/dal";

export default async function MeetingsPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const profile = await getProfile();
  if (!profile?.workspace_id) redirect("/onboarding");

  const supabase = await createClient();
  const { data: meetings } = await supabase
    .from("meetings")
    .select(`
      id, title, started_at, ended_at, duration_mins, status, source,
      meeting_health ( efficiency_score, decision_count, action_item_count )
    `)
    .eq("workspace_id", profile.workspace_id)
    .order("started_at", { ascending: false })
    .limit(50);

  // Detect recurring meetings: titles that appear 2 or more times
  const titleCounts = new Map<string, number>();
  for (const m of meetings ?? []) {
    const key = m.title?.trim();
    if (key) titleCounts.set(key, (titleCounts.get(key) ?? 0) + 1);
  }

  // Build series list sorted by count descending
  const seriesEntries = [...titleCounts.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-semibold tracking-tight">Meetings</h1>
        <Link
          href="/dashboard/meetings/new"
          className="text-xs bg-white text-black px-3 py-1.5 rounded-lg font-medium hover:bg-white/90 active:bg-white/75 active:scale-95 transition-all"
        >
          Upload transcript
        </Link>
      </div>
      <p className="text-white/40 text-sm mb-8">All captured meetings, ordered by most recent.</p>

      {!meetings?.length ? (
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-16 text-center">
          <p className="text-sm text-white/25">No meetings captured yet.</p>
          <p className="text-xs text-white/20 mt-1">Connect Google Meet or Zoom in Settings to start.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {seriesEntries.length > 0 && (
            <section>
              <h2 className="text-xs font-medium text-white/40 uppercase tracking-widest mb-3">Recurring</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {seriesEntries.map(([title, count]) => {
                  const seriesMeetings = meetings.filter(m => m.title?.trim() === title);
                  const scores = seriesMeetings
                    .map(m => {
                      const h = Array.isArray(m.meeting_health) ? m.meeting_health[0] : m.meeting_health;
                      return h?.efficiency_score ?? null;
                    })
                    .filter((s): s is number => s !== null);
                  const avgScore = scores.length
                    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
                    : null;

                  return (
                    <div
                      key={title}
                      className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3"
                    >
                      <p className="text-sm font-medium truncate">{title}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-white/35">{count} meetings</span>
                        {avgScore !== null && (
                          <span className={`text-xs font-medium ${scoreColor(avgScore)}`}>
                            avg {avgScore}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section>
            {seriesEntries.length > 0 && (
              <h2 className="text-xs font-medium text-white/40 uppercase tracking-widest mb-3">All meetings</h2>
            )}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
              {meetings.map((m, i) => (
                <MeetingRow
                  key={m.id}
                  meeting={m}
                  isRecurring={(titleCounts.get(m.title?.trim() ?? "") ?? 0) >= 2}
                  divider={i < meetings.length - 1}
                />
              ))}
            </div>
          </section>
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

function MeetingRow({ meeting, isRecurring, divider }: { meeting: MeetingWithHealth; isRecurring: boolean; divider: boolean }) {
  const dotColor =
    meeting.status === "processed" ? "bg-emerald-400" :
    meeting.status === "failed" ? "bg-red-400" : "bg-amber-400";

  const sourceLabel =
    meeting.source === "google_meet" ? "Google Meet" :
    meeting.source === "zoom" ? "Zoom" : "Manual";

  const health = Array.isArray(meeting.meeting_health)
    ? meeting.meeting_health[0]
    : meeting.meeting_health;

  return (
    <Link
      href={`/dashboard/meetings/${meeting.id}`}
      className={`flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.03] active:bg-white/[0.05] transition-colors ${divider ? "border-b border-white/[0.05]" : ""}`}
    >
      {/* Score */}
      <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center bg-white/[0.04]">
        {health?.efficiency_score != null ? (
          <span className={`text-sm font-semibold ${scoreColor(health.efficiency_score)}`}>
            {health.efficiency_score}
          </span>
        ) : (
          <div className={`w-1.5 h-1.5 rounded-full ${dotColor} opacity-60`} />
        )}
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm truncate">{meeting.title ?? "Untitled meeting"}</p>
          {isRecurring && (
            <span className="shrink-0 text-[10px] text-white/20 border border-white/[0.08] rounded px-1.5 py-0.5">Recurring</span>
          )}
        </div>
        <p className="text-xs text-white/30 mt-0.5">
          {meeting.started_at
            ? new Date(meeting.started_at).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
            : "—"}
          {meeting.duration_mins ? ` · ${meeting.duration_mins}m` : ""}
          {` · ${sourceLabel}`}
        </p>
      </div>

      {/* Stats */}
      {health && meeting.status === "processed" && (
        <div className="shrink-0 flex items-center gap-3 text-xs text-white/25">
          {health.decision_count != null && <span>{health.decision_count}d</span>}
          {health.action_item_count != null && <span>{health.action_item_count}a</span>}
        </div>
      )}
    </Link>
  );
}

function scoreColor(score: number) {
  if (score >= 75) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  return "text-red-400";
}
