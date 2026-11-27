export default function Loading() {
  return (
    <div className="p-8 max-w-4xl">
      <div className="h-6 w-32 bg-white/[0.06] rounded-lg mb-1 animate-pulse" />
      <div className="h-4 w-48 bg-white/[0.04] rounded mb-8 animate-pulse" />
      <div className="grid grid-cols-3 gap-4 mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 bg-white/[0.03] border border-white/[0.05] rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="h-4 w-24 bg-white/[0.05] rounded animate-pulse" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-white/[0.03] border border-white/[0.05] rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="space-y-3">
          <div className="h-4 w-24 bg-white/[0.05] rounded animate-pulse" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-white/[0.03] border border-white/[0.05] rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
