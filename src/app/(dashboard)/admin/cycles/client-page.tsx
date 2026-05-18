'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { createCycle, updateCycle, deleteCycle } from '@/actions/cycles';
import { useRouter } from 'next/navigation';
import { Loader2, X, AlertTriangle } from 'lucide-react';

interface CyclesClientPageProps {
  initialCycles: any[];
}

export default function CyclesClientPage({ initialCycles }: CyclesClientPageProps) {
  const router = useRouter();
  const [cycles, setCycles] = useState(initialCycles);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !startDate || !endDate) {
      toast.error('Please fill out all fields');
      return;
    }

    setLoading(true);

    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (end <= start) {
        toast.error('End date must be after start date');
        setLoading(false);
        return;
      }

      // Calculate quarters automatically to satisfy complex Zod schemas
      // Quarter 1: Start to +3 months
      // Quarter 2: +3 months to +6 months
      // Quarter 3: +6 months to +9 months
      // Quarter 4: +9 months to End
      const diffMs = end.getTime() - start.getTime();
      const quarterMs = diffMs / 4;

      const q1Start = start.toISOString();
      const q1End = new Date(start.getTime() + quarterMs).toISOString();
      
      const q2Start = new Date(start.getTime() + quarterMs + 1000).toISOString();
      const q2End = new Date(start.getTime() + quarterMs * 2).toISOString();
      
      const q3Start = new Date(start.getTime() + quarterMs * 2 + 1000).toISOString();
      const q3End = new Date(start.getTime() + quarterMs * 3).toISOString();
      
      const q4Start = new Date(start.getTime() + quarterMs * 3 + 1000).toISOString();
      const q4End = end.toISOString();

      // Goal setting deadline is start + 30 days or half of Q1 (whichever is shorter)
      const goalDeadline = new Date(start.getTime() + Math.min(30 * 24 * 60 * 60 * 1000, quarterMs / 2)).toISOString();

      const formData = new FormData();
      formData.append('name', name);
      formData.append('start_date', start.toISOString());
      formData.append('end_date', end.toISOString());
      formData.append('goal_setting_deadline', goalDeadline);
      formData.append('q1_start', q1Start);
      formData.append('q1_end', q1End);
      formData.append('q2_start', q2Start);
      formData.append('q2_end', q2End);
      formData.append('q3_start', q3Start);
      formData.append('q3_end', q3End);
      formData.append('q4_start', q4Start);
      formData.append('q4_end', q4End);
      formData.append('is_active', String(isActive));

      const res = await createCycle(formData);

      if (!res.success) {
        toast.error(res.error || 'Failed to create cycle');
      } else {
        toast.success('Performance cycle created successfully');
        setIsCreating(false);
        setName('');
        setStartDate('');
        setEndDate('');
        router.refresh();
        if (res.data) {
          // If active, deactivate others
          const updatedCycles = isActive 
            ? [res.data, ...cycles.map(c => ({ ...c, is_active: false }))]
            : [res.data, ...cycles];
          setCycles(updatedCycles);
        }
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (cycleId: string, currentStatus: boolean) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('is_active', String(!currentStatus));

      const res = await updateCycle(cycleId, formData);

      if (!res.success) {
        toast.error(res.error || 'Failed to update cycle');
      } else {
        toast.success(`Cycle successfully ${!currentStatus ? 'activated' : 'deactivated'}`);
        router.refresh();
        setCycles(cycles.map(c => {
          if (c.id === cycleId) {
            return { ...c, is_active: !currentStatus };
          }
          // If we activated this, all others are deactivated
          if (!currentStatus) {
            return { ...c, is_active: false };
          }
          return c;
        }));
      }
    } catch (err) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (cycleId: string) => {
    if (!confirm('Are you sure you want to delete this cycle?')) return;

    setLoading(true);
    try {
      const res = await deleteCycle(cycleId);

      if (!res.success) {
        toast.error(res.error || 'Failed to delete cycle');
      } else {
        toast.success('Cycle deleted successfully');
        setCycles(cycles.filter(c => c.id !== cycleId));
        router.refresh();
      }
    } catch (err) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-section-gap p-6 relative">
      <div className="flex justify-between items-end mb-2">
        <div className="flex flex-col gap-1">
          <h1 className="font-page-title text-page-title font-semibold text-zinc-900">Performance Cycles</h1>
          <p className="font-body-sm text-body-sm text-zinc-500">Manage organizational goal periods and quarter windows</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="bg-zinc-900 text-white hover:bg-zinc-800 px-4 py-2 rounded-md font-table-cell-primary text-table-cell-primary transition-colors flex items-center space-x-2"
        >
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
              {cycles.map(cycle => (
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
                      <button 
                        onClick={() => handleToggleActive(cycle.id, true)}
                        className="flex items-center space-x-2 text-left"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-status-on-track"></div>
                        <span className="font-table-cell-primary text-table-cell-primary text-zinc-700">Active</span>
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleToggleActive(cycle.id, false)}
                        className="flex items-center space-x-2 text-left"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-300"></div>
                        <span className="font-table-cell-primary text-table-cell-primary text-zinc-500">Inactive</span>
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleToggleActive(cycle.id, cycle.is_active)}
                        className="text-zinc-600 hover:text-zinc-900 font-caption text-caption border border-zinc-200 rounded px-2.5 py-1"
                      >
                        {cycle.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button 
                        onClick={() => handleDelete(cycle.id)}
                        className="text-error hover:text-red-700 font-caption text-caption border border-zinc-200 rounded px-2.5 py-1"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {cycles.length === 0 && (
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

      {/* Create Cycle Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-zinc-200 rounded-xl shadow-2xl max-w-md w-full p-6 relative animate-zoom-in">
            <button 
              onClick={() => setIsCreating(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="font-page-title text-page-title text-zinc-900 mb-2">Create Performance Cycle</h2>
            <p className="font-body-sm text-body-sm text-zinc-500 mb-6">Define a performance window and auto-generate quarterly milestones.</p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Cycle Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. FY 2026-27"
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full border border-zinc-200 rounded-md p-2.5 font-body-sm text-body-sm focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Start Date</label>
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={e => setStartDate(e.target.value)}
                    required
                    className="w-full border border-zinc-200 rounded-md p-2.5 font-body-sm text-body-sm focus:outline-none focus:border-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">End Date</label>
                  <input 
                    type="date" 
                    value={endDate} 
                    onChange={e => setEndDate(e.target.value)}
                    required
                    className="w-full border border-zinc-200 rounded-md p-2.5 font-body-sm text-body-sm focus:outline-none focus:border-zinc-900"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="isActive"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-zinc-900 border-zinc-300 rounded focus:ring-zinc-900"
                />
                <label htmlFor="isActive" className="text-body-sm font-medium text-zinc-700 select-none">
                  Set as Active Performance Cycle
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
                <button 
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 border border-zinc-200 rounded-md hover:bg-zinc-50 font-body-sm text-body-sm transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="bg-zinc-900 text-white hover:bg-zinc-800 px-4 py-2 rounded-md font-body-sm text-body-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Cycle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
