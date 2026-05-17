'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
      <Card className="overflow-hidden border border-indigo-100 dark:border-indigo-950/40 bg-gradient-to-r from-indigo-50/40 to-violet-50/40 dark:from-indigo-950/10 dark:to-violet-950/10 backdrop-blur-md shadow-sm">
        <CardContent className="p-5 flex items-start gap-4">
          <div className="p-2 bg-indigo-100/60 dark:bg-indigo-900/40 rounded-lg animate-pulse">
            <div className="w-5 h-5 bg-indigo-300 dark:bg-indigo-700 rounded-full" />
          </div>
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-indigo-100 dark:bg-indigo-950/80 rounded animate-pulse w-1/4" />
            <div className="h-3 bg-indigo-100 dark:bg-indigo-950/80 rounded animate-pulse w-full" />
            <div className="h-3 bg-indigo-100 dark:bg-indigo-950/80 rounded animate-pulse w-5/6" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group relative overflow-hidden border border-indigo-100/80 dark:border-indigo-900/30 bg-gradient-to-br from-white/60 via-indigo-50/20 to-violet-50/30 dark:from-slate-900/80 dark:via-indigo-950/5 dark:to-violet-950/10 backdrop-blur-md shadow-sm hover:shadow-md hover:border-indigo-200/80 dark:hover:border-indigo-800/40 transition-all duration-300">
      {/* Sparkle background elements */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-400/10 to-violet-500/15 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
      
      <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <div className="p-2.5 bg-indigo-500/10 dark:bg-indigo-400/10 rounded-xl text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-500/20 dark:group-hover:bg-indigo-400/20 transition-colors duration-300">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-semibold text-indigo-950 dark:text-indigo-200 tracking-wide font-heading">
                AI Performance Insights
              </h4>
              <Badge 
                variant="outline" 
                className={`text-[10px] py-0 px-2 h-4 font-medium tracking-wider uppercase border ${
                  isSimulated 
                    ? 'bg-amber-500/5 text-amber-600 border-amber-300/30 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' 
                    : 'bg-emerald-500/5 text-emerald-600 border-emerald-300/30 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                }`}
              >
                {isSimulated ? 'AI Simulated' : 'Live Insights'}
              </Badge>
            </div>
            
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans font-medium">
              {summary}
            </p>
          </div>
        </div>

        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => fetchSummary(true)} 
          disabled={isRefreshing}
          className="h-8 w-8 md:h-9 md:w-auto md:px-3 rounded-full text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/30 shrink-0 border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/50 transition-all duration-300"
        >
          <RefreshCw className={`h-4 w-4 md:mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden md:inline text-xs font-semibold">Regenerate</span>
        </Button>
      </CardContent>
    </Card>
  );
}
