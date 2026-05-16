import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, PlusCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const metadata = { title: 'Cycle Management — AtomQuest' };

export default async function CyclesPage() {
  const supabase = await createClient();
  
  const { data: cycles } = await supabase
    .from('cycles')
    .select('*')
    .order('start_date', { ascending: false });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Performance Cycles</h1>
          <p className="text-slate-500">Manage organizational goal periods and quarter windows</p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Create Cycle
        </Button>
      </div>

      <Card className="ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm border-0">
        <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-800">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-indigo-500" /> Cycle Directory
          </CardTitle>
          <CardDescription>View all historical and active performance cycles</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cycle Name</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cycles?.map(cycle => (
                <TableRow key={cycle.id}>
                  <TableCell className="font-medium">{cycle.name}</TableCell>
                  <TableCell>{new Date(cycle.start_date).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(cycle.end_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {cycle.is_active ? (
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-slate-500">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Edit</Button>
                  </TableCell>
                </TableRow>
              ))}
              
              {(!cycles || cycles.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                    No cycles found. Create one to get started.
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
