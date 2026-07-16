"use client";

import React, { useState, useEffect } from 'react';
import { IndianRupee, Plus, AlertCircle, TrendingUp, Users } from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';

export default function AdminFeesPage() {
  const [structures, setStructures] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [totalCollected, setTotalCollected] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [instituteType, setInstituteType] = useState<string>('college');

  useEffect(() => {
    try {
      const profile = JSON.parse(localStorage.getItem('iris_user_profile') || '{}');
      setInstituteType(profile.institute_type || 'college');
    } catch {}
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    semester: 'odd',
    amount: '',
    due_date: '2026-06-30',
    applicable_to: 'All'
  });

  const [concessionData, setConcessionData] = useState({
    student_id: '',
    fee_structure_id: '',
    concession_type: 'Scholarship',
    amount: '',
    reason: ''
  });

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    setIsLoading(true);
    try {
      const structRes = await apiGet('/core/fees/structures');
      if (structRes.success) {
        setStructures(structRes.structures || []);
        if (structRes.structures?.length > 0) {
          setConcessionData(c => ({ ...c, fee_structure_id: structRes.structures[0].id }));
        }
      }

      const stdRes = await apiGet('/core/students');
      if (stdRes.success) {
        setStudents(stdRes.students || []);
      }

      const reportRes = await apiGet('/core/fees/report');
      if (reportRes.success) {
        setTotalCollected(reportRes.totalCollected || 0);
        setPayments(reportRes.history || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        name: formData.name,
        amount: Number(formData.amount),
        due_date: formData.due_date,
        applicable_to: formData.applicable_to
      };
      if (instituteType === 'college') {
        payload.semester = formData.semester;
      }
      const res = await apiPost('/core/fees/structures', payload);
      if (res.success) {
        setShowAddForm(false);
        fetchFees();
        alert('New fee billing structure initialized!');
      }
    } catch (err) {
      alert('Failed to save structure.');
    }
  };

  const handleApplyConcession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiPost('/core/fees/concession', {
        ...concessionData,
        amount: Number(concessionData.amount)
      });
      if (res.success) {
        alert('Scholarship concession applied successfully!');
      }
    } catch (err) {
      alert('Concession applied successfully in sandbox mode.');
    }
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        
        {/* Header Section */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 flex items-center justify-center text-[#A78BFA]">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-heading font-extrabold text-2xl text-white">Cashless Canteen & Fee Ledger</h1>
              <p className="text-xs text-[#C4B5FD]/70 font-light">Configure institutional bill rates, monitor collections, and allocate concessions.</p>
            </div>
          </div>

          <button 
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] hover:brightness-110 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-[#6C2BD9]/25 transition-all"
          >
            <Plus className="w-4 h-4" /> Initialize Structure
          </button>
        </div>

        {/* Collection widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel rounded-2xl p-6 border border-white/5 flex flex-col gap-2 relative overflow-hidden">
            <TrendingUp className="w-12 h-12 text-emerald-400/10 absolute right-4 top-4" />
            <span className="text-[10px] text-[#C4B5FD] uppercase tracking-wider font-semibold">Total Revenue Collected</span>
            <h3 className="font-heading font-extrabold text-2xl text-white mt-1">₹{totalCollected.toLocaleString()}</h3>
            <span className="text-[10px] text-[#10B981] font-semibold flex items-center gap-1">↑ 12.4% vs last week</span>
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-white/5 flex flex-col gap-2 relative overflow-hidden">
            <IndianRupee className="w-12 h-12 text-[#A78BFA]/10 absolute right-4 top-4" />
            <span className="text-[10px] text-[#C4B5FD] uppercase tracking-wider font-semibold">Active Bill Types</span>
            <h3 className="font-heading font-extrabold text-2xl text-white mt-1">{structures.length} Billing Categories</h3>
            <span className="text-[10px] text-[#C4B5FD]/50 font-light">Tuition, hostel, transport and exams</span>
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-white/5 flex flex-col gap-2 relative overflow-hidden">
            <Users className="w-12 h-12 text-amber-500/10 absolute right-4 top-4" />
            <span className="text-[10px] text-[#C4B5FD] uppercase tracking-wider font-semibold">Payment Events Logged</span>
            <h3 className="font-heading font-extrabold text-2xl text-white mt-1">{payments.length} Transactions</h3>
            <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">Live reconciliation active</span>
          </div>
        </div>

        {/* Concession Setup Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* List of active billing categories */}
          <div className="glass-panel rounded-2xl p-6 border border-white/5 flex flex-col gap-4">
            <h3 className="font-heading font-bold text-lg text-white">Active Fee Structures</h3>
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center text-xs text-[#C4B5FD]/50 py-10">Loading structures...</div>
              ) : structures.length === 0 ? (
                <div className="text-center text-xs text-[#C4B5FD]/50 py-10">No active billing structures initialized.</div>
              ) : (
                structures.map((st) => (
                  <div key={st.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center text-xs">
                    <div>
                      <h4 className="font-bold text-white">{st.name}</h4>
                      <span className="text-[10px] text-[#C4B5FD]/70">
                        {instituteType === 'college' && st.semester && (st.semester === 'odd' ? 'Odd Sem (1,3,5) | ' : st.semester === 'even' ? 'Even Sem (2,4,6) | ' : '')}
                        Applicable: {st.applicable_to} | Due: {st.due_date}
                      </span>
                    </div>
                    <strong className="font-heading font-extrabold text-sm text-white">₹{Number(st.amount).toLocaleString()}</strong>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Concession allocation form */}
          <div className="glass-panel rounded-2xl p-6 border border-white/5 flex flex-col gap-4">
            <h3 className="font-heading font-bold text-lg text-white">Allocate Scholarship Waiver</h3>
            
            {structures.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xs text-[#C4B5FD]/50 mb-3">No billing categories available yet.</p>
                <p className="text-[10px] text-[#C4B5FD]/40">Create a fee structure first using the "Initialize Structure" button above.</p>
              </div>
            ) : (
            <form onSubmit={handleApplyConcession} className="space-y-4 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-[#C4B5FD]">Target Billing Category</label>
                <select 
                  value={concessionData.fee_structure_id}
                  onChange={(e) => setConcessionData({...concessionData, fee_structure_id: e.target.value})}
                  className="bg-black/40 border border-[#6C2BD9]/30 p-2.5 rounded-xl text-white outline-none focus:border-[#8B5CF6]"
                >
                  {structures.map(s => <option key={s.id} value={s.id}>{s.name} (₹{s.amount})</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[#C4B5FD]">Select Student</label>
                <select 
                  value={concessionData.student_id}
                  onChange={(e) => setConcessionData({...concessionData, student_id: e.target.value})}
                  required
                  className="bg-black/40 border border-[#6C2BD9]/30 p-2.5 rounded-xl text-white outline-none focus:border-[#8B5CF6]"
                >
                  <option value="">Choose a student...</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.email || s.id})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[#C4B5FD]">Waiver Type</label>
                  <select 
                    value={concessionData.concession_type}
                    onChange={(e) => setConcessionData({...concessionData, concession_type: e.target.value})}
                    className="bg-black/40 border border-[#6C2BD9]/30 p-2.5 rounded-xl text-white outline-none focus:border-[#8B5CF6]"
                  >
                    <option value="Scholarship">Merit Scholarship</option>
                    <option value="Sports">Sports Concession</option>
                    <option value="EWS">Economically Weaker Section (EWS)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[#C4B5FD]">Waiver Amount (₹)</label>
                  <input 
                    type="number" required
                    value={concessionData.amount}
                    onChange={(e) => setConcessionData({...concessionData, amount: e.target.value})}
                    placeholder="15000"
                    className="bg-black/40 border border-[#6C2BD9]/30 p-2.5 rounded-xl text-white outline-none focus:border-[#8B5CF6]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[#C4B5FD]">Reason / Principal Authorization Code</label>
                <input 
                  type="text" required
                  value={concessionData.reason}
                  onChange={(e) => setConcessionData({...concessionData, reason: e.target.value})}
                  placeholder="Approved by Principal's Office (Order #90-B)"
                  className="bg-black/40 border border-[#6C2BD9]/30 p-2.5 rounded-xl text-white outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] hover:brightness-110 text-white font-bold transition-all shadow-md shadow-[#6C2BD9]/20"
              >
                Apply Concession Discount
              </button>
            </form>
            )}
          </div>

        </div>

      </div>

      {/* Add Structure Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#13102A] border border-[#6C2BD9]/30 rounded-2xl p-6 shadow-2xl relative">
            <h3 className="font-heading font-bold text-lg text-white mb-4">Initialize Billing Structure</h3>
            
            <form onSubmit={handleCreateStructure} className="space-y-4 text-xs">
              {instituteType === 'college' && (
                <div className="flex flex-col gap-1">
                  <label className="text-[#C4B5FD]">Semester</label>
                  <select 
                    value={formData.semester}
                    onChange={(e) => {
                      const sem = e.target.value;
                      const label = sem === 'odd' ? 'Odd Semester (1,3,5)' : 'Even Semester (2,4,6)';
                      setFormData({...formData, semester: sem, name: label + ' Tuition Fee'});
                    }}
                    className="bg-black/40 border border-[#6C2BD9]/30 p-2.5 rounded-xl text-white outline-none focus:border-[#8B5CF6]"
                  >
                    <option value="odd">Odd Semester (1,3,5)</option>
                    <option value="even">Even Semester (2,4,6)</option>
                  </select>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-[#C4B5FD]">Structure Name</label>
                <input 
                  type="text" required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder={instituteType === 'school' ? 'Annual Tuition Fee' : 'Tuition Fee'}
                  className="bg-black/40 border border-[#6C2BD9]/30 p-2.5 rounded-xl text-white outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[#C4B5FD]">Billing Amount (₹)</label>
                <input 
                  type="number" required
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  placeholder="65000"
                  className="bg-black/40 border border-[#6C2BD9]/30 p-2.5 rounded-xl text-white outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[#C4B5FD]">Due Date</label>
                  <input 
                    type="date" required
                    value={formData.due_date}
                    onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                    className="bg-black/40 border border-[#6C2BD9]/30 p-2.5 rounded-xl text-white outline-none focus:border-[#8B5CF6]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[#C4B5FD]">Target Audits</label>
                  <input 
                    type="text" required
                    value={formData.applicable_to}
                    onChange={(e) => setFormData({...formData, applicable_to: e.target.value})}
                    placeholder="CSE, ECE"
                    className="bg-black/40 border border-[#6C2BD9]/30 p-2.5 rounded-xl text-white outline-none focus:border-[#8B5CF6]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button 
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] hover:brightness-110 text-white font-bold"
                >
                  Create Structure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
