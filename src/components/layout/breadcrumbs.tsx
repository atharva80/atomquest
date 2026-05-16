'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { Fragment } from 'react';

export function Breadcrumbs() {
  const pathname = usePathname();
  
  if (!pathname || pathname === '/') return null;
  
  const segments = pathname.split('/').filter(Boolean);
  
  return (
    <nav className="flex items-center space-x-1 text-sm text-slate-500 dark:text-slate-400">
      <Link href="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
        <Home className="h-4 w-4" />
      </Link>
      
      {segments.map((segment, index) => {
        const isLast = index === segments.length - 1;
        const href = `/${segments.slice(0, index + 1).join('/')}`;
        const label = segment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        return (
          <Fragment key={href}>
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
            {isLast ? (
              <span className="font-medium text-slate-900 dark:text-slate-200" aria-current="page">
                {label}
              </span>
            ) : (
              <Link href={href} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate max-w-[150px]">
                {label}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
