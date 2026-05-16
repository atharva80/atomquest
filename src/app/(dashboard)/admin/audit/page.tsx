import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export const metadata = { title: 'Audit Trail — AtomQuest' };

export default async function AuditPage() {
  const supabase = await createClient();
  const { data: logs } = await supabase
    .from('audit_logs')
    .select('*, profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Audit Trail</h1>
        <p className="text-slate-500">Immutable record of system changes and data access</p>
      </div>

      <Card className="ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm border-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs?.map(log => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs text-slate-500 font-mono whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium">
                    {(log as any).profiles?.full_name || 'System'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-slate-50 dark:bg-slate-800 font-mono text-xs">
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate text-slate-500 text-sm">
                    {log.reason || JSON.stringify(log.new_state)}
                  </TableCell>
                  <TableCell className="text-xs text-slate-400 font-mono">
                    —
                  </TableCell>
                </TableRow>
              ))}
              
              {(!logs || logs.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                    No audit logs available.
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
