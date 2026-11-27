"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const stored = localStorage.getItem("meridian-theme");
    if (stored === "light") setTheme("light");
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("meridian-theme", next);
    if (next === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-3 w-full text-left px-5 py-3 bg-white/[0.03] border border-white/[0.07] rounded-xl hover:bg-white/[0.05] active:scale-[0.99] transition-all"
    >
      <div className={`relative w-9 h-5 rounded-full transition-colors ${theme === "light" ? "bg-white/60" : "bg-white/15"}`}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${theme === "light" ? "left-[18px]" : "left-0.5"}`} />
      </div>
      <div>
        <p className="text-sm">{theme === "light" ? "Light mode" : "Dark mode"}</p>
        <p className="text-xs text-white/35 mt-0.5">Switch appearance</p>
      </div>
    </button>
  );
}
