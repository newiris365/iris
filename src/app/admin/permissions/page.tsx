"use client";

import React, { useState, useEffect } from 'react';
import {
  Shield, Save, RefreshCw, Check, X, Sliders, Database, AlertTriangle, CheckCircle
} from 'lucide-react';
import {
  getRolePermissions, setRolePermissions, seedPermissions,
  type ModulePermission
} from '../../../lib/api';

const ALL_ROLES = [
  'SuperAdmin', 'Admin', 'Director', 'Principal', 'HOD', 'Teacher', 'Staff',
  'Student', 'Parent', 'Warden', 'Security', 'Vendor', 'Driver',
  'TPO', 'Librarian', 'Gym Trainer', 'IQAC Coordinator', 'Admissions Officer',
  'HR Admin', 'Company HR', 'Vice Principal', 'Applicant'
];

const COLLEGE_ONLY_ROLES = new Set(['HOD', 'TPO', 'IQAC Coordinator']);

function getVisibleRoles(instituteType: string) {
  if (instituteType === 'school') {
    return ALL_ROLES.filter(r => !COLLEGE_ONLY_ROLES.has(r));
  }
  return ALL_ROLES;
}

const ALL_MODULES = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'admissions', label: 'Admissions' },
  { key: 'students', label: 'Students' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'timetable', label: 'Timetable' },
  { key: 'fees', label: 'Fees & Finance' },
  { key: 'exams', label: 'Exams & Results' },
  { key: 'canteen', label: 'Canteen' },
  { key: 'hostel', label: 'Hostel' },
  { key: 'library', label: 'Library' },
  { key: 'placements', label: 'Placements' },
  { key: 'hr', label: 'HR Management' },
  { key: 'gate', label: 'Smart Gate' },
  { key: 'gym', label: 'FitZone Gym' },
  { key: 'transit', label: 'Transit' },
  { key: 'events', label: 'Events' },
  { key: 'notices', label: 'Notices' },
  { key: 'idcards', label: 'ID Cards' },
  { key: 'ai_concierge', label: 'AI Concierge' },
  { key: 'obe', label: 'OBE Maps' },
  { key: 'naac', label: 'NAAC Scorecard' },
  { key: 'faculty_development', label: 'Faculty Dev' },
  { key: 'achievements', label: 'Achievements' },
  { key: 'director', label: 'Director Console' },
  { key: 'parent_portal', label: 'Parent Portal' },
];

// Sensible default permissions per role
const DEFAULT_PERMISSIONS: Record<string, Record<string, { read: boolean; write: boolean; delete: boolean }>> = {
  Admin: Object.fromEntries(ALL_MODULES.map(m => [m.key, { read: true, write: true, delete: true }])),
  Director: Object.fromEntries(ALL_MODULES.map(m => [m.key, { read: true, write: false, delete: false }])),
  Principal: Object.fromEntries(ALL_MODULES.map(m => [m.key, { read: true, write: false, delete: false }])),
  HOD: Object.fromEntries(ALL_MODULES.map(m => [m.key, { read: true, write: ['attendance', 'obe', 'students'].includes(m.key), delete: false }])),
  Teacher: Object.fromEntries(ALL_MODULES.map(m => [m.key, { read: ['dashboard', 'attendance', 'timetable', 'exams', 'obe', 'students', 'notices'].includes(m.key), write: ['attendance', 'obe'].includes(m.key), delete: false }])),
  Staff: Object.fromEntries(ALL_MODULES.map(m => [m.key, { read: ['dashboard', 'attendance', 'timetable', 'hr', 'notices'].includes(m.key), write: ['attendance'].includes(m.key), delete: false }])),
  Student: Object.fromEntries(ALL_MODULES.map(m => [m.key, { read: ['dashboard', 'attendance', 'timetable', 'fees', 'exams', 'canteen', 'hostel', 'library', 'placements', 'events', 'gym', 'transit', 'notices', 'idcards', 'obe'].includes(m.key), write: false, delete: false }])),
  Parent: Object.fromEntries(ALL_MODULES.map(m => [m.key, { read: ['dashboard', 'attendance', 'fees', 'exams', 'notices', 'parent_portal'].includes(m.key), write: false, delete: false }])),
  Warden: Object.fromEntries(ALL_MODULES.map(m => [m.key, { read: ['dashboard', 'hostel', 'gate', 'notices'].includes(m.key), write: ['hostel', 'gate'].includes(m.key), delete: false }])),
  Security: Object.fromEntries(ALL_MODULES.map(m => [m.key, { read: ['dashboard', 'gate', 'notices'].includes(m.key), write: ['gate'].includes(m.key), delete: false }])),
  Vendor: Object.fromEntries(ALL_MODULES.map(m => [m.key, { read: ['dashboard', 'canteen'].includes(m.key), write: ['canteen'].includes(m.key), delete: false }])),
  Driver: Object.fromEntries(ALL_MODULES.map(m => [m.key, { read: ['dashboard', 'transit'].includes(m.key), write: false, delete: false }])),
  TPO: Object.fromEntries(ALL_MODULES.map(m => [m.key, { read: ['dashboard', 'placements', 'students'].includes(m.key), write: ['placements'].includes(m.key), delete: false }])),
  Librarian: Object.fromEntries(ALL_MODULES.map(m => [m.key, { read: ['dashboard', 'library'].includes(m.key), write: ['library'].includes(m.key), delete: false }])),
  'Gym Trainer': Object.fromEntries(ALL_MODULES.map(m => [m.key, { read: ['dashboard', 'gym'].includes(m.key), write: ['gym'].includes(m.key), delete: false }])),
  'IQAC Coordinator': Object.fromEntries(ALL_MODULES.map(m => [m.key, { read: ['dashboard', 'obe', 'naac'].includes(m.key), write: ['obe', 'naac'].includes(m.key), delete: false }])),
  'Admissions Officer': Object.fromEntries(ALL_MODULES.map(m => [m.key, { read: ['dashboard', 'admissions'].includes(m.key), write: ['admissions'].includes(m.key), delete: false }])),
};

export default function AdminPermissionsPage() {
  const [permissions, setPermissions] = useState<ModulePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedRole, setSelectedRole] = useState('Teacher');
  const [hasExisting, setHasExisting] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [institutionId, setInstitutionId] = useState('');
  const [instituteType, setInstituteType] = useState('college');

  useEffect(() => {
    const saved = localStorage.getItem('iris_user_profile');
    if (saved) {
      try {
        const p = JSON.parse(saved);
        setInstitutionId(p.institution_id || '');
        setInstituteType(p.institute_type || 'college');
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (institutionId) fetchPermissions();
  }, [institutionId]);

  const fetchPermissions = async () => {
    setLoading(true);
    setSaveMsg(null);
    try {
      const res = await getRolePermissions(institutionId);
      if (res.success && res.permissions && res.permissions.length > 0) {
        setPermissions(res.permissions);
        setHasExisting(true);
      } else {
        // Load defaults
        loadDefaults();
      }
    } catch (err) {
      console.error(err);
      loadDefaults();
    } finally { setLoading(false); }
  };

  const loadDefaults = () => {
    const perms: ModulePermission[] = [];
    for (const role of ALL_ROLES) {
      for (const mod of ALL_MODULES) {
        const def = DEFAULT_PERMISSIONS[role]?.[mod.key] || { read: false, write: false, delete: false };
        perms.push({
          role,
          module: mod.key,
          can_read: def.read,
          can_write: def.write,
          can_delete: def.delete,
        });
      }
    }
    setPermissions(perms);
    setHasExisting(false);
  };

  const updatePerm = (role: string, module: string, field: 'can_read' | 'can_write' | 'can_delete', value: boolean) => {
    setPermissions(prev => {
      const idx = prev.findIndex(p => p.role === role && p.module === module);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], [field]: value };
        return updated;
      }
      return [...prev, { role, module, can_read: field === 'can_read' ? value : false, can_write: field === 'can_write' ? value : false, can_delete: field === 'can_delete' ? value : false }];
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await setRolePermissions(institutionId, permissions);
      if (res.success) {
        setSaveMsg({ type: 'success', text: 'Permissions saved successfully!' });
        setHasExisting(true);
      } else {
        setSaveMsg({ type: 'error', text: res.error || 'Failed to save.' });
      }
    } catch (err: any) {
      setSaveMsg({ type: 'error', text: err.message });
    } finally { setSaving(false); }
  };

  const handleSeed = async () => {
    setSaving(true);
    try {
      const res = await seedPermissions(institutionId);
      if (res.success) {
        alert('Default permissions seeded! Refreshing...');
        fetchPermissions();
      } else {
        alert('Seed failed: ' + (res.error || 'Unknown'));
      }
    } catch (err: any) { alert('Error: ' + err.message); }
    finally { setSaving(false); }
  };

  const getPerm = (role: string, module: string): ModulePermission => {
    return permissions.find(p => p.role === role && p.module === module) || {
      role, module, can_read: false, can_write: false, can_delete: false,
    };
  };

  const roleModules = ALL_MODULES.filter(m => {
    // Only show modules relevant to the selected role
    const def = DEFAULT_PERMISSIONS[selectedRole]?.[m.key];
    return def && (def.read || def.write || def.delete);
  });

  const displayModules = roleModules.length > 0 ? roleModules : ALL_MODULES;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
            <Sliders size={20} className="text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Role Permissions</h1>
            <p className="text-sm text-slate-400">Configure what each role can read, write, and delete</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSeed} disabled={saving}
            className="px-3 py-2 bg-white/5 text-slate-300 rounded-lg hover:bg-white/10 text-sm flex items-center gap-1">
            <Database size={14} /> Seed Defaults
          </button>
          <button onClick={fetchPermissions}
            className="px-3 py-2 bg-white/5 text-slate-300 rounded-lg hover:bg-white/10 text-sm flex items-center gap-1">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 text-sm font-medium flex items-center gap-2 disabled:opacity-50">
            <Save size={14} /> {saving ? 'Saving...' : 'Save All'}
          </button>
        </div>
      </div>

      {saveMsg && (
        <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
          saveMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'
        }`}>
          {saveMsg.type === 'success' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
          {saveMsg.text}
        </div>
      )}

      {/* Role selector */}
      <div className="flex flex-wrap gap-2">
        {getVisibleRoles(instituteType).map(role => (
          <button key={role} onClick={() => setSelectedRole(role)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedRole === role
                ? 'bg-cyan-600 text-white'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}>
            {role}
          </button>
        ))}
      </div>

      {/* Permission Matrix for selected role */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading permissions...</div>
      ) : (
        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h3 className="text-sm font-bold text-white">
              {selectedRole} — Module Permissions
            </h3>
            <p className="text-xs text-slate-400 mt-1">Toggle access for each module. Changes are staged until you click Save.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-3 text-slate-400 w-48">Module</th>
                  <th className="text-center p-3 text-slate-400 w-24">Read</th>
                  <th className="text-center p-3 text-slate-400 w-24">Write</th>
                  <th className="text-center p-3 text-slate-400 w-24">Delete</th>
                </tr>
              </thead>
              <tbody>
                {ALL_MODULES.map(mod => {
                  const perm = getPerm(selectedRole, mod.key);
                  return (
                    <tr key={mod.key} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-3 text-white font-medium text-xs">{mod.label}</td>
                      <td className="p-3 text-center">
                        <button onClick={() => updatePerm(selectedRole, mod.key, 'can_read', !perm.can_read)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                            perm.can_read ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-slate-500 border border-white/10'
                          }`}>
                          {perm.can_read ? <Check size={14} /> : <X size={14} />}
                        </button>
                      </td>
                      <td className="p-3 text-center">
                        <button onClick={() => updatePerm(selectedRole, mod.key, 'can_write', !perm.can_write)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                            perm.can_write ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-white/5 text-slate-500 border border-white/10'
                          }`}>
                          {perm.can_write ? <Check size={14} /> : <X size={14} />}
                        </button>
                      </td>
                      <td className="p-3 text-center">
                        <button onClick={() => updatePerm(selectedRole, mod.key, 'can_delete', !perm.can_delete)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                            perm.can_delete ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/5 text-slate-500 border border-white/10'
                          }`}>
                          {perm.can_delete ? <Check size={14} /> : <X size={14} />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Reference */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-5">
        <h3 className="text-sm font-bold text-white mb-3">Permission Legend</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-emerald-500/20 flex items-center justify-center text-emerald-400"><Check size={12} /></div>
            <span className="text-slate-300"><strong>Read</strong> — View data in this module</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-amber-500/20 flex items-center justify-center text-amber-400"><Check size={12} /></div>
            <span className="text-slate-300"><strong>Write</strong> — Create, edit, and modify data</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-red-500/20 flex items-center justify-center text-red-400"><Check size={12} /></div>
            <span className="text-slate-300"><strong>Delete</strong> — Remove records permanently</span>
          </div>
        </div>
      </div>
    </div>
  );
}
