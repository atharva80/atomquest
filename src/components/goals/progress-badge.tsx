'use client';

import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface ProgressBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
}

export function ProgressBadge({ score, size = 'md', showPercentage = true }: ProgressBadgeProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const percentage = Math.round(score * 100);
  
  let color = "text-red-500";
  let stroke = "stroke-red-500";
  if (score >= 0.8) {
    color = "text-green-500";
    stroke = "stroke-green-500";
  } else if (score >= 0.5) {
    color = "text-yellow-500";
    stroke = "stroke-yellow-500";
  }

  const sizes = {
    sm: { radius: 14, strokeWidth: 3, text: "text-[10px]" },
    md: { radius: 20, strokeWidth: 4, text: "text-xs" },
    lg: { radius: 28, strokeWidth: 5, text: "text-base" },
  };

  const { radius, strokeWidth, text } = sizes[size];
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = mounted ? circumference - (score * circumference) : circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: (radius + strokeWidth) * 2, height: (radius + strokeWidth) * 2 }}>
      <svg className="transform -rotate-90" width="100%" height="100%">
        <circle
          className="stroke-slate-200 dark:stroke-slate-800"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx="50%"
          cy="50%"
        />
        <circle
          className={cn("transition-all duration-1000 ease-out", stroke)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx="50%"
          cy="50%"
        />
      </svg>
      {showPercentage && (
        <span className={cn("absolute font-semibold", color, text)}>
          {percentage}%
        </span>
      )}
    </div>
  );
}
