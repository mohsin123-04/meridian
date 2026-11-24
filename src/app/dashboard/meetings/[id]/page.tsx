export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

export default async function MeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: meeting },
    { data: decisions },
    { data: actionItems },
    { data: participants },
    { data: health },
    { data: brief },
  ] = await Promise.all([
    supabase.from("meetings").select("*").eq("id", id).single(),
    supabase.from("decisions").select("*").eq("meeting_id", id).order("created_at"),
    supabase.from("action_items").select("*").eq("meeting_id", id).order("created_at"),
    supabase.from("meeting_participants").select("*").eq("meeting_id", id).order("talk_time_secs", { ascending: false }),
    supabase.from("meeting_health").select("*").eq("meeting_id", id).single(),
    supabase.from("meeting_briefs").select("*").eq("meeting_id", id).order("generated_at", { ascending: false }).limit(1).single(),
  ]);

  if (!meeting) notFound();

  const sourceLabel =
    meeting.source === "google_meet" ? "Google Meet" :
    meeting.source === "zoom" ? "Zoom" : "Manual";

  return (
    <div className="p-8 max-w-3xl">
      {/* Back */}
      <Link href="/dashboard/meetings" className="text-xs text-white/35 hover:text-white transition-colors mb-6 inline-block">
        ← Meetings
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight">{meeting.title ?? "Untitled meeting"}</h1>
        <p className="text-sm text-white/40 mt-1">
          {meeting.started_at
            ? new Date(meeting.started_at).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
            : "Date unknown"}
          {meeting.duration_mins ? ` · ${meeting.duration_mins}m` : ""}
          {` · ${sourceLabel}`}
        </p>
      </div>

      {/* Health card */}
      {health && (
        <section className="mb-8">
          <SectionLabel>Meeting Health</SectionLabel>
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-5">
            <div className="flex items-start gap-6">
              <div className="text-center shrink-0">
                <p className={`text-3xl font-semibold ${scoreColor(health.efficiency_score ?? 0)}`}>
                  {health.efficiency_score ?? "—"}
                </p>
                <p className="text-xs text-white/35 mt-0.5">efficiency</p>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {health.dominant_speaker && (
                  <Stat label="Most vocal" value={health.dominant_speaker} />
                )}
                {health.decision_count != null && (
                  <Stat label="Decisions" value={String(health.decision_count)} />
                )}
                {health.action_item_count != null && (
                  <Stat label="Action items" value={String(health.action_item_count)} />
                )}
                {health.actual_mins && (
                  <Stat label="Duration" value={`${health.actual_mins}m`} />
                )}
              </div>
            </div>
            {health.recurring_topics?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/[0.06]">
                <p className="text-xs text-white/35 mb-2">Recurring unresolved topics</p>
                <div className="flex flex-wrap gap-1.5">
                  {health.recurring_topics.map((t: string) => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Pre-meeting brief */}
      {brief?.brief && (
        <section className="mb-8">
          <SectionLabel>Pre-Meeting Brief</SectionLabel>
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-5 space-y-4 text-sm">
            {brief.brief.summary && (
              <p className="text-white/70 leading-relaxed">{brief.brief.summary}</p>
            )}
            {brief.brief.suggested_topics?.length > 0 && (
              <div>
                <p className="text-xs text-white/35 mb-2">Suggested topics</p>
                <ul className="space-y-1">
                  {brief.brief.suggested_topics.map((t: string, i: number) => (
                    <li key={i} className="text-white/60 flex gap-2">
                      <span className="text-white/20">·</span> {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Decisions */}
      <section className="mb-8">
        <SectionLabel>{decisions?.length ?? 0} Decision{decisions?.length !== 1 ? "s" : ""}</SectionLabel>
        {!decisions?.length ? (
          <EmptyState message="No decisions extracted." />
        ) : (
          <div className="space-y-3">
            {decisions.map((d) => (
              <div key={d.id} className="bg-white/[0.03] border border-white/[0.07] rounded-xl px-5 py-4">
                <p className="text-sm font-medium leading-snug">{d.summary}</p>
                {d.context && <p className="text-xs text-white/45 mt-1.5 leading-relaxed">{d.context}</p>}
                {d.topics?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {d.topics.map((t: string) => (
                      <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Action items */}
      <section className="mb-8">
        <SectionLabel>{actionItems?.length ?? 0} Action Item{actionItems?.length !== 1 ? "s" : ""}</SectionLabel>
        {!actionItems?.length ? (
          <EmptyState message="No action items extracted." />
        ) : (
          <div className="space-y-2">
            {actionItems.map((a) => (
              <div key={a.id} className="flex items-start gap-3 bg-white/[0.03] border border-white/[0.07] rounded-xl px-5 py-4">
                <div className="mt-0.5 w-4 h-4 shrink-0 rounded border border-white/20" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{a.description}</p>
                  <p className="text-xs text-white/35 mt-1">
                    {a.owner_name && <span>{a.owner_name}</span>}
                    {a.owner_name && a.due_date && <span> · </span>}
                    {a.due_date && <span>Due {new Date(a.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
                  </p>
                </div>
                <span className={`shrink-0 text-xs capitalize ${a.status === "done" ? "text-emerald-400" : "text-white/30"}`}>
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Participants */}
      {participants && participants.length > 0 && (
        <section>
          <SectionLabel>Participants</SectionLabel>
          <div className="space-y-2">
            {participants.map((p) => {
              const totalSecs = participants.reduce((sum, x) => sum + (x.talk_time_secs ?? 0), 0);
              const pct = totalSecs > 0 ? Math.round(((p.talk_time_secs ?? 0) / totalSecs) * 100) : 0;
              return (
                <div key={p.id} className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
                  <div className="w-7 h-7 rounded-full bg-violet-600/30 flex items-center justify-center text-xs font-medium text-violet-300 shrink-0">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="flex-1 text-sm">{p.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                      <div className="h-full bg-violet-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-white/35 w-7 text-right">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xs font-medium text-white/40 uppercase tracking-widest mb-3">{children}</h2>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-white/35">{label}</p>
      <p className="text-sm mt-0.5">{value}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-6 text-center">
      <p className="text-sm text-white/25">{message}</p>
    </div>
  );
}

function scoreColor(score: number) {
  if (score >= 75) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  return "text-red-400";
}
