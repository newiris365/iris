"use client";

import React, { useState, useEffect } from 'react';
import { MessageSquare, Save, Send, CheckCircle, XCircle, AlertTriangle, RefreshCw, Eye, EyeOff, Clock, ExternalLink } from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';

const PROVIDERS = [
  { id: 'twilio', name: 'Twilio', desc: 'Twilio WhatsApp Business API (sandbox or production)', fields: ['api_url', 'api_key', 'from_number', 'template_namespace'] },
  { id: 'meta_cloud', name: 'Meta Cloud API', desc: 'WhatsApp Business Platform via Meta Cloud', fields: ['api_url', 'phone_number_id', 'access_token', 'from_number'] },
  { id: 'gupshup', name: 'Gupshup', desc: 'Gupshup WhatsApp Business API', fields: ['api_url', 'api_key', 'from_number'] },
  { id: 'wati', name: 'WATI', desc: 'WATI WhatsApp Business API', fields: ['api_url', 'api_key', 'from_number'] },
  { id: 'custom', name: 'Custom HTTP', desc: 'Any custom HTTP-based WhatsApp API', fields: ['api_url', 'api_key', 'from_number'] },
];

const FIELD_LABELS: Record<string, string> = {
  api_url: 'API URL',
  api_key: 'API Key / Auth Token',
  phone_number_id: 'Phone Number ID',
  from_number: 'Sender Number',
  verify_token: 'Webhook Verify Token',
  access_token: 'Access Token',
  template_namespace: 'Account SID / Template Namespace',
};

export default function AdminWhatsAppPage() {
  const [config, setConfig] = useState<any>(null);
  const [hasConfig, setHasConfig] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'logs'>('config');

  const [form, setForm] = useState({
    provider: 'twilio',
    api_url: 'https://api.twilio.com/2010-04-01/Accounts',
    api_key: '',
    phone_number_id: '',
    from_number: '',
    verify_token: '',
    access_token: '',
    template_namespace: '',
  });

  useEffect(() => { fetchConfig(); }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await apiGet('campusCore/whatsapp/config');
      if (res.success && res.hasConfig && res.config) {
        setConfig(res.config);
        setHasConfig(true);
        setForm({
          provider: res.config.provider || 'twilio',
          api_url: res.config.api_url || '',
          api_key: res.config.api_key || '',
          phone_number_id: res.config.phone_number_id || '',
          from_number: res.config.from_number || '',
          verify_token: res.config.verify_token || '',
          access_token: res.config.access_token || '',
          template_namespace: res.config.template_namespace || '',
        });
      } else {
        setHasConfig(false);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await apiGet('campusCore/whatsapp/delivery-log?limit=50');
      if (res.success) setLogs(res.logs || []);
    } catch (err) { console.error(err); }
    finally { setLogsLoading(false); }
  };

  const handleProviderChange = (provider: string) => {
    const p = PROVIDERS.find(p => p.id === provider);
    setForm(prev => ({
      ...prev,
      provider,
      api_url: provider === 'twilio' ? 'https://api.twilio.com/2010-04-01/Accounts' : '',
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await apiPost('campusCore/whatsapp/config', form);
      if (res.success) {
        alert('WhatsApp API configuration saved successfully!');
        fetchConfig();
      } else {
        alert('Failed to save: ' + (res.error || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally { setSaving(false); }
  };

  const handleTest = async () => {
    if (!testPhone) { alert('Enter a phone number to test.'); return; }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await apiPost('campusCore/whatsapp/test', { phone_number: testPhone });
      setTestResult({ success: res.success, message: res.message || (res.success ? 'Sent!' : 'Failed') });
    } catch (err: any) {
      setTestResult({ success: false, message: err.message });
    } finally { setTesting(false); }
  };

  const selectedProvider = PROVIDERS.find(p => p.id === form.provider);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <MessageSquare size={20} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">WhatsApp API Configuration</h1>
            <p className="text-sm text-slate-400">Configure your institute&apos;s WhatsApp Business API provider</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { fetchConfig(); fetchLogs(); }}
            className="px-3 py-2 bg-white/5 text-slate-300 rounded-lg hover:bg-white/10 text-sm flex items-center gap-1">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Status Banner */}
      {hasConfig ? (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle size={18} className="text-emerald-400" />
          <div>
            <p className="text-sm font-medium text-emerald-300">API Configured</p>
            <p className="text-xs text-emerald-400/60">Provider: {config?.provider || form.provider} | Last updated: {config?.updated_at ? new Date(config.updated_at).toLocaleString() : '—'}</p>
          </div>
        </div>
      ) : (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle size={18} className="text-amber-400" />
          <div>
            <p className="text-sm font-medium text-amber-300">No API Configured</p>
            <p className="text-xs text-amber-400/60">Messages will run in sandbox mode (logged but not delivered). Configure your API below.</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
        {[
          { id: 'config' as const, label: 'API Configuration' },
          { id: 'logs' as const, label: 'Delivery Logs' },
        ].map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); if (tab.id === 'logs') fetchLogs(); }}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
              ${activeTab === tab.id ? 'bg-[#6C2BD9]/20 text-white border border-[#6C2BD9]/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'config' && (
        <div className="space-y-6">
          {/* Provider Selection */}
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Select Provider</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {PROVIDERS.map(p => (
                <button key={p.id} onClick={() => handleProviderChange(p.id)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    form.provider === p.id
                      ? 'bg-[#6C2BD9]/15 border-[#6C2BD9]/40 text-white'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}>
                  <p className="font-semibold text-sm">{p.name}</p>
                  <p className="text-xs mt-1 opacity-60">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Provider Help */}
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6 space-y-3">
            <h3 className="text-lg font-bold text-white">Setup Instructions</h3>
            {form.provider === 'twilio' && (
              <div className="text-sm text-slate-300 space-y-2">
                <p>1. Create a Twilio account at <a href="https://twilio.com" target="_blank" className="text-violet-400 hover:underline">twilio.com</a></p>
                <p>2. Enable the WhatsApp Sandbox or get a production WhatsApp sender</p>
                <p>3. Your <strong>API URL</strong> is: <code className="bg-white/10 px-1 rounded">https://api.twilio.com/2010-04-01/Accounts</code></p>
                <p>4. <strong>API Key</strong> = Auth Token, <strong>Template Namespace</strong> = Account SID</p>
                <p>5. <strong>Sender Number</strong> = <code className="bg-white/10 px-1 rounded">whatsapp:+14155238886</code> (sandbox) or your verified number</p>
              </div>
            )}
            {form.provider === 'meta_cloud' && (
              <div className="text-sm text-slate-300 space-y-2">
                <p>1. Go to <a href="https://business.facebook.com" target="_blank" className="text-violet-400 hover:underline">Meta Business Suite</a></p>
                <p>2. Create a WhatsApp Business Account and Phone Number</p>
                <p>3. <strong>API URL</strong> = <code className="bg-white/10 px-1 rounded">https://graph.facebook.com/v18.0</code></p>
                <p>4. <strong>Phone Number ID</strong> and <strong>Access Token</strong> from the Meta dashboard</p>
              </div>
            )}
            {(form.provider === 'gupshup' || form.provider === 'wati' || form.provider === 'custom') && (
              <div className="text-sm text-slate-300 space-y-2">
                <p>1. Enter the API endpoint URL provided by your WhatsApp Business provider</p>
                <p>2. Enter the API key or access token for authentication</p>
                <p>3. Enter the registered sender number</p>
                <p>4. The system sends messages as <code className="bg-white/10 px-1 rounded">POST</code> with JSON body: <code className="bg-white/10 px-1 rounded">{'{ "to": "...", "message": "..." }'}</code></p>
              </div>
            )}
          </div>

          {/* Config Form */}
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">API Credentials</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {selectedProvider?.fields.map(field => (
                <div key={field} className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">{FIELD_LABELS[field] || field}</label>
                  <div className="relative">
                    <input
                      type={(field.includes('key') || field.includes('token') || field.includes('secret')) && !showSecrets[field] ? 'password' : 'text'}
                      value={(form as any)[field] || ''}
                      onChange={e => setForm(prev => ({ ...prev, [field]: e.target.value }))}
                      placeholder={FIELD_LABELS[field] || field}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 pr-10"
                    />
                    {(field.includes('key') || field.includes('token') || field.includes('secret')) && (
                      <button type="button" onClick={() => setShowSecrets(prev => ({ ...prev, [field]: !prev[field] }))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white">
                        {showSecrets[field] ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Sender Number</label>
                <input type="text" value={form.from_number} onChange={e => setForm(prev => ({ ...prev, from_number: e.target.value }))}
                  placeholder="whatsapp:+14155238886"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Webhook Verify Token (optional)</label>
                <input type="text" value={form.verify_token} onChange={e => setForm(prev => ({ ...prev, verify_token: e.target.value }))}
                  placeholder="iris365-whatsapp-verify"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50" />
              </div>
            </div>

            <button onClick={handleSave} disabled={saving}
              className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 text-sm font-medium disabled:opacity-50 flex items-center gap-2">
              <Save size={14} /> {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>

          {/* Test Message */}
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Test Connection</h3>
            <div className="flex gap-2">
              <input type="text" value={testPhone} onChange={e => setTestPhone(e.target.value)}
                placeholder="+919876543210"
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50" />
              <button onClick={handleTest} disabled={testing}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500 text-sm font-medium disabled:opacity-50 flex items-center gap-2">
                <Send size={14} /> {testing ? 'Sending...' : 'Send Test'}
              </button>
            </div>
            {testResult && (
              <div className={`p-3 rounded-lg text-sm ${testResult.success ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'}`}>
                {testResult.message}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
          {logsLoading ? (
            <div className="p-8 text-center text-slate-400">Loading logs...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
              <p>No delivery logs yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-3 text-slate-400">To</th>
                    <th className="text-left p-3 text-slate-400">Purpose</th>
                    <th className="text-left p-3 text-slate-400">Provider</th>
                    <th className="text-center p-3 text-slate-400">Status</th>
                    <th className="text-left p-3 text-slate-400">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log: any) => (
                    <tr key={log.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-3 text-white font-mono text-xs">{log.to_phone}</td>
                      <td className="p-3">
                        <span className="text-xs px-2 py-0.5 rounded bg-violet-500/20 text-violet-400">{log.channel_purpose || '—'}</span>
                      </td>
                      <td className="p-3 text-slate-400 text-xs">{log.provider || '—'}</td>
                      <td className="p-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          log.status === 'sent' || log.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-400' :
                          log.status === 'sandbox' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>{log.status}</span>
                      </td>
                      <td className="p-3 text-slate-400 text-xs">
                        <div className="flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(log.created_at).toLocaleString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
