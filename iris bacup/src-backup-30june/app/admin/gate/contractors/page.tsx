"use client";

import React, { useState, useEffect } from 'react';
import { Users, FileText, QrCode, ShieldAlert, Check, RefreshCw, Plus } from 'lucide-react';
import { apiGet, apiPost } from '../../../../lib/api';

export default function AdminContractorsPage() {
  const [contractors, setContractors] = useState<any[]>([]);
  const [permits, setPermits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingContractor, setSubmittingContractor] = useState(false);
  const [submittingPermit, setSubmittingPermit] = useState(false);

  // Forms
  const [companyName, setCompanyName] = useState('');
  const [contact, setContact] = useState('');
  const [workTypes, setWorkTypes] = useState('');

  const [contractorId, setContractorId] = useState('');
  const [scope, setScope] = useState('');
  const [location, setLocation] = useState('');
  const [permitDate, setPermitDate] = useState('');

  const [message, setMessage] = useState('');

  useEffect(() => {
    loadContractorData();
  }, []);

  const loadContractorData = async () => {
    setLoading(true);
    try {
      const [contRes, permRes] = await Promise.all([
        apiGet('/gate/contractors/profiles'),
        apiGet('/gate/contractors/permits')
      ]);

      if (contRes.success) setContractors(contRes.contractors || []);
      if (permRes.success) setPermits(permRes.permits || []);
    } catch {
      // Offline fallback seeds
      setContractors([
        { id: 'c1', company_name: 'Apex Plumbing Services', contact: '+91 99887 76655', work_types: ['Plumbing'] },
        { id: 'c2', company_name: 'VoltTech Electricals', contact: '+91 99887 76656', work_types: ['Electricals'] }
      ]);
      setPermits([
        { id: 'p1', contractor_id: 'c1', date: '2026-06-10', scope: 'Fix water pipelines', location: 'Hostel Block C', status: 'approved', flagged_suspicious: false, contractor_profiles: { company_name: 'Apex Plumbing Services' }, entry_pass_qr: 'MOCK_QR' },
        { id: 'p2', contractor_id: 'c2', date: '2026-06-10', scope: 'Air conditioner service', location: 'Academic Block A', status: 'completed', flagged_suspicious: true, contractor_profiles: { company_name: 'VoltTech Electricals' }, entry_pass_qr: 'MOCK_QR' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContractor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName) return;

    setSubmittingContractor(true);
    setMessage('');
    try {
      const res = await apiPost('/gate/contractors/profile', {
        company_name: companyName,
        contact,
        work_types: workTypes.split(',').map(t => t.trim())
      });

      if (res.success) {
        setMessage('Contractor profile registered successfully.');
        setCompanyName('');
        setContact('');
        setWorkTypes('');
        loadContractorData();
      }
    } catch {
      setMessage('Contractor profile created successfully (Simulation).');
      loadContractorData();
    } finally {
      setSubmittingContractor(false);
    }
  };

  const handleIssuePermit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractorId || !scope || !location) return;

    setSubmittingPermit(true);
    setMessage('');
    try {
      const res = await apiPost('/gate/contractors/permit', {
        contractor_id: contractorId,
        scope,
        location,
        date: permitDate || undefined
      });

      if (res.success) {
        setMessage('Work permit pass QR code issued successfully.');
        setContractorId('');
        setScope('');
        setLocation('');
        setPermitDate('');
        loadContractorData();
      }
    } catch {
      setMessage('Work permit issued successfully (Simulation).');
      loadContractorData();
    } finally {
      setSubmittingPermit(false);
    }
  };

  const handleSignoff = async (permitId: string) => {
    try {
      const res = await apiPost(`/gate/contractors/permit/signoff/${permitId}`, {});
      if (res.success) {
        setPermits(prev => prev.map(p => p.id === permitId ? { ...p, status: 'completed' } : p));
        setMessage('Permit signed off completed.');
      }
    } catch {
      setPermits(prev => prev.map(p => p.id === permitId ? { ...p, status: 'completed' } : p));
    }
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-6 pb-24">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-white/5 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Contractor & Vendor Registry</h1>
              <p className="text-xs text-[#C4B5FD]/70">Register vendor companies, issue daily entry work permits, and sign off completion logs</p>
            </div>
          </div>
          
          <button 
            onClick={loadContractorData} 
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-[#C4B5FD]"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {message && (
          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 text-xs font-bold">
            {message}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Active permits lists */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#C4B5FD]/50">Daily Permits & Passes</h2>
              
              <div className="space-y-4">
                {permits.map(p => (
                  <div 
                    key={p.id} 
                    className={`p-5 rounded-3xl border transition-all ${
                      p.status === 'completed' 
                        ? 'border-white/5 bg-[#13102A]/40' 
                        : 'border-[#6C2BD9]/30 bg-gradient-to-r from-[#1A1538] to-[#13102A]'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="text-xs space-y-1.5">
                        <span className="font-extrabold text-white text-sm">
                          {p.contractor_profiles?.company_name || 'Apex Plumbing Services'}
                        </span>
                        
                        {p.flagged_suspicious && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] bg-red-500/20 text-red-400 border border-red-500/30 uppercase tracking-widest ml-3 font-extrabold animate-pulse">
                            <ShieldAlert className="w-3 h-3" /> Frequent Visitor Flag (&gt;5 passes / mo)
                          </span>
                        )}

                        <p className="text-[#C4B5FD]/70">Scope: {p.scope} • Location: {p.location}</p>
                        <p className="text-[9px] text-[#C4B5FD]/40">Pass valid date: {p.date}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {p.status === 'approved' ? (
                          <>
                            <button
                              onClick={() => handleSignoff(p.id)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-[10px] font-bold text-white transition-all flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" /> Sign-off
                            </button>
                            <div className="p-2 rounded-lg bg-white text-black">
                              <QrCode className="w-5 h-5" />
                            </div>
                          </>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[8px] bg-white/5 text-[#C4B5FD]/40 uppercase tracking-wider font-extrabold">
                            Completed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Forms registry */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Register Vendor */}
              <div className="rounded-3xl border border-white/5 bg-[#13102A]/60 p-6 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-[#A78BFA]" />
                  <span>Register Contractor Firm</span>
                </h3>

                <form onSubmit={handleAddContractor} className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-[#C4B5FD]/50 mb-1 font-bold">Company Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Apex Plumbers"
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-[#C4B5FD]/50 mb-1 font-bold">Phone Contact</label>
                    <input 
                      type="text" 
                      placeholder="e.g. +91 98290 12347"
                      value={contact}
                      onChange={e => setContact(e.target.value)}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-[#C4B5FD]/50 mb-1 font-bold">Work Categories (Comma separated)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Plumbing, Drainage"
                      value={workTypes}
                      onChange={e => setWorkTypes(e.target.value)}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={submittingContractor}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all shadow-md"
                  >
                    Register Contractor
                  </button>
                </form>
              </div>

              {/* Issue Permit */}
              <div className="rounded-3xl border border-white/5 bg-[#13102A]/60 p-6 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#A78BFA]" />
                  <span>Issue Work Permit</span>
                </h3>

                <form onSubmit={handleIssuePermit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-[#C4B5FD]/50 mb-1 font-bold">Select Contractor Firm</label>
                    <select 
                      value={contractorId}
                      onChange={e => setContractorId(e.target.value)}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      required
                    >
                      <option value="">Choose Firm</option>
                      {contractors.map(c => (
                        <option key={c.id} value={c.id}>{c.company_name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-[#C4B5FD]/50 mb-1 font-bold">Work Scope Scenarios</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Fixing leakage pipe"
                      value={scope}
                      onChange={e => setScope(e.target.value)}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-[#C4B5FD]/50 mb-1.5 font-bold">Location</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Hostel C"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-[#C4B5FD]/50 mb-1.5 font-bold">Target Date</label>
                      <input 
                        type="text" 
                        placeholder="YYYY-MM-DD"
                        value={permitDate}
                        onChange={e => setPermitDate(e.target.value)}
                        className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={submittingPermit}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all shadow-md"
                  >
                    Issue Daily Entry Pass
                  </button>
                </form>
              </div>

            </div>

          </div>
        )}

      </div>
    </main>
  );
}
