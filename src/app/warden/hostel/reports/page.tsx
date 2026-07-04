"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileSpreadsheet, UserX, Clock, Download, IndianRupee, ShieldAlert, Phone } from 'lucide-react';
import { apiGet } from '../../../../lib/api';
import Link from 'next/link';

export default function WardenReportsPage() {
  const [defaulters, setDefaulters] = useState<any[]>([]);
  const [insideVisitors, setInsideVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'defaulters' | 'visitors'>('defaulters');
  
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadReportsData();
  }, []);

  const loadReportsData = async () => {
    try {
      const [defRes, visRes] = await Promise.all([
        apiGet('/hostel/fees/defaulters'),
        apiGet('/hostel/visitors/inside')
      ]);

      if (defRes.success) {
        setDefaulters(defRes.defaulters || []);
      }
      if (visRes.success) {
        setInsideVisitors(visRes.visitors || []);
      }
    } catch {
      // Mock Data Fallbacks
      setDefaulters([]);

      setInsideVisitors([]);
    } finally {
      setLoading(false);
    }
  };

  const triggerDownloadPDF = (reportType: string) => {
    setSuccessMsg(`Initiated PDF generation for ${reportType} report...`);
    setTimeout(() => {
      setSuccessMsg('');
      window.open('/api/v1/hostel/allocations/report/pdf', '_blank');
    }, 1500);
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/warden/hostel" className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-[#C4B5FD]/70 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="font-extrabold text-xl">Warden Report Desk</h1>
              <p className="text-[10px] text-[#C4B5FD]/50">Export audit sheets, check fee defaulters, and view active visitor alerts</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8">
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 mb-6">
            {successMsg}
          </div>
        )}

        {/* Tab Controls */}
        <div className="flex border-b border-white/5 mb-6">
          <button
            onClick={() => setActiveTab('defaulters')}
            className={`px-6 py-3 text-xs font-bold transition-all relative ${
              activeTab === 'defaulters' ? 'text-white' : 'text-[#C4B5FD]/50 hover:text-[#C4B5FD]'
            }`}
          >
            Rent Defaulters ({defaulters.length})
            {activeTab === 'defaulters' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6C2BD9]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('visitors')}
            className={`px-6 py-3 text-xs font-bold transition-all relative ${
              activeTab === 'visitors' ? 'text-white' : 'text-[#C4B5FD]/50 hover:text-[#C4B5FD]'
            }`}
          >
            Live Visitor Overstay Monitor ({insideVisitors.length})
            {activeTab === 'visitors' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6C2BD9]" />
            )}
          </button>
        </div>

        {/* Download action buttons */}
        <div className="flex justify-end gap-3 mb-6">
          <button
            onClick={() => triggerDownloadPDF(activeTab === 'defaulters' ? 'Defaulters' : 'Visitors')}
            className="px-4 py-2 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white transition-all shadow-md flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" /> Download PDF Report
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-2 border-[#6C2BD9] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeTab === 'defaulters' ? (
          /* Defaulters Table */
          <div className="rounded-3xl border border-white/5 bg-[#13102A]/60 overflow-hidden shadow-xl">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-white/5 bg-white/5 text-[10px] text-[#C4B5FD]/50 font-bold uppercase tracking-wider">
                  <th className="p-4">Student Name</th>
                  <th className="p-4">Roll Number</th>
                  <th className="p-4">Guardian Contact</th>
                  <th className="p-4">Due Date</th>
                  <th className="p-4 text-right">Rent + Fine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-[#C4B5FD]/80">
                {defaulters.map((def, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-bold text-white">{def.students?.name}</td>
                    <td className="p-4 font-mono">{def.students?.roll_number}</td>
                    <td className="p-4 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#C4B5FD]/40" />
                      <span>{def.students?.guardian_phone || 'N/A'}</span>
                    </td>
                    <td className="p-4 text-amber-400 font-medium">
                      {new Date(def.due_date).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right font-extrabold text-red-400">
                      ₹{def.amount + def.penalty}
                    </td>
                  </tr>
                ))}
                {defaulters.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-[#C4B5FD]/30">
                      No rent defaulters for the current period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Live Visitors Overstay Table */
          <div className="rounded-3xl border border-white/5 bg-[#13102A]/60 overflow-hidden shadow-xl">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-white/5 bg-white/5 text-[10px] text-[#C4B5FD]/50 font-bold uppercase tracking-wider">
                  <th className="p-4">Visitor Details</th>
                  <th className="p-4">Host Student</th>
                  <th className="p-4">Gate Pass ID</th>
                  <th className="p-4">Check-In Time</th>
                  <th className="p-4 text-right">Action Alert</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-[#C4B5FD]/80">
                {insideVisitors.map((vis, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-white">{vis.visitor_name}</p>
                      <p className="text-[10px] text-[#C4B5FD]/40 mt-0.5">{vis.relation || 'Guest'} • {vis.visitor_phone}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold">{vis.students?.name}</p>
                      <p className="text-[10px] text-[#C4B5FD]/40 mt-0.5 font-mono">{vis.students?.roll_number}</p>
                    </td>
                    <td className="p-4 font-mono font-bold text-[#A78BFA]">{vis.gate_pass_id}</td>
                    <td className="p-4 text-[#C4B5FD]/60 font-mono">
                      {new Date(vis.in_time).toLocaleString()}
                    </td>
                    <td className="p-4 text-right">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                        <Clock className="w-3.5 h-3.5" /> Inside Premises
                      </span>
                    </td>
                  </tr>
                ))}
                {insideVisitors.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-[#C4B5FD]/30">
                      No active visitors inside the block.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
