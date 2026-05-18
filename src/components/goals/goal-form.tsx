'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Goal, ThrustArea, UomType } from '@/types';
import { UOM_TYPES } from '@/lib/constants';
import { createGoal, updateGoal } from '@/actions/goals';
import { createGoalSchema } from '@/schemas/goal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ZodError } from 'zod';
import { Loader2 } from 'lucide-react';

interface GoalFormProps {
  thrustAreas: ThrustArea[];
  existingGoal?: Goal;
  remainingWeightage: number;
  cycleId?: string;
  mode: 'create' | 'edit';
  onSuccess?: () => void;
  existingGoals?: any[];
}

export function GoalForm({ thrustAreas, existingGoal, remainingWeightage, cycleId, mode, onSuccess, existingGoals = [] }: GoalFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    title: existingGoal?.title || '',
    description: existingGoal?.description || '',
    thrust_area_id: existingGoal?.thrust_area_id || '',
    uom_type: existingGoal?.uom_type || 'numeric_max' as UomType,
    target: existingGoal?.target?.toString() || '',
    weightage: existingGoal?.weightage?.toString() || ''
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // Auto-set target for zero_based
    if (field === 'uom_type' && value === 'zero_based') {
      setFormData(prev => ({ ...prev, target: '0' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    
    try {
      // 1. Prepare data for validation
      let targetValue: number | Date | 0 = 0;
      
      if (formData.uom_type === 'timeline') {
        targetValue = new Date(formData.target); // Assuming target is a date string yyyy-mm-dd
      } else if (formData.uom_type !== 'zero_based') {
        targetValue = Number(formData.target);
      }

      const payload = {
        title: formData.title,
        description: formData.description || undefined,
        thrust_area_id: formData.thrust_area_id,
        uom_type: formData.uom_type,
        target: targetValue,
        weightage: Number(formData.weightage),
      };

      // 2. Validate
      createGoalSchema.parse(payload);
      
      // 3. Weightage check
      if (payload.weightage > remainingWeightage) {
        setErrors({ weightage: `Maximum available weightage is ${remainingWeightage}%` });
        setLoading(false);
        return;
      }

      // 4. Server Action
      const formPayload = new FormData();
      Object.entries(payload).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          formPayload.append(key, val.toString());
        }
      });
      if (cycleId) {
        formPayload.append('cycle_id', cycleId);
      }

      const result = mode === 'create' 
        ? await createGoal(formPayload) 
        : await updateGoal(existingGoal!.id, formPayload);

      if (!result.success) {
        if (result.fieldErrors) {
          // Convert array of strings to single string for our simple error state
          const simpleErrors: Record<string, string> = {};
          Object.keys(result.fieldErrors).forEach(key => {
            simpleErrors[key] = result.fieldErrors![key][0];
          });
          setErrors(simpleErrors);
        } else {
          toast.error(result.error || 'Failed to save goal');
        }
        return;
      }

      toast.success(mode === 'create' ? 'Goal created successfully' : 'Goal updated successfully');
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/employee/goals');
      }

    } catch (err) {
      if (err instanceof ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach(e => {
          if (e.path[0]) newErrors[e.path[0].toString()] = e.message;
        });
        setErrors(newErrors);
      } else {
        toast.error('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const isTimeline = formData.uom_type === 'timeline';
  const isZeroBased = formData.uom_type === 'zero_based';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-6">
      {/* Column 1: Form */}
      <div className="w-full md:w-3/5 flex flex-col gap-6 animate-fade-in">
        <div className="flex flex-col gap-1">
          <h2 className="text-[24px] font-semibold tracking-tight text-zinc-950 font-page-title leading-[32px]">
            {mode === 'create' ? 'Create New Goal' : 'Edit Goal'}
          </h2>
          <p className="text-[14px] text-zinc-500 font-body-sm leading-[20px]">
            Define measurable metrics and alignment for the current cycle.
          </p>
        </div>
        <div className="flex flex-col gap-[24px]">
          <div className="flex flex-col gap-[6px]">
            <label className="font-medium text-[14px] text-zinc-900 leading-[20px]">Goal Title</label>
            <input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="e.g. Optimize BLDC motor efficiency profiles"
              className={`w-full px-3 py-2 bg-white border border-zinc-200 rounded text-[14px] font-body-sm focus:outline-none focus:border-zinc-400 focus:ring-0 transition-colors ${errors.title ? 'border-red-500' : ''}`}
            />
            {errors.title && <p className="text-[12px] text-red-500 mt-1">{errors.title}</p>}
          </div>
          <div className="flex flex-col gap-[6px]">
            <label className="font-medium text-[14px] text-zinc-900 leading-[20px]">Thrust Area</label>
            <select
              value={formData.thrust_area_id}
              onChange={(e) => handleChange('thrust_area_id', e.target.value)}
              className={`w-full px-3 py-2 bg-white border border-zinc-200 rounded text-[14px] font-body-sm focus:outline-none focus:border-zinc-400 focus:ring-0 transition-colors appearance-none ${errors.thrust_area_id ? 'border-red-500' : ''}`}
            >
              <option value="" disabled>Select a thrust area</option>
              {thrustAreas.map((ta) => (
                <option key={ta.id} value={ta.id}>{ta.name}</option>
              ))}
            </select>
            {errors.thrust_area_id && <p className="text-[12px] text-red-500 mt-1">{errors.thrust_area_id}</p>}
          </div>
          <div className="flex flex-col gap-[6px]">
            <label className="font-medium text-[14px] text-zinc-900 leading-[20px]">UOM Type</label>
            <select
              value={formData.uom_type}
              onChange={(e) => handleChange('uom_type', e.target.value)}
              className="w-full px-3 py-2 bg-white border border-zinc-200 rounded text-[14px] font-body-sm focus:outline-none focus:border-zinc-400 focus:ring-0 transition-colors appearance-none"
            >
              <option value="" disabled>Select UoM Type</option>
              {UOM_TYPES.map((uom) => (
                <option key={uom.value} value={uom.value}>{uom.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-[6px]">
            <label className="font-medium text-[14px] text-zinc-900 leading-[20px]">Target Value</label>
            {isTimeline ? (
              <input
                id="target"
                type="date"
                value={formData.target}
                onChange={(e) => handleChange('target', e.target.value)}
                className={`w-full px-3 py-2 bg-white border border-zinc-200 rounded text-[14px] font-body-sm focus:outline-none focus:border-zinc-400 focus:ring-0 transition-colors tabular-nums ${errors.target ? 'border-red-500' : ''}`}
              />
            ) : (
              <div className="relative">
                <input
                  id="target"
                  type="number"
                  step="0.01"
                  value={formData.target}
                  onChange={(e) => handleChange('target', e.target.value)}
                  disabled={isZeroBased}
                  placeholder="e.g. 95"
                  className={`w-full px-3 py-2 bg-white border border-zinc-200 rounded text-[14px] font-body-sm focus:outline-none focus:border-zinc-400 focus:ring-0 transition-colors tabular-nums ${errors.target ? 'border-red-500' : ''}`}
                />
                {formData.uom_type.includes('percentage') && (
                  <span className="absolute right-3 top-2.5 text-zinc-400 text-[14px]">%</span>
                )}
              </div>
            )}
            {errors.target && <p className="text-[12px] text-red-500 mt-1">{errors.target}</p>}
          </div>
          <div className="flex flex-col gap-[6px]">
            <label className="font-medium text-[14px] text-zinc-900 leading-[20px]">Weightage (%)</label>
            <input
              id="weightage"
              type="number"
              min="10"
              max={mode === 'create' ? remainingWeightage : 100}
              value={formData.weightage}
              onChange={(e) => handleChange('weightage', e.target.value)}
              className={`w-full px-3 py-2 bg-white border border-zinc-200 rounded text-[14px] font-body-sm focus:outline-none focus:border-zinc-400 focus:ring-0 transition-colors tabular-nums ${errors.weightage ? 'border-red-500' : ''}`}
            />
            {errors.weightage && <p className="text-[12px] text-red-500 mt-1">{errors.weightage}</p>}
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button 
              type="button" 
              onClick={() => router.back()} 
              disabled={loading}
              className="px-4 py-2 bg-white border border-zinc-200 text-zinc-900 font-medium text-[14px] rounded hover:bg-zinc-50 transition-colors leading-[20px]"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-4 py-2 bg-zinc-900 text-white font-medium text-[14px] rounded hover:bg-zinc-800 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 leading-[20px]"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === 'create' ? 'Add Goal' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
      {/* Column 2: Allocation Info */}
      <div className="w-full md:w-2/5 animate-slide-up stagger-1">
        <div className="bg-white border border-zinc-200 rounded-xl p-5 flex flex-col gap-6 sticky top-[80px]">
          {/* Ring */}
          <div className="flex items-center gap-4">
            <div className="relative w-[80px] h-[80px] shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  className="text-zinc-200"
                  cx="50"
                  cy="50"
                  fill="none"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                ></circle>
                <circle
                  className="text-zinc-900 transition-all duration-1000 ease-out"
                  cx="50"
                  cy="50"
                  fill="none"
                  r="40"
                  stroke="currentColor"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * (100 - remainingWeightage)) / 100}
                  strokeWidth="8"
                ></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-semibold text-lg text-zinc-900 tabular-nums">{remainingWeightage}%</span>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Remaining</span>
              </div>
            </div>
            <p className="text-[12px] text-zinc-500 font-body-sm leading-relaxed">
              Total allocated: {100 - remainingWeightage}%. You must distribute exactly 100% before submission.
            </p>
          </div>
          <hr className="border-zinc-100" />
          {/* Checklist */}
          <div className="flex flex-col gap-3">
            <h4 className="font-section-label text-[12px] text-zinc-400 tracking-widest uppercase">
              Allocation Checklist
            </h4>
            <ul className="flex flex-col gap-2 text-[14px]">
              {existingGoals.map((g, i) => (
                <li key={g.id} className="flex justify-between items-center text-zinc-700">
                  <span className="truncate pr-4">Goal {i + 1}</span>
                  <span className="tabular-nums font-medium text-zinc-900">{g.weightage}%</span>
                </li>
              ))}
              {mode === 'create' && Number(formData.weightage) > 0 && (
                <li className="flex justify-between items-center text-zinc-400 italic">
                  <span className="truncate pr-4">New Goal</span>
                  <span className="tabular-nums font-medium text-zinc-900">{formData.weightage}%</span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </form>
  );
}
