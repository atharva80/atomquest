'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

interface ExportButtonProps {
  type: 'goals' | 'checkins' | 'audit';
  cycleId: string;
  format?: 'csv' | 'xlsx';
  label?: string;
}

export function ExportButton({ type, cycleId, format = 'xlsx', label = 'Export' }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/export?type=${type}&cycleId=${cycleId}&format=${format}`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-export.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Export completed successfully');
    } catch (error) {
      toast.error('Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleExport} disabled={loading} variant="outline" size="sm">
      <Download className="mr-2 h-4 w-4" />
      {loading ? 'Exporting...' : label}
    </Button>
  );
}
