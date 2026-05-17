import { createClient } from '@/lib/supabase/server';
import { PlusCircle, Calendar } from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'Cycle Management — Orbit' };

export default async function CyclesPage() {
  const supabase = await createClient();
  
  const { data: cycles } = await supabase
    .from('cycles')
    .select('*')
    .order('start_date', { ascending: false });

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-section-gap p-6">
      <div className="flex justify-between items-end mb-2">
        <div className="flex flex-col gap-1">
          <h1 className="font-page-title text-page-title font-semibold text-zinc-900">Performance Cycles</h1>
          <p className="font-body-sm text-body-sm text-zinc-500">Manage organizational goal periods and quarter windows</p>
        </div>
        <button className="bg-zinc-900 text-white hover:bg-zinc-800 px-4 py-2 rounded-md font-table-cell-primary text-table-cell-primary transition-colors flex items-center space-x-2">
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>Create Cycle</span>
        </button>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden animate-fade-in-up-stagger">
        <div className="p-4 border-b border-zinc-200 flex items-center gap-2">
          <span className="material-symbols-outlined text-zinc-500 text-[20px]">calendar_month</span>
          <h2 className="font-section-heading text-section-heading font-medium text-zinc-900">Cycle Directory</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="px-4 py-3 font-section-label text-section-label text-zinc-500 tracking-widest uppercase">Cycle Name</th>
                <th className="px-4 py-3 font-section-label text-section-label text-zinc-500 tracking-widest uppercase">Start Date</th>
                <th className="px-4 py-3 font-section-label text-section-label text-zinc-500 tracking-widest uppercase">End Date</th>
                <th className="px-4 py-3 font-section-label text-section-label text-zinc-500 tracking-widest uppercase">Status</th>
                <th className="px-4 py-3 font-section-label text-section-label text-zinc-500 tracking-widest uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {cycles?.map(cycle => (
                <tr key={cycle.id} className="hover:bg-zinc-50/50 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="font-table-cell-primary text-table-cell-primary font-medium text-zinc-900">{cycle.name}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-body-sm text-body-sm text-zinc-600">{new Date(cycle.start_date).toLocaleDateString()}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-body-sm text-body-sm text-zinc-600">{new Date(cycle.end_date).toLocaleDateString()}</div>
                  </td>
                  <td className="px-4 py-3">
                    {cycle.is_active ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-status-on-track"></div>
                        <span className="font-table-cell-primary text-table-cell-primary text-zinc-700">Active</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-300"></div>
                        <span className="font-table-cell-primary text-table-cell-primary text-zinc-500">Inactive</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-zinc-500 hover:text-zinc-900 font-table-cell-primary text-table-cell-primary transition-colors bg-white border border-zinc-200 px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100 shadow-sm">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              
              {(!cycles || cycles.length === 0) && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-zinc-500 font-body-sm">
                    No cycles found. Create one to get started.
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
