export default function Loading() {
  return (
    <div className="p-8 flex gap-8">
      {/* Topic sidebar skeleton */}
      <div className="w-40 shrink-0 space-y-1.5">
        <div className="h-3 w-20 bg-white/[0.05] rounded mb-4 animate-pulse" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-7 bg-white/[0.03] rounded-lg animate-pulse" />
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="h-6 w-28 bg-white/[0.06] rounded-lg mb-2 animate-pulse" />
        <div className="h-4 w-48 bg-white/[0.04] rounded mb-6 animate-pulse" />
        <div className="h-9 bg-white/[0.03] border border-white/[0.05] rounded-lg mb-6 animate-pulse" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 bg-white/[0.03] border border-white/[0.05] rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
