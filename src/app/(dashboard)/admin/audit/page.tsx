import { createClient } from '@/lib/supabase/server';
import { getAuditLogs } from '@/queries/audit';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const metadata = { title: 'System Audit Trail — AtomQuest' };

export default async function AuditPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Verify that the user is an admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/');
  }

  // Fetch all audit logs (page size 100 for a detailed log screen)
  const { data: logs, count } = await getAuditLogs({ pageSize: 100 });

  return (
    <main className="flex-1 p-page-margin max-w-6xl w-full mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 pb-6 border-b border-zinc-200">
        <div>
          <h1 className="font-page-title text-page-title font-semibold text-zinc-900 mb-1">
            System Audit Trail
          </h1>
          <p className="font-body-sm text-body-sm text-zinc-500">
            Real-time security log and action history of all goal setting, approvals, and performance events.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-badge-label text-badge-label bg-zinc-100 text-zinc-700 border border-zinc-200 px-3 py-1.5 rounded-md tabular-nums">
            Total Logs: {count}
          </span>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            <span className="material-symbols-outlined text-4xl text-zinc-300 mb-2">history</span>
            <p className="font-body-sm text-body-sm font-medium">No audit logs recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  <th className="px-6 py-3 font-table-header text-table-header uppercase text-zinc-500 tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 font-table-header text-table-header uppercase text-zinc-500 tracking-wider">
                    User / Actor
                  </th>
                  <th className="px-6 py-3 font-table-header text-table-header uppercase text-zinc-500 tracking-wider">
                    Action Event
                  </th>
                  <th className="px-6 py-3 font-table-header text-table-header uppercase text-zinc-500 tracking-wider">
                    Comments / Reason
                  </th>
                  <th className="px-6 py-3 font-table-header text-table-header uppercase text-zinc-500 tracking-wider">
                    Goal Reference ID
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {logs.map((log) => {
                  const timestamp = new Date(log.created_at).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  // Format action into nice readable badge
                  let actionClass = 'bg-zinc-100 text-zinc-700 border-zinc-200';
                  if (log.action.includes('approve') || log.action.includes('submit')) {
                    actionClass = 'bg-zinc-900 text-white border-zinc-900';
                  } else if (log.action.includes('return') || log.action.includes('reject')) {
                    actionClass = 'bg-zinc-100 text-red-700 border-red-200';
                  }

                  return (
                    <tr key={log.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-4 font-caption text-caption text-zinc-500 whitespace-nowrap">
                        {timestamp}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center border border-zinc-200">
                            <span className="text-[10px] font-medium text-zinc-600">
                              {log.profile?.first_name?.[0]}{log.profile?.last_name?.[0]}
                            </span>
                          </div>
                          <span className="font-table-cell-primary text-table-cell-primary text-zinc-900">
                            {log.profile?.first_name} {log.profile?.last_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border uppercase tracking-wider ${actionClass}`}>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-body-sm text-body-sm text-zinc-600 max-w-xs truncate">
                        {log.reason || <span className="text-zinc-400 italic">No description provided</span>}
                      </td>
                      <td className="px-6 py-4 font-caption text-caption text-zinc-400 font-mono whitespace-nowrap">
                        {log.goal_id ? log.goal_id.slice(0, 8) + '...' : <span className="text-zinc-300">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
