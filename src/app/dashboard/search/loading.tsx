export default function Loading() {
  return (
    <div className="p-8 max-w-2xl">
      <div className="h-10 bg-white/[0.04] border border-white/[0.08] rounded-xl mb-6 animate-pulse" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 bg-white/[0.03] border border-white/[0.05] rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}
