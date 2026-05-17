import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export const metadata = { title: 'Shared Goals — Orbit' };

export default async function SharedGoalsPage() {
  const supabase = await createClient();
  
  // Fetch shared goals relations
  const { data: sharedGoals } = await supabase
    .from('shared_goals')
    .select('*, goals:primary_goal_id(title, profiles:employee_id(first_name, last_name, email)), shared_with:shared_employee_id(first_name, last_name, email)')
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-section-gap p-6">
      <div className="flex justify-between items-end mb-2">
        <div className="flex flex-col gap-1">
          <h1 className="font-page-title text-page-title font-semibold text-zinc-900">Shared Goals Directory</h1>
          <p className="font-body-sm text-body-sm text-zinc-500">Manage cascading and cross-functional goals</p>
        </div>
        <button className="bg-zinc-900 text-white hover:bg-zinc-800 px-4 py-2 rounded-md font-table-cell-primary text-table-cell-primary transition-colors flex items-center space-x-2">
          <span className="material-symbols-outlined text-[18px]">share</span>
          <span>Create Shared Goal</span>
        </button>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden animate-fade-in-up-stagger">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="px-4 py-3 font-section-label text-section-label text-zinc-500 tracking-widest uppercase">Primary Owner</th>
                <th className="px-4 py-3 font-section-label text-section-label text-zinc-500 tracking-widest uppercase">Goal Title</th>
                <th className="px-4 py-3 font-section-label text-section-label text-zinc-500 tracking-widest uppercase">Shared With</th>
                <th className="px-4 py-3 font-section-label text-section-label text-zinc-500 tracking-widest uppercase">Sync Status</th>
                <th className="px-4 py-3 font-section-label text-section-label text-zinc-500 tracking-widest uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {sharedGoals?.map((sg: any) => {
                const ownerName = `${sg.goals?.profiles?.first_name || ''} ${sg.goals?.profiles?.last_name || ''}`.trim() || sg.goals?.profiles?.email || 'Unknown';
                const sharedWithName = `${sg.shared_with?.first_name || ''} ${sg.shared_with?.last_name || ''}`.trim() || sg.shared_with?.email || 'Unknown';
                
                return (
                  <tr key={sg.id} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="font-table-cell-primary text-table-cell-primary font-medium text-zinc-900">{ownerName}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-body-sm text-body-sm text-zinc-600 max-w-[200px] truncate">{sg.goals?.title || 'Unknown Goal'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-table-cell-primary text-table-cell-primary text-zinc-700">{sharedWithName}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-status-on-track"></div>
                        <span className="font-table-cell-primary text-table-cell-primary text-zinc-700">Synced</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-zinc-500 hover:text-status-overdue font-table-cell-primary text-table-cell-primary transition-colors bg-white border border-zinc-200 px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100 shadow-sm">
                        Unlink
                      </button>
                    </td>
                  </tr>
                );
              })}
              
              {(!sharedGoals || sharedGoals.length === 0) && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-zinc-500 font-body-sm">
                    No shared goals configured yet.
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
