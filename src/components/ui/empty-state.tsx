import React from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4 bg-white border border-zinc-200 rounded-xl text-center", className)}>
      <span className="material-symbols-outlined text-[48px] text-zinc-300 mb-4" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 48" }}>
        {icon}
      </span>
      <h3 className="text-[16px] font-medium text-zinc-900 mb-2 leading-[24px]">{title}</h3>
      <p className="text-[14px] text-zinc-500 mb-6 max-w-sm leading-[24px]">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
