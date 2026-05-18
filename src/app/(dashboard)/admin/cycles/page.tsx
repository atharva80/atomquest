import { createClient } from '@/lib/supabase/server';
import CyclesClientPage from './client-page';

export const metadata = { title: 'Cycle Management — Orbit' };

export default async function CyclesPage() {
  const supabase = await createClient();
  
  const { data: cycles } = await supabase
    .from('cycles')
    .select('*')
    .order('start_date', { ascending: false });

  return (
    <CyclesClientPage initialCycles={cycles || []} />
  );
}
