export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getAuthUser, getProfile } from "@/lib/dal";
import { uploadTranscript } from "./actions";

export default async function NewMeetingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const profile = await getProfile();
  if (!profile?.workspace_id) redirect("/onboarding");

  const params = await searchParams;

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-xl font-semibold tracking-tight mb-1">Upload transcript</h1>
      <p className="text-white/40 text-sm mb-8">
        Paste a meeting transcript to extract decisions, action items, and health scores.
      </p>

      {params.error && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {params.error}
        </div>
      )}

      <form action={uploadTranscript} className="space-y-4">
        <div>
          <label className="block text-xs text-white/40 uppercase tracking-widest mb-2">
            Meeting title <span className="normal-case text-white/20">(optional)</span>
          </label>
          <input
            name="title"
            type="text"
            placeholder="e.g. Q4 Planning"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs text-white/40 uppercase tracking-widest mb-2">
            Duration <span className="normal-case text-white/20">(minutes, optional)</span>
          </label>
          <input
            name="duration_mins"
            type="number"
            min="1"
            placeholder="e.g. 45"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs text-white/40 uppercase tracking-widest mb-2">
            Transcript <span className="text-red-400">*</span>
          </label>
          <textarea
            name="transcript"
            required
            rows={16}
            placeholder="Paste your meeting transcript here..."
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors resize-none font-[family-name:var(--font-geist-mono)] text-xs leading-relaxed"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="bg-white text-black hover:bg-white/90 transition-colors rounded-xl px-5 py-2.5 text-sm font-medium"
          >
            Process meeting
          </button>
          <a
            href="/dashboard/meetings"
            className="text-sm text-white/35 hover:text-white transition-colors"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
