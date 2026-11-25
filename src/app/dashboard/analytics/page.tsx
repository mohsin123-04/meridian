export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthUser, getProfile } from "@/lib/dal";

export default async function AnalyticsPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const profile = await getProfile();
  if (!profile?.workspace_id) redirect("/onboarding");

  const supabase = await createClient();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [{ data: meetings }, { data: actionItems }] = await Promise.all([
    supabase
      .from("meetings")
      .select(`
        id, title, started_at, status,
        meeting_health ( efficiency_score, decision_count, action_item_count )
      `)
      .eq("workspace_id", profile.workspace_id)
      .order("started_at", { ascending: false })
      .limit(60),
    supabase
      .from("action_items")
      .select("status, due_date")
      .eq("workspace_id", profile.workspace_id),
  ]);

  const processed = meetings?.filter((m) => m.status === "processed") ?? [];
  const recent = meetings?.filter(
    (m) => m.started_at && new Date(m.started_at) >= thirtyDaysAgo
  ) ?? [];

  // Stats
  const totalMeetings = recent.length;
  const scores = processed
    .map((m) => {
      const h = Array.isArray(m.meeting_health) ? m.meeting_health[0] : m.meeting_health;
      return h?.efficiency_score ?? null;
    })
    .filter((s): s is number => s !== null);
  const avgScore = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : null;
  const totalDecisions = processed.reduce((sum, m) => {
    const h = Array.isArray(m.meeting_health) ? m.meeting_health[0] : m.meeting_health;
    return sum + (h?.decision_count ?? 0);
  }, 0);

  const openItems = actionItems?.filter((i) => i.status === "open").length ?? 0;
  const doneItems = actionItems?.filter((i) => i.status === "done").length ?? 0;
  const overdueItems =
    actionItems?.filter(
      (i) => i.status === "open" && i.due_date && new Date(i.due_date) < new Date()
    ).length ?? 0;

  // Trend: last 20 processed meetings oldest→newest for the chart
  const trendMeetings = processed.slice(0, 20).reverse().map((m) => {
    const h = Array.isArray(m.meeting_health) ? m.meeting_health[0] : m.meeting_health;
    return {
      id: m.id,
      title: m.title ?? "Untitled",
      score: h?.efficiency_score ?? 0,
      date: m.started_at
        ? new Date(m.started_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : "",
    };
  });

  // Recurring leaderboard
  const titleMap = new Map<string, { scores: number[]; count: number; latestId: string }>();
  for (const m of processed) {
    const key = m.title?.trim();
    if (!key) continue;
    const h = Array.isArray(m.meeting_health) ? m.meeting_health[0] : m.meeting_health;
    const score = h?.efficiency_score;
    if (!titleMap.has(key)) titleMap.set(key, { scores: [], count: 0, latestId: m.id });
    const entry = titleMap.get(key)!;
    entry.count++;
    if (score != null) entry.scores.push(score);
  }
  const leaderboard = [...titleMap.entries()]
    .filter(([, v]) => v.count >= 2)
    .map(([title, v]) => ({
      title,
      count: v.count,
      latestId: v.latestId,
      avg: v.scores.length
        ? Math.round(v.scores.reduce((a, b) => a + b, 0) / v.scores.length)
        : null,
    }))
    .sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0));

  const hasData = processed.length > 0;

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight mb-1">Analytics</h1>
        <p className="text-white/40 text-sm">Meeting health and team trends, last 30 days.</p>
      </div>

      {!hasData ? (
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-16 text-center">
          <p className="text-sm text-white/25">No processed meetings yet.</p>
          <p className="text-xs text-white/20 mt-1">Analytics will appear once meetings have been captured and processed.</p>
        </div>
      ) : (
        <div className="space-y-8">

          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              label="Meetings (30d)"
              value={totalMeetings.toString()}
              sub={`${processed.length} processed`}
            />
            <StatCard
              label="Avg efficiency"
              value={avgScore != null ? avgScore.toString() : "—"}
              sub="out of 100"
              valueColor={avgScore != null ? scoreColor(avgScore) : "text-white"}
            />
            <StatCard
              label="Decisions logged"
              value={totalDecisions.toString()}
              sub="all time"
            />
            <StatCard
              label="Open actions"
              value={openItems.toString()}
              sub={overdueItems > 0 ? `${overdueItems} overdue` : `${doneItems} completed`}
              subColor={overdueItems > 0 ? "text-red-400" : undefined}
            />
          </div>

          {/* Efficiency trend */}
          {trendMeetings.length > 0 && (
            <section>
              <h2 className="text-xs font-medium text-white/40 uppercase tracking-widest mb-4">
                Efficiency trend
              </h2>
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-5 py-5">
                <div className="flex items-end gap-1 h-24 mb-2">
                  {trendMeetings.map((m) => (
                    <Link
                      key={m.id}
                      href={`/dashboard/meetings/${m.id}`}
                      title={`${m.title}: ${m.score}`}
                      className="flex-1 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
                      style={{
                        height: `${Math.max(m.score, 4)}%`,
                        backgroundColor:
                          m.score >= 75 ? "#34d399" :
                          m.score >= 50 ? "#fbbf24" : "#f87171",
                      }}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-white/20">
                  <span>{trendMeetings[0]?.date}</span>
                  <span>{trendMeetings[trendMeetings.length - 1]?.date}</span>
                </div>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/[0.05]">
                  <Legend color="#34d399" label="75+" />
                  <Legend color="#fbbf24" label="50-74" />
                  <Legend color="#f87171" label="Below 50" />
                </div>
              </div>
            </section>
          )}

          {/* Two column: recurring leaderboard + action item health */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Recurring leaderboard */}
            {leaderboard.length > 0 && (
              <section>
                <h2 className="text-xs font-medium text-white/40 uppercase tracking-widest mb-4">
                  Recurring meetings
                </h2>
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
                  {leaderboard.map((row, i) => (
                    <div
                      key={row.title}
                      className={`flex items-center justify-between gap-3 px-5 py-3 ${
                        i < leaderboard.length - 1 ? "border-b border-white/[0.05]" : ""
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm truncate">{row.title}</p>
                        <p className="text-xs text-white/35 mt-0.5">{row.count} meetings</p>
                      </div>
                      <div className="shrink-0 text-right">
                        {row.avg != null ? (
                          <>
                            <span className={`text-sm font-semibold ${scoreColor(row.avg)}`}>
                              {row.avg}
                            </span>
                            <p className="text-xs text-white/25">avg</p>
                          </>
                        ) : (
                          <span className="text-sm text-white/20">—</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Action item health */}
            <section>
              <h2 className="text-xs font-medium text-white/40 uppercase tracking-widest mb-4">
                Action item health
              </h2>
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-5 py-4 space-y-4">
                <ActionBar
                  label="Open"
                  count={openItems}
                  total={openItems + doneItems}
                  color="bg-amber-400/50"
                />
                <ActionBar
                  label="Completed"
                  count={doneItems}
                  total={openItems + doneItems}
                  color="bg-emerald-400/50"
                />
                {overdueItems > 0 && (
                  <div className="pt-3 border-t border-white/[0.05]">
                    <p className="text-xs text-red-400">
                      {overdueItems} overdue item{overdueItems !== 1 ? "s" : ""} need attention
                    </p>
                  </div>
                )}
                {openItems + doneItems === 0 && (
                  <p className="text-sm text-white/25 text-center py-4">No action items yet.</p>
                )}
              </div>
            </section>

          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  valueColor = "text-white",
  subColor,
}: {
  label: string;
  value: string;
  sub: string;
  valueColor?: string;
  subColor?: string;
}) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-4">
      <p className="text-xs text-white/40 mb-2">{label}</p>
      <p className={`text-2xl font-semibold tracking-tight ${valueColor}`}>{value}</p>
      <p className={`text-xs mt-1 ${subColor ?? "text-white/30"}`}>{sub}</p>
    </div>
  );
}

function ActionBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-white/50">{label}</span>
        <span className="text-white/35">{count}</span>
      </div>
      <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
      <span className="text-xs text-white/35">{label}</span>
    </div>
  );
}

function scoreColor(score: number) {
  if (score >= 75) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  return "text-red-400";
}
