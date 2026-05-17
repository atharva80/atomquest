'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface ProgressSummaryProps {
  employeeId?: string;
}

export function ProgressSummary({ employeeId }: ProgressSummaryProps) {
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [isSimulated, setIsSimulated] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchSummary = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const res = await fetch('/api/ai/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employeeId }),
      });

      if (!res.ok) {
        throw new Error('Failed to fetch summary');
      }

      const data = await res.json();
      setSummary(data.summary || '');
      setIsSimulated(!!data.simulated);
    } catch (err) {
      console.error('Error fetching progress summary:', err);
      setSummary('Could not load progress summary. Please try again.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  if (loading) {
    return (
      <div className="bg-white border border-zinc-200 rounded-xl p-5 flex items-start gap-4">
        <div className="p-2 bg-zinc-100 rounded-lg animate-pulse">
          <div className="w-5 h-5 bg-zinc-200 rounded-full" />
        </div>
        <div className="space-y-2 flex-1 pt-1">
          <div className="h-4 bg-zinc-100 rounded animate-pulse w-1/4" />
          <div className="h-3 bg-zinc-100 rounded animate-pulse w-full" />
          <div className="h-3 bg-zinc-100 rounded animate-pulse w-5/6" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in relative overflow-hidden group hover:border-zinc-300 transition-colors">
      <div className="flex items-start gap-4 flex-1 z-10">
        <div className="p-2 bg-zinc-100 rounded-lg text-zinc-700 group-hover:bg-zinc-200 transition-colors duration-300">
          <span className="material-symbols-outlined text-[20px] animate-pulse-subtle">smart_toy</span>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-[14px] font-medium text-zinc-900 leading-[20px]">
              AI Performance Insights
            </h4>
            <span 
              className={cn(
                "text-[10px] py-0.5 px-2 font-medium tracking-widest uppercase rounded border",
                isSimulated 
                  ? "bg-yellow-50 text-yellow-700 border-yellow-200" 
                  : "bg-green-50 text-green-700 border-green-200"
              )}
            >
              {isSimulated ? 'Simulated' : 'Live'}
            </span>
          </div>
          
          <p className="text-[14px] text-zinc-600 leading-[24px]">
            {summary}
          </p>
        </div>
      </div>

      <button 
        onClick={() => fetchSummary(true)} 
        disabled={isRefreshing}
        className="px-3 py-1.5 rounded flex items-center gap-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors z-10 border border-transparent hover:border-zinc-200"
      >
        <span className={cn("material-symbols-outlined text-[16px]", isRefreshing && "animate-spin")}>sync</span>
        <span className="text-[12px] font-medium hidden md:inline">Regenerate</span>
      </button>
    </div>
  );
}
