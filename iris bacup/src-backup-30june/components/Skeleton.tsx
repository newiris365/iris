export default function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-[#13102A]/60 border border-white/5 p-6 rounded-3xl shadow-xl space-y-4 ${className}`}>
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

export function SkeletonTable({ rows = 4, cols = 3 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-[#13102A]/60 border border-white/5 p-6 rounded-3xl shadow-xl space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      <div className="border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-6 space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 mt-8 space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <SkeletonTable rows={5} cols={2} />
          </div>
          <Skeleton className="h-80" />
        </div>
      </div>
    </div>
  );
}