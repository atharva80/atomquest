import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';

export const metadata = { title: 'User Management — AtomQuest' };

export default async function UsersPage() {
  const supabase = await createClient();
  
  // Fetch users with their departments
  const { data: users } = await supabase
    .from('profiles')
    .select('*, departments(name)')
    .order('full_name');

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">User Directory</h1>
        <p className="text-slate-500">Manage employee accounts, roles, and reporting structures</p>
      </div>

      <Card className="ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm border-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Emp Code</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map(u => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 ring-1 ring-slate-200 dark:ring-slate-800">
                        <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs">
                          {getInitials(u.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-slate-100">{u.full_name}</div>
                        <div className="text-xs text-slate-500">{u.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-500">{u.employee_code || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === 'admin' ? 'destructive' : u.role === 'manager' ? 'default' : 'secondary'} className="capitalize">
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-500">{(u as any).departments?.name || '—'}</TableCell>
                  <TableCell className="text-right">
                    <button className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 font-medium">Edit Role</button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
