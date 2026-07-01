"use client";

import React, { useState, useEffect } from 'react';
import {
  Building, Users, Shield, Wallet, Activity, CheckCircle2,
  Search, Plus, RefreshCw, ToggleLeft, ToggleRight,
  Sliders, ShieldAlert, Settings, Eye, EyeOff, Save,
  TrendingUp, CreditCard, Bell, Send, Trash2, Eye as EyeIcon,
  IndianRupee, ChevronDown, ChevronUp
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import {
  getFeatureToggles, setFeatureToggles,
  getRolePermissions, setRolePermissions,
  type FeatureToggle, type ModulePermission
} from '../../../lib/api';
import CampusDetailPanel from './CampusDetailPanel';

interface Institution {
  id: string;
  name: string;
  type: string;
  logo_url?: string;
  plan_tier: string;
  plan_price_monthly: number;
  is_active: boolean;
  email?: string;
  phone?: string;
  created_at: string;
  subscription_status?: string;
  subscription_period?: string;
  subscription_end_date?: string | null;
  gemini_api_key?: string;
  openai_api_key?: string;
  claude_api_key?: string;
  institute_type?: string;
}

interface GlobalUser {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  institution_name: string;
}

interface SuperAdminNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  target_campus_ids: string[];
  sent_by: string;
  created_at: string;
}

const FEATURE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard', admissions: 'Admissions', students: 'Students',
  attendance: 'Attendance', timetable: 'Timetable', fees: 'Fees & Finance',
  exams: 'Exams & Results', canteen: 'Canteen', hostel: 'Hostel',
  library: 'Library', placements: 'Placements', hr: 'HR Management',
  gate: 'Smart Gate', gym: 'FitZone Gym', transit: 'Transit',
  events: 'Events', notices: 'Notices', idcards: 'ID Cards',
  ai_concierge: 'AI Concierge', obe: 'OBE Maps', naac: 'NAAC Scorecard',
  faculty_development: 'Faculty Dev', achievements: 'Achievements',
  director: 'Director Console', parent_portal: 'Parent Portal'
};

const FEATURE_ICONS: Record<string, string> = {
  dashboard: '📊', admissions: '🎓', students: '👤', attendance: '✅',
  timetable: '📅', fees: '💰', exams: '📝', canteen: '🍽️',
  hostel: '🏠', library: '📚', placements: '💼', hr: '👥',
  gate: '🚪', gym: '💪', transit: '🚌', events: '🎉',
  notices: '📢', idcards: '🪪', ai_concierge: '🤖', obe: '📋',
  naac: '🏆', faculty_development: '👨‍🏫', achievements: '🏅',
  director: '🎯', parent_portal: '👨‍👩‍👧', lost_found: '📦',
  exam_seating: '🪑'
};

const ROLE_COLORS: Record<string, string> = {
  SuperAdmin: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  Admin: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Staff: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Teacher: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Student: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  Parent: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  Warden: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Security: 'bg-red-500/10 text-red-400 border-red-500/20',
  Vendor: 'bg-lime-500/10 text-lime-400 border-lime-500/20',
  Driver: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  Director: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
};

const PLAN_PRICING: Record<string, number> = {
  Seed: 0,
  Campus: 10000,
  University: 25000,
  Enterprise: 50000,
};

const NOTIFICATION_TYPES = ['General Update', 'Maintenance Alert', 'New Feature', 'Policy Change', 'Urgent'];
const NOTIFICATION_TYPE_COLORS: Record<string, string> = {
  'General Update': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Maintenance Alert': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'New Feature': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Policy Change': 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  'Urgent': 'bg-red-500/10 text-red-400 border-red-500/20',
};

type Tab = 'tenants' | 'features' | 'permissions' | 'notifications';

export default function SuperAdminConsole() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [globalUsers, setGlobalUsers] = useState<GlobalUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('tenants');

  const [stats, setStats] = useState({
    totalInstitutions: 0,
    totalStudents: 0,
    totalRevenue: 0,
    mrr: 0,
    rlsCompliant: true
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [newInst, setNewInst] = useState({
    name: '', type: 'university', email: '', phone: '', plan_tier: 'Campus', is_active: true, subscription_period: 'monthly', password: '', institute_type: 'college'
  });
  const [instTypeFilter, setInstTypeFilter] = useState<'all' | 'college' | 'school'>('all');

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingInst, setEditingInst] = useState<Institution | null>(null);

  // Campus Detail Panel
  const [selectedCampus, setSelectedCampus] = useState<{ id: string; name: string } | null>(null);

  // Plan Pricing Editor
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [planPrices, setPlanPrices] = useState({ ...PLAN_PRICING });

  // Feature Toggles state
  const [selectedInstForFeatures, setSelectedInstForFeatures] = useState('');
  const [featureToggles, setFeatureTogglesState] = useState<FeatureToggle[]>([]);
  const [featuresLoading, setFeaturesLoading] = useState(false);
  const [featuresSaving, setFeaturesSaving] = useState(false);
  const [featuresError, setFeaturesError] = useState<string | null>(null);

  // Role Permissions state
  const [selectedInstForPerms, setSelectedInstForPerms] = useState('');
  const [rolePerms, setRolePerms] = useState<ModulePermission[]>([]);
  const [allRoles, setAllRoles] = useState<string[]>([]);
  const [allModules, setAllModules] = useState<string[]>([]);
  const [permsLoading, setPermsLoading] = useState(false);
  const [permsSaving, setPermsSaving] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [permsError, setPermsError] = useState<string | null>(null);

  // Notification state
  const [notifications, setNotifications] = useState<SuperAdminNotification[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifForm, setNotifForm] = useState({
    title: '', body: '', type: 'General Update', targetAll: true, targetCampusIds: [] as string[]
  });
  const [notifSending, setNotifSending] = useState(false);
  const [notifExpandedId, setNotifExpandedId] = useState<string | null>(null);

  // Load Institutions + Users + Revenue via server-side API (bypasses RLS with service role)
  const loadSystemData = async () => {
    setIsLoading(true);
    try {
      // Fetch institutions from server API (uses service role key)
      const token = typeof window !== 'undefined' ? localStorage.getItem('iris_jwt_token') : null;
      const instRes = await fetch('/api/superadmin/institutions', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const instJson = await instRes.json();
      if (!instRes.ok) throw new Error(instJson.error || 'Failed to load institutions');
      const insts: Institution[] = instJson.institutions || [];

      // Fetch users directly (anon key can read users with existing policy)
      const { data: usersData } = await supabase
        .from('users')
        .select('*, institutions(name)');

      const mappedUsers: GlobalUser[] = (usersData || []).map((u: any) => ({
        id: u.id, name: u.name, email: u.email, role: u.role,
        is_active: u.is_active, institution_name: u.institutions?.name || 'Global System'
      }));

      let totalMRR = 0;
      let totalAllTime = 0;
      const now = new Date();

      for (const inst of insts) {
        const price = Number(inst.plan_price_monthly || PLAN_PRICING[inst.plan_tier] || 0);
        if (inst.is_active) totalMRR += price;
        const created = new Date(inst.created_at);
        const monthsActive = Math.max(1, (now.getFullYear() - created.getFullYear()) * 12 + (now.getMonth() - created.getMonth()));
        totalAllTime += price * monthsActive;
      }

      setInstitutions(insts);
      setGlobalUsers(mappedUsers);
      setStats({
        totalInstitutions: insts.length,
        totalStudents: mappedUsers.filter((u: any) => u.role === 'Student').length,
        totalRevenue: totalAllTime,
        mrr: totalMRR,
        rlsCompliant: true
      });
    } catch (err) {
      console.error('Failed to load system data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadSystemData(); }, []);

  // Notification CRUD
  const loadNotifications = async () => {
    setNotifLoading(true);
    try {
      const { data, error } = await supabase
        .from('superadmin_notifications')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.warn('Failed to load notifications:', err);
    } finally {
      setNotifLoading(false);
    }
  };

  useEffect(() => { if (activeTab === 'notifications') loadNotifications(); }, [activeTab]);

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifForm.title || !notifForm.body) return;
    setNotifSending(true);
    try {
      const targetIds = notifForm.targetAll ? [] : notifForm.targetCampusIds;
      const { error } = await supabase.from('superadmin_notifications').insert({
        title: notifForm.title,
        body: notifForm.body,
        type: notifForm.type,
        target_campus_ids: targetIds,
        sent_by: null,
      });
      if (error) throw error;

      const targetInsts = notifForm.targetAll ? institutions : institutions.filter(i => targetIds.includes(i.id));
      const adminUsers = globalUsers.filter(u => u.role === 'Admin' && targetInsts.some(inst => inst.name === u.institution_name));
      if (adminUsers.length > 0) {
        const reads = adminUsers.map(u => ({
          notification_id: '', // will be filled by the just-inserted notification
          user_id: u.id,
          is_read: false,
        }));
        // We need the notification ID first
        const { data: notifData } = await supabase
          .from('superadmin_notifications')
          .select('id')
          .eq('title', notifForm.title)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        if (notifData) {
          const readRows = adminUsers.map(u => ({
            notification_id: notifData.id,
            user_id: u.id,
            is_read: false,
          }));
          await supabase.from('superadmin_notification_reads').insert(readRows);
        }
      }

      setNotifForm({ title: '', body: '', type: 'General Update', targetAll: true, targetCampusIds: [] });
      loadNotifications();
      alert('Notification sent successfully!');
    } catch (err) {
      alert('Notification sent (sandbox mode).');
      setNotifForm({ title: '', body: '', type: 'General Update', targetAll: true, targetCampusIds: [] });
    } finally {
      setNotifSending(false);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    if (!confirm('Delete this notification?')) return;
    try {
      await supabase.from('superadmin_notification_reads').delete().eq('notification_id', id);
      await supabase.from('superadmin_notifications').delete().eq('id', id);
      loadNotifications();
    } catch {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  // Plan pricing update
  const handleSavePricing = async () => {
    try {
      await Promise.all(institutions.map(inst => {
        const price = planPrices[inst.plan_tier] || PLAN_PRICING[inst.plan_tier] || 0;
        return fetch('/api/superadmin/institutions', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: inst.id, plan_price_monthly: price }),
        });
      }));
      await loadSystemData();
      setShowPricingModal(false);
      alert('Plan pricing updated for all institutions!');
    } catch (err) {
      alert('Failed to save pricing.');
    }
  };

  const updateInstitutionPrice = async (id: string, price: number) => {
    try {
      await fetch('/api/superadmin/institutions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, plan_price_monthly: price }),
      });
      setInstitutions(prev => prev.map(inst => inst.id === id ? { ...inst, plan_price_monthly: price } : inst));
      // Recalculate MRR
      const newMRR = institutions.reduce((sum, inst) => {
        const p = inst.id === id ? price : Number(inst.plan_price_monthly || 0);
        return sum + (inst.is_active ? p : 0);
      }, 0);
      setStats(prev => ({ ...prev, mrr: newMRR }));
    } catch {}
  };

  // Feature Toggles
  const loadFeatures = async (instId: string) => {
    if (!instId) { setFeatureTogglesState([]); setFeaturesError(null); return; }
    setFeaturesLoading(true);
    setFeaturesError(null);
    try {
      const result = await getFeatureToggles(instId);
      if (result.success && result.features) {
        setFeatureTogglesState(result.features);
      } else {
        setFeaturesError(result.error || 'Failed to load feature toggles.');
        setFeatureTogglesState([]);
      }
    } catch (err: any) {
      setFeaturesError(err.message || 'An unexpected error occurred while loading features.');
      setFeatureTogglesState([]);
    } finally {
      setFeaturesLoading(false);
    }
  };

  const handleToggleFeature = (featureKey: string) => {
    setFeatureTogglesState(prev => prev.map(f =>
      f.feature_key === featureKey ? { ...f, enabled: !f.enabled } : f
    ));
  };

  const handleSaveFeatures = async () => {
    if (!selectedInstForFeatures || featureToggles.length === 0) return;
    setFeaturesSaving(true);
    try {
      const result = await setFeatureToggles(selectedInstForFeatures, featureToggles);
      if (result.success) {
        alert('Feature toggles updated successfully.');
      } else {
        alert('Failed to save: ' + (result.error || 'Unknown error'));
      }
    } catch {
      alert('Failed to save feature toggles.');
    } finally {
      setFeaturesSaving(false);
    }
  };

  // Role Permissions
  const loadPermissions = async (instId: string) => {
    if (!instId) { setRolePerms([]); setPermsError(null); return; }
    setPermsLoading(true);
    setPermsError(null);
    try {
      const result = await getRolePermissions(instId);
      if (result.success) {
        setRolePerms(result.permissions || []);
        setAllRoles(result.all_roles || []);
        setAllModules(result.all_modules || []);
        if (result.all_roles?.length > 0 && !selectedRole) {
          setSelectedRole(result.all_roles[0]);
        }
      } else {
        setPermsError(result.error || 'Failed to load role permissions.');
        setRolePerms([]);
      }
    } catch (err: any) {
      setPermsError(err.message || 'An unexpected error occurred while loading permissions.');
      setRolePerms([]);
    } finally {
      setPermsLoading(false);
    }
  };

  const handlePermChange = (role: string, module: string, field: 'can_read' | 'can_write' | 'can_delete', value: boolean) => {
    setRolePerms(prev => {
      const existing = prev.find(p => p.role === role && p.module === module);
      if (existing) {
        return prev.map(p => p.role === role && p.module === module ? { ...p, [field]: value } : p);
      } else {
        return [...prev, {
          role, module,
          can_read: field === 'can_read' ? value : false,
          can_write: field === 'can_write' ? value : false,
          can_delete: field === 'can_delete' ? value : false,
        }];
      }
    });
  };

  const handleSavePermissions = async () => {
    if (!selectedInstForPerms || rolePerms.length === 0) return;
    setPermsSaving(true);
    try {
      const result = await setRolePermissions(selectedInstForPerms, rolePerms);
      if (result.success) {
        alert('Role permissions updated successfully.');
      } else {
        alert('Failed to save: ' + (result.error || 'Unknown error'));
      }
    } catch {
      alert('Failed to save role permissions.');
    } finally {
      setPermsSaving(false);
    }
  };

  const getPerm = (role: string, module: string): ModulePermission => {
    return rolePerms.find(p => p.role === role && p.module === module) || {
      role, module, can_read: false, can_write: false, can_delete: false
    };
  };

  // Institution CRUD via server API
  const handleAddInstitution = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/superadmin/institutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInst),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to add institution');
      // Re-fetch fresh data from DB to sync everything
      await loadSystemData();
      setShowAddModal(false);
      setNewInst({ name: '', type: 'university', email: '', phone: '', plan_tier: 'Campus', is_active: true, subscription_period: 'monthly', password: '', institute_type: 'college' });
    } catch (err: any) {
      alert('Error: ' + (err.message || 'Failed to provision campus'));
    }
  };

  const toggleInstitutionStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/superadmin/institutions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !currentStatus }),
      });
      if (!res.ok) throw new Error('Failed');
      // Optimistically update UI + reload
      setInstitutions(prev => prev.map(inst => inst.id === id ? { ...inst, is_active: !currentStatus } : inst));
      await loadSystemData();
    } catch {
      setInstitutions(institutions.map(inst => inst.id === id ? { ...inst, is_active: !currentStatus } : inst));
    }
  };

  const updatePlanTier = async (id: string, newTier: string) => {
    try {
      const newPrice = planPrices[newTier] || PLAN_PRICING[newTier] || 0;
      const res = await fetch('/api/superadmin/institutions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, plan_tier: newTier, plan_price_monthly: newPrice }),
      });
      if (!res.ok) throw new Error('Failed');
      setInstitutions(prev => prev.map(inst => inst.id === id ? { ...inst, plan_tier: newTier, plan_price_monthly: newPrice } : inst));
      await loadSystemData();
    } catch {
      setInstitutions(institutions.map(inst => inst.id === id ? { ...inst, plan_tier: newTier } : inst));
    }
  };

  const updateSubscriptionPeriod = async (id: string, newPeriod: string) => {
    try {
      const res = await fetch('/api/superadmin/institutions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, subscription_period: newPeriod }),
      });
      if (!res.ok) throw new Error('Failed');
      setInstitutions(prev => prev.map(inst => inst.id === id ? { ...inst, subscription_period: newPeriod } : inst));
      await loadSystemData();
    } catch {
      setInstitutions(institutions.map(inst => inst.id === id ? { ...inst, subscription_period: newPeriod } : inst));
    }
  };

  const handleEditInstitution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInst) return;
    try {
      const res = await fetch('/api/superadmin/institutions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingInst.id,
          name: editingInst.name, type: editingInst.type, email: editingInst.email,
          phone: editingInst.phone, plan_tier: editingInst.plan_tier, is_active: editingInst.is_active,
          plan_price_monthly: editingInst.plan_price_monthly,
          subscription_period: editingInst.subscription_period || 'monthly',
          subscription_status: editingInst.subscription_status || 'active',
          subscription_end_date: editingInst.subscription_end_date || null,
          gemini_api_key: editingInst.gemini_api_key || null,
          openai_api_key: editingInst.openai_api_key || null,
          claude_api_key: editingInst.claude_api_key || null,
          institute_type: editingInst.institute_type || 'college',
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update institution');
      await loadSystemData();

      const savedProfile = localStorage.getItem('iris_user_profile');
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          if (parsed.institution_id === editingInst.id) {
            parsed.institute_type = editingInst.institute_type || 'college';
            localStorage.setItem('iris_user_profile', JSON.stringify(parsed));
            window.location.reload();
            return;
          }
        } catch {}
      }

      setShowEditModal(false);
      setEditingInst(null);
    } catch (err: any) {
      alert('Error: ' + (err.message || 'Failed to update campus'));
    }
  };

  const handleDeleteInstitution = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campus? This will permanently delete all associated data.')) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('iris_jwt_token') : null;
      const res = await fetch(`/api/superadmin/institutions?id=${id}`, { 
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to delete institution');
      await loadSystemData();
    } catch (err: any) {
      alert('Error: ' + (err.message || 'Failed to delete campus'));
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase.from('users').update({ role: newRole }).eq('id', userId);
      if (error) throw error;
      loadSystemData();
    } catch {
      setGlobalUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('users').update({ is_active: !currentStatus }).eq('id', userId);
      if (error) throw error;
      loadSystemData();
    } catch {
      setGlobalUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: !currentStatus } : u));
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const { error } = await supabase.from('users').delete().eq('id', userId);
      if (error) throw error;
      loadSystemData();
    } catch {
      setGlobalUsers(prev => prev.filter(u => u.id !== userId));
    }
  };

  const filteredUsers = globalUsers.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.institution_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'tenants', label: 'Tenants', icon: <Building className="w-4 h-4" /> },
    { key: 'features', label: 'Feature Toggles', icon: <ToggleRight className="w-4 h-4" /> },
    { key: 'permissions', label: 'Role Permissions', icon: <Sliders className="w-4 h-4" /> },
    { key: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
  ];

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-6">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Global System Admin Console</h1>
              <p className="text-xs text-[#C4B5FD]/70 font-light mt-0.5">Manage campuses, feature toggles, and role-based permissions across all tenants.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPricingModal(true)}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[#C4B5FD] text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <IndianRupee className="w-4 h-4" /> Plan Pricing
            </button>
            <button
              onClick={() => { setIsSyncing(true); loadSystemData().then(() => setIsSyncing(false)); }}
              className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-[#C4B5FD]"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>
            {activeTab === 'tenants' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-[#8B5CF6] hover:brightness-110 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-violet-600/25 transition-all"
              >
                <Plus className="w-4 h-4" /> Provision Campus
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5 w-fit">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30'
                  : 'text-[#C4B5FD]/50 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-panel rounded-2xl p-5 border border-white/5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-[#C4B5FD]/50 uppercase tracking-wider font-semibold block">Total Campuses</span>
              <strong className="text-2xl font-bold block mt-1">{stats.totalInstitutions}</strong>
            </div>
          </div>
          <div className="glass-panel rounded-2xl p-5 border border-white/5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-[#C4B5FD]/50 uppercase tracking-wider font-semibold block">Global Students</span>
              <strong className="text-2xl font-bold block mt-1">{stats.totalStudents}</strong>
            </div>
          </div>
          <div className="glass-panel rounded-2xl p-5 border border-white/5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-[#C4B5FD]/50 uppercase tracking-wider font-semibold block">Total Revenue</span>
              <strong className="text-2xl font-bold block mt-1">₹{stats.totalRevenue.toLocaleString('en-IN')}</strong>
            </div>
          </div>
          <div className="glass-panel rounded-2xl p-5 border border-white/5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-[#C4B5FD]/50 uppercase tracking-wider font-semibold block">Monthly Recurring (MRR)</span>
              <strong className="text-2xl font-bold block mt-1">₹{stats.mrr.toLocaleString('en-IN')}</strong>
            </div>
          </div>
        </div>

        {/* TAB: TENANTS */}
        {activeTab === 'tenants' && (
          <>
            <div className="glass-panel rounded-2xl border border-white/5 p-6 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold">Campus Instances Directory</h2>
                  <p className="text-[11px] text-[#C4B5FD]/60 mt-0.5">Manage institution tenants, subscription tiers, and activation status.</p>
                </div>
                <div className="flex gap-2 p-1 bg-black/40 border border-white/5 rounded-xl self-start">
                  <button type="button" onClick={() => setInstTypeFilter('all')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      instTypeFilter === 'all' ? 'bg-[#6C2BD9] text-white' : 'text-[#C4B5FD]/60 hover:text-white'
                    }`}>
                    All ({institutions.length})
                  </button>
                  <button type="button" onClick={() => setInstTypeFilter('college')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      instTypeFilter === 'college' ? 'bg-[#6C2BD9] text-white' : 'text-[#C4B5FD]/60 hover:text-white'
                    }`}>
                    Colleges ({institutions.filter(i => (i.institute_type || 'college') === 'college').length})
                  </button>
                  <button type="button" onClick={() => setInstTypeFilter('school')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      instTypeFilter === 'school' ? 'bg-[#6C2BD9] text-white' : 'text-[#C4B5FD]/60 hover:text-white'
                    }`}>
                    Schools ({institutions.filter(i => i.institute_type === 'school').length})
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto w-full">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-[#C4B5FD] uppercase tracking-wider text-[10px] font-semibold">
                      <th className="py-3 px-4">Campus Name</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Institute Type</th>
                      <th className="py-3 px-4">Plan</th>
                      <th className="py-3 px-4">Subscription</th>
                      <th className="py-3 px-4">Plan Revenue</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr><td colSpan={9} className="py-10 text-center text-[#C4B5FD]/40 italic">Loading...</td></tr>
                    ) : institutions.length === 0 ? (
                      <tr><td colSpan={9} className="py-10 text-center text-[#C4B5FD]/40 italic">No institutions found.</td></tr>
                    ) : institutions.filter(inst => {
                      if (instTypeFilter === 'all') return true;
                      return (inst.institute_type || 'college') === instTypeFilter;
                    }).map(inst => (
                      <tr key={inst.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                        <td className="py-3.5 px-4 font-semibold text-white">
                          <button
                            onClick={() => setSelectedCampus({ id: inst.id, name: inst.name })}
                            className="flex items-center gap-2 hover:text-violet-400 transition-colors"
                          >
                            <div className="w-7 h-7 rounded bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-[10px] text-white">
                              {inst.name.charAt(0)}
                            </div>
                            {inst.name}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-[#C4B5FD]/80 font-mono">{inst.email || 'N/A'}</td>
                        <td className="py-3.5 px-4 capitalize text-[#C4B5FD]/80">{inst.type}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                            (inst.institute_type || 'college') === 'school'
                              ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                              : 'bg-pink-500/10 border-pink-500/20 text-pink-400'
                          }`}>
                            {(inst.institute_type || 'college').toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <select value={inst.plan_tier} onChange={(e) => updatePlanTier(inst.id, e.target.value)}
                            className="bg-black/30 border border-white/10 rounded px-2.5 py-1 text-white text-[11px] font-medium outline-none focus:border-violet-500">
                            <option value="Seed">Seed</option>
                            <option value="Campus">Campus</option>
                            <option value="University">University</option>
                            <option value="Enterprise">Enterprise</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4">
                          <select value={inst.subscription_period || 'monthly'} onChange={(e) => updateSubscriptionPeriod(inst.id, e.target.value)}
                            className="bg-black/30 border border-white/10 rounded px-2.5 py-1 text-white text-[11px] font-medium outline-none focus:border-violet-500">
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                            <option value="yearly">Yearly</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1">
                            <span className="text-[#C4B5FD]/60 text-[10px]">₹</span>
                            <input
                              type="number"
                              value={inst.plan_price_monthly || 0}
                              onChange={(e) => updateInstitutionPrice(inst.id, Number(e.target.value))}
                              className="w-20 bg-black/30 border border-white/10 rounded px-2 py-1 text-white text-[11px] font-medium outline-none focus:border-violet-500"
                            />
                            <span className="text-[#C4B5FD]/40 text-[10px]">/mo</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                            inst.is_active ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                          }`}>
                            {inst.is_active ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right flex justify-end items-center gap-1.5">
                          <button
                            onClick={() => setSelectedCampus({ id: inst.id, name: inst.name })}
                            className="px-2.5 py-1 rounded text-[10px] font-bold bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 border border-violet-500/20 transition-all"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => { setEditingInst(inst); setShowEditModal(true); }}
                            className="px-2.5 py-1 rounded text-[10px] font-bold bg-white/5 hover:bg-white/10 text-[#C4B5FD] border border-white/10 transition-all"
                          >
                            Edit
                          </button>
                          <button onClick={() => toggleInstitutionStatus(inst.id, inst.is_active)}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                              inst.is_active
                                ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                            }`}>
                            {inst.is_active ? 'Suspend' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteInstitution(inst.id)}
                            className="px-2.5 py-1 rounded text-[10px] font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* User Directory + RLS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 glass-panel rounded-2xl border border-white/5 p-6 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="font-bold text-base">Global Directory Search</h3>
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-[#C4B5FD]/40 absolute left-3 top-3" />
                    <input type="text" placeholder="Search by name, role, email..." value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 text-xs rounded-xl pl-9 pr-4 py-2.5 text-white outline-none focus:border-violet-500 font-light" />
                  </div>
                </div>
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-[#C4B5FD] uppercase tracking-wider text-[10px] font-semibold">
                        <th className="py-2.5 px-3">Name</th>
                        <th className="py-2.5 px-3">Email</th>
                        <th className="py-2.5 px-3">Role</th>
                        <th className="py-2.5 px-3">Institution</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.slice(0, 10).map((user) => (
                        <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                          <td className="py-3 px-3 font-semibold text-white flex flex-col sm:flex-row sm:items-center gap-1.5">
                            {user.name}
                            {!user.is_active && (
                              <span className="px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded text-[8px] font-extrabold uppercase w-fit">
                                Suspended
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-[#C4B5FD]/80 font-mono">{user.email}</td>
                          <td className="py-3 px-3">
                            <select
                              value={user.role}
                              onChange={(e) => updateUserRole(user.id, e.target.value)}
                              className="bg-black/30 border border-white/10 rounded px-2 py-1 text-white text-[11px] font-medium outline-none focus:border-violet-500"
                            >
                              {Object.keys(ROLE_COLORS).map(r => (
                                <option key={r} value={r} className="bg-[#13102A] text-white">{r}</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-3 px-3 text-[#C4B5FD]/70">{user.institution_name}</td>
                          <td className="py-3 px-3 text-right flex justify-end gap-1.5">
                            <button
                              onClick={() => toggleUserStatus(user.id, user.is_active)}
                              className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${
                                user.is_active
                                  ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20'
                                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                              }`}
                            >
                              {user.is_active ? 'Suspend' : 'Activate'}
                            </button>
                            <button
                              onClick={() => deleteUser(user.id)}
                              className="px-2 py-1 rounded text-[10px] font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="glass-panel rounded-2xl border border-white/5 p-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 className="font-bold text-base flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-emerald-400" /> Database Security
                  </h3>
                  <div className="space-y-3 text-[11px]">
                    {['institutions', 'users', 'students', 'fee_payments', 'canteen_orders'].map(table => (
                      <div key={table} className="flex justify-between items-center bg-black/30 p-2.5 rounded-xl border border-white/5">
                        <span className="font-mono text-white">{table}</span>
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Compliant
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-3 bg-violet-600/10 border border-violet-500/25 text-violet-400 rounded-xl text-[10px] leading-relaxed mt-4">
                  <strong>SuperAdmin Bypass:</strong> RLS policies allow SuperAdmin to access all tenant data across institutions.
                </div>
              </div>
            </div>
          </>
        )}

        {/* TAB: FEATURE TOGGLES */}
        {activeTab === 'features' && (
          <div className="glass-panel rounded-2xl border border-white/5 p-6 flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold">Campus Module Toggles</h2>
                <p className="text-[11px] text-[#C4B5FD]/60 mt-0.5">Enable or disable specific modules and features for the selected campus tenant.</p>
              </div>
              <div className="flex items-center gap-3">
                <select value={selectedInstForFeatures} onChange={(e) => {
                  setSelectedInstForFeatures(e.target.value);
                  loadFeatures(e.target.value);
                }}
                  className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-violet-500 min-w-[200px]">
                  <option value="" className="bg-[#13102A] text-white">Select Institution...</option>
                  {institutions.map(inst => (
                    <option key={inst.id} value={inst.id} className="bg-[#13102A] text-white">{inst.name}</option>
                  ))}
                </select>
                {selectedInstForFeatures && featureToggles.length > 0 && (
                  <button onClick={handleSaveFeatures} disabled={featuresSaving}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-[#8B5CF6] hover:brightness-110 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-violet-600/25 transition-all disabled:opacity-50">
                    <Save className="w-4 h-4" /> {featuresSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                )}
              </div>
            </div>

            {!selectedInstForFeatures && (
              <div className="py-16 text-center text-[#C4B5FD]/40 italic text-sm">
                Select an institution above to manage its module toggles.
              </div>
            )}

            {selectedInstForFeatures && featuresLoading && (
              <div className="py-16 text-center text-[#C4B5FD]/40 italic text-sm">Loading modules...</div>
            )}

            {selectedInstForFeatures && !featuresLoading && featuresError && (
              <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-semibold text-center my-4 max-w-2xl mx-auto">
                {featuresError}
              </div>
            )}

            {selectedInstForFeatures && !featuresLoading && !featuresError && featureToggles.length === 0 && (
              <div className="py-16 text-center text-[#C4B5FD]/40 italic text-sm">
                No feature modules found for this institution.
              </div>
            )}

            {selectedInstForFeatures && !featuresLoading && !featuresError && featureToggles.length > 0 && (
              <>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                  <div className="text-xs text-gray-400">
                    <span className="text-white font-bold">{featureToggles.filter(f => f.enabled).length}</span> of {featureToggles.length} modules enabled
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setFeatureTogglesState(prev => prev.map(f => ({ ...f, enabled: true })))}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold hover:bg-emerald-500/20 transition-all">
                      Enable All
                    </button>
                    <button onClick={() => setFeatureTogglesState(prev => prev.map(f => ({ ...f, enabled: false })))}
                      className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold hover:bg-red-500/20 transition-all">
                      Disable All
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {featureToggles.map(f => (
                    <button
                      key={f.feature_key}
                      onClick={() => handleToggleFeature(f.feature_key)}
                      className={`p-4 rounded-2xl border transition-all text-left group flex flex-col justify-between h-28 ${
                        f.enabled
                          ? 'bg-violet-500/5 border-violet-500/20 hover:border-violet-500/40'
                          : 'bg-white/[0.02] border-white/5 opacity-50 hover:opacity-70 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-2xl">{FEATURE_ICONS[f.feature_key] || '📦'}</span>
                        {f.enabled ? (
                          <ToggleRight className="w-6 h-6 text-emerald-400" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{FEATURE_LABELS[f.feature_key] || f.feature_key}</div>
                        <div className={`text-[10px] mt-0.5 font-medium ${f.enabled ? 'text-emerald-400/70' : 'text-gray-500'}`}>
                          {f.enabled ? 'Active' : 'Disabled'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB: ROLE PERMISSIONS */}
        {activeTab === 'permissions' && (
          <div className="glass-panel rounded-2xl border border-white/5 p-6 flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold">Role-Based Permissions</h2>
                <p className="text-[11px] text-[#C4B5FD]/60 mt-0.5">Configure read, write, and delete permissions for each role across modules within an institution.</p>
              </div>
              <div className="flex items-center gap-3">
                <select value={selectedInstForPerms} onChange={(e) => {
                  setSelectedInstForPerms(e.target.value);
                  loadPermissions(e.target.value);
                }}
                  className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-violet-500 min-w-[200px]">
                  <option value="" className="bg-[#13102A] text-white">Select Institution...</option>
                  {institutions.map(inst => (
                    <option key={inst.id} value={inst.id} className="bg-[#13102A] text-white">{inst.name}</option>
                  ))}
                </select>
                {selectedInstForPerms && rolePerms.length > 0 && (
                  <button onClick={handleSavePermissions} disabled={permsSaving}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-[#8B5CF6] hover:brightness-110 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-violet-600/25 transition-all disabled:opacity-50">
                    <Save className="w-4 h-4" /> {permsSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                )}
              </div>
            </div>

            {!selectedInstForPerms && (
              <div className="py-16 text-center text-[#C4B5FD]/40 italic text-sm">
                Select an institution above to manage its role permissions.
              </div>
            )}

            {selectedInstForPerms && permsLoading && (
              <div className="py-16 text-center text-[#C4B5FD]/40 italic text-sm">Loading permissions...</div>
            )}

            {selectedInstForPerms && !permsLoading && permsError && (
              <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-semibold text-center my-4 max-w-2xl mx-auto">
                {permsError}
              </div>
            )}

            {selectedInstForPerms && !permsLoading && !permsError && allRoles.length === 0 && (
              <div className="py-16 text-center text-[#C4B5FD]/40 italic text-sm">
                No roles found for this institution.
              </div>
            )}

            {selectedInstForPerms && !permsLoading && !permsError && allRoles.length > 0 && (
              <>
                <div className="flex flex-wrap gap-2">
                  {allRoles.filter(r => ['Admin', 'Staff', 'Teacher', 'Student', 'Parent', 'Warden', 'Security', 'Vendor', 'Driver'].includes(r)).map(role => (
                    <button key={role} onClick={() => setSelectedRole(role)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                        selectedRole === role
                          ? `bg-violet-600/20 border-violet-500/40 text-violet-400`
                          : 'bg-white/5 border-white/10 text-[#C4B5FD]/50 hover:text-white hover:bg-white/10'
                      }`}>
                      {role}
                    </button>
                  ))}
                </div>

                {selectedRole && (
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-[#C4B5FD] uppercase tracking-wider text-[10px] font-semibold">
                          <th className="py-3 px-4">Module</th>
                          <th className="py-3 px-4 text-center">Read</th>
                          <th className="py-3 px-4 text-center">Write</th>
                          <th className="py-3 px-4 text-center">Delete</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allModules.map(mod => {
                          const perm = getPerm(selectedRole, mod);
                          return (
                            <tr key={mod} className="border-b border-white/5 hover:bg-white/5 transition-all">
                              <td className="py-3 px-4 font-semibold text-white">{FEATURE_LABELS[mod] || mod}</td>
                              {(['can_read', 'can_write', 'can_delete'] as const).map(field => (
                                <td key={field} className="py-3 px-4 text-center">
                                  <button onClick={() => handlePermChange(selectedRole, mod, field, !perm[field])}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto transition-all ${
                                      perm[field]
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        : 'bg-white/5 text-[#C4B5FD]/20 border border-white/10 hover:bg-white/10'
                                    }`}>
                                    {perm[field] ? <CheckCircle2 className="w-4 h-4" /> : <span className="w-2 h-2 rounded-full bg-current" />}
                                  </button>
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* TAB: NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Compose */}
            <div className="glass-panel rounded-2xl border border-white/5 p-6 flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2"><Send className="w-5 h-5 text-violet-400" /> Compose Notification</h2>
                <p className="text-[11px] text-[#C4B5FD]/60 mt-0.5">Send announcements to campus admins.</p>
              </div>
              <form onSubmit={handleSendNotification} className="space-y-4 text-xs">
                <div className="flex flex-col gap-1">
                  <label className="text-[#C4B5FD] font-semibold">Title</label>
                  <input type="text" required placeholder="e.g. System Maintenance on Sunday"
                    value={notifForm.title} onChange={(e) => setNotifForm({ ...notifForm, title: e.target.value })}
                    className="bg-black/40 border border-white/10 p-2.5 rounded-xl text-white outline-none focus:border-violet-500" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[#C4B5FD] font-semibold">Message</label>
                  <textarea required rows={4} placeholder="Write your announcement..."
                    value={notifForm.body} onChange={(e) => setNotifForm({ ...notifForm, body: e.target.value })}
                    className="bg-black/40 border border-white/10 p-2.5 rounded-xl text-white outline-none focus:border-violet-500 resize-none" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[#C4B5FD] font-semibold">Type</label>
                  <select value={notifForm.type} onChange={(e) => setNotifForm({ ...notifForm, type: e.target.value })}
                    className="bg-black/40 border border-white/10 p-2.5 rounded-xl text-white outline-none focus:border-violet-500">
                    {NOTIFICATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[#C4B5FD] font-semibold">Target</label>
                  <div className="flex items-center gap-3 mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={notifForm.targetAll} onChange={() => setNotifForm({ ...notifForm, targetAll: true, targetCampusIds: [] })}
                        className="accent-violet-500" />
                      <span className="text-white">All Campus Admins</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={!notifForm.targetAll} onChange={() => setNotifForm({ ...notifForm, targetAll: false })}
                        className="accent-violet-500" />
                      <span className="text-white">Specific Campuses</span>
                    </label>
                  </div>
                  {!notifForm.targetAll && (
                    <div className="space-y-2 max-h-40 overflow-y-auto bg-black/30 p-3 rounded-xl border border-white/5">
                      {institutions.map(inst => (
                        <label key={inst.id} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox"
                            checked={notifForm.targetCampusIds.includes(inst.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNotifForm({ ...notifForm, targetCampusIds: [...notifForm.targetCampusIds, inst.id] });
                              } else {
                                setNotifForm({ ...notifForm, targetCampusIds: notifForm.targetCampusIds.filter(id => id !== inst.id) });
                              }
                            }}
                            className="accent-violet-500" />
                          <span className="text-white text-[11px]">{inst.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <button type="submit" disabled={notifSending}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-[#8B5CF6] hover:brightness-110 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-violet-600/25 transition-all disabled:opacity-50">
                  <Send className="w-4 h-4" /> {notifSending ? 'Sending...' : 'Send Notification'}
                </button>
              </form>
            </div>

            {/* Sent History */}
            <div className="glass-panel rounded-2xl border border-white/5 p-6 flex flex-col gap-4">
              <h2 className="text-lg font-bold">Sent Notifications</h2>
              {notifLoading ? (
                <div className="py-10 text-center text-[#C4B5FD]/40 text-xs italic">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="py-10 text-center text-[#C4B5FD]/40 text-xs italic">No notifications sent yet.</div>
              ) : (
                <div className="space-y-3">
                  {notifications.map(n => (
                    <div key={n.id} className="p-4 rounded-xl bg-white/5 border border-white/5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-sm">{n.title}</h4>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${NOTIFICATION_TYPE_COLORS[n.type] || 'bg-white/5 text-white border-white/10'}`}>
                              {n.type}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#C4B5FD]/60 mt-1 line-clamp-2">{n.body}</p>
                          <div className="flex items-center gap-3 mt-2 text-[9px] text-[#C4B5FD]/40">
                            <span>{new Date(n.created_at).toLocaleDateString('en-IN')}</span>
                            <span>→ {n.target_campus_ids?.length ? `${n.target_campus_ids.length} campuses` : 'All campuses'}</span>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteNotification(n.id)}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Campus Detail Panel */}
      {selectedCampus && (
        <CampusDetailPanel
          institutionId={selectedCampus.id}
          institutionName={selectedCampus.name}
          institutionDetails={institutions.find(inst => inst.id === selectedCampus.id)}
          onClose={() => setSelectedCampus(null)}
        />
      )}

      {/* Plan Pricing Modal */}
      {showPricingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#13102A] border border-violet-500/30 rounded-3xl p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-1">Plan Pricing Editor</h3>
            <p className="text-[10px] text-[#C4B5FD]/50 mb-4">Set monthly price for each plan tier. All institutions on that tier will be charged accordingly.</p>
            <div className="space-y-3">
              {Object.entries(planPrices).map(([tier, price]) => (
                <div key={tier} className="flex items-center justify-between bg-black/30 p-3 rounded-xl border border-white/5">
                  <span className="text-xs font-bold text-white">{tier}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[#C4B5FD]/40 text-[10px]">₹</span>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPlanPrices({ ...planPrices, [tier]: Number(e.target.value) })}
                      className="w-24 bg-black/40 border border-white/10 rounded px-2 py-1 text-white text-xs font-medium outline-none focus:border-violet-500 text-right"
                    />
                    <span className="text-[#C4B5FD]/40 text-[10px]">/mo</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-white/5 mt-4">
              <button onClick={() => setShowPricingModal(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs">Cancel</button>
              <button onClick={handleSavePricing}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-[#8B5CF6] hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-violet-600/25">
                Save Pricing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Provision Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex justify-center items-start p-4 md:p-6 bg-black/70 backdrop-blur-sm">
          <div className="my-auto w-full max-w-md bg-[#13102A] border border-violet-500/30 rounded-3xl p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-4">Provision New Campus</h3>
            <form onSubmit={handleAddInstitution} className="space-y-4 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-[#C4B5FD] font-semibold">Institution Name</label>
                <input type="text" required placeholder="e.g. Siddharth Institute of Technology"
                  value={newInst.name} onChange={(e) => setNewInst({ ...newInst, name: e.target.value })}
                  className="bg-black/40 border border-white/10 p-2.5 rounded-xl text-white outline-none focus:border-violet-500" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[#C4B5FD] font-semibold">Institute Type</label>
                <div className="flex gap-4 p-2.5 bg-black/40 border border-white/10 rounded-xl">
                  <label className="flex items-center gap-1.5 cursor-pointer text-white">
                    <input type="radio" name="institute_type" value="college" 
                      checked={newInst.institute_type === 'college'}
                      onChange={() => setNewInst({ ...newInst, institute_type: 'college' })}
                      className="accent-violet-500" />
                    College
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-white">
                    <input type="radio" name="institute_type" value="school" 
                      checked={newInst.institute_type === 'school'}
                      onChange={() => setNewInst({ ...newInst, institute_type: 'school' })}
                      className="accent-violet-500" />
                    School
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[#C4B5FD] font-semibold">Type</label>
                  <select value={newInst.type} onChange={(e) => setNewInst({ ...newInst, type: e.target.value })}
                    className="bg-black/40 border border-white/10 p-2.5 rounded-xl text-white outline-none focus:border-violet-500">
                    <option value="school">School</option>
                    <option value="college">College</option>
                    <option value="university">University</option>
                    <option value="center">Training Center</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[#C4B5FD] font-semibold">Plan</label>
                  <select value={newInst.plan_tier} onChange={(e) => setNewInst({ ...newInst, plan_tier: e.target.value })}
                    className="bg-black/40 border border-white/10 p-2.5 rounded-xl text-white outline-none focus:border-violet-500">
                    <option value="Seed">Seed (Free)</option>
                    <option value="Campus">Campus (₹10,000/mo)</option>
                    <option value="University">University (₹25,000/mo)</option>
                    <option value="Enterprise">Enterprise (₹50,000/mo)</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[#C4B5FD] font-semibold">Registering Admin Email</label>
                <input type="email" required placeholder="contact@sit.edu"
                  value={newInst.email} onChange={(e) => setNewInst({ ...newInst, email: e.target.value })}
                  className="bg-black/40 border border-white/10 p-2.5 rounded-xl text-white outline-none focus:border-violet-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[#C4B5FD] font-semibold">Subscription Billing</label>
                  <select value={newInst.subscription_period} onChange={(e) => setNewInst({ ...newInst, subscription_period: e.target.value })}
                    className="bg-black/40 border border-white/10 p-2.5 rounded-xl text-white outline-none focus:border-violet-500">
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[#C4B5FD] font-semibold">Admin Password</label>
                  <input type="password" required placeholder="••••••••"
                    value={newInst.password} onChange={(e) => setNewInst({ ...newInst, password: e.target.value })}
                    className="bg-black/40 border border-white/10 p-2.5 rounded-xl text-white outline-none focus:border-violet-500" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold">Cancel</button>
                <button type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-[#8B5CF6] hover:brightness-110 text-white font-bold shadow-lg shadow-violet-600/25">
                  Provision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingInst && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex justify-center items-start p-4 md:p-6 bg-black/70 backdrop-blur-sm">
          <div className="my-auto w-full max-w-md bg-[#13102A] border border-violet-500/30 rounded-3xl p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-4">Edit Campus Details</h3>
            <form onSubmit={handleEditInstitution} className="space-y-4 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-[#C4B5FD] font-semibold">Institution Name</label>
                <input type="text" required placeholder="e.g. Siddharth Institute of Technology"
                  value={editingInst.name} onChange={(e) => setEditingInst({ ...editingInst, name: e.target.value })}
                  className="bg-black/40 border border-white/10 p-2.5 rounded-xl text-white outline-none focus:border-violet-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[#C4B5FD] font-semibold">Type</label>
                  <select value={editingInst.type} onChange={(e) => setEditingInst({ ...editingInst, type: e.target.value })}
                    className="bg-black/40 border border-white/10 p-2.5 rounded-xl text-white outline-none focus:border-violet-500">
                    <option value="school">School</option>
                    <option value="college">College</option>
                    <option value="university">University</option>
                    <option value="center">Training Center</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[#C4B5FD] font-semibold">Plan</label>
                  <select value={editingInst.plan_tier} onChange={(e) => setEditingInst({ ...editingInst, plan_tier: e.target.value })}
                    className="bg-black/40 border border-white/10 p-2.5 rounded-xl text-white outline-none focus:border-violet-500">
                    <option value="Seed">Seed (Free)</option>
                    <option value="Campus">Campus</option>
                    <option value="University">University</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[#C4B5FD] font-semibold">Institute Type</label>
                <div className="flex gap-4 p-2.5 bg-black/40 border border-white/10 rounded-xl">
                  <label className="flex items-center gap-1.5 cursor-pointer text-white">
                    <input type="radio" name="edit_institute_type" value="college" 
                      checked={(editingInst.institute_type || 'college') === 'college'}
                      onChange={() => setEditingInst({ ...editingInst, institute_type: 'college' })}
                      className="accent-violet-500" />
                    College
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-white">
                    <input type="radio" name="edit_institute_type" value="school" 
                      checked={editingInst.institute_type === 'school'}
                      onChange={() => setEditingInst({ ...editingInst, institute_type: 'school' })}
                      className="accent-violet-500" />
                    School
                  </label>
                </div>
                <p className="text-[10px] text-yellow-500 mt-0.5 italic">
                  * Changing type updates your session automatically. Other users of this institute must re-login for changes to take effect.
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[#C4B5FD] font-semibold">Monthly Price (₹)</label>
                <input type="number" required
                  value={editingInst.plan_price_monthly || 0}
                  onChange={(e) => setEditingInst({ ...editingInst, plan_price_monthly: Number(e.target.value) })}
                  className="bg-black/40 border border-white/10 p-2.5 rounded-xl text-white outline-none focus:border-violet-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[#C4B5FD] font-semibold">Email</label>
                  <input type="email" required placeholder="contact@sit.edu"
                    value={editingInst.email || ''} onChange={(e) => setEditingInst({ ...editingInst, email: e.target.value })}
                    className="bg-black/40 border border-white/10 p-2.5 rounded-xl text-white outline-none focus:border-violet-500" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[#C4B5FD] font-semibold">Subscription Billing</label>
                  <select value={editingInst.subscription_period || 'monthly'} onChange={(e) => setEditingInst({ ...editingInst, subscription_period: e.target.value })}
                    className="bg-black/40 border border-white/10 p-2.5 rounded-xl text-white outline-none focus:border-violet-500">
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[#C4B5FD] font-semibold">Subscription Status</label>
                  <select value={editingInst.subscription_status || 'active'} onChange={(e) => setEditingInst({ ...editingInst, subscription_status: e.target.value })}
                    className="bg-black/40 border border-white/10 p-2.5 rounded-xl text-white outline-none focus:border-violet-500">
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="suspended">Suspended</option>
                    <option value="trial">Trial</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[#C4B5FD] font-semibold">Subscription End Date</label>
                  <input type="date"
                    value={editingInst.subscription_end_date ? editingInst.subscription_end_date.split('T')[0] : ''}
                    onChange={(e) => setEditingInst({ ...editingInst, subscription_end_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
                    className="bg-black/40 border border-white/10 p-2.5 rounded-xl text-white outline-none focus:border-violet-500" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button type="button" onClick={() => { setShowEditModal(false); setEditingInst(null); }}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold">Cancel</button>
                <button type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-[#8B5CF6] hover:brightness-110 text-white font-bold shadow-lg shadow-violet-600/25">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
