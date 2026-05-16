'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { UserRole } from '@/types';

interface SidebarProps {
  role: UserRole;
  collapsed?: boolean;
}

export function Sidebar({ role, collapsed: initialCollapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  
  const navItems = NAV_ITEMS[role] || [];
  
  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className={cn(
      "flex flex-col h-screen bg-slate-950 text-slate-200 transition-all duration-300 border-r border-slate-800", 
      collapsed ? "w-20" : "w-64"
    )}>
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800">
        {!collapsed && <span className="text-xl font-bold text-indigo-400">AtomQuest</span>}
        {collapsed && <span className="text-xl font-bold text-indigo-400 mx-auto">AQ</span>}
        <button onClick={() => setCollapsed(!collapsed)} className="p-1 hover:bg-slate-800 rounded-md hidden md:block">
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            
            return (
              <li key={index}>
                <Link href={item.href} className={cn(
                  "flex items-center rounded-md px-3 py-2 transition-colors",
                  isActive ? "bg-indigo-900/50 text-indigo-300 border-l-2 border-indigo-500" : "hover:bg-slate-800 hover:text-white text-slate-400",
                  collapsed && "justify-center px-0 border-l-0"
                )}>
                  {Icon && <Icon className={cn("h-5 w-5", !collapsed && "mr-3")} />}
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button onClick={handleSignOut} className={cn(
          "flex items-center w-full rounded-md px-3 py-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors", 
          collapsed && "justify-center px-0"
        )}>
          <LogOut className={cn("h-5 w-5", !collapsed && "mr-3")} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
}
