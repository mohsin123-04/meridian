export default function Loading() {
  return (
    <div className="p-8 max-w-3xl">
      <div className="h-6 w-32 bg-white/[0.06] rounded-lg mb-2 animate-pulse" />
      <div className="h-4 w-56 bg-white/[0.04] rounded mb-8 animate-pulse" />

      <div className="space-y-10">
        {["Open", "Completed"].map((section) => (
          <div key={section}>
            <div className="h-3 w-16 bg-white/[0.05] rounded mb-3 animate-pulse" />
            <div className="space-y-2">
              {Array.from({ length: section === "Open" ? 4 : 2 }).map((_, i) => (
                <div key={i} className="h-16 bg-white/[0.03] border border-white/[0.05] rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
