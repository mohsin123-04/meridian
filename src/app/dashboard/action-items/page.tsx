export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { toggleActionItemStatus } from "./actions";

export default async function ActionItemsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("workspace_id")
    .eq("id", user.id)
    .single();

  if (!profile?.workspace_id) redirect("/onboarding");

  const { data: items } = await supabase
    .from("action_items")
    .select(`
      id, description, owner_name, due_date, status, created_at,
      meetings ( id, title, started_at )
    `)
    .eq("workspace_id", profile.workspace_id)
    .order("created_at", { ascending: false })
    .limit(100);

  const open = items?.filter((i) => i.status === "open") ?? [];
  const done = items?.filter((i) => i.status === "done") ?? [];

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-xl font-semibold tracking-tight mb-1">Action Items</h1>
      <p className="text-white/40 text-sm mb-8">All open tasks extracted from your meetings.</p>

      {!items?.length ? (
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-16 text-center">
          <p className="text-sm text-white/25">No action items yet.</p>
          <p className="text-xs text-white/20 mt-1">Action items are extracted automatically when meetings are processed.</p>
        </div>
      ) : (
        <div className="space-y-10">
          <section>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-xs font-medium text-white/40 uppercase tracking-widest">Open</h2>
              <span className="text-xs text-white/25">{open.length}</span>
            </div>
            {!open.length ? (
              <p className="text-sm text-white/25 px-1">All caught up.</p>
            ) : (
              <div className="space-y-2">
                {open.map((item) => <ActionRow key={item.id} item={item} />)}
              </div>
            )}
          </section>

          {done.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-xs font-medium text-white/40 uppercase tracking-widest">Completed</h2>
                <span className="text-xs text-white/25">{done.length}</span>
              </div>
              <div className="space-y-2">
                {done.map((item) => <ActionRow key={item.id} item={item} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

type ActionItem = {
  id: string;
  description: string;
  owner_name: string | null;
  due_date: string | null;
  status: string;
  created_at: string;
  meetings: { id: string; title: string | null; started_at: string | null } | { id: string; title: string | null; started_at: string | null }[] | null;
};

function ActionRow({ item }: { item: ActionItem }) {
  const meeting = Array.isArray(item.meetings) ? item.meetings[0] : item.meetings;
  const isDone = item.status === "done";

  const isOverdue =
    item.due_date &&
    item.status === "open" &&
    new Date(item.due_date) < new Date();

  return (
    <div className={`flex items-start gap-3 bg-white/[0.03] border rounded-xl px-5 py-4 ${isDone ? "border-white/[0.04] opacity-50" : "border-white/[0.07]"}`}>
      <form action={toggleActionItemStatus}>
        <input type="hidden" name="id" value={item.id} />
        <input type="hidden" name="status" value={isDone ? "open" : "done"} />
        <button
          type="submit"
          className={`mt-0.5 w-4 h-4 shrink-0 rounded border flex items-center justify-center transition-colors cursor-pointer ${
            isDone
              ? "bg-emerald-500/20 border-emerald-500/40 hover:bg-emerald-500/10"
              : "border-white/20 hover:border-white/40"
          }`}
        >
          {isDone && (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1.5 5L4 7.5L8.5 2.5" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </form>

      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${isDone ? "line-through text-white/40" : ""}`}>{item.description}</p>

        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          {item.owner_name && (
            <span className="text-xs text-white/35">{item.owner_name}</span>
          )}
          {item.due_date && (
            <span className={`text-xs ${isOverdue ? "text-red-400" : "text-white/35"}`}>
              {isOverdue ? "Overdue · " : "Due "}
              {new Date(item.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          )}
          {meeting && (
            <Link
              href={`/dashboard/meetings/${meeting.id}`}
              className="text-xs text-white/25 hover:text-white/60 transition-colors"
            >
              {meeting.title ?? "View meeting"} →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
