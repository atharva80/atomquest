import React from 'react';
import { Skeleton } from './skeleton';
import { cn } from '@/lib/utils';

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("bg-white border border-zinc-200 rounded-xl p-5 flex flex-col gap-4", className)}>
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-2/3 bg-zinc-200" />
          <Skeleton className="h-4 w-1/2 bg-zinc-200" />
        </div>
        <Skeleton className="h-8 w-8 rounded-md bg-zinc-200" />
      </div>
      <div className="space-y-2 mt-4">
        <Skeleton className="h-4 w-full bg-zinc-200" />
        <Skeleton className="h-4 w-5/6 bg-zinc-200" />
      </div>
      <div className="mt-4 pt-4 border-t border-zinc-100 flex justify-between">
        <Skeleton className="h-8 w-24 bg-zinc-200 rounded-md" />
        <Skeleton className="h-8 w-24 bg-zinc-200 rounded-md" />
      </div>
    </div>
  );
}
