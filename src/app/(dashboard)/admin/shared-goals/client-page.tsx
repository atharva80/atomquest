'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { createSharedGoal } from '@/actions/shared-goals';
import { useRouter } from 'next/navigation';
import { Loader2, X } from 'lucide-react';
import { UOM_TYPES } from '@/lib/constants';

interface SharedGoalsClientPageProps {
  initialSharedGoals: any[];
  cycles: any[];
  thrustAreas: any[];
  employees: any[];
}

export default function SharedGoalsClientPage({ 
  initialSharedGoals, 
  cycles, 
  thrustAreas, 
  employees 
}: SharedGoalsClientPageProps) {
  const router = useRouter();
  const [sharedGoals, setSharedGoals] = useState(initialSharedGoals);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [cycleId, setCycleId] = useState(cycles[0]?.id || '');
  const [thrustAreaId, setThrustAreaId] = useState(thrustAreas[0]?.id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uomType, setUomType] = useState('numeric_min');
  const [target, setTarget] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [weightage, setWeightage] = useState('10');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !cycleId || !thrustAreaId || selectedEmployees.length === 0) {
      toast.error('Please fill out all required fields and select at least one employee');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('cycle_id', cycleId);
      formData.append('thrust_area_id', thrustAreaId);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('uom_type', uomType);
      if (target) formData.append('target', target);
      if (targetDate) formData.append('target_date', new Date(targetDate).toISOString());
      formData.append('weightage', weightage);
      formData.append('employee_ids', JSON.stringify(selectedEmployees));

      const res = await createSharedGoal(formData);

      if (!res.success) {
        toast.error(res.error || 'Failed to cascade shared goal');
      } else {
        toast.success('Cascaded shared goal successfully to all chosen employees!');
        setIsCreating(false);
        setTitle('');
        setDescription('');
        setTarget('');
        setTargetDate('');
        setSelectedEmployees([]);
        router.refresh();
        // Simple mock push to state for immediate feedback
        const primaryGoalTitle = title;
        const newItems = selectedEmployees.map(empId => {
          const emp = employees.find(e => e.id === empId);
          return {
            id: Math.random().toString(),
            goals: { title: primaryGoalTitle },
            shared_with: emp
          };
        });
        setSharedGoals([...newItems, ...sharedGoals]);
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleEmployee = (id: string) => {
    if (selectedEmployees.includes(id)) {
      setSelectedEmployees(selectedEmployees.filter(empId => empId !== id));
    } else {
      setSelectedEmployees([...selectedEmployees, id]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-section-gap p-6 relative">
      <div className="flex justify-between items-end mb-2">
        <div className="flex flex-col gap-1">
          <h1 className="font-page-title text-page-title font-semibold text-zinc-900">Shared Goals Directory</h1>
          <p className="font-body-sm text-body-sm text-zinc-500">Manage cascading and cross-functional organizational goals</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="bg-zinc-900 text-white hover:bg-zinc-800 px-4 py-2 rounded-md font-table-cell-primary text-table-cell-primary transition-colors flex items-center space-x-2"
        >
          <span className="material-symbols-outlined text-[18px]">share</span>
          <span>Create Shared Goal</span>
        </button>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden animate-fade-in-up-stagger">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="px-4 py-3 font-section-label text-section-label text-zinc-500 tracking-widest uppercase">Cascade Status</th>
                <th className="px-4 py-3 font-section-label text-section-label text-zinc-500 tracking-widest uppercase">Goal Title</th>
                <th className="px-4 py-3 font-section-label text-section-label text-zinc-500 tracking-widest uppercase">Shared With</th>
                <th className="px-4 py-3 font-section-label text-section-label text-zinc-500 tracking-widest uppercase">Sync Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {sharedGoals.map((sg: any) => {
                const sharedWithName = sg.shared_with 
                  ? `${sg.shared_with.first_name || ''} ${sg.shared_with.last_name || ''}`.trim() || sg.shared_with.email 
                  : 'Unknown';
                
                return (
                  <tr key={sg.id} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border uppercase tracking-wider bg-zinc-900 text-white border-zinc-900">
                        CASCADED
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-body-sm text-body-sm text-zinc-900 font-medium max-w-sm truncate">{sg.goals?.title || 'Organization Goal'}</div>
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
                  </tr>
                );
              })}
              
              {sharedGoals.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-zinc-500 font-body-sm">
                    No shared goals configured yet. Click &quot;Create Shared Goal&quot; to cascade.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Shared Goal Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-zinc-200 rounded-xl shadow-2xl max-w-lg w-full p-6 relative animate-zoom-in max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsCreating(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="font-page-title text-page-title text-zinc-900 mb-2">Create & Cascade Goal</h2>
            <p className="font-body-sm text-body-sm text-zinc-500 mb-6">Create a template goal and assign it to multiple employees concurrently.</p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Performance Cycle</label>
                  <select 
                    value={cycleId} 
                    onChange={e => setCycleId(e.target.value)}
                    required
                    className="w-full border border-zinc-200 rounded-md p-2.5 font-body-sm text-body-sm bg-white focus:outline-none focus:border-zinc-900"
                  >
                    {cycles.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Strategic Thrust Area</label>
                  <select 
                    value={thrustAreaId} 
                    onChange={e => setThrustAreaId(e.target.value)}
                    required
                    className="w-full border border-zinc-200 rounded-md p-2.5 font-body-sm text-body-sm bg-white focus:outline-none focus:border-zinc-900"
                  >
                    {thrustAreas.map(ta => (
                      <option key={ta.id} value={ta.id}>{ta.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Goal Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Achieve 98% On-Time Delivery"
                  value={title} 
                  onChange={e => setTitle(e.target.value)}
                  required
                  className="w-full border border-zinc-200 rounded-md p-2.5 font-body-sm text-body-sm focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Description</label>
                <textarea 
                  placeholder="Describe the expected outcomes and target milestones..."
                  value={description} 
                  onChange={e => setDescription(e.target.value)}
                  className="w-full border border-zinc-200 rounded-md p-2.5 font-body-sm text-body-sm focus:outline-none focus:border-zinc-900 h-20"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">UOM Type</label>
                  <select 
                    value={uomType} 
                    onChange={e => setUomType(e.target.value)}
                    className="w-full border border-zinc-200 rounded-md p-2.5 font-body-sm text-body-sm bg-white focus:outline-none focus:border-zinc-900"
                  >
                    {UOM_TYPES.map(u => (
                      <option key={u.value} value={u.value}>{u.label.split(" ")[0]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Target</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 95"
                    value={target} 
                    onChange={e => setTarget(e.target.value)}
                    className="w-full border border-zinc-200 rounded-md p-2.5 font-body-sm text-body-sm focus:outline-none focus:border-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Weightage (%)</label>
                  <input 
                    type="number" 
                    min="10" 
                    max="100"
                    value={weightage} 
                    onChange={e => setWeightage(e.target.value)}
                    required
                    className="w-full border border-zinc-200 rounded-md p-2.5 font-body-sm text-body-sm focus:outline-none focus:border-zinc-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Due Date</label>
                <input 
                  type="date" 
                  value={targetDate} 
                  onChange={e => setTargetDate(e.target.value)}
                  className="w-full border border-zinc-200 rounded-md p-2.5 font-body-sm text-body-sm focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Select Employees to Cascade</label>
                <div className="border border-zinc-200 rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                  {employees.map(emp => (
                    <div key={emp.id} className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id={`emp-${emp.id}`}
                        checked={selectedEmployees.includes(emp.id)}
                        onChange={() => toggleEmployee(emp.id)}
                        className="w-4 h-4 text-zinc-900 border-zinc-300 rounded focus:ring-zinc-900"
                      />
                      <label htmlFor={`emp-${emp.id}`} className="text-body-sm font-medium text-zinc-700 select-none">
                        {emp.first_name} {emp.last_name} ({emp.email})
                      </label>
                    </div>
                  ))}
                </div>
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
                  Cascade Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
