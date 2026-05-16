'use client';

import { Bell } from 'lucide-react';
import { Breadcrumbs } from './breadcrumbs';
import { RoleSwitcher } from './role-switcher';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { Profile, Cycle } from '@/types';

interface TopbarProps {
  profile: Profile;
  cycle: Cycle | null;
}

export function Topbar({ profile, cycle }: TopbarProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white/80 px-6 backdrop-blur-md dark:bg-slate-950/80 dark:border-slate-800">
      <div className="flex items-center gap-4">
        <Breadcrumbs />
      </div>

      <div className="flex items-center gap-4">
        {cycle && (
          <div className="hidden md:flex items-center px-3 py-1 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-full dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/30">
            {cycle.name}
          </div>
        )}
        
        <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors dark:hover:text-slate-300">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-950"></span>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none">
            <Avatar className="h-8 w-8 ring-2 ring-indigo-100 dark:ring-indigo-900/30 transition-all hover:ring-indigo-300">
              <AvatarFallback className="bg-indigo-600 text-white text-xs">
                {getInitials(profile.full_name)}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{profile.full_name}</p>
                <p className="text-xs leading-none text-muted-foreground">{profile.email}</p>
                <p className="text-xs font-semibold text-indigo-600 mt-1 capitalize">{profile.role}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="p-2">
              <p className="text-xs text-muted-foreground mb-2 px-2 font-medium">Demo Actions</p>
              <RoleSwitcher currentRole={profile.role} />
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-600">
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
