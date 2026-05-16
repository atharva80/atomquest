/**
 * Hook — useRealtime
 *
 * Client-side hook for Supabase Realtime subscriptions.
 */

'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useRealtime<T>(
  table: string,
  filter?: string,
  onUpdate?: (payload: any) => void
) {
  const supabase = createClient();

  useEffect(() => {
    let channelParams: any = { event: '*', schema: 'public', table };
    if (filter) {
      channelParams.filter = filter;
    }

    const channel = supabase
      .channel(`realtime_${table}_${filter || 'all'}`)
      .on('postgres_changes', channelParams, (payload) => {
        if (onUpdate) onUpdate(payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, table, filter, onUpdate]);
}
