/**
 * Component — Empty State
 *
 * Reusable empty state placeholder.
 */

import { LucideIcon, Inbox } from 'lucide-react';
import Link from 'next/link';

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string, href: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[300px] border border-dashed rounded-lg bg-slate-50/50">
      <div className="bg-white p-4 rounded-full shadow-sm mb-4">
        <Icon className="w-8 h-8 text-slate-400" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-medium text-slate-900">{title}</h3>
      {description && <p className="text-slate-500 mt-1 max-w-sm">{description}</p>}
      {action && (
        <Link href={action.href} className="mt-4 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-800 transition-colors">
          {action.label}
        </Link>
      )}
    </div>
  );
}
