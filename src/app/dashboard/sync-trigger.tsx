"use client";

import { useEffect } from "react";

const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const LS_KEY = "meridian_last_sync";

export default function SyncTrigger() {
  useEffect(() => {
    const last = Number(localStorage.getItem(LS_KEY) ?? 0);
    if (Date.now() - last < COOLDOWN_MS) return;

    localStorage.setItem(LS_KEY, String(Date.now()));
    fetch("/api/integrations/google/sync", { method: "POST" }).catch(() => {});
  }, []);

  return null;
}
