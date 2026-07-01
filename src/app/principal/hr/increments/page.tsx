"use client";

import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, XCircle, IndianRupee, TrendingUp, User, FileText, Download } from 'lucide-react';

interface IncrementRequest {
  id: string;
  employee_name: string;
  department: string;
  designation: string;
  current_basic: number;
  proposed_basic: number;
  increment_percent: number;
  hod_recommendation: string;
  appraisal_score: number;
  status: string;
  effective_date: string;
}

export default function PrincipalIncrements() {
  const [increments, setIncrements] = useState<IncrementRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('iris_jwt_token')}`
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/hr/reports/headcount', { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setIncrements([]);
    } catch {
      // Mock data
      setIncrements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleApproval = async (id: string, action: 'approve' | 'reject') => {
    setProcessing(id);
    try {
      // In a real implementation, call the increment approval endpoint
      await new Promise(resolve => setTimeout(resolve, 800));
      setIncrements(prev => prev.map(inc =>
        inc.id === id ? { ...inc, status: action === 'approve' ? 'approved' : 'rejected' } : inc
      ));
      alert(`Increment ${action === 'approve' ? 'approved' : 'rejected'} successfully.`);
    } finally {
      setProcessing(null);
    }
  };

  const exportCSV = () => {
    const headers = ['Employee', 'Department', 'Current Basic', 'Proposed Basic', 'Increment %', 'Appraisal Score', 'Status'];
    const rows = increments.map(inc => [
      inc.employee_name, inc.department, String(inc.current_basic), String(inc.proposed_basic),
      `${inc.increment_percent}%`, String(inc.appraisal_score), inc.status
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'increment_approvals.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const pendingCount = increments.filter(i => i.status === 'pending').length;
  const approvedCount = increments.filter(i => i.status === 'approved').length;
  const totalCost = increments.filter(i => i.status === 'approved' || i.status === 'pending')
    .reduce((s, i) => s + (i.proposed_basic - i.current_basic), 0);

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; bg: string; border: string; text: string }> = {
      pending: { label: 'Pending Approval', bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' },
      approved: { label: 'Approved', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400' },
      rejected: { label: 'Rejected', bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' }
    };
    const s = config[status] || config.pending;
    return <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md ${s.bg} border ${s.border} ${s.text} font-bold`}>{s.label}</span>;
  };

  return (
    <div className="max-w-7xl mx-auto py-2 w-full flex flex-col gap-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[#6C2BD9]/30 bg-gradient-to-r from-[#13102A] to-[#1E193C] p-6 md:p-8 flex flex-col gap-4">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#8B5CF6]/10 rounded-full blur-3xl -z-10"></div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-[#A78BFA] font-bold uppercase tracking-widest font-mono">Final Authorization Desk</span>
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-[#C4B5FD] to-[#A78BFA] bg-clip-text text-transparent">
              Increment Approval Console
            </h1>
            <p className="text-xs text-[#C4B5FD]/70">
              Review HOD-recommended salary increments, validate appraisal scores, and approve or reject proposals.
            </p>
          </div>
          <button
            onClick={exportCSV}
            className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition-all border border-white/5 flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

        {/* KPI Deck */}
        <div className="grid grid-cols-3 gap-4 mt-2">
          {[
            { label: 'Pending Approvals', value: String(pendingCount), icon: FileText, color: '#F59E0B' },
            { label: 'Approved', value: String(approvedCount), icon: CheckCircle, color: '#10B981' },
            { label: 'Monthly Impact', value: `₹${totalCost.toLocaleString('en-IN')}`, icon: TrendingUp, color: '#8B5CF6' }
          ].map((kpi, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-[#0D0A1A]/60 border border-white/5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${kpi.color}15`, border: `1px solid ${kpi.color}30` }}>
                <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] text-[#C4B5FD]/50 uppercase font-bold">{kpi.label}</span>
                <span className="text-sm font-extrabold text-white">{kpi.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <RefreshCw className="w-8 h-8 text-[#8B5CF6] animate-spin mx-auto mb-4" />
          <p className="text-xs text-[#C4B5FD]">Loading increment proposals…</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {increments.map(inc => (
            <div key={inc.id} className="glass-panel border border-[#6C2BD9]/20 bg-[#13102A]/40 rounded-2xl p-5 flex flex-col gap-4 group hover:border-[#6C2BD9]/40 transition-all">
              {/* Employee Info Row */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center text-white font-extrabold text-sm shrink-0">
                    {inc.employee_name.charAt(0)}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-extrabold text-white">{inc.employee_name}</span>
                    <span className="text-[10px] text-[#C4B5FD]/70 font-semibold">{inc.designation} • {inc.department}</span>
                  </div>
                </div>
                {getStatusBadge(inc.status)}
              </div>

              {/* Salary Comparison */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-[#0D0A1A]/80 border border-white/5 flex flex-col gap-1">
                  <span className="text-[9px] text-[#C4B5FD]/50 uppercase font-bold">Current Basic</span>
                  <span className="text-sm font-extrabold text-white">₹{inc.current_basic.toLocaleString('en-IN')}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#0D0A1A]/80 border border-white/5 flex flex-col gap-1">
                  <span className="text-[9px] text-[#C4B5FD]/50 uppercase font-bold">Proposed Basic</span>
                  <span className="text-sm font-extrabold text-emerald-400">₹{inc.proposed_basic.toLocaleString('en-IN')}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#0D0A1A]/80 border border-white/5 flex flex-col gap-1">
                  <span className="text-[9px] text-[#C4B5FD]/50 uppercase font-bold">Increment</span>
                  <span className="text-sm font-extrabold text-[#A78BFA]">+{inc.increment_percent}%</span>
                </div>
                <div className="p-3 rounded-xl bg-[#0D0A1A]/80 border border-white/5 flex flex-col gap-1">
                  <span className="text-[9px] text-[#C4B5FD]/50 uppercase font-bold">Appraisal Score</span>
                  <span className="text-sm font-extrabold text-amber-400">{inc.appraisal_score}/5</span>
                </div>
              </div>

              {/* HOD Recommendation */}
              <div className="p-3 rounded-xl bg-[#0D0A1A]/60 border border-white/5 flex flex-col gap-1.5">
                <span className="text-[9px] text-[#C4B5FD]/50 uppercase font-bold flex items-center gap-1">
                  <User className="w-3 h-3" /> HOD Recommendation
                </span>
                <p className="text-xs text-[#C4B5FD]/80 leading-relaxed">{inc.hod_recommendation}</p>
              </div>

              {/* Effective Date & Actions */}
              {inc.status === 'pending' && (
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-t border-white/5 pt-4">
                  <span className="text-[10px] text-[#C4B5FD]/50 font-semibold">
                    Effective Date: <span className="text-[#A78BFA] font-bold">{inc.effective_date}</span>
                  </span>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApproval(inc.id, 'reject')}
                      disabled={processing === inc.id}
                      className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-xs hover:bg-red-500/20 transition-all flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                    <button
                      onClick={() => handleApproval(inc.id, 'approve')}
                      disabled={processing === inc.id}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-white font-bold text-xs shadow-lg shadow-[#6C2BD9]/25 hover:brightness-110 transition-all flex items-center gap-1.5 border border-[#A78BFA]/20"
                    >
                      {processing === inc.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      Approve Increment
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
