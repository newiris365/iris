"use client";

import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, Sliders, ToggleLeft, ToggleRight, Loader2, Database, AlertTriangle, ExternalLink } from 'lucide-react';
import { 
  getFeatureToggles, setFeatureToggles,
  getRolePermissions, setRolePermissions,
  seedPermissions,
  type FeatureToggle, type ModulePermission 
} from '../../../lib/api';

const ALL_FEATURES = [
  'dashboard', 'admissions', 'students', 'attendance', 'timetable',
  'fees', 'exams', 'canteen', 'hostel', 'library', 'placements',
  'hr', 'gate', 'gym', 'transit', 'events', 'notices', 'idcards',
  'ai_concierge', 'obe', 'naac', 'faculty_development', 'achievements',
  'director', 'parent_portal'
];

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
  director: '🎯', parent_portal: '👨‍👩‍👧'
};

type Tab = 'features' | 'permissions';

const SEED_SQL = `-- Run this in Supabase SQL Editor to seed defaults
-- Replace YOUR_INSTITUTION_ID with your actual institution UUID

INSERT INTO institution_features (institution_id, feature_key, enabled)
SELECT 'YOUR_INSTITUTION_ID', f.feature_key, true
FROM (VALUES
  ('dashboard'), ('admissions'), ('students'), ('attendance'), ('timetable'),
  ('fees'), ('exams'), ('canteen'), ('hostel'), ('library'), ('placements'),
  ('hr'), ('gate'), ('gym'), ('transit'), ('events'), ('notices'), ('idcards'),
  ('ai_concierge'), ('obe'), ('naac'), ('faculty_development'), ('achievements'),
  ('director'), ('parent_portal')
) AS f(feature_key)
ON CONFLICT (institution_id, feature_key) DO NOTHING;

INSERT INTO module_permissions (institution_id, role, module, can_read, can_write, can_delete)
SELECT 'YOUR_INSTITUTION_ID', 'Admin', m.module, true, true, true
FROM (VALUES
  ('dashboard'), ('admissions'), ('students'), ('attendance'), ('timetable'),
  ('fees'), ('exams'), ('canteen'), ('hostel'), ('library'), ('placements'),
  ('hr'), ('gate'), ('gym'), ('transit'), ('events'), ('notices'), ('idcards'),
  ('ai_concierge'), ('obe'), ('naac'), ('faculty_development'), ('achievements'),
  ('director'), ('parent_portal')
) AS m(module)
ON CONFLICT (institution_id, role, module) DO NOTHING;`;

export default function AdminSettingsPage() {
  const [institutionId, setInstitutionId] = useState('');
  const [userRole, setUserRole] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('features');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);

  // Feature toggles
  const [features, setFeatures] = useState<FeatureToggle[]>([]);

  // Role permissions
  const [rolePerms, setRolePerms] = useState<ModulePermission[]>([]);
  const [allRoles, setAllRoles] = useState<string[]>([]);
  const [allModules, setAllModules] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [instituteType, setInstituteType] = useState('college');

  useEffect(() => {
    const profile = localStorage.getItem('iris_user_profile');
    if (profile) {
      try {
        const parsed = JSON.parse(profile);
        setInstitutionId(parsed.institution_id || '');
        setUserRole(parsed.role || '');
        setInstituteType(parsed.institute_type || 'college');
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (institutionId) loadAll();
  }, [institutionId]);

  const loadAll = async () => {
    if (!institutionId) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const [featResult, permResult] = await Promise.all([
        getFeatureToggles(institutionId).catch(() => null),
        getRolePermissions(institutionId).catch(() => null)
      ]);

      const backendUp = featResult?.success || permResult?.success;
      setBackendAvailable(backendUp);

      if (featResult?.success && featResult.features) {
        setFeatures(featResult.features);
      }
      if (permResult?.success) {
        setRolePerms(permResult.permissions || []);
        setAllRoles(permResult.all_roles || []);
        setAllModules(permResult.all_modules || []);
        if (permResult.all_roles?.length > 0) setSelectedRole(permResult.all_roles[0]);
      }
    } catch {
      setBackendAvailable(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFeature = (featureKey: string) => {
    setFeatures(prev => prev.map(f =>
      f.feature_key === featureKey ? { ...f, enabled: !f.enabled } : f
    ));
  };

  const handleToggleAllFeatures = (enabled: boolean) => {
    setFeatures(prev => prev.map(f => ({ ...f, enabled })));
  };

  const handleSaveFeatures = async () => {
    if (!institutionId || features.length === 0) return;
    setIsSaving(true);
    try {
      const result = await setFeatureToggles(institutionId, features);
      if (result.success) {
        alert('Module toggles saved successfully.');
      } else {
        alert('Failed to save: ' + (result.error || 'Unknown error'));
      }
    } catch {
      alert('Failed to save. Make sure the backend server is running.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePermChange = (role: string, module: string, field: 'can_read' | 'can_write' | 'can_delete', value: boolean) => {
    setRolePerms(prev => {
      const existing = prev.find(p => p.role === role && p.module === module);
      if (existing) {
        return prev.map(p => p.role === role && p.module === module ? { ...p, [field]: value } : p);
      }
      return [...prev, {
        role, module,
        can_read: field === 'can_read' ? value : false,
        can_write: field === 'can_write' ? value : false,
        can_delete: field === 'can_delete' ? value : false,
      }];
    });
  };

  const handleSavePermissions = async () => {
    if (!institutionId || rolePerms.length === 0) return;
    setIsSaving(true);
    try {
      const result = await setRolePermissions(institutionId, rolePerms);
      if (result.success) {
        alert('Permissions updated successfully.');
      } else {
        alert('Failed to save: ' + (result.error || 'Unknown error'));
      }
    } catch {
      alert('Failed to save. Make sure the backend server is running.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSeed = async () => {
    if (!institutionId) return;
    setIsSeeding(true);
    try {
      const result = await seedPermissions(institutionId);
      if (result.success) {
        alert('Defaults seeded! All modules enabled, Admin has full access.');
        await loadAll();
      } else {
        alert('Failed to seed: ' + (result.error || 'Unknown error'));
      }
    } catch {
      alert('Failed to seed. Make sure the backend server is running.');
    } finally {
      setIsSeeding(false);
    }
  };

  const getPerm = (role: string, module: string): ModulePermission => {
    return rolePerms.find(p => p.role === role && p.module === module) || {
      role, module, can_read: false, can_write: false, can_delete: false
    };
  };

  const enabledCount = features.filter(f => f.enabled).length;

  // SuperAdmin-only guard
  if (userRole && userRole !== 'SuperAdmin') {
    return (
      <main className="min-h-screen bg-[#0D0A1A] text-white p-6">
        <div className="max-w-2xl mx-auto flex flex-col items-center justify-center h-[60vh] gap-4">
          <div className="w-16 h-16 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Access Restricted</h1>
          <p className="text-sm text-slate-400 text-center max-w-md">
            Module toggles and role permissions can only be managed by the <span className="text-violet-400 font-semibold">SuperAdmin</span>.
            Contact your institution&apos;s SuperAdmin to make changes.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-6">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Institution Settings</h1>
              <p className="text-xs text-[#C4B5FD]/70 font-light mt-0.5">Enable/disable modules and configure role permissions.</p>
            </div>
          </div>
          <div className="flex gap-3">
            {!isLoading && backendAvailable === false && (
              <button onClick={() => setShowSqlModal(true)}
                className="px-4 py-2.5 rounded-xl bg-amber-600/20 border border-amber-500/30 hover:bg-amber-600/30 text-amber-400 text-xs font-bold flex items-center gap-1.5 transition-all">
                <Database className="w-4 h-4" /> Seed via SQL
              </button>
            )}
            {!isLoading && backendAvailable === false && features.length === 0 && (
              <button onClick={handleSeed} disabled={isSeeding}
                className="px-4 py-2.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 hover:bg-emerald-600/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50">
                {isSeeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                {isSeeding ? 'Seeding...' : 'Initialize Defaults'}
              </button>
            )}
            {activeTab === 'features' && features.length > 0 && (
              <button onClick={handleSaveFeatures} disabled={isSaving}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-[#8B5CF6] hover:brightness-110 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-violet-600/25 transition-all disabled:opacity-50">
                <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Modules'}
              </button>
            )}
            {activeTab === 'permissions' && rolePerms.length > 0 && (
              <button onClick={handleSavePermissions} disabled={isSaving}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-[#8B5CF6] hover:brightness-110 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-violet-600/25 transition-all disabled:opacity-50">
                <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Permissions'}
              </button>
            )}
          </div>
        </div>

        {/* Backend unavailable warning */}
        {backendAvailable === false && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-amber-400 mb-1">Backend server is not reachable</h3>
              <p className="text-xs text-amber-300/70 leading-relaxed">
                The Express backend API is required for saving changes. Deploy your backend to a service like 
                <strong> Render</strong>, <strong>Railway</strong>, or <strong>Fly.io</strong> and set the 
                <code className="bg-black/30 px-1.5 py-0.5 rounded mx-1">NEXT_PUBLIC_API_URL</code> 
                environment variable in Netlify to point to your backend URL (e.g. 
                <code className="bg-black/30 px-1.5 py-0.5 rounded mx-1">https://your-backend.onrender.com/api/v1</code>).
              </p>
              <p className="text-xs text-amber-300/70 leading-relaxed mt-2">
                <strong>Quick fix:</strong> Click &quot;Seed via SQL&quot; above to initialize module data directly in Supabase.
              </p>
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex gap-2">
          {([
            { key: 'features' as const, label: 'Module Toggles', icon: <ToggleRight className="w-4 h-4" /> },
            { key: 'permissions' as const, label: 'Role Permissions', icon: <Sliders className="w-4 h-4" /> },
          ]).map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === tab.key
                  ? 'bg-violet-600/20 border border-violet-500/40 text-violet-400'
                  : 'bg-white/5 border border-white/10 text-[#C4B5FD]/50 hover:text-white hover:bg-white/10'
              }`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="py-16 text-center text-[#C4B5FD]/40 italic flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading settings...
          </div>
        )}

        {/* ===================== FEATURE TOGGLES TAB ===================== */}
        {!isLoading && activeTab === 'features' && (
          <>
            {features.length > 0 ? (
              <>
                {/* Stats bar */}
                <div className="glass-panel rounded-2xl border border-white/5 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-400">
                      <span className="text-white font-bold">{enabledCount}</span> of {features.length} modules enabled
                    </div>
                    <div className="w-32 h-2 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full transition-all"
                        style={{ width: `${(enabledCount / features.length) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleToggleAllFeatures(true)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold hover:bg-emerald-500/20 transition-all">
                      Enable All
                    </button>
                    <button onClick={() => handleToggleAllFeatures(false)}
                      className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-bold hover:bg-red-500/20 transition-all">
                      Disable All
                    </button>
                  </div>
                </div>

                {/* Feature grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {features.map(f => (
                    <button
                      key={f.feature_key}
                      onClick={() => handleToggleFeature(f.feature_key)}
                      className={`p-4 rounded-2xl border transition-all text-left group ${
                        f.enabled
                          ? 'bg-violet-500/5 border-violet-500/20 hover:border-violet-500/40'
                          : 'bg-white/[0.02] border-white/5 opacity-50 hover:opacity-70 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{FEATURE_ICONS[f.feature_key] || '📦'}</span>
                        {f.enabled ? (
                          <ToggleRight className="w-6 h-6 text-emerald-400" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-gray-600" />
                        )}
                      </div>
                      <div className="text-sm font-bold text-white">{FEATURE_LABELS[f.feature_key] || f.feature_key}</div>
                      <div className={`text-[11px] mt-1 font-medium ${f.enabled ? 'text-emerald-400/70' : 'text-gray-500'}`}>
                        {f.enabled ? 'Active' : 'Disabled'}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-16 text-center text-[#C4B5FD]/40 italic text-sm">
                {backendAvailable === false 
                  ? 'Backend not reachable. Click "Seed via SQL" to initialize module data, or deploy the backend server.'
                  : 'No module data found. Click "Initialize Defaults" to set up all modules.'
                }
              </div>
            )}
          </>
        )}

        {/* ===================== ROLE PERMISSIONS TAB ===================== */}
        {!isLoading && activeTab === 'permissions' && (
          <>
            {rolePerms.length > 0 ? (
              <>
                {/* Role selector */}
                <div className="flex flex-wrap gap-2">
                  {(instituteType === 'school'
                    ? ['Admin', 'Staff', 'Teacher', 'Student', 'Parent', 'Warden', 'Security', 'Vendor', 'Driver']
                    : ['Admin', 'Staff', 'Teacher', 'Student', 'Parent', 'Warden', 'Security', 'Vendor', 'Driver', 'HOD', 'Director', 'Principal', 'TPO']
                  ).map(role => (
                    <button key={role} onClick={() => setSelectedRole(role)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                        selectedRole === role
                          ? 'bg-violet-600/20 border-violet-500/40 text-violet-400'
                          : 'bg-white/5 border-white/10 text-[#C4B5FD]/50 hover:text-white hover:bg-white/10'
                      }`}>
                      {role}
                    </button>
                  ))}
                </div>

                {/* Permission matrix */}
                {selectedRole && (
                  <div className="glass-panel rounded-2xl border border-white/5 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Sliders className="w-4 h-4 text-violet-400" />
                      <h2 className="text-sm font-bold">{selectedRole} Permissions</h2>
                    </div>
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
                  </div>
                )}
              </>
            ) : (
              <div className="py-16 text-center text-[#C4B5FD]/40 italic text-sm">
                {backendAvailable === false
                  ? 'Backend not reachable. Click "Seed via SQL" to initialize permissions, or deploy the backend server.'
                  : 'No permissions configured. Click "Initialize Defaults" to set up role permissions.'
                }
              </div>
            )}
          </>
        )}

        {/* SQL Modal */}
        {showSqlModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowSqlModal(false)}>
            <div className="bg-[#13102A] border border-white/10 rounded-2xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Seed via Supabase SQL Editor</h3>
                <button onClick={() => setShowSqlModal(false)} className="text-gray-400 hover:text-white text-xl">&times;</button>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                1. Go to your <a href="https://supabase.com/dashboard" target="_blank" className="text-violet-400 hover:underline inline-flex items-center gap-1">Supabase Dashboard <ExternalLink className="w-3 h-3" /></a> → SQL Editor<br/>
                2. Replace <code className="bg-black/30 px-1 rounded">YOUR_INSTITUTION_ID</code> with your institution UUID<br/>
                3. Paste and run the SQL below
              </p>
              <p className="text-xs text-gray-500 mb-2">Your institution ID: <code className="bg-black/30 px-1.5 py-0.5 rounded text-violet-400">{institutionId || 'not found'}</code></p>
              <pre className="bg-black/40 rounded-xl p-4 text-[11px] text-green-300/80 overflow-x-auto whitespace-pre-wrap leading-relaxed border border-white/5">
                {SEED_SQL.replace(/YOUR_INSTITUTION_ID/g, institutionId || 'YOUR_INSTITUTION_ID')}
              </pre>
              <button onClick={() => {
                navigator.clipboard.writeText(SEED_SQL.replace(/YOUR_INSTITUTION_ID/g, institutionId || 'YOUR_INSTITUTION_ID'));
                alert('SQL copied to clipboard!');
              }} className="mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl transition-colors">
                Copy SQL to Clipboard
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
