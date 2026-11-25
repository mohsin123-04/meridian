"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProcessTrigger({ meetingId }: { meetingId: string }) {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function run() {
      await fetch("/api/process-meeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId }),
      });
      if (!cancelled) router.refresh();
    }

    run();
    return () => { cancelled = true; };
  }, [meetingId, router]);

  return null;
}
