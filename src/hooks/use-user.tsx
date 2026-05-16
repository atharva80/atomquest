/**
 * Hook — useUser
 *
 * Client-side hook to access the current user's profile and role.
 */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile, UserRole } from '@/types';
import { User } from '@supabase/supabase-js';

type UserContextType = {
  user: User | null;
  profile: Profile | null;
  role: UserRole | null;
  isLoading: boolean;
};

const UserContext = createContext<UserContextType>({
  user: null,
  profile: null,
  role: null,
  isLoading: true,
});

export const UserProvider: React.FC<{ children: React.ReactNode, initialProfile?: Profile | null, initialUser?: User | null }> = ({ 
  children, 
  initialProfile = null,
  initialUser = null
}) => {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(initialUser);
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [role, setRole] = useState<UserRole | null>(initialProfile?.role || null);
  const [isLoading, setIsLoading] = useState(!initialProfile);

  useEffect(() => {
    let mounted = true;

    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user && mounted) {
        setUser(session.user);
        if (!initialProfile) {
          const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
          if (data && mounted) {
            setProfile(data as Profile);
            setRole(data.role as UserRole);
          }
        }
      }
      if (mounted) setIsLoading(false);
    }

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && mounted) {
        setUser(session.user);
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (data && mounted) {
          setProfile(data as Profile);
          setRole(data.role as UserRole);
        }
      } else if (!session?.user && mounted) {
        setUser(null);
        setProfile(null);
        setRole(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, initialProfile]);

  return (
    <UserContext.Provider value={{ user, profile, role, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
