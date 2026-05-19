import { getMyGoals } from '@/queries/goals';
import { getActiveCycle, getCurrentQuarter } from '@/queries/cycles';
import { getMyCheckins } from '@/queries/check-ins';
import { CheckinForm } from '@/components/check-ins/check-in-form';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export const metadata = { title: 'Check-ins — AtomQuest' };

export default async function EmployeeCheckinsPage({ searchParams }: { searchParams: { quarter?: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const cycle = await getActiveCycle();
  if (!cycle) {
    return (
      <div className="max-w-3xl mx-auto p-6 flex flex-col gap-6 animate-fade-in">
        <div className="flex flex-col gap-1">
          <h1 className="text-[24px] font-semibold tracking-tight text-zinc-950">Quarterly Check-ins</h1>
          <p className="text-[14px] text-zinc-500">No active performance cycle found.</p>
        </div>
      </div>
    );
  }

  const currentQ = getCurrentQuarter(cycle);
  const activeTab = (searchParams.quarter as string) || currentQ || 'Q1';

  const allGoals = await getMyGoals(cycle.id);
  // After manager approval, goals are auto-locked: approved → locked.
  // Both 'approved' and 'locked' statuses mean the sheet has been through approval.
  const approvedGoals = allGoals.filter(g => g.status === 'approved' || g.status === 'locked');

  // Block if employee has goals but none have been approved/locked yet
  if (allGoals.length > 0 && approvedGoals.length === 0) {
    const currentStatus = allGoals[0].status;
    return (
      <div className="max-w-3xl mx-auto p-6 flex flex-col gap-6 animate-fade-in">
        <div className="flex flex-col gap-1">
          <h1 className="text-[24px] font-semibold tracking-tight text-zinc-950">Quarterly Check-ins</h1>
          <p className="text-[14px] text-zinc-500">{cycle.name}</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg flex items-start gap-3">
          <span className="material-symbols-outlined text-amber-600">schedule</span>
          <div>
            <h4 className="text-[14px] font-medium leading-[20px]">Goal Sheet Not Approved</h4>
            <p className="text-[14px] mt-1 leading-[20px]">
              Your goals must be approved by your manager before you can submit check-ins.{' '}
              Current status: <strong>{currentStatus.toUpperCase()}</strong>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (approvedGoals.length === 0) {
    return (
      <div className="max-w-3xl mx-auto p-6 flex flex-col gap-6 animate-fade-in">
        <div className="flex flex-col gap-1">
          <h1 className="text-[24px] font-semibold tracking-tight text-zinc-950">Quarterly Check-ins</h1>
          <p className="text-[14px] text-zinc-500">No approved goals found for this cycle.</p>
        </div>
      </div>
    );
  }

  const checkins = await getMyCheckins(cycle.id, activeTab as any);
  // Read-only when: no active window, OR viewing a quarter that isn't currently open
  const isWindowOpen = currentQ !== null;
  const isActiveTab = activeTab === currentQ;
  const readOnly = !isWindowOpen || !isActiveTab;

  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

  return (
    <div className="max-w-5xl mx-auto p-6 flex flex-col gap-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-[24px] font-semibold tracking-tight text-zinc-950 leading-[32px]">Quarterly Check-ins</h1>
        <p className="text-[14px] text-zinc-500 leading-[20px]">{cycle.name} — Log your progress against planned targets.</p>
      </div>

      {/* No active window banner */}
      {!isWindowOpen && (
        <div className="bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-lg flex items-center gap-3">
          <span className="material-symbols-outlined text-zinc-400 text-[20px]">calendar_today</span>
          <div>
            <p className="text-[14px] font-medium text-zinc-700">No Check-in Window Open</p>
            <p className="text-[13px] text-zinc-500">
              Windows open in July (Q1), October (Q2), January (Q3), and March/April (Q4).
            </p>
          </div>
        </div>
      )}

      {/* Quarter tabs */}
      <div className="flex items-center gap-1 border-b border-zinc-200">
        {quarters.map(q => {
          const isActive = q === activeTab;
          const isCurrent = q === currentQ;
          return (
            <Link
              key={q}
              href={`?quarter=${q}`}
              className={`px-4 py-2.5 text-[14px] font-medium leading-[20px] border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${
                isActive
                  ? 'border-zinc-900 text-zinc-900'
                  : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
              }`}
            >
              {q}
              {isCurrent && (
                <span className="text-[9px] font-bold bg-zinc-900 text-white px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                  Now
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Viewing a closed quarter */}
      {!isActiveTab && (
        <div className="bg-zinc-50 border border-zinc-200 text-zinc-600 px-4 py-3 rounded-lg flex items-center gap-3">
          <span className="material-symbols-outlined text-zinc-400 text-[20px]">info</span>
          <p className="text-[14px] leading-[20px]">
            The check-in window for <strong>{activeTab}</strong> is not currently open. Viewing read-only.
          </p>
        </div>
      )}

      {/* Check-in form */}
      <CheckinForm
        goals={approvedGoals}
        quarter={activeTab as any}
        cycleId={cycle.id}
        existingCheckins={checkins}
        readOnly={readOnly}
      />
    </div>
  );
}
