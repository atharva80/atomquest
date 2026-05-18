import { createClient } from '@/lib/supabase/server';
import { ShieldAlert, CheckCircle } from 'lucide-react';
import Link from 'next/link';

import { ForceTriggerButton } from '@/components/admin/force-trigger-button';

export const metadata = { title: 'Escalations — Orbit' };

export default async function EscalationsPage() {
  const supabase = await createClient();
  
  const { data: escalations } = await supabase
    .from('escalations')
    .select('*, target_user:profiles!escalations_target_user_id_fkey(first_name, last_name, email)')
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-section-gap p-6">
      <div className="flex justify-between items-end mb-2">
        <div className="flex flex-col gap-1">
          <h1 className="font-page-title text-page-title font-semibold text-zinc-900">Escalation Log</h1>
          <p className="font-body-sm text-body-sm text-zinc-500">Track process delays requiring HR or Admin intervention</p>
        </div>
        <ForceTriggerButton />
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden animate-fade-in-up-stagger">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="px-4 py-3 font-section-label text-section-label text-zinc-500 tracking-widest uppercase">Date</th>
                <th className="px-4 py-3 font-section-label text-section-label text-zinc-500 tracking-widest uppercase">Employee</th>
                <th className="px-4 py-3 font-section-label text-section-label text-zinc-500 tracking-widest uppercase">Escalation Type</th>
                <th className="px-4 py-3 font-section-label text-section-label text-zinc-500 tracking-widest uppercase">Level</th>
                <th className="px-4 py-3 font-section-label text-section-label text-zinc-500 tracking-widest uppercase">Status</th>
                <th className="px-4 py-3 font-section-label text-section-label text-zinc-500 tracking-widest uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {escalations?.map((esc: any) => {
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
                          <div className="w-1.5 h-1.5 rounded-full bg-status-on-track"></div>
                          <span className="font-table-cell-primary text-table-cell-primary text-zinc-700">Resolved</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-status-overdue animate-pulse-subtle"></div>
                          <span className="font-table-cell-primary text-table-cell-primary text-status-overdue font-medium">Pending</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!esc.resolved_at ? (
                        <button className="text-zinc-500 hover:text-zinc-900 font-table-cell-primary text-table-cell-primary transition-colors bg-white border border-zinc-200 px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100 shadow-sm flex items-center gap-1 ml-auto">
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
    </div>
  );
}
