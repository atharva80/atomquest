import { redirect } from 'next/navigation';
import { getGoalById, getMyGoals } from '@/queries/goals';
import { createClient } from '@/lib/supabase/server';
import { updateGoalWeightage } from '@/actions/goals';
import Link from 'next/link';

export const metadata = { title: 'Edit Weightage — Orbit' };

export default async function EditWeightagePage({ params }: { params: { goalId: string } }) {
  const supabase = await createClient();
  const goal = await getGoalById(params.goalId);

  if (!goal) redirect('/employee/goals');

  // Security: goal must belong to current user
  const { data: { user } } = await supabase.auth.getUser();
  if (goal.profile_id !== user?.id) redirect('/employee/goals');

  // Shared goals assigned by admin always have status 'locked'
  // If it's not locked, redirect to the normal edit page
  if (goal.status !== 'locked') {
    redirect(`/employee/goals/${goal.id}/edit`);
  }

  // Calculate available weightage (excluding this goal)
  const goals = await getMyGoals(goal.cycle_id);
  const otherGoals = goals.filter(g => g.id !== goal.id);
  const usedByOthers = otherGoals.reduce((sum, g) => sum + g.weightage, 0);
  const maxAllowable = 100 - usedByOthers;
  const thrustAreaName = (goal as any).thrust_areas?.name || 'Shared Goal';

  return (
    <div className="max-w-xl mx-auto p-6 flex flex-col gap-8 animate-fade-in">

      {/* Back link */}
      <Link
        href="/employee/goals"
        className="inline-flex items-center gap-1 text-[13px] text-zinc-500 hover:text-zinc-900 transition-colors w-fit"
      >
        <span className="material-symbols-outlined text-[16px]">arrow_back</span>
        Back to Goals
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-900 text-white uppercase tracking-wider">
            Shared
          </span>
          <span className="text-[12px] text-zinc-400 uppercase tracking-widest font-medium">
            {thrustAreaName}
          </span>
        </div>
        <h1 className="text-[28px] font-semibold tracking-tight text-zinc-950 leading-[36px]">
          {goal.title}
        </h1>
        <p className="text-[14px] text-zinc-500 leading-[20px]">
          This goal was assigned by your admin. Only the weightage can be adjusted.
        </p>
      </div>

      {/* Read-only goal info */}
      <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-5 grid grid-cols-2 gap-5">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] text-zinc-400 uppercase tracking-widest">Target</span>
          <span className="text-[20px] font-semibold text-zinc-900 tabular-nums">
            {goal.target !== null ? goal.target : 'N/A'}
            {(goal.uom_type === 'percentage_min' || goal.uom_type === 'percentage_max') ? '%' : ''}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] text-zinc-400 uppercase tracking-widest">UOM Type</span>
          <span className="text-[14px] font-medium text-zinc-700 capitalize">
            {goal.uom_type?.replace(/_/g, ' ') || '—'}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] text-zinc-400 uppercase tracking-widest">Current Weightage</span>
          <span className="text-[20px] font-semibold text-zinc-900 tabular-nums">{goal.weightage}%</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] text-zinc-400 uppercase tracking-widest">Max Allowable</span>
          <span className="text-[20px] font-semibold text-zinc-900 tabular-nums">{maxAllowable}%</span>
        </div>
      </div>

      {/* Weightage edit form — the ONLY editable field */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-[16px] font-semibold text-zinc-900">Adjust Weightage</h2>
          <p className="text-[13px] text-zinc-500">
            Enter a value between 10% and {maxAllowable}%. Total across all goals must equal 100%.
          </p>
        </div>

        <form
          action={async (formData: FormData) => {
            'use server';
            const newWeightage = Number(formData.get('weightage'));
            await updateGoalWeightage(params.goalId, newWeightage);
            redirect('/employee/goals');
          }}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <label htmlFor="weightage" className="font-medium text-[14px] text-zinc-900">
              Weightage (%)
            </label>
            <div className="relative">
              <input
                id="weightage"
                name="weightage"
                type="number"
                min={10}
                max={maxAllowable}
                defaultValue={goal.weightage}
                required
                className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-[16px] font-medium tabular-nums focus:outline-none focus:border-zinc-900 focus:ring-0 transition-colors pr-10"
              />
              <span className="absolute right-3 top-3 text-zinc-400 text-[14px] font-medium">%</span>
            </div>
            <p className="text-[12px] text-zinc-400">
              Other goals use {usedByOthers}% — up to {maxAllowable}% available for this goal
            </p>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Link
              href="/employee/goals"
              className="px-4 py-2 bg-white border border-zinc-200 text-zinc-900 font-medium text-[14px] rounded-lg hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="px-6 py-2 bg-zinc-900 text-white font-medium text-[14px] rounded-lg hover:bg-zinc-800 transition-colors shadow-sm"
            >
              Save Weightage
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}