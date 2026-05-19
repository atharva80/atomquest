'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

interface ExportButtonProps {
  type: 'goals' | 'checkins' | 'audit' | 'achievements';
  cycleId: string;
  format?: 'csv' | 'xlsx';
  label?: string;
}

export function ExportButton({ type, cycleId, format = 'csv', label = 'Export' }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [quarter, setQuarter] = useState('all');

  const handleExport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type,
        cycleId,
        format,
        quarter
      });
      const response = await fetch(`/api/export?${params.toString()}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Export failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const filename = `export-${type}-${new Date().toISOString().split('T')[0]}${quarter !== 'all' ? `-${quarter}` : ''}.csv`;
      a.download = filename;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Export completed successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  // Show quarter selector only for achievements type
  const showQuarterSelector = type === 'achievements';

  return (
    <div className="flex items-center gap-2">
      {showQuarterSelector && (
        <select
          value={quarter}
          onChange={(e) => setQuarter(e.target.value)}
          className="border border-zinc-200 rounded-md px-2 py-1.5 text-sm bg-white"
        >
          <option value="all">All Quarters</option>
          <option value="Q1">Q1</option>
          <option value="Q2">Q2</option>
          <option value="Q3">Q3</option>
          <option value="Q4">Q4</option>
        </select>
      )}
      <Button onClick={handleExport} disabled={loading} variant="outline" size="sm">
        <Download className="mr-2 h-4 w-4" />
        {loading ? 'Exporting...' : label}
      </Button>
    </div>
  );
}
