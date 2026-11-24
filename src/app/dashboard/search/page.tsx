export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("workspace_id")
    .eq("id", user.id)
    .single();

  if (!profile?.workspace_id) redirect("/onboarding");

  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  if (!query) {
    return (
      <div className="p-8 max-w-2xl">
        <h1 className="text-xl font-semibold tracking-tight mb-1">Search</h1>
        <p className="text-white/40 text-sm">Search across meetings, decisions, and action items.</p>
        <div className="mt-16 text-center">
          <p className="text-sm text-white/20">Type something in the search bar to get started.</p>
        </div>
      </div>
    );
  }

  const pattern = `%${query}%`;

  const [{ data: meetings }, { data: decisions }, { data: actionItems }] = await Promise.all([
    supabase
      .from("meetings")
      .select("id, title, started_at, status")
      .eq("workspace_id", profile.workspace_id)
      .ilike("title", pattern)
      .order("started_at", { ascending: false })
      .limit(5),
    supabase
      .from("decisions")
      .select("id, summary, topic, meeting_id, created_at")
      .eq("workspace_id", profile.workspace_id)
      .ilike("summary", pattern)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("action_items")
      .select("id, description, owner_name, status, meeting_id")
      .eq("workspace_id", profile.workspace_id)
      .ilike("description", pattern)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const totalResults =
    (meetings?.length ?? 0) + (decisions?.length ?? 0) + (actionItems?.length ?? 0);

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight mb-1">Search</h1>
        <p className="text-white/40 text-sm">
          {totalResults === 0
            ? `No results for "${query}"`
            : `${totalResults} result${totalResults !== 1 ? "s" : ""} for "${query}"`}
        </p>
      </div>

      {totalResults === 0 ? (
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-16 text-center">
          <p className="text-sm text-white/25">Nothing found.</p>
          <p className="text-xs text-white/20 mt-1">Try a different search term.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {meetings && meetings.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-medium text-white/40 uppercase tracking-widest">
                  Meetings
                </h2>
                <span className="text-xs text-white/25">{meetings.length}</span>
              </div>
              <div className="space-y-1.5">
                {meetings.map((m) => (
                  <Link
                    key={m.id}
                    href={`/dashboard/meetings/${m.id}`}
                    className="flex items-center justify-between gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 hover:bg-white/[0.05] transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        <Highlight text={m.title ?? "Untitled meeting"} query={query} />
                      </p>
                      {m.started_at && (
                        <p className="text-xs text-white/35 mt-0.5">
                          {new Date(m.started_at).toLocaleDateString("en-US", {
                            weekday: "short", month: "short", day: "numeric",
                          })}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-white/20 text-xs">→</span>
                  </Link>
                ))}
              </div>
              {meetings.length === 5 && (
                <Link
                  href="/dashboard/meetings"
                  className="block mt-2 text-xs text-white/30 hover:text-white/60 transition-colors px-1"
                >
                  View all meetings →
                </Link>
              )}
            </section>
          )}

          {decisions && decisions.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-medium text-white/40 uppercase tracking-widest">
                  Decisions
                </h2>
                <span className="text-xs text-white/25">{decisions.length}</span>
              </div>
              <div className="space-y-1.5">
                {decisions.map((d) => (
                  <Link
                    key={d.id}
                    href={d.meeting_id ? `/dashboard/meetings/${d.meeting_id}` : "/dashboard/decisions"}
                    className="block bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 hover:bg-white/[0.05] transition-colors"
                  >
                    <p className="text-sm leading-snug">
                      <Highlight text={d.summary ?? ""} query={query} />
                    </p>
                    {d.topic && (
                      <p className="text-xs text-white/35 mt-1">{d.topic}</p>
                    )}
                  </Link>
                ))}
              </div>
              {decisions.length === 5 && (
                <Link
                  href={`/dashboard/decisions?q=${encodeURIComponent(query)}`}
                  className="block mt-2 text-xs text-white/30 hover:text-white/60 transition-colors px-1"
                >
                  View all decisions →
                </Link>
              )}
            </section>
          )}

          {actionItems && actionItems.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-medium text-white/40 uppercase tracking-widest">
                  Action Items
                </h2>
                <span className="text-xs text-white/25">{actionItems.length}</span>
              </div>
              <div className="space-y-1.5">
                {actionItems.map((item) => (
                  <Link
                    key={item.id}
                    href={item.meeting_id ? `/dashboard/meetings/${item.meeting_id}` : "/dashboard/action-items"}
                    className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 hover:bg-white/[0.05] transition-colors"
                  >
                    <div
                      className={`shrink-0 w-3 h-3 rounded-sm border ${
                        item.status === "done"
                          ? "bg-emerald-500/20 border-emerald-500/40"
                          : "border-white/20"
                      }`}
                    />
                    <div className="min-w-0">
                      <p className={`text-sm truncate ${item.status === "done" ? "line-through text-white/40" : ""}`}>
                        <Highlight text={item.description ?? ""} query={query} />
                      </p>
                      {item.owner_name && (
                        <p className="text-xs text-white/35 mt-0.5">{item.owner_name}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
              {actionItems.length === 5 && (
                <Link
                  href="/dashboard/action-items"
                  className="block mt-2 text-xs text-white/30 hover:text-white/60 transition-colors px-1"
                >
                  View all action items →
                </Link>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;

  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-amber-400/20 text-amber-200 rounded-sm px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}
