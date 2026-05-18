'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { resolveEscalation } from '@/actions/escalations';
import { toast } from 'sonner';
import { revalidatePath } from 'next/cache';

interface Escalation {
  id: string;
  created_at: string;
  type: string;
  resolved_at: string | null;
  target_user?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export function EscalationsClient({ initialEscalations }: { initialEscalations: Escalation[] }) {
  const [escalations, setEscalations] = useState(initialEscalations);

  const handleResolve = async (escalationId: string) => {
    const result = await resolveEscalation(escalationId);
    if (result.success) {
      setEscalations(prev => 
        prev.map(e => 
          e.id === escalationId 
            ? { ...e, resolved_at: new Date().toISOString() }
            : e
        )
      );
      toast.success('Escalation resolved');
    } else {
      toast.error(result.error || 'Failed to resolve');
    }
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden animate-fade-in-up-stagger">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200">
              <th className="px-4 py-3 font-section-label text-section-label text-zinc-500 tracking-widest uppercase">Date</th>
              <th className="px-4 py-3 font-section-label text-section-label text-zinc-500 tracking-widest uppercase">Employee</th>
              <th className="px-4 py-3 font-section-label text-section-label text-zinc-500 tracking-widest uppercase">Type</th>
              <th className="px-4 py-3 font-section-label text-section-label text-zinc-500 tracking-widest uppercase">Level</th>
              <th className="px-4 py-3 font-section-label text-section-label text-zinc-500 tracking-widest uppercase">Status</th>
              <th className="px-4 py-3 font-section-label text-section-label text-zinc-500 tracking-widest uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {escalations.map((esc) => {
              const fullName = `${esc.target_user?.first_name || ''} ${esc.target_user?.last_name || ''}`.trim() || 'Unknown User';
              return (
                <tr key={esc.id} className="hover:bg-zinc-50/50 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="font-body-sm text-body-sm text-zinc-600">{new Date(esc.created_at).toLocaleDateString()}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-table-cell-primary text-table-cell-primary font-medium text-zinc-900">{fullName}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-table-cell-primary text-table-cell-primary text-zinc-700 capitalize">{esc.type.replace(/_/g, ' ')}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-zinc-100 text-zinc-700 font-badge-label text-badge-label border border-zinc-200">
                      Level 1
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {esc.resolved_at ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        <span className="font-table-cell-primary text-table-cell-primary text-zinc-700">Resolved</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                        <span className="font-table-cell-primary text-table-cell-primary text-red-600 font-medium">Pending</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!esc.resolved_at ? (
                      <button 
                        onClick={() => handleResolve(esc.id)}
                        className="text-zinc-500 hover:text-zinc-900 font-table-cell-primary text-table-cell-primary transition-colors bg-white border border-zinc-200 px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100 shadow-sm flex items-center gap-1 ml-auto cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        Resolve
                      </button>
                    ) : (
                      <span className="font-table-cell-primary text-table-cell-primary text-zinc-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
            
            {(!escalations || escalations.length === 0) && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-zinc-500 font-body-sm">
                  No escalations logged. Process compliance is 100%.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}