import { createClient } from '@/lib/supabase/server';
import { getTeamMembers } from '@/queries/users';
import { getActiveCycle } from '@/queries/cycles';
import { redirect } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export const metadata = { title: 'My Team — AtomQuest' };

export default async function TeamOverviewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const cycle = await getActiveCycle();
  const team = await getTeamMembers(user.id);

  if (team.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500">
        You do not have any team members assigned to you.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Team Overview</h1>
        <p className="text-slate-500">View your direct reports and their goal status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {team.map(member => (
          <Link href={`/manager/team/${member.id}`} key={member.id}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full border-slate-200 dark:border-slate-800 group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 ring-1 ring-slate-100 dark:ring-slate-800">
                      <AvatarFallback className="bg-indigo-100 text-indigo-700 font-medium">
                        {getInitials(`${member.first_name} ${member.last_name}`)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">
                        {member.first_name} {member.last_name}
                      </h3>
                      <p className="text-xs text-slate-500">{member.email}</p>
                    </div>
                  </div>
                  <ChevronRight className="text-slate-300 dark:text-slate-700 h-5 w-5 group-hover:text-indigo-500 transition-colors" />
                </div>
                
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/50 flex justify-between items-center">
                  <div className="text-xs text-slate-500">
                    <span className="font-medium text-slate-700 dark:text-slate-300 block">Status</span>
                    {/* Mock status for UI demo since we didn't join goals in getTeamMembers */}
                    Goal Sheet Status
                  </div>
                  <Badge variant="outline" className="bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    View Details
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
