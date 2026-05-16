import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { UserProvider } from '@/hooks/use-user';
import { Profile } from '@/types';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  
  // 1. Get session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    redirect('/login');
  }

  // 2. Fetch user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (profileError || !profile) {
    redirect('/login?error=Profile not found');
  }

  // 3. Fetch active cycle for the topbar
  const { data: activeCycle } = await supabase
    .from('cycles')
    .select('*')
    .eq('is_active', true)
    .single();

  return (
    <UserProvider initialProfile={profile as Profile} initialUser={session.user}>
      <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
        <Sidebar role={profile.role} />
        
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <Topbar profile={profile as Profile} cycle={activeCycle || null} />
          
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-7xl mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </UserProvider>
  );
}
