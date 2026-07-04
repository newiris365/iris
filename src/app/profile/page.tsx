"use client";

import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, Building2, Crown, ArrowLeft, KeyRound, Bell, Palette, Loader2, X, CheckCircle, AlertCircle, Monitor, Smartphone, Globe, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'security' | 'preferences'>('overview');

  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 2FA state
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');
  const [twoFAMsg, setTwoFAMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Active sessions state
  const [sessions, setSessions] = useState<any[]>([]);
  const [showSessionsModal, setShowSessionsModal] = useState(false);

  // Preferences state
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [showThemeModal, setShowThemeModal] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('iris_user_profile');
    if (saved) {
      try {
        setProfile(JSON.parse(saved));
      } catch {
        window.location.href = '/login';
      }
    } else {
      window.location.href = '/login';
    }

    // Load 2FA status from localStorage
    const fa2Status = localStorage.getItem('iris_2fa_enabled');
    setTwoFAEnabled(fa2Status === 'true');

    // Load preferences from localStorage
    const pushPref = localStorage.getItem('iris_push_notifications');
    setPushNotifications(pushPref !== 'false');
    const emailPref = localStorage.getItem('iris_email_notifications');
    setEmailNotifications(emailPref !== 'false');
    const themePref = localStorage.getItem('iris_theme') as 'dark' | 'light' | null;
    if (themePref) setTheme(themePref);

    // Load sessions
    loadSessions();
  }, []);

  const loadSessions = () => {
    const stored = localStorage.getItem('iris_active_sessions');
    if (stored) {
      try {
        setSessions(JSON.parse(stored));
      } catch {
        initSessions();
      }
    } else {
      initSessions();
    }
  };

  const initSessions = () => {
    const currentSession = {
      id: `session_${Date.now()}`,
      device: getDeviceName(),
      browser: getBrowserName(),
      ip: 'Current Session',
      lastActive: new Date().toISOString(),
      isCurrent: true
    };
    setSessions([currentSession]);
    localStorage.setItem('iris_active_sessions', JSON.stringify([currentSession]));
  };

  const getDeviceName = () => {
    const ua = navigator.userAgent;
    if (/Windows/.test(ua)) return 'Windows PC';
    if (/Mac/.test(ua)) return 'Mac';
    if (/Linux/.test(ua)) return 'Linux PC';
    if (/Android/.test(ua)) return 'Android Device';
    if (/iPhone|iPad/.test(ua)) return 'iOS Device';
    return 'Unknown Device';
  };

  const getBrowserName = () => {
    const ua = navigator.userAgent;
    if (/Edg/.test(ua)) return 'Edge';
    if (/Chrome/.test(ua)) return 'Chrome';
    if (/Firefox/.test(ua)) return 'Firefox';
    if (/Safari/.test(ua)) return 'Safari';
    return 'Unknown Browser';
  };

  const handlePasswordChange = async () => {
    setPasswordMsg(null);
    if (!currentPassword || !newPassword) {
      setPasswordMsg({ type: 'error', text: 'Please fill in all fields.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setPasswordLoading(true);
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      // Re-authenticate with current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: currentPassword
      });

      if (signInError) {
        setPasswordMsg({ type: 'error', text: 'Current password is incorrect.' });
        setPasswordLoading(false);
        return;
      }

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

      if (updateError) {
        setPasswordMsg({ type: 'error', text: updateError.message || 'Failed to update password.' });
      } else {
        setPasswordMsg({ type: 'success', text: 'Password changed successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordMsg(null);
        }, 2000);
      }
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Something went wrong. Please try again.' });
    }
    setPasswordLoading(false);
  };

  const handleEnable2FA = async () => {
    setTwoFAMsg(null);
    if (twoFAEnabled) {
      // Disable 2FA
      if (twoFACode !== '000000') {
        setTwoFAMsg({ type: 'error', text: 'Enter 000000 to disable 2FA (demo).' });
        return;
      }
      setTwoFALoading(true);
      await new Promise(r => setTimeout(r, 1000));
      setTwoFAEnabled(false);
      localStorage.setItem('iris_2fa_enabled', 'false');
      setTwoFAMsg({ type: 'success', text: 'Two-Factor Auth disabled.' });
      setTwoFACode('');
      setTwoFALoading(false);
      setTimeout(() => { setShow2FAModal(false); setTwoFAMsg(null); }, 1500);
    } else {
      // Enable 2FA — verify code
      if (twoFACode !== '000000') {
        setTwoFAMsg({ type: 'error', text: 'Enter demo code 000000 to enable.' });
        return;
      }
      setTwoFALoading(true);
      await new Promise(r => setTimeout(r, 1000));
      setTwoFAEnabled(true);
      localStorage.setItem('iris_2fa_enabled', 'true');
      setTwoFAMsg({ type: 'success', text: 'Two-Factor Auth enabled!' });
      setTwoFACode('');
      setTwoFALoading(false);
      setTimeout(() => { setShow2FAModal(false); setTwoFAMsg(null); }, 1500);
    }
  };

  const handleRevokeSession = (sessionId: string) => {
    const updated = sessions.filter(s => s.id !== sessionId);
    setSessions(updated);
    localStorage.setItem('iris_active_sessions', JSON.stringify(updated));
  };

  const handleRevokeAllOther = () => {
    const current = sessions.find(s => s.isCurrent);
    const updated = current ? [current] : [];
    setSessions(updated);
    localStorage.setItem('iris_active_sessions', JSON.stringify(updated));
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      SuperAdmin: 'from-red-500/20 to-orange-500/20 border-red-500/30 text-red-400',
      Admin: 'from-violet-500/20 to-purple-500/20 border-violet-500/30 text-violet-400',
      Director: 'from-amber-500/20 to-yellow-500/20 border-amber-500/30 text-amber-400',
      HOD: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-cyan-400',
      Teacher: 'from-emerald-500/20 to-green-500/20 border-emerald-500/30 text-emerald-400',
      Staff: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30 text-blue-400',
      Student: 'from-violet-500/20 to-purple-500/20 border-violet-500/30 text-violet-400',
      Parent: 'from-pink-500/20 to-rose-500/20 border-pink-500/30 text-pink-400',
      Warden: 'from-orange-500/20 to-amber-500/20 border-orange-500/30 text-orange-400',
      Security: 'from-slate-500/20 to-gray-500/20 border-slate-500/30 text-slate-400',
      Vendor: 'from-teal-500/20 to-cyan-500/20 border-teal-500/30 text-teal-400',
      Driver: 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30 text-yellow-400',
    };
    return colors[role] || 'from-violet-500/20 to-purple-500/20 border-violet-500/30 text-violet-400';
  };

  const getRoleDashboard = (role: string) => {
    const dashboards: Record<string, string> = {
      SuperAdmin: '/admin/global',
      Admin: '/admin/dashboard',
      Director: '/director/dashboard',
      HOD: '/hod/dashboard',
      Teacher: '/teacher/attendance',
      Staff: '/faculty/dashboard',
      Student: '/student/dashboard',
      Parent: '/parent/dashboard',
      Warden: '/warden/dashboard',
      Security: '/security/dashboard',
      Vendor: '/vendor/dashboard',
      Driver: '/driver/dashboard',
    };
    return dashboards[role] || '/dashboard';
  };

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: User },
    { id: 'security' as const, label: 'Security', icon: KeyRound },
    { id: 'preferences' as const, label: 'Preferences', icon: Palette },
  ];

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0D0A1A] flex items-center justify-center">
        <p className="text-slate-400">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0A1A] p-4 lg:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href={getRoleDashboard(profile.role)}
            className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">My Profile</h1>
            <p className="text-sm text-slate-400">Manage your account settings</p>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
          <div className={`h-24 bg-gradient-to-r ${getRoleColor(profile.role)} opacity-40`} />
          <div className="px-6 pb-6">
            <div className="-mt-10 mb-4 flex items-end gap-4">
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${getRoleColor(profile.role)} flex items-center justify-center text-2xl font-extrabold text-white border-4 border-[#0D0A1A] shadow-xl`}>
                {profile.name?.charAt(0) || 'U'}
              </div>
              <div className="pb-1">
                <h2 className="text-xl font-bold text-white">{profile.name}</h2>
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r ${getRoleColor(profile.role)}`}>
                  <Shield size={10} />
                  {profile.role}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                <Mail size={16} className="text-slate-400" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Email</p>
                  <p className="text-sm text-white">{profile.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                <Building2 size={16} className="text-slate-400" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Institution</p>
                  <p className="text-sm text-white truncate">{profile.institution_name || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                <Crown size={16} className="text-slate-400" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Plan</p>
                  <p className="text-sm text-white">{profile.plan_tier || 'Standard'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                <User size={16} className="text-slate-400" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">User ID</p>
                  <p className="text-sm text-white font-mono text-xs">{profile.id?.slice(0, 8)}...</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${activeTab === tab.id ? 'bg-[#6C2BD9]/20 text-white border border-[#6C2BD9]/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Account Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-sm text-slate-400">Full Name</span>
                <span className="text-sm text-white font-medium">{profile.name}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-sm text-slate-400">Email Address</span>
                <span className="text-sm text-white font-medium">{profile.email}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-sm text-slate-400">Role</span>
                <span className="text-sm text-white font-medium">{profile.role}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-sm text-slate-400">Institution</span>
                <span className="text-sm text-white font-medium">{profile.institution_name || '—'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-sm text-slate-400">Plan Tier</span>
                <span className="text-sm text-white font-medium">{profile.plan_tier || 'Standard'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-slate-400">Account Status</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">Active</span>
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Security Settings</h3>
            <div className="space-y-3">
              {/* Password */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <KeyRound size={16} className="text-slate-400" />
                  <div>
                    <p className="text-sm text-white font-medium">Password</p>
                    <p className="text-xs text-slate-400">Last changed: Never</p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowPasswordModal(true); setPasswordMsg(null); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }}
                  className="text-xs px-3 py-1.5 rounded-lg bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 text-[#A78BFA] hover:bg-[#6C2BD9]/30 transition-colors font-medium"
                >
                  Change
                </button>
              </div>

              {/* Two-Factor Auth */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <Bell size={16} className="text-slate-400" />
                  <div>
                    <p className="text-sm text-white font-medium">Two-Factor Auth</p>
                    <p className="text-xs text-slate-400">
                      {twoFAEnabled ? 'Enabled — extra layer of security active' : 'Add an extra layer of security'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setShow2FAModal(true); setTwoFAMsg(null); setTwoFACode(''); }}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium ${
                    twoFAEnabled
                      ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30'
                      : 'bg-[#6C2BD9]/20 border-[#6C2BD9]/30 text-[#A78BFA] hover:bg-[#6C2BD9]/30'
                  }`}
                >
                  {twoFAEnabled ? 'Enabled' : 'Enable'}
                </button>
              </div>

              {/* Active Sessions */}
              <div
                onClick={() => { loadSessions(); setShowSessionsModal(true); }}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/[0.07] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Shield size={16} className="text-slate-400" />
                  <div>
                    <p className="text-sm text-white font-medium">Active Sessions</p>
                    <p className="text-xs text-slate-400">Manage your login sessions</p>
                  </div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">
                  {sessions.length} active
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Preferences</h3>
            <div className="space-y-3">
              {/* Push Notifications Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <Bell size={16} className="text-slate-400" />
                  <div>
                    <p className="text-sm text-white font-medium">Push Notifications</p>
                    <p className="text-xs text-slate-400">Receive push notifications</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const newVal = !pushNotifications;
                    setPushNotifications(newVal);
                    localStorage.setItem('iris_push_notifications', String(newVal));
                  }}
                  className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${
                    pushNotifications ? 'bg-[#6C2BD9]' : 'bg-white/10'
                  }`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                    pushNotifications ? 'right-0.5' : 'left-0.5'
                  }`} />
                </button>
              </div>

              {/* Theme Selector */}
              <div
                onClick={() => setShowThemeModal(true)}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/[0.07] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Palette size={16} className="text-slate-400" />
                  <div>
                    <p className="text-sm text-white font-medium">Theme</p>
                    <p className="text-xs text-slate-400">Interface appearance</p>
                  </div>
                </div>
                <span className="text-xs text-white font-medium capitalize">{theme}</span>
              </div>

              {/* Email Notifications Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-slate-400" />
                  <div>
                    <p className="text-sm text-white font-medium">Email Notifications</p>
                    <p className="text-xs text-slate-400">Receive email updates</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const newVal = !emailNotifications;
                    setEmailNotifications(newVal);
                    localStorage.setItem('iris_email_notifications', String(newVal));
                  }}
                  className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${
                    emailNotifications ? 'bg-[#6C2BD9]' : 'bg-white/10'
                  }`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                    emailNotifications ? 'right-0.5' : 'left-0.5'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════ PASSWORD MODAL ═══════════════════════ */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#13102A] border border-[#6C2BD9]/30 rounded-2xl p-6 shadow-2xl relative">
            <button onClick={() => setShowPasswordModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X size={16} />
            </button>
            <h3 className="font-heading font-bold text-base text-white mb-1">Change Password</h3>
            <p className="text-xs text-slate-400 mb-5">Enter your current password and choose a new one.</p>

            {passwordMsg && (
              <div className={`mb-4 p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                passwordMsg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'
              }`}>
                {passwordMsg.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                {passwordMsg.text}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-[#6C2BD9]"
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-[#6C2BD9]"
                  placeholder="Min 6 characters"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handlePasswordChange()}
                  className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-[#6C2BD9]"
                  placeholder="Re-enter new password"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowPasswordModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-white text-xs font-bold hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button
                onClick={handlePasswordChange}
                disabled={passwordLoading}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] hover:brightness-110 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                {passwordLoading ? <><Loader2 size={12} className="animate-spin" /> Updating...</> : 'Update Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════ 2FA MODAL ═══════════════════════ */}
      {show2FAModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#13102A] border border-[#6C2BD9]/30 rounded-2xl p-6 shadow-2xl relative">
            <button onClick={() => setShow2FAModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X size={16} />
            </button>
            <h3 className="font-heading font-bold text-base text-white mb-1">
              {twoFAEnabled ? 'Two-Factor Authentication' : 'Enable Two-Factor Auth'}
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              {twoFAEnabled
                ? 'Your account is protected with 2FA. You can disable it below.'
                : 'Scan the QR code with your authenticator app, then enter the 6-digit code.'}
            </p>

            {!twoFAEnabled && (
              <div className="mb-4 p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <div className="w-32 h-32 bg-white rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <div className="grid grid-cols-5 gap-0.5 mb-2">
                      {Array.from({ length: 25 }).map((_, i) => (
                        <div key={i} className={`w-4 h-4 ${Math.random() > 0.4 ? 'bg-black' : 'bg-white'}`} />
                      ))}
                    </div>
                    <p className="text-[8px] text-gray-500 font-mono">IRIS 2FA</p>
                  </div>
                </div>
              </div>
            )}

            {twoFAMsg && (
              <div className={`mb-4 p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                twoFAMsg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'
              }`}>
                {twoFAMsg.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                {twoFAMsg.text}
              </div>
            )}

            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                {twoFAEnabled ? 'Enter 000000 to disable' : 'Enter 6-digit code'}
              </label>
              <input
                type="text"
                value={twoFACode}
                onChange={e => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={e => e.key === 'Enter' && handleEnable2FA()}
                className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-[#6C2BD9] text-center tracking-[0.3em] font-mono"
                placeholder="000000"
                maxLength={6}
              />
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShow2FAModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-white text-xs font-bold hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleEnable2FA}
                disabled={twoFALoading || twoFACode.length !== 6}
                className={`flex-1 py-2.5 rounded-xl hover:brightness-110 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  twoFAEnabled
                    ? 'bg-red-500/80 hover:bg-red-500'
                    : 'bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6]'
                }`}
              >
                {twoFALoading ? <><Loader2 size={12} className="animate-spin" /> Processing...</> : twoFAEnabled ? 'Disable 2FA' : 'Enable 2FA'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════ SESSIONS MODAL ═══════════════════════ */}
      {showSessionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#13102A] border border-[#6C2BD9]/30 rounded-2xl p-6 shadow-2xl relative max-h-[80vh] overflow-hidden flex flex-col">
            <button onClick={() => setShowSessionsModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X size={16} />
            </button>
            <h3 className="font-heading font-bold text-base text-white mb-1">Active Sessions</h3>
            <p className="text-xs text-slate-400 mb-4">Manage your login sessions across devices.</p>

            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              {sessions.map((session) => (
                <div key={session.id} className={`p-3 rounded-xl border flex items-start gap-3 ${
                  session.isCurrent ? 'bg-[#6C2BD9]/10 border-[#6C2BD9]/30' : 'bg-white/5 border-white/5'
                }`}>
                  <div className={`p-2 rounded-lg ${session.isCurrent ? 'bg-[#6C2BD9]/20' : 'bg-white/5'}`}>
                    {session.device.includes('Android') || session.device.includes('iOS')
                      ? <Smartphone size={14} className="text-slate-400" />
                      : <Monitor size={14} className="text-slate-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-white font-medium truncate">{session.device}</p>
                      {session.isCurrent && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">Current</span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400">{session.browser} · {session.ip}</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">
                      Last active: {new Date(session.lastActive).toLocaleString()}
                    </p>
                  </div>
                  {!session.isCurrent && (
                    <button
                      onClick={() => handleRevokeSession(session.id)}
                      className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
                      title="Revoke session"
                    >
                      <LogOut size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {sessions.filter(s => !s.isCurrent).length > 0 && (
              <button
                onClick={handleRevokeAllOther}
                className="w-full py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-colors"
              >
                Sign out all other sessions
              </button>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════ THEME MODAL ═══════════════════════ */}
      {showThemeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#13102A] border border-[#6C2BD9]/30 rounded-2xl p-6 shadow-2xl relative">
            <button onClick={() => setShowThemeModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X size={16} />
            </button>
            <h3 className="font-heading font-bold text-base text-white mb-1">Select Theme</h3>
            <p className="text-xs text-slate-400 mb-5">Choose your preferred interface appearance.</p>

            <div className="space-y-2">
              {(['dark', 'light'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setTheme(t);
                    localStorage.setItem('iris_theme', t);
                    setShowThemeModal(false);
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                    theme === t
                      ? 'bg-[#6C2BD9]/15 border-[#6C2BD9]/40 text-white'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/[0.07]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      theme === t ? 'border-[#6C2BD9] bg-[#6C2BD9]' : 'border-white/20'
                    }`}>
                      {theme === t && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <span className="text-sm font-medium capitalize">{t} Mode</span>
                  </div>
                  <div className={`w-12 h-7 rounded-lg border ${
                    t === 'dark' ? 'bg-[#0D0A1A] border-white/10' : 'bg-gray-100 border-gray-300'
                  }`}>
                    <div className={`w-3 h-3 rounded-full mt-1.5 ml-1.5 ${
                      t === 'dark' ? 'bg-[#8B5CF6]' : 'bg-yellow-400'
                    }`} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
