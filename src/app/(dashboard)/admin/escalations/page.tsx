import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = { title: 'Escalations — AtomQuest' };

export default async function EscalationsPage() {
  const supabase = await createClient();
  
  const { data: escalations } = await supabase
    .from('escalations')
    .select('*, target_user:profiles!escalations_target_user_id_fkey(full_name)')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Escalation Log</h1>
          <p className="text-slate-500">Track process delays requiring HR or Admin intervention</p>
        </div>
        <form action="/api/cron/escalation" method="POST">
          <Button variant="outline" type="submit">
            <ShieldAlert className="mr-2 h-4 w-4" /> Force Trigger Check
          </Button>
        </form>
      </div>

      <Card className="ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm border-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Escalation Type</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {escalations?.map(esc => (
                <TableRow key={esc.id}>
                  <TableCell className="text-slate-500">
                    {new Date(esc.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-medium">
                    {(esc as any).target_user?.full_name || 'Unknown User'}
                  </TableCell>
                  <TableCell className="capitalize">
                    {esc.type.replace(/_/g, ' ')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      Level 1
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {esc.resolved_at ? (
                      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400">
                        Resolved
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Pending</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {!esc.resolved_at && (
                      <Button variant="ghost" size="sm" className="text-indigo-600">
                        <CheckCircle className="mr-1 h-3 w-3" /> Resolve
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              
              {(!escalations || escalations.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    No escalations logged. Process compliance is 100%.
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
