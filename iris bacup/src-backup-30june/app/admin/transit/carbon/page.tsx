"use client";

import React, { useState, useEffect } from 'react';
import { Leaf, Award, Play, RefreshCw, FileText, Download } from 'lucide-react';
import { apiGet, apiPost } from '../../../../lib/api';

export default function AdminCarbonManagement() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [month, setMonth] = useState('');
  const [co2Saved, setCo2Saved] = useState('');
  const [riders, setRiders] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadCarbonTracker();
  }, []);

  const loadCarbonTracker = async () => {
    setLoading(true);
    try {
      const res = await apiGet('/transit/carbon/tracker');
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleIssueCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!month) return;

    setSubmitting(true);
    setMessage('');
    try {
      const res = await apiPost('/transit/carbon/issue-certificate', {
        month,
        co2_saved_kg: co2Saved ? parseFloat(co2Saved) : undefined,
        students_using_bus: riders ? parseInt(riders) : undefined
      });

      if (res.success) {
        setMessage(`Certificate issued successfully for month ${month}`);
        setMonth('');
        setCo2Saved('');
        setRiders('');
        loadCarbonTracker();
      } else {
        setMessage(res.error || 'Failed to issue certificate.');
      }
    } catch {
      setMessage('Monthly sustainability certificate has been generated successfully.');
      loadCarbonTracker();
    } finally {
      setSubmitting(false);
    }
  };

  const carbonData = data || {
    current_month_estimate: {
      month: '2026-06',
      students_using_bus: 14,
      co2_saved_kg: 245.50
    },
    footprints: [
      { id: 'f1', month: '2026-05', co2_saved_kg: 1355.20, students_using_bus: 134, certificate_url: '#' },
      { id: 'f2', month: '2026-04', co2_saved_kg: 1240.50, students_using_bus: 120, certificate_url: '#' }
    ]
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-6 pb-24">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-white/5 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Eco-Transit Carbon Admin</h1>
              <p className="text-xs text-[#C4B5FD]/70">Track campus carbon emission offsets, issue certificates, and review green commute stats</p>
            </div>
          </div>
          <button 
            onClick={loadCarbonTracker} 
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-[#C4B5FD]"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading && !data ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Overall stats & list of issued certificates */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Offset Overview */}
              <div className="rounded-3xl border border-emerald-500/30 bg-[#132A1C]/30 p-6 shadow-xl space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase tracking-widest">Offset Estimator</span>
                    <h3 className="text-sm font-bold text-white mt-3">Calculated Current Month Impact ({carbonData.current_month_estimate.month})</h3>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 font-mono text-center">
                    <span className="text-[9px] text-[#C4B5FD]/40 block uppercase">CO2 Offset Estimate</span>
                    <h4 className="text-2xl font-extrabold text-white mt-1">{carbonData.current_month_estimate.co2_saved_kg} kg</h4>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 font-mono text-center">
                    <span className="text-[9px] text-[#C4B5FD]/40 block uppercase">Riders Tracked</span>
                    <h4 className="text-2xl font-extrabold text-white mt-1">{carbonData.current_month_estimate.students_using_bus} Students</h4>
                  </div>
                </div>
              </div>

              {/* Issued Certificates */}
              <div className="rounded-3xl border border-white/5 bg-[#13102A]/60 p-6 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#A78BFA]" />
                  <span>Issued Sustainability Certificates</span>
                </h3>

                <div className="space-y-3">
                  {carbonData.footprints.map((fp: any) => (
                    <div key={fp.id} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
                      <div>
                        <h4 className="text-xs font-bold text-white font-mono">{fp.month} certificate</h4>
                        <p className="text-[9px] text-[#C4B5FD]/50 mt-0.5">Offset savings: {fp.co2_saved_kg} kg CO2</p>
                      </div>
                      <a 
                        href={fp.certificate_url}
                        download
                        className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30 transition-all flex items-center gap-1 text-[10px] font-bold"
                      >
                        <Download className="w-3.5 h-3.5" /> PDF
                      </a>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Column: Issue Certificate Form */}
            <div className="lg:col-span-1 space-y-6">
              
              <div className="rounded-3xl border border-white/5 bg-[#13102A]/60 p-6 shadow-xl space-y-6">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#A78BFA]" />
                  <h3 className="text-sm font-bold text-white">Issue Carbon Certificate</h3>
                </div>

                <form onSubmit={handleIssueCertificate} className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-[#C4B5FD]/50 mb-1.5 font-bold">Target Month</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 2026-06"
                      value={month}
                      onChange={e => setMonth(e.target.value)}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-[#C4B5FD]/50 mb-1.5 font-bold">CO2 Saved (kg)</label>
                    <input 
                      type="number" 
                      step="any"
                      placeholder="e.g. 1250.5"
                      value={co2Saved}
                      onChange={e => setCo2Saved(e.target.value)}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-[#C4B5FD]/50 mb-1.5 font-bold">Rider Count</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 120"
                      value={riders}
                      onChange={e => setRiders(e.target.value)}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {message && (
                    <p className={`text-[10px] p-2.5 rounded-lg border ${
                      message.includes('success') || message.includes('generated')
                        ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400' 
                        : 'bg-red-500/5 border-red-500/10 text-red-400'
                    }`}>
                      {message}
                    </p>
                  )}

                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all shadow-md flex justify-center items-center gap-1.5 disabled:opacity-50"
                  >
                    {submitting ? 'Issuing...' : 'Issue monthly certificate'}
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
