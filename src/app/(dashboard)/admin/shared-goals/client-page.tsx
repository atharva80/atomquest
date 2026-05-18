'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { createSharedGoal, createAndAssignSharedGoal, deleteSharedGoal } from '@/actions/shared-goals';
import { useRouter } from 'next/navigation';
import { Loader2, X, Trash2, Users } from 'lucide-react';
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

  const handleCreate = async (e: React.FormEvent, assign: boolean = false) => {
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

      const res = assign 
        ? await createAndAssignSharedGoal(formData)
        : await createSharedGoal(formData);

      if (!res.success) {
        toast.error(res.error || 'Failed to cascade shared goal');
      } else {
        toast.success(assign 
          ? 'Goal assigned to all employees!' 
          : 'Cascaded shared goal successfully!');
        setIsCreating(false);
        setTitle('');
        setDescription('');
        setTarget('');
        setTargetDate('');
        setSelectedEmployees([]);
        router.refresh();
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

  const handleDelete = async (primaryGoalId: string) => {
    if (!confirm('Are you sure you want to delete this shared goal? This will remove it from all recipients.')) {
      return;
    }
    
    setLoading(true);
    try {
      const res = await deleteSharedGoal(primaryGoalId);
      if (!res.success) {
        toast.error(res.error || 'Failed to delete shared goal');
      } else {
        toast.success('Shared goal deleted');
        setSharedGoals(sharedGoals.filter((sg: any) => sg.primary_goal_id !== primaryGoalId));
        router.refresh();
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 p-6 relative">
      <div className="flex justify-between items-end mb-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Shared Goals</h1>
          <p className="text-sm text-zinc-500">Manage cascading and cross-functional organizational goals</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="bg-zinc-900 text-white hover:bg-zinc-700 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Users className="h-4 w-4" />
          <span>Create Shared Goal</span>
        </button>
      </div>

      {/* Card Grid */}
      {sharedGoals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-zinc-200 rounded-xl">
          <div className="h-8 w-8 text-zinc-300 mb-4">
            <Users className="h-8 w-8" />
          </div>
          <p className="text-sm font-medium text-zinc-900 mb-1">No shared goals yet</p>
          <p className="text-sm text-zinc-500 mb-4 max-w-xs">Create a shared goal to cascade organizational goals across multiple employees.</p>
          <button 
            onClick={() => setIsCreating(true)}
            className="bg-zinc-900 text-white hover:bg-zinc-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Create Shared Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sharedGoals.map((sg: any, index: number) => (
            <div 
              key={sg.primary_goal_id} 
              className="bg-white border border-zinc-200 rounded-xl p-5 hover:border-zinc-300 transition-colors animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest">
                      {sg.goal?.thrust_area || 'Thrust Area'}
                    </span>
                    <span className="text-xs text-zinc-300">•</span>
                    <span className="text-xs text-zinc-500">
                      {sg.goal?.cycle_name || 'Cycle'}
                    </span>
                  </div>
                  <h3 className="text-base font-medium text-zinc-900 truncate">{sg.goal?.title}</h3>
                </div>
                <button
                  onClick={() => handleDelete(sg.primary_goal_id)}
                  className="text-zinc-400 hover:text-red-600 p-1 rounded transition-colors"
                  title="Delete shared goal"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Metrics */}
              <div className="flex gap-4 mb-4">
                {sg.goal?.target && (
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-widest mb-0.5">Target</p>
                    <p className="text-sm font-medium text-zinc-900 tabular-nums">
                      {sg.goal.target}{sg.goal.uom_type === 'percentage' ? '%' : ''}
                    </p>
                  </div>
                )}
                {sg.goal?.weightage && (
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-widest mb-0.5">Weightage</p>
                    <p className="text-sm font-medium text-zinc-900 tabular-nums">{sg.goal.weightage}%</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-widest mb-0.5">Status</p>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${sg.goal?.status === 'assigned' ? 'bg-green-600' : 'bg-zinc-300'}`}></div>
                    <span className="text-xs font-medium text-zinc-700 capitalize">
                      {sg.goal?.status === 'assigned' ? 'Assigned' : 'Draft'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recipients */}
              <div className="pt-4 border-t border-zinc-100">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-2">Shared with {sg.recipients?.length || 0} employee{(sg.recipients?.length || 0) !== 1 ? 's' : ''}</p>
                <div className="flex flex-wrap gap-2">
                  {sg.recipients?.map((emp: any) => (
                    <div 
                      key={emp.id} 
                      className="inline-flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-md px-2.5 py-1.5"
                    >
                      <div className="w-6 h-6 rounded-full bg-zinc-200 flex items-center justify-center">
                        <span className="text-xs font-medium text-zinc-600">
                          {emp.first_name?.[0] || ''}{emp.last_name?.[0] || ''}
                        </span>
                      </div>
                      <span className="text-sm text-zinc-700">
                        {emp.first_name} {emp.last_name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={(e) => handleCreate(e as any, false)}
                    disabled={loading}
                    className="px-4 py-2 border border-zinc-200 rounded-md hover:bg-zinc-50 font-body-sm text-body-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save as Draft
                  </button>
                  <button 
                    type="button"
                    onClick={(e) => handleCreate(e as any, true)}
                    disabled={loading}
                    className="bg-zinc-900 text-white hover:bg-zinc-800 px-4 py-2 rounded-md font-body-sm text-body-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Assign Now
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
