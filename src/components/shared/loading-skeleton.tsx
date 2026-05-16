/**
 * Component — Loading Skeleton
 *
 * Reusable skeleton loader for different layouts.
 */

import { Skeleton } from '@/components/ui/skeleton';

export function LoadingSkeleton({
  variant = 'list',
  count = 3
}: {
  variant?: 'card' | 'table' | 'list' | 'detail';
  count?: number;
}) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (variant === 'card') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {items.map(i => (
          <div key={i} className="rounded-xl border bg-card text-card-foreground shadow p-6 space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="pt-4 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className="rounded-md border p-4 space-y-4">
        <div className="flex gap-4 border-b pb-4">
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-6 w-1/4" />
        </div>
        {items.map(i => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'detail') {
    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-8">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  // list variant
  return (
    <div className="space-y-4">
      {items.map(i => <Skeleton key={i} className="h-12 w-full" />)}
    </div>
  );
}
