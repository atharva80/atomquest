'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types';

import { signOut } from '@/actions/auth';

interface SidebarProps {
  role: UserRole;
  collapsed?: boolean;
  className?: string;
}

export function Sidebar({ role, collapsed: initialCollapsed = false, className }: SidebarProps) {
  const pathname = usePathname();
  const navItems = NAV_ITEMS[role] || [];

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (e) {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = '/login';
    }
  };

  return (
    <aside className={cn("w-[240px] flex-shrink-0 bg-zinc-50 border-r border-zinc-200 flex flex-col h-full py-4 relative z-40 hidden md:flex", className)}>
      {/* Header */}
      <div className="px-4 mb-8">
        <div className="flex items-center gap-3 mb-1 mt-2">
          <img alt="Orbit Logo" className="w-auto h-12 flex-shrink-0" src="/orbit-logo.png" />
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-2 space-y-1">
        {navItems.map((item, index) => {
          // If we are at the exact item.href, or we are within a sub-path (except for exactly matching the root like /employee which we need to be careful about)
          const isActive = pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== `/${role}`);
          
          return (
            <Link key={index} href={item.href} className={cn(
              "flex items-center gap-3 px-3 py-2 transition-all duration-200 rounded-md animate-fade-in-down",
              isActive 
                ? "bg-zinc-100 text-zinc-900 border-r-2 border-zinc-900 translate-x-1"
                : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
            )}>
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span className="text-[14px] leading-[20px] font-medium">{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Actions */}
      <div className="px-4 mt-auto pt-4 border-t border-zinc-200 flex flex-col gap-4">
        {role === 'employee' && (
          <Link href={`/${role}/goals/new`} className="w-full bg-zinc-900 text-white rounded-md px-4 py-2.5 text-[14px] leading-[20px] font-medium hover:bg-zinc-800 transition-colors flex justify-center items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Create New Goal
          </Link>
        )}
        <div className="flex flex-col gap-1 -mx-2">
          <a className="flex items-center gap-3 px-3 py-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-all duration-200 rounded-md" href="#">
            <span className="material-symbols-outlined text-[20px]">help</span>
            <span className="text-[14px] leading-[20px] font-medium">Help Center</span>
          </a>
          <button 
            type="button" 
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 px-3 py-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-all duration-200 rounded-md text-left"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span className="text-[14px] leading-[20px] font-medium">Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
