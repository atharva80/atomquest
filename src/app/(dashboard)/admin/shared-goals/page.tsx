import { createClient } from '@/lib/supabase/server';
import SharedGoalsClientPage from './client-page';

export const metadata = { title: 'Shared Goals — Orbit' };

export default async function SharedGoalsPage() {
  const supabase = await createClient();
  
  // Fetch shared goals relations - corrected to match supabase schema fields!
  const { data: sharedGoals } = await supabase
    .from('shared_goals')
    .select(`
      id,
      created_at,
      goals:primary_goal_id(
        title,
        profiles:profile_id(first_name, last_name, email)
      ),
      shared_with:recipient_profile_id(first_name, last_name, email)
    `)
    .order('created_at', { ascending: false });

  // Fetch cycles for dropdown
  const { data: cycles } = await supabase
    .from('cycles')
    .select('*')
    .order('start_date', { ascending: false });

  // Fetch thrust areas for dropdown
  const { data: thrustAreas } = await supabase
    .from('thrust_areas')
    .select('*')
    .order('name');

  // Fetch employees for multi-select
  const { data: employees } = await supabase
    .from('profiles')
    .select('*')
    .order('first_name');

  return (
    <SharedGoalsClientPage 
      initialSharedGoals={sharedGoals || []} 
      cycles={cycles || []} 
      thrustAreas={thrustAreas || []} 
      employees={employees || []} 
    />
  );
}
