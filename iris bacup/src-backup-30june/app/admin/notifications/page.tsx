"use client";

import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, RefreshCw, AlertTriangle, Megaphone, Wrench, Sparkles, FileText, Shield } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  'General Update': { icon: Megaphone, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  'Maintenance Alert': { icon: Wrench, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  'New Feature': { icon: Sparkles, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  'Policy Change': { icon: FileText, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
  'Urgent': { icon: Shield, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
};

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { loadNotifications(); }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const profile = JSON.parse(localStorage.getItem('iris_user_profile') || '{}');
      const userId = profile.id;
      if (!userId) return;

      // Get notifications from superadmin_notifications table
      const { data: allNotifs, error: notifErr } = await supabase
        .from('superadmin_notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (notifErr) throw notifErr;

      // Get read status for this user
      const { data: readStatus } = await supabase
        .from('superadmin_notification_reads')
        .select('notification_id, is_read')
        .eq('user_id', userId);

      const readMap = new Map((readStatus || []).map((r: any) => [r.notification_id, r.is_read]));

      const merged: Notification[] = (allNotifs || []).map((n: any) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        type: n.type || 'General Update',
        is_read: readMap.get(n.id) || false,
        created_at: n.created_at,
      }));

      setNotifications(merged);
    } catch (err) {
      console.warn('Failed to load notifications:', err);
      // Fallback mock
      setNotifications([
        { id: '1', title: 'System Maintenance Notice', body: 'IRIS 365 will undergo scheduled maintenance on Sunday, June 22nd from 2:00 AM to 5:00 AM IST. All services will be temporarily unavailable.', type: 'Maintenance Alert', is_read: false, created_at: '2026-06-15T10:00:00Z' },
        { id: '2', title: 'New Feature: AI Concierge', body: 'We are excited to announce the launch of AI Concierge — an intelligent chatbot for student queries. It is now available for all institutions on Campus plan and above.', type: 'New Feature', is_read: true, created_at: '2026-06-12T14:30:00Z' },
        { id: '3', title: 'Updated Privacy Policy', body: 'Please review the updated privacy policy effective July 1st. Key changes include data retention policies and student consent requirements.', type: 'Policy Change', is_read: true, created_at: '2026-06-10T09:00:00Z' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (notifId: string) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
    try {
      const profile = JSON.parse(localStorage.getItem('iris_user_profile') || '{}');
      const userId = profile.id;
      if (userId) {
        await supabase.from('superadmin_notification_reads').upsert({
          notification_id: notifId,
          user_id: userId,
          is_read: true,
          read_at: new Date().toISOString(),
        }, { onConflict: 'notification_id,user_id' });
      }
    } catch {}
  };

  const handleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      const notif = notifications.find(n => n.id === id);
      if (notif && !notif.is_read) markAsRead(id);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">

        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 flex items-center justify-center text-[#A78BFA] relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h1 className="font-heading font-extrabold text-2xl text-white">Notifications</h1>
              <p className="text-xs text-[#C4B5FD]/70 font-light">
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''} from SuperAdmin` : 'All caught up!'}
              </p>
            </div>
          </div>
          <button onClick={handleRefresh}
            className="flex items-center gap-1 bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl text-xs border border-white/10 transition-all">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {/* Notification List */}
        {loading ? (
          <div className="text-center py-20 text-[#C4B5FD]/40 text-xs">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center">
            <Bell className="w-12 h-12 text-[#C4B5FD]/20 mx-auto mb-3" />
            <h3 className="font-bold text-white mb-1">No Notifications</h3>
            <p className="text-xs text-[#C4B5FD]/50">You&apos;re all caught up! SuperAdmin announcements will appear here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {notifications.map(n => {
              const config = TYPE_CONFIG[n.type] || TYPE_CONFIG['General Update'];
              const Icon = config.icon;
              const isExpanded = expandedId === n.id;

              return (
                <div
                  key={n.id}
                  onClick={() => handleExpand(n.id)}
                  className={`glass-panel rounded-2xl border cursor-pointer transition-all ${
                    n.is_read
                      ? 'border-white/5 hover:border-white/10'
                      : 'border-violet-500/30 bg-violet-500/5 hover:border-violet-500/50'
                  }`}
                >
                  <div className="p-5 flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${config.bg}`}>
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`font-bold text-sm ${n.is_read ? 'text-white/70' : 'text-white'}`}>{n.title}</h3>
                        {!n.is_read && (
                          <span className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0" />
                        )}
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${config.bg} ${config.color}`}>
                          {n.type}
                        </span>
                      </div>
                      <p className={`text-[11px] mt-1 ${n.is_read ? 'text-[#C4B5FD]/40' : 'text-[#C4B5FD]/60'} ${isExpanded ? '' : 'line-clamp-2'}`}>
                        {n.body}
                      </p>
                      <span className="text-[9px] text-[#C4B5FD]/30 mt-2 block">
                        {new Date(n.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
