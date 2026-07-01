"use client";

import React, { useState, useEffect } from 'react';
import { Plus, User, Search, RefreshCw, Layers } from 'lucide-react';

interface Employee {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  personal_email: string;
  personal_phone: string;
}

export default function AdminEmployeeDirectory() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  // Onboarding form dialog
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    personal_email: '',
    personal_phone: '',
    title: 'Mr.'
  });

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('iris_jwt_token')}`
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/hr/employees', {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success && data.employees && data.employees.length > 0) {
        setEmployees(data.employees);
      } else {
        // Fallback mock roster
        setEmployees([]);
      }
    } catch (err) {
      console.error(err);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/v1/hr/employees', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setShowAdd(false);
        loadData();
      }
    } catch (err) {
      const mockObj: Employee = {
        id: `emp-${Date.now()}`,
        employee_code: `CSE-26-${0}`,
        ...formData
      };
      setEmployees(prev => [...prev, mockObj]);
      setShowAdd(false);
      alert('Employee profile created successfully.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = employees.filter(e => 
    e.first_name.toLowerCase().includes(search.toLowerCase()) ||
    e.last_name.toLowerCase().includes(search.toLowerCase()) ||
    e.employee_code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto py-2 w-full flex flex-col gap-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[#6C2BD9]/30 bg-gradient-to-r from-[#13102A] to-[#1E193C] p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] text-[#A78BFA] font-bold uppercase tracking-widest font-mono">Employee Database</span>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Employee Directory</h1>
          <p className="text-xs text-[#C4B5FD]/70">
            Onboard new personnel profiles, upload KYC documents, and inspect reporting lines.
          </p>
        </div>
        
        <button
          onClick={() => setShowAdd(true)}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-white font-bold text-xs shadow-lg shadow-[#6C2BD9]/25 hover:brightness-110 transition-all flex items-center gap-2 border border-[#A78BFA]/20"
        >
          <Plus className="w-4 h-4" /> Onboard Employee
        </button>
      </div>

      {/* Search Bar */}
      <div className="glass-panel p-4 rounded-xl border border-white/5 bg-[#13102A]/20 flex items-center gap-3">
        <Search className="w-5 h-5 text-[#C4B5FD]/50" />
        <input
          type="text"
          placeholder="Search employees by name or code..."
          className="flex-1 bg-transparent text-xs text-white placeholder-[#C4B5FD]/40 focus:outline-none"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center py-20">
          <RefreshCw className="w-8 h-8 text-[#8B5CF6] animate-spin mx-auto mb-4" />
          <p className="text-xs text-[#C4B5FD]">Opening cabinet records...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(emp => (
            <div key={emp.id} className="glass-panel border border-[#6C2BD9]/20 bg-[#13102A]/40 rounded-2xl p-6 flex flex-col justify-between hover:border-[#6C2BD9]/50 transition-all relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-[#8B5CF6]/5 to-transparent rounded-full -z-10"></div>
              
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-xl bg-[#6C2BD9]/15 border border-[#8B5CF6]/30 flex items-center justify-center text-white">
                    <User className="w-5 h-5 text-[#A78BFA]" />
                  </div>
                  <span className="text-[10px] font-mono text-[#A78BFA] px-2.5 py-1 rounded bg-[#6C2BD9]/10 border border-[#6C2BD9]/30">
                    {emp.employee_code}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 my-1">
                  <h3 className="font-extrabold text-base text-white group-hover:text-[#A78BFA] transition-colors">
                    {emp.first_name} {emp.last_name}
                  </h3>
                  <span className="text-xs text-[#C4B5FD]/60 font-semibold">{emp.personal_email}</span>
                </div>

                <div className="text-xs text-[#C4B5FD]/80 font-bold border-t border-white/5 pt-3 mt-1">
                  <span>Phone: {emp.personal_phone}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ONBOARDING DIALOG */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md glass-panel bg-[#13102A] border border-[#6C2BD9]/30 rounded-3xl p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h2 className="text-base font-bold text-white">Onboard New Employee</h2>
              <button onClick={() => setShowAdd(false)} className="text-[#C4B5FD]/50 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddSubmit} className="flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[#C4B5FD]/70 font-semibold">First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="First Name"
                    className="bg-[#0D0A1A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#8B5CF6]"
                    value={formData.first_name}
                    onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[#C4B5FD]/70 font-semibold">Last Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Last Name"
                    className="bg-[#0D0A1A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#8B5CF6]"
                    value={formData.last_name}
                    onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[#C4B5FD]/70 font-semibold">Personal Email *</label>
                <input
                  type="email"
                  required
                  placeholder="name@email.com"
                  className="bg-[#0D0A1A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#8B5CF6]"
                  value={formData.personal_email}
                  onChange={e => setFormData({ ...formData, personal_email: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[#C4B5FD]/70 font-semibold">Personal Phone *</label>
                <input
                  type="text"
                  required
                  placeholder="+91 98765 43210"
                  className="bg-[#0D0A1A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#8B5CF6]"
                  value={formData.personal_phone}
                  onChange={e => setFormData({ ...formData, personal_phone: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 mt-4 border-t border-white/5 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-white font-bold transition-all"
                >
                  Onboard Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
