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
}

export function GoalForm({ thrustAreas, existingGoal, remainingWeightage, cycleId, mode, onSuccess }: GoalFormProps) {
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
        description: formData.description,
        thrust_area_id: formData.thrust_area_id,
        uom_type: formData.uom_type,
        target: targetValue,
        weightage: Number(formData.weightage),
      };

      // 2. Validate
      createGoalSchema.parse(payload);
      
      // 3. Weightage check (only for create)
      if (mode === 'create' && payload.weightage > remainingWeightage) {
        setErrors({ weightage: `Maximum available weightage is ${remainingWeightage}%` });
        setLoading(false);
        return;
      }

      // 4. Server Action
      const formPayload = new FormData();
      Object.entries(payload).forEach(([key, val]) => {
        formPayload.append(key, val.toString());
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Goal Title <span className="text-red-500">*</span></Label>
          <Input 
            id="title" 
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="e.g. Achieve $1M in Q3 Sales"
            className={errors.title ? "border-red-500" : ""}
          />
          {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
          <Textarea 
            id="description" 
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Provide context on how this will be achieved..."
            rows={3}
            className={errors.description ? "border-red-500" : ""}
          />
          {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Thrust Area */}
          <div className="space-y-2">
            <Label>Thrust Area <span className="text-red-500">*</span></Label>
            <Select 
              value={formData.thrust_area_id} 
              onValueChange={(val) => handleChange('thrust_area_id', val)}
            >
              <SelectTrigger className={errors.thrust_area_id ? "border-red-500" : ""}>
                <SelectValue placeholder="Select a thrust area" />
              </SelectTrigger>
              <SelectContent>
                {thrustAreas.map(ta => (
                  <SelectItem key={ta.id} value={ta.id}>{ta.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.thrust_area_id && <p className="text-sm text-red-500">{errors.thrust_area_id}</p>}
          </div>

          {/* UoM Type */}
          <div className="space-y-2">
            <Label>Unit of Measurement <span className="text-red-500">*</span></Label>
            <Select 
              value={formData.uom_type} 
              onValueChange={(val) => handleChange('uom_type', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select UoM" />
              </SelectTrigger>
              <SelectContent>
                {UOM_TYPES.map(uom => (
                  <SelectItem key={uom.value} value={uom.value}>
                    <div className="flex flex-col">
                      <span>{uom.label}</span>
                      <span className="text-[10px] text-muted-foreground">{uom.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Target */}
          <div className="space-y-2">
            <Label htmlFor="target">Target Value <span className="text-red-500">*</span></Label>
            {isTimeline ? (
              <Input 
                id="target" 
                type="date"
                value={formData.target}
                onChange={(e) => handleChange('target', e.target.value)}
                className={errors.target ? "border-red-500" : ""}
              />
            ) : (
              <div className="relative">
                <Input 
                  id="target" 
                  type="number"
                  step="0.01"
                  value={formData.target}
                  onChange={(e) => handleChange('target', e.target.value)}
                  disabled={isZeroBased}
                  className={errors.target ? "border-red-500" : ""}
                />
                {formData.uom_type.includes('percentage') && (
                  <span className="absolute right-3 top-2.5 text-muted-foreground">%</span>
                )}
              </div>
            )}
            {errors.target && <p className="text-sm text-red-500">{errors.target}</p>}
          </div>

          {/* Weightage */}
          <div className="space-y-2">
            <Label htmlFor="weightage">
              Weightage <span className="text-red-500">*</span>
              {mode === 'create' && (
                <span className="text-xs font-normal text-muted-foreground ml-2">
                  (Max {remainingWeightage}% available)
                </span>
              )}
            </Label>
            <div className="relative">
              <Input 
                id="weightage" 
                type="number"
                min="10"
                max={mode === 'create' ? remainingWeightage : 100}
                value={formData.weightage}
                onChange={(e) => handleChange('weightage', e.target.value)}
                className={errors.weightage ? "border-red-500" : ""}
              />
              <span className="absolute right-3 top-2.5 text-muted-foreground">%</span>
            </div>
            {errors.weightage && <p className="text-sm text-red-500">{errors.weightage}</p>}
            {!errors.weightage && (
              <p className="text-xs text-muted-foreground">Must be between 10% and 100%</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === 'create' ? 'Create Goal' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
