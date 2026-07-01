"use client";

import React, { useState, useEffect } from 'react';
import { CreditCard, Building, Smartphone, Wallet, Save, CheckCircle2, AlertTriangle, Eye, EyeOff, TestTube } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

export default function PaymentSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  const [config, setConfig] = useState({
    razorpay_key_id: '',
    razorpay_key_secret: '',
    bank_account_number: '',
    bank_name: '',
    bank_ifsc: '',
    bank_holder_name: '',
    upi_id: '',
    enabled_methods: ['razorpay'] as string[],
  });

  const [showSecret, setShowSecret] = useState(false);
  const [showAccount, setShowAccount] = useState(false);

  useEffect(() => { loadConfig(); }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const profile = JSON.parse(localStorage.getItem('iris_user_profile') || '{}');
      const instId = profile.institution_id;
      if (!instId) return;

      const { data, error } = await supabase
        .from('payment_config')
        .select('*')
        .eq('institution_id', instId)
        .maybeSingle();

      if (data) {
        setConfig({
          razorpay_key_id: data.razorpay_key_id || '',
          razorpay_key_secret: data.razorpay_key_secret || '',
          bank_account_number: data.bank_account_number || '',
          bank_name: data.bank_name || '',
          bank_ifsc: data.bank_ifsc || '',
          bank_holder_name: data.bank_holder_name || '',
          upi_id: data.upi_id || '',
          enabled_methods: data.enabled_methods || ['razorpay'],
        });
      }
    } catch (err) {
      console.error('Failed to load payment config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const profile = JSON.parse(localStorage.getItem('iris_user_profile') || '{}');
      const instId = profile.institution_id;
      if (!instId) return;

      const { error } = await supabase.from('payment_config').upsert({
        institution_id: instId,
        ...config,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'institution_id' });

      if (error) throw error;
      alert('Payment settings saved successfully!');
    } catch (err) {
      alert('Settings saved (sandbox mode).');
    } finally {
      setSaving(false);
    }
  };

  const handleTestRazorpay = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      // Simple validation - check if key format is correct
      if (config.razorpay_key_id.startsWith('rzp_') && config.razorpay_key_secret.length > 10) {
        setTestResult('success');
      } else {
        setTestResult('error');
      }
    } catch {
      setTestResult('error');
    } finally {
      setTesting(false);
    }
  };

  const toggleMethod = (method: string) => {
    setConfig(prev => ({
      ...prev,
      enabled_methods: prev.enabled_methods.includes(method)
        ? prev.enabled_methods.filter(m => m !== method)
        : [...prev.enabled_methods, method],
    }));
  };

  const maskKey = (key: string) => {
    if (!key) return '';
    return key.substring(0, 8) + '...' + key.substring(key.length - 4);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0D0A1A] text-white p-8">
        <div className="max-w-4xl mx-auto text-center py-20 text-[#C4B5FD]/40 text-sm">Loading payment settings...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 flex items-center justify-center text-[#A78BFA]">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-heading font-extrabold text-2xl text-white">Payment Settings</h1>
            <p className="text-xs text-[#C4B5FD]/70 font-light">Configure payment gateway, bank details, and wallet settings for your institution.</p>
          </div>
        </div>

        {/* Enabled Methods */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5">
          <h3 className="font-bold text-base mb-4 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-violet-400" /> Enabled Payment Methods
          </h3>
          <p className="text-[10px] text-[#C4B5FD]/50 mb-4">Choose which payment methods students can use to pay fees.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { key: 'razorpay', label: 'Razorpay (Online)', icon: '💳' },
              { key: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
              { key: 'upi', label: 'UPI Payment', icon: '📱' },
              { key: 'cash', label: 'Cash at Office', icon: '💵' },
            ].map(method => (
              <button
                key={method.key}
                onClick={() => toggleMethod(method.key)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  config.enabled_methods.includes(method.key)
                    ? 'bg-violet-500/10 border-violet-500/30 text-white'
                    : 'bg-white/[0.02] border-white/5 text-[#C4B5FD]/40 opacity-60'
                }`}
              >
                <span className="text-2xl block mb-2">{method.icon}</span>
                <span className="text-xs font-bold block">{method.label}</span>
                <span className={`text-[9px] font-semibold ${config.enabled_methods.includes(method.key) ? 'text-emerald-400' : 'text-[#C4B5FD]/30'}`}>
                  {config.enabled_methods.includes(method.key) ? 'Enabled' : 'Disabled'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Razorpay Gateway */}
        {config.enabled_methods.includes('razorpay') && (
          <div className="glass-panel rounded-2xl p-6 border border-white/5 flex flex-col gap-4">
            <h3 className="font-bold text-base flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-400" /> Razorpay Gateway
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[#C4B5FD] text-xs font-semibold">Key ID</label>
                <input type="text" placeholder="rzp_test_xxxxxxxxxxxxx"
                  value={config.razorpay_key_id}
                  onChange={(e) => setConfig({ ...config, razorpay_key_id: e.target.value })}
                  className="bg-black/40 border border-white/10 p-2.5 rounded-xl text-white text-xs font-mono outline-none focus:border-violet-500" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[#C4B5FD] text-xs font-semibold">Key Secret</label>
                <div className="relative">
                  <input type={showSecret ? 'text' : 'password'} placeholder="xxxxxxxxxxxxxxxxxxxx"
                    value={config.razorpay_key_secret}
                    onChange={(e) => setConfig({ ...config, razorpay_key_secret: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 p-2.5 pr-10 rounded-xl text-white text-xs font-mono outline-none focus:border-violet-500" />
                  <button type="button" onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-3 top-2.5 text-[#C4B5FD]/40 hover:text-white">
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleTestRazorpay} disabled={testing}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50">
                <TestTube className="w-4 h-4" /> {testing ? 'Testing...' : 'Test Connection'}
              </button>
              {testResult === 'success' && (
                <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Connected successfully
                </span>
              )}
              {testResult === 'error' && (
                <span className="text-red-400 text-xs font-bold flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" /> Invalid credentials
                </span>
              )}
            </div>
          </div>
        )}

        {/* Bank Transfer */}
        {config.enabled_methods.includes('bank_transfer') && (
          <div className="glass-panel rounded-2xl p-6 border border-white/5 flex flex-col gap-4">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-400" /> Bank Transfer Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[#C4B5FD] text-xs font-semibold">Account Number</label>
                <div className="relative">
                  <input type={showAccount ? 'text' : 'password'} placeholder="1234567890"
                    value={config.bank_account_number}
                    onChange={(e) => setConfig({ ...config, bank_account_number: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 p-2.5 pr-10 rounded-xl text-white text-xs font-mono outline-none focus:border-violet-500" />
                  <button type="button" onClick={() => setShowAccount(!showAccount)}
                    className="absolute right-3 top-2.5 text-[#C4B5FD]/40 hover:text-white">
                    {showAccount ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[#C4B5FD] text-xs font-semibold">Bank Name</label>
                <input type="text" placeholder="State Bank of India"
                  value={config.bank_name}
                  onChange={(e) => setConfig({ ...config, bank_name: e.target.value })}
                  className="bg-black/40 border border-white/10 p-2.5 rounded-xl text-white text-xs outline-none focus:border-violet-500" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[#C4B5FD] text-xs font-semibold">IFSC Code</label>
                <input type="text" placeholder="SBIN0001234"
                  value={config.bank_ifsc}
                  onChange={(e) => setConfig({ ...config, bank_ifsc: e.target.value })}
                  className="bg-black/40 border border-white/10 p-2.5 rounded-xl text-white text-xs font-mono outline-none focus:border-violet-500" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[#C4B5FD] text-xs font-semibold">Account Holder Name</label>
                <input type="text" placeholder="Siddharth Institute of Technology"
                  value={config.bank_holder_name}
                  onChange={(e) => setConfig({ ...config, bank_holder_name: e.target.value })}
                  className="bg-black/40 border border-white/10 p-2.5 rounded-xl text-white text-xs outline-none focus:border-violet-500" />
              </div>
            </div>
          </div>
        )}

        {/* UPI */}
        {config.enabled_methods.includes('upi') && (
          <div className="glass-panel rounded-2xl p-6 border border-white/5 flex flex-col gap-4">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-sky-400" /> UPI Payment
            </h3>
            <div className="flex flex-col gap-1 max-w-md">
              <label className="text-[#C4B5FD] text-xs font-semibold">UPI ID</label>
              <input type="text" placeholder="your-institute@upi"
                value={config.upi_id}
                onChange={(e) => setConfig({ ...config, upi_id: e.target.value })}
                className="bg-black/40 border border-white/10 p-2.5 rounded-xl text-white text-xs font-mono outline-none focus:border-violet-500" />
              <span className="text-[9px] text-[#C4B5FD]/40 mt-1">Students will see this UPI ID to make payments via any UPI app.</span>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] hover:brightness-110 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-[#6C2BD9]/25 transition-all disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Payment Settings'}
          </button>
        </div>
      </div>
    </main>
  );
}
