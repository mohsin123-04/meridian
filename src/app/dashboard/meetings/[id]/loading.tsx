export default function Loading() {
  return (
    <div className="p-8 max-w-3xl">
      <div className="h-3 w-16 bg-white/[0.05] rounded mb-6 animate-pulse" />
      <div className="h-6 w-56 bg-white/[0.06] rounded-lg mb-2 animate-pulse" />
      <div className="h-4 w-40 bg-white/[0.04] rounded mb-10 animate-pulse" />
      <div className="h-32 bg-white/[0.03] border border-white/[0.05] rounded-xl mb-8 animate-pulse" />
      <div className="space-y-3 mb-8">
        <div className="h-4 w-20 bg-white/[0.05] rounded animate-pulse" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 bg-white/[0.03] border border-white/[0.05] rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="space-y-2">
        <div className="h-4 w-24 bg-white/[0.05] rounded animate-pulse" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 bg-white/[0.03] border border-white/[0.05] rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}
