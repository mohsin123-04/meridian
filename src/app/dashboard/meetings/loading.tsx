export default function Loading() {
  return (
    <div className="p-8">
      <div className="h-6 w-28 bg-white/[0.06] rounded-lg mb-2 animate-pulse" />
      <div className="h-4 w-52 bg-white/[0.04] rounded mb-8 animate-pulse" />
      <div className="space-y-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-[72px] bg-white/[0.03] border border-white/[0.05] rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}
