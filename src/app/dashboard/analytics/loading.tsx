export default function Loading() {
  return (
    <div className="p-8 max-w-4xl">
      <div className="h-6 w-28 bg-white/[0.06] rounded-lg mb-2 animate-pulse" />
      <div className="h-4 w-56 bg-white/[0.04] rounded mb-8 animate-pulse" />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-white/[0.03] border border-white/[0.05] rounded-xl animate-pulse" />
        ))}
      </div>

      {/* Trend chart */}
      <div className="h-40 bg-white/[0.03] border border-white/[0.05] rounded-xl mb-8 animate-pulse" />

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-48 bg-white/[0.03] border border-white/[0.05] rounded-xl animate-pulse" />
        <div className="h-48 bg-white/[0.03] border border-white/[0.05] rounded-xl animate-pulse" />
      </div>
    </div>
  );
}
