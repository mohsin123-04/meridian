"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBar() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (q) router.push(`/dashboard/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="px-3 py-2">
      <div className="relative">
        <svg
          width="12"
          height="12"
          viewBox="0 0 15 15"
          fill="none"
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none"
        >
          <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M10 10L13.5 13.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search..."
          className="w-full bg-white/[0.04] border border-white/[0.07] rounded-lg pl-7 pr-3 py-1.5 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-white/15 transition-colors"
        />
      </div>
    </form>
  );
}
