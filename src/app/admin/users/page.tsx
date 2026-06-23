"use client";

import React, { useState, useEffect } from 'react';
import {
  Users, UserPlus, Search, Shield, CheckCircle, XCircle, RefreshCw,
  MoreVertical, Key, UserX, UserCheck, ChevronDown, X, Eye, EyeOff, Mail, Phone, Building2
} from 'lucide-react';
import { apiGet, apiPost, apiPut } from '../../../lib/api';
import { getRoleLabel } from '../../../lib/roleLabels';

const ALL_ROLES = [
  { value: 'Admin', label: 'Admin', color: 'text-violet-400 bg-violet-500/20' },
  { value: 'Director', label: 'Director', color: 'text-amber-400 bg-amber-500/20' },
  { value: 'Principal', label: 'Principal', color: 'text-purple-400 bg-purple-500/20' },
  { value: 'HOD', label: 'HOD', color: 'text-cyan-400 bg-cyan-500/20' },
  { value: 'Teacher', label: 'Teacher', color: 'text-emerald-400 bg-emerald-500/20' },
  { value: 'Staff', label: 'Staff', color: 'text-blue-400 bg-blue-500/20' },
  { value: 'TPO', label: 'TPO', color: 'text-indigo-400 bg-indigo-500/20' },
  { value: 'Librarian', label: 'Librarian', color: 'text-teal-400 bg-teal-500/20' },
  { value: 'Gym Trainer', label: 'Gym Trainer', color: 'text-orange-400 bg-orange-500/20' },
  { value: 'IQAC Coordinator', label: 'IQAC Coordinator', color: 'text-pink-400 bg-pink-500/20' },
  { value: 'Admissions Officer', label: 'Admissions Officer', color: 'text-rose-400 bg-rose-500/20' },
  { value: 'Warden', label: 'Warden', color: 'text-green-400 bg-green-500/20' },
  { value: 'Security', label: 'Security', color: 'text-red-400 bg-red-500/20' },
  { value: 'Vendor', label: 'Vendor', color: 'text-yellow-400 bg-yellow-500/20' },
  { value: 'Driver', label: 'Driver', color: 'text-orange-400 bg-orange-500/20' },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [instituteType, setInstituteType] = useState('college');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedProfile = localStorage.getItem('iris_user_profile');
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          setInstituteType(parsed.institute_type || 'college');
        } catch (e) {}
      }
    }
  }, []);
  const [activeFilter, setActiveFilter] = useState('true');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [page, setPage] = useState(1);

  const [addForm, setAddForm] = useState({
    name: '', email: '', phone: '', role: 'Teacher', department_id: '', employee_id: '', password: 'password123',
  });
  const [editForm, setEditForm] = useState({ name: '', phone: '', role: '', department_id: '', employee_id: '', is_active: true });
  const [resetPassword, setResetPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchUsers(); fetchDepartments(); fetchStats(); }, [roleFilter, activeFilter, page]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (roleFilter) params.set('role', roleFilter);
      if (activeFilter) params.set('is_active', activeFilter);
      if (search) params.set('search', search);
      params.set('page', String(page));
      params.set('limit', '50');

      const res = await apiGet(`campusCore/users?${params.toString()}`);
      if (res.success) {
        setUsers(res.users || []);
        setTotal(res.total || 0);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchDepartments = async () => {
    try {
      const res = await apiGet('campusCore/users/departments');
      if (res.success) setDepartments(res.departments || []);
    } catch {}
  };

  const fetchStats = async () => {
    try {
      const res = await apiGet('campusCore/users/stats');
      if (res.success) setStats(res.stats || {});
    } catch {}
  };

  const handleSearch = () => { setPage(1); fetchUsers(); };

  const handleAddUser = async () => {
    setSaving(true);
    try {
      const res = await apiPost('campusCore/users', addForm);
      if (res.success) {
        alert(res.message || 'User created!');
        setShowAddModal(false);
        setAddForm({ name: '', email: '', phone: '', role: 'Teacher', department_id: '', employee_id: '', password: 'password123' });
        fetchUsers();
        fetchStats();
      } else {
        alert('Failed: ' + (res.error || 'Unknown error'));
      }
    } catch (err: any) { alert('Error: ' + err.message); }
    finally { setSaving(false); }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      const res = await apiPut(`campusCore/users/${selectedUser.id}`, editForm);
      if (res.success) {
        alert('User updated!');
        setShowEditModal(false);
        setSelectedUser(null);
        fetchUsers();
        fetchStats();
      } else {
        alert('Failed: ' + (res.error || 'Unknown error'));
      }
    } catch (err: any) { alert('Error: ' + err.message); }
    finally { setSaving(false); }
  };

  const handleDeactivate = async (userId: string) => {
    if (!confirm('Deactivate this user?')) return;
    try {
      await apiPost(`campusCore/users/${userId}/deactivate`, {});
      fetchUsers();
      fetchStats();
    } catch (err: any) { alert(err.message); }
  };

  const handleReactivate = async (userId: string) => {
    try {
      await apiPost(`campusCore/users/${userId}/reactivate`, {});
      fetchUsers();
      fetchStats();
    } catch (err: any) { alert(err.message); }
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !resetPassword) return;
    setSaving(true);
    try {
      const res = await apiPost(`campusCore/users/${selectedUser.id}/reset-password`, { password: resetPassword });
      if (res.success) {
        alert('Password reset!');
        setShowPasswordModal(false);
        setSelectedUser(null);
        setResetPassword('');
      } else {
        alert('Failed: ' + (res.error || 'Unknown error'));
      }
    } catch (err: any) { alert('Error: ' + err.message); }
    finally { setSaving(false); }
  };

  const openEdit = (user: any) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name || '',
      phone: user.phone || '',
      role: user.role || '',
      department_id: user.department_id || '',
      employee_id: user.employee_id || '',
      is_active: user.is_active !== false,
    });
    setShowEditModal(true);
  };

  const getRoleStyle = (role: string) => {
    return ALL_ROLES.find(r => r.value === role)?.color || 'text-slate-400 bg-slate-500/20';
  };

  const filteredUsers = search
    ? users.filter(u => u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))
    : users;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
            <Users size={20} className="text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">User Management</h1>
            <p className="text-sm text-slate-400">{total} total users in your institution</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { fetchUsers(); fetchStats(); }}
            className="px-3 py-2 bg-white/5 text-slate-300 rounded-lg hover:bg-white/10 text-sm flex items-center gap-1">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500 text-sm font-medium flex items-center gap-2">
            <UserPlus size={14} /> Add User
          </button>
        </div>
      </div>

      {/* Role Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {ALL_ROLES.filter(r => stats[r.value]).map(r => (
          <div key={r.value} className="bg-white/5 rounded-xl border border-white/10 p-3 text-center">
            <p className="text-lg font-bold text-white">{stats[r.value] || 0}</p>
            <p className="text-xs text-slate-400">{getRoleLabel(r.value, instituteType)}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search by name, email, or employee ID..."
            className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50" />
        </div>
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/50">
          <option value="">All Roles</option>
          {ALL_ROLES.map(r => <option key={r.value} value={r.value}>{getRoleLabel(r.value, instituteType)}</option>)}
        </select>
        <select value={activeFilter} onChange={e => { setActiveFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/50">
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading users...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Users size={40} className="mx-auto mb-3 opacity-50" />
          <p>No users found.</p>
        </div>
      ) : (
        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-3 text-slate-400">User</th>
                  <th className="text-left p-3 text-slate-400">Role</th>
                  <th className="text-left p-3 text-slate-400">Department</th>
                  <th className="text-center p-3 text-slate-400">Status</th>
                  <th className="text-left p-3 text-slate-400">Last Login</th>
                  <th className="text-right p-3 text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/30 to-purple-500/30 flex items-center justify-center text-xs font-bold text-white">
                          {user.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="text-white font-medium">{user.name}</p>
                          <p className="text-xs text-slate-400">{user.email}</p>
                          {user.employee_id && <p className="text-[10px] text-slate-500">ID: {user.employee_id}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRoleStyle(user.role)}`}>
                        {getRoleLabel(user.role, instituteType)}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300 text-xs">
                      {user.departments?.name || '—'}
                    </td>
                    <td className="p-3 text-center">
                      {user.is_active !== false ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">Active</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">Inactive</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-400 text-xs">
                      {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(user)} title="Edit"
                          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white text-xs">Edit</button>
                        <button onClick={() => { setSelectedUser(user); setShowPasswordModal(true); }} title="Reset Password"
                          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-amber-400 text-xs">Password</button>
                        {user.is_active !== false ? (
                          <button onClick={() => handleDeactivate(user.id)} title="Deactivate"
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 text-xs">Deactivate</button>
                        ) : (
                          <button onClick={() => handleReactivate(user.id)} title="Reactivate"
                            className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-400 text-xs">Reactivate</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {total > 50 && (
            <div className="flex items-center justify-between p-3 border-t border-white/5">
              <span className="text-xs text-slate-400">Showing {filteredUsers.length} of {total}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1 bg-white/5 rounded text-xs text-slate-300 hover:bg-white/10 disabled:opacity-30">Prev</button>
                <span className="px-3 py-1 text-xs text-slate-400">Page {page}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={filteredUsers.length < 50}
                  className="px-3 py-1 bg-white/5 rounded text-xs text-slate-300 hover:bg-white/10 disabled:opacity-30">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#120F22] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus size={18} className="text-violet-400" /> Add New User
              </h2>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Full Name *</label>
                <input type="text" value={addForm.name} onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Dr. Rajesh Kumar"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Email *</label>
                <input type="email" value={addForm.email} onChange={e => setAddForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="rajesh@siet.edu.in"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">Phone</label>
                  <input type="text" value={addForm.phone} onChange={e => setAddForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+919876543210"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">Employee ID</label>
                  <input type="text" value={addForm.employee_id} onChange={e => setAddForm(p => ({ ...p, employee_id: e.target.value }))}
                    placeholder="FAC001"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">Role *</label>
                  <select value={addForm.role} onChange={e => setAddForm(p => ({ ...p, role: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/50">
                    {ALL_ROLES.map(r => <option key={r.value} value={r.value}>{getRoleLabel(r.value, instituteType)}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">Department</label>
                  <select value={addForm.department_id} onChange={e => setAddForm(p => ({ ...p, department_id: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/50">
                    <option value="">None</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Initial Password *</label>
                <div className="relative">
                  <input type={showPwd ? 'text' : 'password'} value={addForm.password}
                    onChange={e => setAddForm(p => ({ ...p, password: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 pr-10" />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                    {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">User can change after first login. Default: password123</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 bg-white/5 text-slate-300 rounded-lg hover:bg-white/10 text-sm">Cancel</button>
                <button onClick={handleAddUser} disabled={saving || !addForm.name || !addForm.email}
                  className="flex-1 px-4 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-500 text-sm font-medium disabled:opacity-50">
                  {saving ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#120F22] border border-white/10 rounded-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="text-lg font-bold text-white">Edit User</h2>
              <button onClick={() => setShowEditModal(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Name</label>
                <input type="text" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/50" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Phone</label>
                <input type="text" value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">Role</label>
                  <select value={editForm.role} onChange={e => setEditForm(p => ({ ...p, role: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/50">
                    {ALL_ROLES.map(r => <option key={r.value} value={r.value}>{getRoleLabel(r.value, instituteType)}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">Department</label>
                  <select value={editForm.department_id} onChange={e => setEditForm(p => ({ ...p, department_id: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/50">
                    <option value="">None</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Employee ID</label>
                <input type="text" value={editForm.employee_id} onChange={e => setEditForm(p => ({ ...p, employee_id: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/50" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={editForm.is_active} onChange={e => setEditForm(p => ({ ...p, is_active: e.target.checked }))}
                  className="rounded" />
                <label className="text-sm text-slate-300">Active</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2.5 bg-white/5 text-slate-300 rounded-lg hover:bg-white/10 text-sm">Cancel</button>
                <button onClick={handleEditUser} disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-500 text-sm font-medium disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#120F22] border border-white/10 rounded-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><Key size={16} /> Reset Password</h2>
              <button onClick={() => setShowPasswordModal(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-300">Reset password for <strong>{selectedUser.name}</strong></p>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">New Password</label>
                <input type={showPwd ? 'text' : 'password'} value={resetPassword}
                  onChange={e => setResetPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowPasswordModal(false)}
                  className="flex-1 px-4 py-2.5 bg-white/5 text-slate-300 rounded-lg hover:bg-white/10 text-sm">Cancel</button>
                <button onClick={handleResetPassword} disabled={saving || resetPassword.length < 8}
                  className="flex-1 px-4 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-500 text-sm font-medium disabled:opacity-50">
                  {saving ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
