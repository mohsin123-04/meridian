export const dynamic = "force-dynamic";

import { createWorkspace } from "./actions";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold tracking-tight mb-1">Set up your workspace</h1>
          <p className="text-white/40 text-sm">This is where your team&apos;s meetings will live.</p>
        </div>

        {params.error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {params.error}
          </div>
        )}

        <form action={createWorkspace} className="space-y-3">
          <div>
            <input
              name="name"
              type="text"
              placeholder="Company or team name"
              required
              minLength={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder:text-white/30 focus:outline-none focus:border-violet-500/50"
            />
            <p className="text-white/25 text-xs mt-2 ml-1">
              You can invite teammates after setup.
            </p>
          </div>
          <button
            type="submit"
            className="w-full bg-violet-600 hover:bg-violet-500 transition-colors rounded-xl px-4 py-3 text-sm font-medium"
          >
            Create workspace
          </button>
        </form>
      </div>
    </main>
  );
}
