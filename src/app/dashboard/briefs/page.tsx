export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthUser, getProfile } from "@/lib/dal";

export default async function BriefsPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const profile = await getProfile();
  if (!profile?.workspace_id) redirect("/onboarding");

  const supabase = await createClient();
  const { data: briefs } = await supabase
    .from("meeting_briefs")
    .select(`
      id, generated_at, brief, calendar_event_id,
      meetings ( id, title, started_at )
    `)
    .eq("workspace_id", profile.workspace_id)
    .order("generated_at", { ascending: false })
    .limit(20);

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight mb-1">Pre-Meeting Briefs</h1>
          <p className="text-white/40 text-sm">AI-generated context before each call.</p>
        </div>
        <form action="/api/briefs/upcoming" method="POST">
          <button
            type="submit"
            className="text-xs px-4 py-2 rounded-lg bg-white text-black font-medium hover:bg-white/90 transition-colors"
          >
            Generate upcoming
          </button>
        </form>
      </div>

      {!briefs?.length ? (
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-16 text-center">
          <p className="text-sm text-white/25">No briefs generated yet.</p>
          <p className="text-xs text-white/20 mt-1">
            Briefs are auto-generated 30 minutes before upcoming Google Meet calls, or click &quot;Generate upcoming&quot; above.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {briefs.map((b) => {
            const meeting = Array.isArray(b.meetings) ? b.meetings[0] : b.meetings;
            const brief = b.brief as {
              summary?: string;
              suggested_topics?: string[];
              open_action_items?: Array<{ description: string; owner: string; from_meeting: string }>;
              relevant_decisions?: Array<{ summary: string; context: string; made_at: string }>;
              watch_out_for?: string[];
            };

            return (
              <div key={b.id} className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      {meeting?.title ?? "Upcoming meeting"}
                    </p>
                    <p className="text-xs text-white/35 mt-0.5">
                      Brief generated {new Date(b.generated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                  {meeting?.id && (
                    <Link href={`/dashboard/meetings/${meeting.id}`} className="text-xs text-white/30 hover:text-white transition-colors shrink-0">
                      View meeting →
                    </Link>
                  )}
                </div>

                <div className="px-6 py-5 space-y-5">
                  {/* Summary */}
                  {brief.summary && (
                    <p className="text-sm text-white/70 leading-relaxed">{brief.summary}</p>
                  )}

                  {/* Suggested topics */}
                  {brief.suggested_topics && brief.suggested_topics.length > 0 && (
                    <div>
                      <p className="text-xs text-white/35 uppercase tracking-widest mb-2">Suggested topics</p>
                      <ul className="space-y-1">
                        {brief.suggested_topics.map((t, i) => (
                          <li key={i} className="flex gap-2 text-sm text-white/60">
                            <span className="text-white/20 shrink-0">·</span> {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Open action items */}
                  {brief.open_action_items && brief.open_action_items.length > 0 && (
                    <div>
                      <p className="text-xs text-white/35 uppercase tracking-widest mb-2">Open action items</p>
                      <div className="space-y-2">
                        {brief.open_action_items.map((a, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <div className="mt-1 w-3.5 h-3.5 rounded border border-white/20 shrink-0" />
                            <div>
                              <p className="text-sm text-white/70">{a.description}</p>
                              <p className="text-xs text-white/30 mt-0.5">{a.owner} · from {a.from_meeting}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Relevant decisions */}
                  {brief.relevant_decisions && brief.relevant_decisions.length > 0 && (
                    <div>
                      <p className="text-xs text-white/35 uppercase tracking-widest mb-2">Relevant past decisions</p>
                      <div className="space-y-2">
                        {brief.relevant_decisions.map((d, i) => (
                          <div key={i} className="bg-white/[0.03] rounded-lg px-3 py-2.5">
                            <p className="text-sm text-white/70">{d.summary}</p>
                            {d.context && <p className="text-xs text-white/35 mt-1">{d.context}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Watch out for */}
                  {brief.watch_out_for && brief.watch_out_for.length > 0 && (
                    <div>
                      <p className="text-xs text-white/35 uppercase tracking-widest mb-2">Watch out for</p>
                      <ul className="space-y-1">
                        {brief.watch_out_for.map((w, i) => (
                          <li key={i} className="flex gap-2 text-sm text-amber-400/70">
                            <span className="shrink-0">!</span> {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
