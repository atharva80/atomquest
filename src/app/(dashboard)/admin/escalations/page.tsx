import { createClient } from '@/lib/supabase/server';
import { ForceTriggerButton } from '@/components/admin/force-trigger-button';
import { EscalationsClient } from './client-page';

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

      <EscalationsClient initialEscalations={escalations || []} />
    </div>
  );
}