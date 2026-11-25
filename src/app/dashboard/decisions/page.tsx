export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import SearchInput from "./search-input";
import { Suspense } from "react";
import { getAuthUser, getProfile } from "@/lib/dal";

export default async function DecisionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const profile = await getProfile();
  if (!profile?.workspace_id) redirect("/onboarding");

  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("decisions")
    .select(`id, summary, context, topics, created_at, meetings ( id, title, started_at )`)
    .eq("workspace_id", profile.workspace_id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (q) {
    query = query.ilike("summary", `%${q}%`);
  }

  const { data: decisions } = await query;

  // Group by topic for the filter list
  const allTopics = Array.from(
    new Set(decisions?.flatMap((d) => d.topics ?? []) ?? [])
  ).sort();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight mb-1">Decisions</h1>
          <p className="text-white/40 text-sm">Every decision extracted from your meetings, in one place.</p>
        </div>
        <Suspense>
          <SearchInput defaultValue={q} />
        </Suspense>
      </div>

      {!decisions?.length ? (
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-16 text-center">
          <p className="text-sm text-white/25">No decisions yet.</p>
          <p className="text-xs text-white/20 mt-1">Decisions are extracted automatically when meetings are processed.</p>
        </div>
      ) : (
        <div className="flex gap-8">
          {/* Topic filter sidebar */}
          {allTopics.length > 0 && (
            <aside className="shrink-0 w-40">
              <p className="text-xs text-white/35 uppercase tracking-widest mb-3">Topics</p>
              <div className="space-y-1">
                {allTopics.map((topic) => {
                  const count = decisions.filter((d) => d.topics?.includes(topic)).length;
                  return (
                    <div key={topic} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.04] cursor-default">
                      <span className="text-xs text-white/60 capitalize">{topic}</span>
                      <span className="text-xs text-white/25">{count}</span>
                    </div>
                  );
                })}
              </div>
            </aside>
          )}

          {/* Decision list */}
          <div className="flex-1 space-y-3 min-w-0">
            {decisions.map((d) => {
              const meeting = Array.isArray(d.meetings) ? d.meetings[0] : d.meetings;
              return (
                <div key={d.id} className="bg-white/[0.03] border border-white/[0.07] rounded-xl px-5 py-4">
                  <p className="text-sm font-medium leading-snug">{d.summary}</p>
                  {d.context && (
                    <p className="text-xs text-white/45 mt-2 leading-relaxed">{d.context}</p>
                  )}

                  <div className="flex items-center justify-between gap-4 mt-3">
                    <div className="flex flex-wrap gap-1.5">
                      {d.topics?.map((t: string) => (
                        <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
                          {t}
                        </span>
                      ))}
                    </div>

                    {meeting && (
                      <Link
                        href={`/dashboard/meetings/${meeting.id}`}
                        className="shrink-0 text-xs text-white/30 hover:text-white transition-colors"
                      >
                        {meeting.title ?? "View meeting"} →
                      </Link>
                    )}
                  </div>

                  <p className="text-xs text-white/20 mt-2">
                    {new Date(d.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
