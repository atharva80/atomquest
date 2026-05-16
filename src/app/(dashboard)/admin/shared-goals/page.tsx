import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = { title: 'Shared Goals — AtomQuest' };

export default async function SharedGoalsPage() {
  const supabase = await createClient();
  
  // Fetch shared goals relations
  const { data: sharedGoals } = await supabase
    .from('shared_goals')
    .select('*, goals:primary_goal_id(title, profiles:employee_id(full_name)), shared_with:shared_employee_id(full_name)')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Shared Goals Directory</h1>
          <p className="text-slate-500">Manage cascading and cross-functional goals</p>
        </div>
        <Button>
          <Share2 className="mr-2 h-4 w-4" /> Create Shared Goal
        </Button>
      </div>

      <Card className="ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm border-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
              <TableRow>
                <TableHead>Primary Owner</TableHead>
                <TableHead>Goal Title</TableHead>
                <TableHead>Shared With</TableHead>
                <TableHead>Sync Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sharedGoals?.map(sg => (
                <TableRow key={sg.id}>
                  <TableCell className="font-medium">
                    {(sg as any).goals?.profiles?.full_name || 'Unknown'}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {(sg as any).goals?.title || 'Unknown Goal'}
                  </TableCell>
                  <TableCell>
                    {(sg as any).shared_with?.full_name || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full dark:bg-emerald-900/30 dark:text-emerald-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Synced
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">Unlink</Button>
                  </TableCell>
                </TableRow>
              ))}
              
              {(!sharedGoals || sharedGoals.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                    No shared goals configured yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
