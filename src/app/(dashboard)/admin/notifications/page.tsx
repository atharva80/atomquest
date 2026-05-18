import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Notifications — Admin | AtomQuest' };

export default async function NotificationsPage() {
  const hasEmail = !!process.env.RESEND_API_KEY;
  const hasTeams = !!process.env.TEAMS_WEBHOOK_URL;
  const hasSSO = !!(process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET);

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="font-page-title text-page-title text-zinc-900 mb-2">Integrations & Notifications</h2>
      <p className="font-body-sm text-zinc-500 mb-8">Status of active third-party integrations.</p>
      <div className="space-y-4">
        {[
          { label: 'Email (Resend)', active: hasEmail, detail: hasEmail ? 'Sending live emails' : 'RESEND_API_KEY not configured — using stub logs' },
          { label: 'Microsoft Teams', active: hasTeams, detail: hasTeams ? 'Webhook active' : 'TEAMS_WEBHOOK_URL not configured' },
          { label: 'Microsoft Entra SSO', active: hasSSO, detail: hasSSO ? 'Azure AD configured' : 'AZURE_AD_* env variables not configured' },
        ].map(item => (
          <div key={item.label} className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="font-table-cell-primary text-zinc-900">{item.label}</p>
              <p className="font-caption text-zinc-500 mt-0.5">{item.detail}</p>
            </div>
            <span className={`w-2.5 h-2.5 rounded-full ${item.active ? 'bg-green-500' : 'bg-zinc-300'}`} />
          </div>
        ))}
      </div>
    </div>
  );
}