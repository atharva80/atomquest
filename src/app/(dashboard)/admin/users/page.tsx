import { createClient } from '@/lib/supabase/server';
import UsersClientPage from './client-page';

export const metadata = { title: 'User Management — Orbit' };

export default async function UsersPage() {
  const supabase = await createClient();
  
  // Fetch users with their departments
  const { data: users } = await supabase
    .from('profiles')
    .select('*, departments(name)')
    .order('first_name');

  // Fetch departments for dropdown
  const { data: departments } = await supabase
    .from('departments')
    .select('*')
    .order('name');

  // Fetch managers for dropdown (profiles with role manager or admin)
  const { data: managers } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['manager', 'admin'])
    .order('first_name');

  return (
    <UsersClientPage 
      initialUsers={users || []} 
      departments={departments || []} 
      managers={managers || []} 
    />
  );
}
