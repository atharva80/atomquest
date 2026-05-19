'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Eye, EyeOff, Zap, Webhook, Key } from 'lucide-react';

const ALL_EVENTS = [
  'goal.created', 'goal.updated', 'goal.approved',
  'goal.rejected', 'goal.deleted', 'checkin.submitted',
  'checkin.approved', 'cycle.started', 'cycle.ended',
  'user.created', 'user.updated', 'escalation.created',
];

interface WebhookItem {
  id: string;
  name: string;
  url: string;
  events: string[];
  enabled: boolean;
  secret: string;
  createdAt?: string;
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${checked ? 'bg-zinc-900' : 'bg-zinc-200'}`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

export default function ApiPage() {
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [newWebhook, setNewWebhook] = useState({ name: '', url: '', secret: '', events: [] as string[] });

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/webhooks');
      if (res.ok) setWebhooks(await res.json());
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newWebhook.name.trim() || !newWebhook.url.trim()) {
      toast.error('Name and URL are required');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWebhook),
      });
      if (!res.ok) throw new Error('Failed');
      const created = await res.json();
      setWebhooks(prev => [...prev, created]);
      setNewWebhook({ name: '', url: '', secret: '', events: [] });
      setIsAdding(false);
      toast.success('Webhook created');
    } catch {
      toast.error('Failed to create webhook');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (webhook: WebhookItem) => {
    const updated = { ...webhook, enabled: !webhook.enabled };
    setWebhooks(prev => prev.map(w => w.id === webhook.id ? updated : w));
    try {
      const res = await fetch('/api/admin/webhooks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: webhook.id, enabled: !webhook.enabled }),
      });
      if (!res.ok) throw new Error();
      toast.success(updated.enabled ? 'Webhook enabled' : 'Webhook disabled');
    } catch {
      // revert
      setWebhooks(prev => prev.map(w => w.id === webhook.id ? webhook : w));
      toast.error('Failed to update webhook');
    }
  };

  const handleDelete = async (id: string) => {
    setWebhooks(prev => prev.filter(w => w.id !== id));
    try {
      const res = await fetch('/api/admin/webhooks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      toast.success('Webhook deleted');
    } catch {
      toast.error('Failed to delete webhook');
      fetchWebhooks();
    }
  };

  const handleTest = async (webhook: WebhookItem) => {
    setTestingId(webhook.id);
    try {
      const res = await fetch('/api/admin/webhooks/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhook.url, secret: webhook.secret }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Webhook test OK — ${data.statusCode} ${data.statusText}`);
      } else {
        toast.error(`Webhook test failed: ${data.error || data.statusCode}`);
      }
    } catch {
      toast.error('Test request failed');
    } finally {
      setTestingId(null);
    }
  };

  const toggleEvent = (event: string) => {
    setNewWebhook(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event],
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-[24px] font-semibold tracking-tight text-zinc-950 leading-[32px]">API Configuration</h1>
        <p className="text-[14px] text-zinc-500 mt-1">Manage webhooks and external system integrations.</p>
      </div>

      {/* Webhooks */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <Webhook className="h-4 w-4 text-zinc-500" />
            <h2 className="text-[15px] font-semibold text-zinc-900">Webhooks</h2>
            <span className="text-[11px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full font-medium">
              {webhooks.length}
            </span>
          </div>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-200 rounded-lg text-[13px] font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Webhook
          </button>
        </div>

        {/* Add form */}
        {isAdding && (
          <div className="p-6 bg-zinc-50 border-b border-zinc-200 space-y-4">
            <h3 className="text-[14px] font-semibold text-zinc-900">New Webhook</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-zinc-700">Name *</label>
                <input
                  placeholder="e.g., HR System"
                  value={newWebhook.name}
                  onChange={e => setNewWebhook(p => ({ ...p, name: e.target.value }))}
                  className="px-3 py-2 border border-zinc-200 rounded-lg text-[14px] focus:outline-none focus:border-zinc-400"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-zinc-700">URL *</label>
                <input
                  placeholder="https://..."
                  value={newWebhook.url}
                  onChange={e => setNewWebhook(p => ({ ...p, url: e.target.value }))}
                  className="px-3 py-2 border border-zinc-200 rounded-lg text-[14px] focus:outline-none focus:border-zinc-400"
                />
              </div>
              <div className="md:col-span-2 flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-zinc-700">Secret (leave blank to auto-generate)</label>
                <input
                  placeholder="whsec_..."
                  value={newWebhook.secret}
                  onChange={e => setNewWebhook(p => ({ ...p, secret: e.target.value }))}
                  className="px-3 py-2 border border-zinc-200 rounded-lg text-[14px] font-mono focus:outline-none focus:border-zinc-400"
                />
              </div>
              <div className="md:col-span-2 flex flex-col gap-2">
                <label className="text-[13px] font-medium text-zinc-700">Events to subscribe</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_EVENTS.map(e => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => toggleEvent(e)}
                      className={`text-[12px] px-2.5 py-1 rounded-full border transition-colors ${
                        newWebhook.events.includes(e)
                          ? 'bg-zinc-900 border-zinc-900 text-white'
                          : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-400'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-[13px] font-medium hover:bg-zinc-800 disabled:opacity-50"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Create Webhook
              </button>
              <button
                onClick={() => { setIsAdding(false); setNewWebhook({ name: '', url: '', secret: '', events: [] }); }}
                className="px-4 py-2 text-[13px] font-medium text-zinc-600 hover:text-zinc-900"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Webhook list */}
        <div className="divide-y divide-zinc-100">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
            </div>
          )}
          {!loading && webhooks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Webhook className="h-8 w-8 text-zinc-300" />
              <p className="text-[14px] text-zinc-400">No webhooks configured</p>
            </div>
          )}
          {webhooks.map(wh => (
            <div key={wh.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-lg flex-shrink-0 ${wh.enabled ? 'bg-emerald-50' : 'bg-zinc-100'}`}>
                    <Webhook className={`h-4 w-4 ${wh.enabled ? 'text-emerald-600' : 'text-zinc-400'}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium text-zinc-900">{wh.name}</p>
                    <p className="text-[13px] text-zinc-500 truncate">{wh.url}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Toggle checked={wh.enabled} onChange={() => handleToggle(wh)} />
                  <button
                    onClick={() => handleTest(wh)}
                    disabled={testingId === wh.id}
                    className="px-2.5 py-1.5 text-[12px] font-medium border border-zinc-200 rounded-lg hover:bg-zinc-50 text-zinc-700 flex items-center gap-1 disabled:opacity-50"
                  >
                    {testingId === wh.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                    Test
                  </button>
                  <button
                    onClick={() => handleDelete(wh.id)}
                    className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Secret row */}
              <div className="mt-3 flex items-center gap-2">
                <span className="text-[12px] text-zinc-400">Secret:</span>
                <code className="text-[12px] bg-zinc-50 border border-zinc-100 px-2 py-0.5 rounded font-mono text-zinc-700">
                  {showSecret[wh.id] ? wh.secret : '••••••••••••' + wh.secret.slice(-4)}
                </code>
                <button
                  onClick={() => setShowSecret(p => ({ ...p, [wh.id]: !p[wh.id] }))}
                  className="text-zinc-400 hover:text-zinc-600"
                >
                  {showSecret[wh.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>

              {/* Events */}
              {wh.events.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {wh.events.map(ev => (
                    <span key={ev} className="text-[11px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full">{ev}</span>
                  ))}
                </div>
              )}
              {wh.events.length === 0 && (
                <p className="mt-2 text-[12px] text-zinc-400 italic">No events subscribed</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* API Keys (UI-ready) */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-zinc-500" />
            <h2 className="text-[15px] font-semibold text-zinc-900">API Keys</h2>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-200 rounded-lg text-[13px] font-medium text-zinc-700 hover:bg-zinc-50 transition-colors">
            <Plus className="h-3.5 w-3.5" />
            Generate Key
          </button>
        </div>
        <div className="flex flex-col items-center py-12 gap-2">
          <Key className="h-8 w-8 text-zinc-300" />
          <p className="text-[14px] text-zinc-400">No API keys yet</p>
          <p className="text-[12px] text-zinc-400">API key management coming soon</p>
        </div>
      </div>

      {/* Available Events reference */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6">
        <h2 className="text-[15px] font-semibold text-zinc-900 mb-4">Available Events</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {ALL_EVENTS.map(event => (
            <div key={event} className="text-[13px] text-zinc-600 bg-zinc-50 border border-zinc-100 px-3 py-2 rounded-lg font-mono">
              {event}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}