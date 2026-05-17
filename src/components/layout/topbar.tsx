'use client';

import { useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { RoleSwitcher } from './role-switcher';
import { Profile, Cycle } from '@/types';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface TopbarProps {
  profile: Profile;
  cycle: Cycle | null;
}

export function Topbar({ profile, cycle }: TopbarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      toast.success(`Searching for "${searchQuery}"...`);
      setSearchQuery('');
    }
  };

  const handleSignOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' });
    // Also clear supabase client state just in case
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <header className="h-[56px] bg-white border-b border-zinc-200 flex justify-between items-center px-6 w-full sticky top-0 z-50 flex-shrink-0">
      <div className="flex items-center gap-6">
        {/* Mobile Menu Button (hidden on md) */}
        <button className="md:hidden text-zinc-500 hover:text-zinc-900 transition-colors">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="text-[24px] leading-[32px] font-semibold text-zinc-900 tracking-tight md:hidden">Orbit</div>
        
        {/* Left: Breadcrumb / Cycle */}
        <nav className="hidden md:flex text-zinc-900 font-medium text-[14px]">
          {cycle && (
            <span className="text-zinc-900 font-medium border-b-2 border-zinc-900 pb-0.5 mt-0.5">
              {cycle.name}
            </span>
          )}
        </nav>
      </div>

      {/* Right: Actions & Profile */}
      <div className="flex items-center gap-4">
        <form onSubmit={handleSearch} className="relative hidden sm:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-[18px]">search</span>
          <input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-1.5 bg-zinc-50 border border-zinc-200 rounded-full focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 text-[14px] text-zinc-900 w-64 transition-all shadow-sm" 
            placeholder="Search goals, users..." 
            type="text"
          />
        </form>
        
        <div className="flex items-center gap-2">
          {/* Notifications Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors opacity-80 relative focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1">
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-red-500 ring-2 ring-white animate-pulse"></span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-white border border-zinc-200 rounded-xl shadow-lg p-2 mt-2">
              <DropdownMenuLabel className="font-semibold text-zinc-900 mb-2 px-2">Notifications</DropdownMenuLabel>
              <div className="flex flex-col gap-2">
                <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-lg text-sm cursor-pointer hover:bg-zinc-100 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-blue-500 text-[20px]">info</span>
                    <div>
                      <p className="font-medium text-zinc-900">Quarterly Check-ins due</p>
                      <p className="text-zinc-500 mt-0.5">Please submit your Q3 check-ins by Friday to avoid delays.</p>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-lg text-sm cursor-pointer hover:bg-zinc-100 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-green-500 text-[20px]">check_circle</span>
                    <div>
                      <p className="font-medium text-zinc-900">Goal Approved</p>
                      <p className="text-zinc-500 mt-0.5">Your manager approved the "Launch Mobile App" goal.</p>
                    </div>
                  </div>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <button className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors opacity-80 focus:outline-none">
            <span className="material-symbols-outlined text-[20px]">settings</span>
          </button>
        </div>
        
        <div className="w-px h-5 bg-zinc-200 mx-1"></div>
        
        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="focus:outline-none">
            <button className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center overflow-hidden border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1 transition-all hover:border-zinc-400 cursor-pointer shadow-sm">
              <span className="text-[13px] font-semibold text-zinc-700 tracking-wide">
                {profile.full_name ? getInitials(profile.full_name) : getInitials(`${profile.first_name} ${profile.last_name}`)}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 bg-white border border-zinc-200 rounded-xl shadow-lg mt-2 p-1">
            <DropdownMenuLabel className="font-normal p-3">
              <div className="flex flex-col space-y-1.5">
                <p className="text-[15px] font-semibold leading-none text-zinc-900 tracking-tight">
                  {profile.full_name || `${profile.first_name} ${profile.last_name}`}
                </p>
                <p className="text-sm leading-none text-zinc-500">{profile.email}</p>
                <p className="text-[10px] font-bold text-zinc-400 mt-2 uppercase tracking-widest">{profile.role}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-zinc-100 my-1" />
            <div className="p-2">
              <p className="text-xs text-zinc-400 mb-2 px-2 font-semibold uppercase tracking-wider">Demo Access</p>
              <RoleSwitcher currentRole={profile.role} />
            </div>
            <DropdownMenuSeparator className="bg-zinc-100 my-1" />
            <div className="p-1">
              <DropdownMenuItem asChild className="text-zinc-700 cursor-pointer focus:bg-zinc-100 p-0 rounded-lg">
                <button onClick={handleSignOut} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-zinc-700 font-medium hover:bg-zinc-50 hover:text-red-600 transition-colors rounded-lg">
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  Sign Out
                </button>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
