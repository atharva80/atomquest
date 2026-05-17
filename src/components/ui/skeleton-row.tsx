import React from 'react';
import { Skeleton } from './skeleton';
import { cn } from '@/lib/utils';

export function SkeletonRow({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-4 py-3 border-b border-zinc-100 last:border-0", className)}>
      <Skeleton className="h-10 w-10 rounded-full bg-zinc-200" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3 bg-zinc-200" />
        <Skeleton className="h-3 w-1/4 bg-zinc-200" />
      </div>
      <Skeleton className="h-6 w-24 bg-zinc-200" />
    </div>
  );
}
