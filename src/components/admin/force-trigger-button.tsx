'use client';

import { useState } from 'react';
import { triggerEscalationCheck } from '@/actions/escalations';
import { toast } from 'sonner';

export function ForceTriggerButton() {
  const [loading, setLoading] = useState(false);

  const handleTrigger = async () => {
    setLoading(true);
    const result = await triggerEscalationCheck();
    
    if (result.success) {
      toast.success(`Escalation check completed. ${result.data?.created || 0} found.`);
    } else {
      toast.error(result.error || 'Failed to trigger check');
    }
    setLoading(false);
  };

  return (
    <button 
      onClick={handleTrigger}
      disabled={loading}
      className="bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-50 disabled:opacity-50 px-4 py-2 rounded-md font-table-cell-primary text-table-cell-primary transition-colors flex items-center space-x-2"
    >
      <span className={`material-symbols-outlined text-[18px] text-zinc-500 ${loading ? 'animate-spin' : ''}`}>
        {loading ? 'sync' : 'gpp_maybe'}
      </span>
      <span>{loading ? 'Checking...' : 'Force Trigger Check'}</span>
    </button>
  );
}
