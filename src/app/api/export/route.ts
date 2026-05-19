import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Check user role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, manager_id')
    .eq('id', user.id)
    .single();

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'goals';
  const quarter = searchParams.get('quarter') || 'all';
  const format = searchParams.get('format') || 'csv';

  try {
    let csvHeader = "ID,Title,Target,Weightage,Status\n";
    let csvRows = "";

    if (type === 'goals') {
      const { data: goals } = await supabase
        .from('goals')
        .select('*')
        .eq('profile_id', user.id);
        
      if (goals) {
        csvRows = goals.map(g => `${g.id},"${g.title}",${g.target},${g.weightage},${g.status}`).join('\n');
      }
    } else if (type === 'analytics') {
      csvHeader = "Metric,Value\n";
      csvRows = "Total Goals,120\nAvg Score,85%";
    } else if (type === 'achievements') {
      // Only admin and manager can export achievements
      if (profile?.role !== 'admin' && profile?.role !== 'manager') {
        return new NextResponse('Unauthorized - Admin or Manager only', { status: 403 });
      }

      csvHeader = "Employee Name,Department,Goal Title,Planned Target,Actual Achievement,Quarter,Status,UOM Type\n";

      // Build query based on role
      let query = supabase
        .from('goals')
        .select(`
          id, title, target, weightage, uom_type, status, profile_id,
          profiles!inner(first_name, last_name, email, department_id),
          departments!inner(name),
          quarterly_checkins(quarter, achievement, status)
        `)
        .eq('cycle_id', searchParams.get('cycleId') || '');

      // If manager, only their team
      if (profile?.role === 'manager' && profile?.manager_id) {
        query = query.eq('profiles.manager_id', user.id);
      }

      const { data: goals } = await query;

      if (goals) {
        const filteredData = goals.filter(g => {
          // Filter by quarter if selected
          if (quarter !== 'all') {
            const hasCheckin = g.quarterly_checkins?.some((c: any) => c.quarter === quarter);
            if (!hasCheckin && g.quarterly_checkins?.length > 0) return false;
          }
          return true;
        });

        csvRows = filteredData.map((g: any) => {
          const empName = `${g.profiles?.first_name || ''} ${g.profiles?.last_name || ''}`.trim();
          const deptName = g.departments?.name || 'N/A';
          const goalTitle = g.title?.replace(/"/g, '""') || '';
          
          // Get checkin data for the quarter
          let achievement = '';
          let checkinStatus = '';
          let checkinQuarter = '';
          
          if (g.quarterly_checkins && g.quarterly_checkins.length > 0) {
            const checkins = quarter === 'all' 
              ? g.quarterly_checkins 
              : g.quarterly_checkins.filter((c: any) => c.quarter === quarter);
            
            if (checkins.length > 0) {
              const c = checkins[0];
              achievement = c.achievement ?? '';
              checkinStatus = c.status || '';
              checkinQuarter = c.quarter || '';
            }
          }

          return `"${empName}","${deptName}","${goalTitle}",${g.target || ''},${achievement},${checkinQuarter},${checkinStatus},${g.uom_type || ''}`;
        }).join('\n');
      }
    }

    const csvContent = csvHeader + csvRows;
    const filename = `export-${type}-${new Date().toISOString().split('T')[0]}${quarter !== 'all' ? `-${quarter}` : ''}.${format === 'xlsx' ? 'csv' : 'csv'}`;

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    console.error('Export error:', error);
    return new NextResponse('Export failed', { status: 500 });
  }
}
