import { createClient } from '@/lib/supabase/server';
import SharedGoalsClientPage from './client-page';

export const metadata = { title: 'Shared Goals — Orbit' };

export default async function SharedGoalsPage() {
  const supabase = await createClient();
  
  // Fetch shared goals with more details - grouped by primary goal
  const { data: sharedGoalsData } = await supabase
    .from('shared_goals')
    .select(`
      id,
      created_at,
      primary_goal_id,
      recipient_profile_id,
      goals:primary_goal_id(
        id,
        title,
        description,
        target,
        weightage,
        uom_type,
        status,
        cycle_id,
        cycles(name),
        thrust_areas(name)
      ),
      shared_with:recipient_profile_id(id, first_name, last_name, email)
    `)
    .order('created_at', { ascending: false });

  // Also fetch all recipient goals to check their status
  let allRecipientGoals: any[] = [];
  const recipientIds = sharedGoalsData?.map(sg => sg.recipient_profile_id).filter(Boolean) || [];
  
  if (recipientIds.length > 0) {
    const { data: goalsData } = await supabase
      .from('goals')
      .select('id, profile_id, status')
      .in('profile_id', recipientIds);
    allRecipientGoals = goalsData || [];
  }

  // Group by primary_goal_id
  const groupedGoals = new Map();
  
  if (sharedGoalsData && sharedGoalsData.length > 0) {
    for (const sg of sharedGoalsData) {
      const primaryId = sg.primary_goal_id;
      if (!groupedGoals.has(primaryId)) {
        // Check if any recipient goal has locked status (assigned)
        const primaryRecipientIds = sharedGoalsData
          .filter(s => s.primary_goal_id === primaryId)
          .map(s => s.recipient_profile_id)
          .filter(Boolean);
        
        const recipientStatuses = allRecipientGoals
          .filter(g => primaryRecipientIds.includes(g.profile_id));
        
        const isAssigned = recipientStatuses.some(r => r.status === 'locked');
        
        groupedGoals.set(primaryId, {
          id: sg.id,
          primary_goal_id: primaryId,
          created_at: sg.created_at,
          goal: {
            id: sg.goals?.id,
            title: sg.goals?.title,
            description: sg.goals?.description,
            target: sg.goals?.target,
            weightage: sg.goals?.weightage,
            uom_type: sg.goals?.uom_type,
            status: isAssigned ? 'assigned' : 'draft',
            cycle_name: sg.goals?.cycles?.name,
            thrust_area: sg.goals?.thrust_areas?.name,
          },
          recipients: [],
          isAssigned
        });
      }
      if (sg.shared_with) {
        groupedGoals.get(primaryId).recipients.push(sg.shared_with);
      }
    }
  }

  const groupedGoalsArray = Array.from(groupedGoals.values());

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
      initialSharedGoals={groupedGoalsArray} 
      cycles={cycles || []} 
      thrustAreas={thrustAreas || []} 
      employees={employees || []} 
    />
  );
}
