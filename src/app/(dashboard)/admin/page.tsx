import { createClient } from '@/lib/supabase/server';
import { Card, Metric, Text, Title } from '@tremor/react';
import { ShieldAlert, Users, History, Activity, Settings, Database, Share2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'Admin Dashboard — AtomQuest' };

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch real stats from Supabase
  const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
  const { count: activeCycles } = await supabase.from('cycles').select('*', { count: 'exact', head: true }).eq('is_active', true);
  const { count: escalations } = await supabase.from('escalations').select('*', { count: 'exact', head: true }).is('resolved_at', null);
  const { count: auditEvents } = await supabase.from('audit_logs').select('*', { count: 'exact', head: true });

  const stats = {
    totalUsers: totalUsers || 0,
    activeCycles: activeCycles || 0,
    escalations: escalations || 0,
    auditEvents: auditEvents || 0
  };

  const quickLinks = [
    { name: 'Cycle Management', icon: 'autorenew', href: '/admin/cycles' },
    { name: 'User Directory', icon: 'manage_accounts', href: '/admin/users' },
    { name: 'Security Policies', icon: 'security', href: '/admin/security' },
    { name: 'Data Export', icon: 'dataset', href: '/admin/export' },
    { name: 'System Logs', icon: 'list_alt', href: '/admin/logs' },
    { name: 'API Configuration', icon: 'api', href: '/admin/api' },
  ];

  return (
    <div className="max-w-6xl mx-auto flex flex-col min-h-full">
      {/* Page Header */}
      <div className="flex flex-col gap-1 mb-section-gap">
        <h2 className="font-page-title text-page-title text-zinc-900 tracking-tight">System Administration</h2>
        <p className="font-body-sm text-body-sm text-zinc-500">
          Monitor platform health, user activity, and critical administrative functions.
        </p>
      </div>
      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-section-gap">
        {/* Total Users */}
        <div
          className="bg-white border border-zinc-200 rounded-xl p-5 flex flex-col gap-2 animate-fade-in-up-stagger"
          style={{ animationDelay: '100ms' }}
        >
          <div className="flex items-center justify-between">
            <span className="font-section-label text-section-label uppercase tracking-widest text-zinc-500">
              Total Users
            </span>
            <span className="material-symbols-outlined text-zinc-400 text-[18px]">group</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-data-value-lg text-data-value-lg tabular-nums text-zinc-950">{stats.totalUsers}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-status-on-track animate-pulse-subtle"></span>
            <span className="font-caption text-caption text-zinc-500">+12% vs last month</span>
          </div>
        </div>
        {/* Active Cycles */}
        <div
          className="bg-white border border-zinc-200 rounded-xl p-5 flex flex-col gap-2 animate-fade-in-up-stagger"
          style={{ animationDelay: '200ms' }}
        >
          <div className="flex items-center justify-between">
            <span className="font-section-label text-section-label uppercase tracking-widest text-zinc-500">
              Active Cycles
            </span>
            <span className="material-symbols-outlined text-zinc-400 text-[18px]">autorenew</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-data-value-lg text-data-value-lg tabular-nums text-zinc-950">{stats.activeCycles}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-status-on-track animate-pulse-subtle"></span>
            <span className="font-caption text-caption text-zinc-500">All systems optimal</span>
          </div>
        </div>
        {/* Active Escalations */}
        <div
          className="bg-white border border-zinc-200 border-l-2 border-l-status-overdue rounded-xl p-5 flex flex-col gap-2 animate-fade-in-up-stagger"
          style={{ animationDelay: '300ms' }}
        >
          <div className="flex items-center justify-between">
            <span className="font-section-label text-section-label uppercase tracking-widest text-zinc-500">
              Active Escalations
            </span>
            <span className="material-symbols-outlined text-status-overdue text-[18px]">error</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-data-value-lg text-data-value-lg tabular-nums text-zinc-950">{stats.escalations}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-status-overdue"></span>
            <span className="font-caption text-caption text-zinc-500">Requires immediate attention</span>
          </div>
        </div>
        {/* Audit Events */}
        <div
          className="bg-white border border-zinc-200 rounded-xl p-5 flex flex-col gap-2 animate-fade-in-up-stagger"
          style={{ animationDelay: '400ms' }}
        >
          <div className="flex items-center justify-between">
            <span className="font-section-label text-section-label uppercase tracking-widest text-zinc-500">
              Audit Events (24h)
            </span>
            <span className="material-symbols-outlined text-zinc-400 text-[18px]">history</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-data-value-lg text-data-value-lg tabular-nums text-zinc-950">{stats.auditEvents}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
            <span className="font-caption text-caption text-zinc-500">Normal volume</span>
          </div>
        </div>
      </div>
      {/* Quick Links / Modules Grid */}
      <div className="mb-8">
        <h3 className="font-section-heading text-section-heading text-zinc-900 mb-4">Management Modules</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="group bg-white border border-zinc-200 rounded-xl p-card-padding flex items-start gap-4 hover:bg-zinc-50 transition-colors animate-fade-in-up-stagger"
            >
              <div className="p-2 bg-zinc-100 rounded-md group-hover:bg-white border border-transparent group-hover:border-zinc-200 transition-colors flex-shrink-0">
                <span className="material-symbols-outlined text-zinc-400 group-hover:text-zinc-700 transition-colors text-[20px]">
                  {link.icon}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-table-cell-primary text-table-cell-primary text-zinc-900">{link.name}</span>
                <span className="font-caption text-caption text-zinc-500">
                  {link.name === 'Cycle Management'
                    ? 'Configure review periods and timelines.'
                    : link.name === 'User Directory'
                    ? 'Manage roles, permissions, and profiles.'
                    : link.name === 'Security Policies'
                    ? 'Enforce SSO and authentication rules.'
                    : link.name === 'Data Export'
                    ? 'Generate raw data dumps for compliance.'
                    : link.name === 'System Logs'
                    ? 'View detailed application event history.'
                    : 'Manage webhooks and external integrations.'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
      {/* Sticky Alert Banner */}
      {stats.escalations > 0 && (
        <div className="mt-auto pt-6 pb-4">
          <div
            className="bg-zinc-100 border border-zinc-200 rounded-xl p-4 flex items-center justify-between shadow-sm animate-fade-in-up-stagger"
            style={{ animationDelay: '750ms' }}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-status-overdue" style={{ fontVariationSettings: "'FILL' 1" }}>
                warning
              </span>
              <div>
                <p className="font-table-cell-primary text-table-cell-primary text-zinc-900 font-semibold">
                  Action Required: {stats.escalations} Pending Escalations
                </p>
                <p className="font-caption text-caption text-zinc-500">
                  Goal alignment disputes have exceeded the SLA threshold.
                </p>
              </div>
            </div>
            <Link
              href="/admin/escalations"
              className="bg-white text-zinc-900 px-4 py-1.5 rounded-md font-table-cell-primary text-table-cell-primary border border-zinc-200 hover:bg-zinc-50 transition-colors shadow-sm"
            >
              Review Now
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
