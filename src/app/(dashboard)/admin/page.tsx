import { createClient } from '@/lib/supabase/server';
import { Card, Metric, Text, Title } from '@tremor/react';
import { ShieldAlert, Users, History, Activity, Settings, Database, Share2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'Admin Dashboard — AtomQuest' };

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Mocks for demo, in real life these would be COUNT() queries
  const stats = {
    totalUsers: 24,
    activeCycles: 1,
    escalations: 3,
    auditEvents: 142
  };

  const quickLinks = [
    { name: 'Cycle Management', icon: Activity, href: '/admin/cycles', color: 'text-indigo-500', bg: 'bg-indigo-100 dark:bg-indigo-900/50' },
    { name: 'User Directory', icon: Users, href: '/admin/users', color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/50' },
    { name: 'Escalations Log', icon: ShieldAlert, href: '/admin/escalations', color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/50' },
    { name: 'Audit Trail', icon: History, href: '/admin/audit', color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800' },
    { name: 'Shared Goals', icon: Share2, href: '/admin/shared-goals', color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/50' },
    { name: 'Analytics', icon: Database, href: '/analytics', color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/50' }
  ];

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">System Administration</h1>
        <p className="text-slate-500 mt-1">Manage global settings, user roles, and monitor system health.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm border-t-4 border-t-blue-500">
          <Text>Total Users</Text>
          <Metric>{stats.totalUsers}</Metric>
        </Card>
        
        <Card className="ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm border-t-4 border-t-emerald-500">
          <Text>Active Cycles</Text>
          <Metric>{stats.activeCycles}</Metric>
        </Card>

        <Card className="ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm border-t-4 border-t-red-500">
          <Text>Active Escalations</Text>
          <Metric>{stats.escalations}</Metric>
        </Card>

        <Card className="ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm border-t-4 border-t-slate-500">
          <Text>Recent Audit Events</Text>
          <Metric>{stats.auditEvents}</Metric>
        </Card>
      </div>

      <div className="mt-8">
        <Title className="mb-4 text-slate-800 dark:text-slate-200">Admin Modules</Title>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((link) => (
            <Link key={link.name} href={link.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer ring-1 ring-slate-200 dark:ring-slate-800 group">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${link.bg}`}>
                    <link.icon className={`h-6 w-6 ${link.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">
                      {link.name}
                    </h3>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
      
      {stats.escalations > 0 && (
        <div className="mt-8 bg-red-50 border border-red-200 rounded-xl p-6 dark:bg-red-950/20 dark:border-red-900/50">
          <div className="flex items-start gap-4">
            <AlertTriangle className="text-red-600 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-400">Action Required: Pending Escalations</h3>
              <p className="text-red-600 dark:text-red-500 mt-1">
                There are {stats.escalations} unresolved escalations triggered by process delays. Please review the escalation log immediately to prevent compliance issues.
              </p>
              <Link href="/admin/escalations" className="inline-block mt-3 text-sm font-medium text-red-700 hover:text-red-800 underline underline-offset-2">
                View Escalation Log
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
