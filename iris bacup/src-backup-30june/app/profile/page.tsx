"use client";

import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, Building2, Crown, ArrowLeft, KeyRound, Bell, Palette } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'security' | 'preferences'>('overview');

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
  }, []);

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0D0A1A] flex items-center justify-center">
        <p className="text-slate-400">Loading profile...</p>
      </div>
    );
  }

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
          {/* Banner */}
          <div className={`h-24 bg-gradient-to-r ${getRoleColor(profile.role)} opacity-40`} />

          <div className="px-6 pb-6">
            {/* Avatar */}
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

            {/* Quick Info */}
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

        {/* Tab Content */}
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

        {activeTab === 'security' && (
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Security Settings</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <KeyRound size={16} className="text-slate-400" />
                  <div>
                    <p className="text-sm text-white font-medium">Password</p>
                    <p className="text-xs text-slate-400">Last changed: Never</p>
                  </div>
                </div>
                <button className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors">
                  Change
                </button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <Bell size={16} className="text-slate-400" />
                  <div>
                    <p className="text-sm text-white font-medium">Two-Factor Auth</p>
                    <p className="text-xs text-slate-400">Add an extra layer of security</p>
                  </div>
                </div>
                <button className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors">
                  Enable
                </button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <Shield size={16} className="text-slate-400" />
                  <div>
                    <p className="text-sm text-white font-medium">Active Sessions</p>
                    <p className="text-xs text-slate-400">Manage your login sessions</p>
                  </div>
                </div>
                <span className="text-xs text-white font-medium">1 active</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Preferences</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <Bell size={16} className="text-slate-400" />
                  <div>
                    <p className="text-sm text-white font-medium">Push Notifications</p>
                    <p className="text-xs text-slate-400">Receive push notifications</p>
                  </div>
                </div>
                <div className="w-10 h-5 bg-[#6C2BD9] rounded-full relative cursor-pointer">
                  <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <Palette size={16} className="text-slate-400" />
                  <div>
                    <p className="text-sm text-white font-medium">Theme</p>
                    <p className="text-xs text-slate-400">Interface appearance</p>
                  </div>
                </div>
                <span className="text-xs text-white font-medium">Dark</span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-slate-400" />
                  <div>
                    <p className="text-sm text-white font-medium">Email Notifications</p>
                    <p className="text-xs text-slate-400">Receive email updates</p>
                  </div>
                </div>
                <div className="w-10 h-5 bg-[#6C2BD9] rounded-full relative cursor-pointer">
                  <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
