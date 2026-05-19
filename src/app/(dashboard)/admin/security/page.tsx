'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Copy, Check } from 'lucide-react';

/** Displays the Azure callback redirect URI with a copy button */
function RedirectUriDisplay() {
  const [uri, setUri] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUri(`${window.location.origin}/api/auth/azure/callback`);
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(uri);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Copy failed');
    }
  };

  return (
    <div className="flex items-center gap-2 bg-white border border-blue-200 rounded-lg px-3 py-2">
      <code className="flex-1 text-[13px] text-zinc-800 font-mono break-all">
        {uri || 'Loading...'}
      </code>
      <button
        onClick={copy}
        className="flex-shrink-0 p-1 text-blue-600 hover:text-blue-800 transition-colors"
        title="Copy"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}

interface AzureConfig {
  enabled: boolean;
  tenantId: string;
  clientId: string;
  clientSecret: string;
  syncHierarchy: boolean;
  syncRoles: boolean;
  roleMapping: { azureGroup: string; appRole: string }[];
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-zinc-900' : 'bg-zinc-200'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

const DEFAULT_CONFIG: AzureConfig = {
  enabled: false,
  tenantId: '',
  clientId: '',
  clientSecret: '',
  syncHierarchy: true,
  syncRoles: true,
  roleMapping: [
    { azureGroup: 'AtomQuest-Admins', appRole: 'admin' },
    { azureGroup: 'AtomQuest-Managers', appRole: 'manager' },
    { azureGroup: 'AtomQuest-Employees', appRole: 'employee' },
  ],
};

export default function SecurityPage() {
  const [config, setConfig] = useState<AzureConfig>(DEFAULT_CONFIG);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);

  useEffect(() => {
    fetch('/api/admin/security')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setConfig(data); })
      .catch(() => {})
      .finally(() => setLoadingConfig(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error('Failed to save');
      toast.success('Security settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const res = await fetch('/api/admin/security/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: config.tenantId, clientId: config.clientId, clientSecret: config.clientSecret }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Azure AD connection successful ✓');
      } else {
        toast.error(`Connection failed: ${data.error}`);
      }
    } catch {
      toast.error('Failed to reach Azure AD');
    } finally {
      setTesting(false);
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/admin/security/sync', {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Sync failed');
      
      const data = await response.json();
      toast.success(`Synced ${data.usersSynced} users from Azure AD`);
    } catch (error) {
      toast.error('Failed to sync with Azure AD');
    } finally {
      setSyncing(false);
    }
  };

  const addRoleMapping = () => {
    setConfig(prev => ({
      ...prev,
      roleMapping: [...prev.roleMapping, { azureGroup: '', appRole: 'employee' }],
    }));
  };

  const removeRoleMapping = (index: number) => {
    setConfig(prev => ({
      ...prev,
      roleMapping: prev.roleMapping.filter((_, i) => i !== index),
    }));
  };

  const updateRoleMapping = (index: number, field: 'azureGroup' | 'appRole', value: string) => {
    setConfig(prev => ({
      ...prev,
      roleMapping: prev.roleMapping.map((m, i) => 
        i === index ? { ...m, [field]: value } : m
      ),
    }));
  };

  if (loadingConfig) {
    return (
      <div className="max-w-4xl mx-auto p-6 flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-[24px] font-semibold tracking-tight text-zinc-950 leading-[32px]">Security Policies</h1>
        <p className="text-[14px] text-zinc-500 mt-1">
          Configure Microsoft Entra ID (Azure AD) integration for SSO and user sync.
        </p>
      </div>

      {/* Azure App Registration — Setup Guide */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <div className="flex gap-3">
          <span className="material-symbols-outlined text-blue-600 flex-shrink-0">info</span>
          <div className="flex flex-col gap-3 w-full">
            <div>
              <h3 className="text-[14px] font-semibold text-blue-900">Azure App Registration — Required Setup</h3>
              <p className="text-[13px] text-blue-800 mt-1 leading-[20px]">
                Before enabling SSO, register an application in your{' '}
                <a href="https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps" target="_blank" rel="noreferrer"
                  className="underline font-medium">Azure Portal</a>{' '}
                and add this <strong>Redirect URI</strong> to the app&apos;s Authentication settings:
              </p>
            </div>
            <RedirectUriDisplay />
            <div className="text-[12px] text-blue-700 space-y-1">
              <p><strong>Platform:</strong> Web</p>
              <p><strong>Scopes needed:</strong> <code className="bg-blue-100 px-1 rounded">openid profile email offline_access User.Read</code></p>
              <p><strong>Optional (for group sync):</strong> <code className="bg-blue-100 px-1 rounded">GroupMember.Read.All</code> API permission</p>
            </div>
          </div>
        </div>
      </div>

      {/* SSO Status Card */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-100 rounded-lg">
              <span className="material-symbols-outlined text-zinc-600">security</span>
            </div>
            <div>
              <h3 className="font-section-heading text-section-heading text-zinc-900">Single Sign-On (SSO)</h3>
              <p className="text-sm text-zinc-500">Microsoft Entra ID integration</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Toggle
              checked={config.enabled}
              onChange={(checked) => setConfig(prev => ({ ...prev, enabled: checked }))}
            />
            <span className={`text-sm font-medium ${config.enabled ? 'text-green-600' : 'text-zinc-400'}`}>
              {config.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>

        {config.enabled && (
          <div className="space-y-6">
            {/* Azure AD Credentials */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tenantId">Azure Tenant ID</Label>
                <Input
                  id="tenantId"
                  type="password"
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  value={config.tenantId}
                  onChange={(e) => setConfig(prev => ({ ...prev, tenantId: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientId">Application (Client) ID</Label>
                <Input
                  id="clientId"
                  type="password"
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  value={config.clientId}
                  onChange={(e) => setConfig(prev => ({ ...prev, clientId: e.target.value }))}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="clientSecret">Client Secret</Label>
                <Input
                  id="clientSecret"
                  type="password"
                  placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={config.clientSecret}
                  onChange={(e) => setConfig(prev => ({ ...prev, clientSecret: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleTestConnection} disabled={testing}>
                {testing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Testing...</> : 'Test Connection'}
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : 'Save Configuration'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Org Hierarchy Sync */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-100 rounded-lg">
              <span className="material-symbols-outlined text-zinc-600">account_tree</span>
            </div>
            <div>
              <h3 className="font-section-heading text-section-heading text-zinc-900">Org Hierarchy Sync</h3>
              <p className="text-sm text-zinc-500">Automatically sync reporting lines from Azure AD</p>
            </div>
          </div>
          <Toggle
            checked={config.syncHierarchy}
            onChange={(checked) => setConfig(prev => ({ ...prev, syncHierarchy: checked }))}
          />
        </div>

        <div className="bg-zinc-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm text-zinc-600">
            <span className="material-symbols-outlined text-[18px]">info</span>
            <span>Manager reports will be derived from Azure AD &quot;manager&quot; attribute</span>
          </div>
        </div>
      </div>

      {/* Role Mapping */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-100 rounded-lg">
              <span className="material-symbols-outlined text-zinc-600">group</span>
            </div>
            <div>
              <h3 className="font-section-heading text-section-heading text-zinc-900">Role Assignment</h3>
              <p className="text-sm text-zinc-500">Map Azure AD groups to application roles</p>
            </div>
          </div>
          <Toggle
            checked={config.syncRoles}
            onChange={(checked) => setConfig(prev => ({ ...prev, syncRoles: checked }))}
          />
        </div>

        {config.enabled && config.syncRoles && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm font-medium text-zinc-500 px-2">
              <span>Azure AD Group</span>
              <span>App Role</span>
            </div>
            
            {config.roleMapping.map((mapping, index) => (
              <div key={index} className="grid grid-cols-2 gap-4 items-center">
                <Input
                  placeholder="Group name"
                  value={mapping.azureGroup}
                  onChange={(e) => updateRoleMapping(index, 'azureGroup', e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <select
                    value={mapping.appRole}
                    onChange={(e) => updateRoleMapping(index, 'appRole', e.target.value)}
                    className="flex-1 border border-zinc-200 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="employee">Employee</option>
                  </select>
                  <button
                    onClick={() => removeRoleMapping(index)}
                    className="p-1 text-zinc-400 hover:text-red-500"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
              </div>
            ))}

            <Button variant="outline" size="sm" onClick={addRoleMapping}>
              <span className="material-symbols-outlined mr-1 text-[18px]">add</span>
              Add Mapping
            </Button>
          </div>
        )}
      </div>

      {/* Manual Sync */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-section-heading text-section-heading text-zinc-900">Manual Sync</h3>
            <p className="text-sm text-zinc-500 mt-1">Manually trigger Azure AD user sync</p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleSyncNow} 
            disabled={!config.enabled || syncing}
          >
            <span className="material-symbols-outlined mr-2 text-[18px]">sync</span>
            {syncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        </div>
      </div>
    </div>
  );
}