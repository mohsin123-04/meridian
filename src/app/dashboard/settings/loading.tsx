export default function Loading() {
  return (
    <div className="p-8 max-w-2xl">
      <div className="h-6 w-24 bg-white/[0.06] rounded-lg mb-8 animate-pulse" />
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 bg-white/[0.03] border border-white/[0.05] rounded-xl animate-pulse" />
        ))}
        <div className="h-4 w-28 bg-white/[0.05] rounded animate-pulse" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-white/[0.03] border border-white/[0.05] rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
