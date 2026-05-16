import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'goals';

  try {
    // Determine export data based on type
    let csvHeader = "ID,Title,Target,Weightage,Status\n";
    let csvRows = "";

    if (type === 'goals') {
      const { data: goals } = await supabase
        .from('goals')
        .select('*')
        .eq('employee_id', user.id);
        
      if (goals) {
        csvRows = goals.map(g => `${g.id},"${g.title}",${g.target},${g.weightage},${g.status}`).join('\n');
      }
    } else if (type === 'analytics') {
      csvHeader = "Metric,Value\n";
      csvRows = "Total Goals,120\nAvg Score,85%";
    }

    const csvContent = csvHeader + csvRows;

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="export-${type}-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } catch (error) {
    return new NextResponse('Export failed', { status: 500 });
  }
}
