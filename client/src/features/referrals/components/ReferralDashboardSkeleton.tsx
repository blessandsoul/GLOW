import { Skeleton } from '@/components/ui/skeleton';

export function ReferralDashboardSkeleton(): React.ReactElement {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <Skeleton className="mb-3 h-4 w-40" />
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="mt-2.5 h-3 w-56" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
            <Skeleton className="mb-2 h-7 w-12" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
      <Skeleton className="h-32 w-full rounded-2xl" />
      <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/60 px-5 py-4">
          <Skeleton className="h-4 w-32" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-3.5">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
