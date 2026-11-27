"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function NavProgress() {
  const pathname = usePathname();
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  // Detect link clicks to start the bar
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a[href]");
      if (!anchor) return;
      const href = anchor.getAttribute("href") ?? "";
      if (!href || href.startsWith("http") || href.startsWith("#") || href.startsWith("mailto")) return;
      setState("loading");
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, []);

  // Mark done when pathname changes (navigation completed)
  useEffect(() => {
    if (state === "loading") {
      setState("done");
      const t = setTimeout(() => setState("idle"), 400);
      return () => clearTimeout(t);
    }
  }, [pathname]);

  if (state === "idle") return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-[2px] overflow-hidden pointer-events-none">
      <div
        className={`h-full bg-white/50 transition-opacity duration-300 ${state === "done" ? "opacity-0 w-full" : "opacity-100"}`}
        style={state === "loading" ? { animation: "nav-progress 8s cubic-bezier(0.1,0.4,0.2,1) forwards" } : { width: "100%" }}
      />
    </div>
  );
}
