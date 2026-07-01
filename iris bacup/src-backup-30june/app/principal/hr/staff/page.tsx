"use client";

import React, { useState, useEffect } from 'react';
import { Users, Search, Mail, Phone, Briefcase } from 'lucide-react';
import { apiGet } from '../../../../lib/api';

export default function PrincipalStaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiGet('campusCore/hr/staff');
        if (res.success) setStaff(res.staff || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const departments = Array.from(new Set(staff.map(s => s.department_name).filter(Boolean)));
  const filtered = staff.filter(s =>
    (deptFilter === 'all' || s.department_name === deptFilter) &&
    (!search || s.full_name?.toLowerCase().includes(search.toLowerCase()) || s.employee_id?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <Users size={24} className="text-purple-400" />
        Staff Directory
        {staff.length > 0 && (
          <span className="bg-purple-500/20 text-purple-400 text-sm px-2 py-0.5 rounded-full">{staff.length}</span>
        )}
      </h1>

      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
            placeholder="Search by name or ID..." />
        </div>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
          <option value="all">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading staff...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">No staff found.</div>
      ) : (
        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-3 text-slate-400 font-medium">Name</th>
                <th className="text-left p-3 text-slate-400 font-medium">Employee ID</th>
                <th className="text-left p-3 text-slate-400 font-medium">Department</th>
                <th className="text-left p-3 text-slate-400 font-medium">Designation</th>
                <th className="text-left p-3 text-slate-400 font-medium">Email</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-xs">
                        {s.full_name?.charAt(0) || '?'}
                      </div>
                      <span className="text-white font-medium">{s.full_name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-slate-300">{s.employee_id}</td>
                  <td className="p-3 text-slate-300">{s.department_name || '—'}</td>
                  <td className="p-3 text-slate-300">{s.designation || s.role}</td>
                  <td className="p-3 text-slate-300 flex items-center gap-1"><Mail size={12} /> {s.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
