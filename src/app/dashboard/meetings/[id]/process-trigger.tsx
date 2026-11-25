"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProcessTrigger({ meetingId }: { meetingId: string }) {
  const router = useRouter();
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      await fetch("/api/process-meeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId }),
      });
      if (!cancelled) {
        setDone(true);
        router.refresh();
      }
    }

    run();
    return () => { cancelled = true; };
  }, [meetingId, router]);

  if (done) return null;

  return (
    <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
      <svg className="shrink-0 animate-spin text-amber-400" width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="8 26" strokeLinecap="round" />
      </svg>
      <p className="text-sm text-amber-400">Analysing transcript...</p>
    </div>
  );
}
