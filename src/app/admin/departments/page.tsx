"use client";

import React, { useState, useEffect } from 'react';
import {
  Building2, Plus, Search, RefreshCw, Edit2, Trash2, X, Check, AlertTriangle, CheckCircle
} from 'lucide-react';
import { apiGet, apiPost, apiPut, apiDelete } from '../../../lib/api';

interface Department {
  id: string;
  name: string;
  code?: string;
  created_at?: string;
}

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [institutionId, setInstitutionId] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [addForm, setAddForm] = useState({ name: '', code: '' });
  const [editForm, setEditForm] = useState({ name: '', code: '' });
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('iris_user_profile');
    if (saved) {
      try {
        const p = JSON.parse(saved);
        setInstitutionId(p.institution_id || '');
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (institutionId) fetchDepartments();
  }, [institutionId]);

  const fetchDepartments = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await apiGet('campusCore/departments', { institution_id: institutionId });
      if (res.success) {
        setDepartments(res.departments || []);
      } else {
        setMsg({ type: 'error', text: res.error || 'Failed to load departments.' });
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!addForm.name.trim()) {
      setMsg({ type: 'error', text: 'Department name is required.' });
      return;
    }
    setSaving(true);
    try {
      const res = await apiPost('campusCore/departments', {
        name: addForm.name,
        institution_id: institutionId,
      });
      if (res.success) {
        setMsg({ type: 'success', text: 'Department created!' });
        setShowAddModal(false);
        setAddForm({ name: '', code: '' });
        fetchDepartments();
      } else {
        setMsg({ type: 'error', text: res.error || 'Failed to create.' });
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedDept || !editForm.name.trim()) return;
    setSaving(true);
    try {
      const res = await apiPut('campusCore/departments', {
        id: selectedDept.id,
        name: editForm.name,
      });
      if (res.success) {
        setMsg({ type: 'success', text: 'Department updated!' });
        setShowEditModal(false);
        setSelectedDept(null);
        fetchDepartments();
      } else {
        setMsg({ type: 'error', text: res.error || 'Failed to update.' });
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (dept: Department) => {
    if (!confirm(`Delete department "${dept.name}"? This cannot be undone.`)) return;
    try {
      const res = await apiDelete(`campusCore/departments?id=${dept.id}`);
      if (res.success) {
        setMsg({ type: 'success', text: 'Department deleted.' });
        fetchDepartments();
      } else {
        setMsg({ type: 'error', text: res.error || 'Failed to delete.' });
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    }
  };

  const openEdit = (dept: Department) => {
    setSelectedDept(dept);
    setEditForm({ name: dept.name, code: dept.code || '' });
    setShowEditModal(true);
  };

  const filtered = search
    ? departments.filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || (d.code && d.code.toLowerCase().includes(search.toLowerCase())))
    : departments;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
            <Building2 size={20} className="text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Departments</h1>
            <p className="text-sm text-slate-400">Manage academic departments for your institution</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchDepartments}
            className="px-3 py-2 bg-white/5 text-slate-300 rounded-lg hover:bg-white/10 text-sm flex items-center gap-1">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 text-sm font-medium flex items-center gap-2">
            <Plus size={14} /> Add Department
          </button>
        </div>
      </div>

      {/* Message */}
      {msg && (
        <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
          msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'
        }`}>
          {msg.type === 'success' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
          {msg.text}
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search departments..."
            className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50" />
        </div>
        <span className="text-xs text-slate-500">{filtered.length} department{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading departments...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Building2 size={40} className="mx-auto mb-3 text-slate-600" />
          <p className="text-sm text-slate-400">No departments found</p>
          <button onClick={() => setShowAddModal(true)} className="mt-3 text-sm text-purple-400 hover:text-purple-300">
            Create your first department
          </button>
        </div>
      ) : (
        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-slate-400 font-medium">Name</th>
                <th className="text-left p-4 text-slate-400 font-medium">Code</th>
                <th className="text-left p-4 text-slate-400 font-medium">Created</th>
                <th className="text-right p-4 text-slate-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(dept => (
                <tr key={dept.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
                        <Building2 size={14} className="text-purple-400" />
                      </div>
                      <span className="text-white font-medium">{dept.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-300">{dept.code || '—'}</td>
                  <td className="p-4 text-slate-400 text-xs">
                    {dept.created_at ? new Date(dept.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(dept)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(dept)}
                        className="p-1.5 rounded-lg hover:bg-red-500/15 text-slate-400 hover:text-red-400 transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowAddModal(false)}>
          <div className="bg-[#1A1130] rounded-2xl border border-white/10 p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Add Department</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Department Name *</label>
                <input value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="e.g. Computer Science"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Code (optional)</label>
                <input value={addForm.code} onChange={e => setAddForm({ ...addForm, code: e.target.value })}
                  placeholder="e.g. CS"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-slate-300 hover:text-white text-sm">Cancel</button>
              <button onClick={handleAdd} disabled={saving}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 text-sm font-medium disabled:opacity-50 flex items-center gap-2">
                <Check size={14} /> {saving ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowEditModal(false)}>
          <div className="bg-[#1A1130] rounded-2xl border border-white/10 p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Edit Department</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Department Name *</label>
                <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Code (optional)</label>
                <input value={editForm.code} onChange={e => setEditForm({ ...editForm, code: e.target.value })}
                  placeholder="e.g. CS"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-slate-300 hover:text-white text-sm">Cancel</button>
              <button onClick={handleEdit} disabled={saving}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 text-sm font-medium disabled:opacity-50 flex items-center gap-2">
                <Check size={14} /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
