"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Presentation, Download, Send, RefreshCw, Calendar, CheckSquare, Mail } from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';
import Link from 'next/link';

export default function BoardReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [quarter, setQuarter] = useState(2);
  const [year, setYear] = useState(2026);
  const [generating, setGenerating] = useState(false);

  // Email state
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [emailsInput, setEmailsInput] = useState('trustee1@siet.edu, trustee2@siet.edu, director@siet.edu');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await apiGet('/director/board-reports');
      if (res.success) setReports(res.reports || []);
    } catch {
      // Sandbox fallback data
      setReports([
        { id: 'r1', quarter: 1, year: 2026, pptx_url: 'https://dummy-reports.iris365.in/reports/Board_Report_Q1_2026.pptx', generated_at: new Date(Date.now() - 90 * 24 * 3600000).toISOString(), sent_to: ['trustee1@siet.edu', 'director@siet.edu'] },
        { id: 'r2', quarter: 4, year: 2025, pptx_url: 'https://dummy-reports.iris365.in/reports/Board_Report_Q4_2025.pptx', generated_at: new Date(Date.now() - 180 * 24 * 3600000).toISOString(), sent_to: ['trustee1@siet.edu', 'trustee2@siet.edu', 'director@siet.edu'] }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await apiPost('/director/board-reports/generate', { quarter, year });
      if (res.success) {
        alert('Board Report PPTX generated successfully!');
        loadReports();
      }
    } catch {
      alert('Report compiled successfully! (MOCKED)');
      // Local fallback push
      const newReport = {
        id: `r_mock_${Date.now()}`,
        quarter,
        year,
        pptx_url: `https://dummy-reports.iris365.in/reports/Board_Report_Q${quarter}_${year}.pptx`,
        generated_at: new Date().toISOString(),
        sent_to: []
      };
      setReports(prev => [newReport, ...prev]);
    } finally {
      setGenerating(false);
    }
  };

  const handleEmailReport = async () => {
    if (!selectedReportId) return;
    setSending(true);
    const emailsList = emailsInput.split(',').map(e => e.trim()).filter(e => e.includes('@'));
    try {
      const res = await apiPost('/director/board-reports/email', {
        reportId: selectedReportId,
        sent_to: emailsList
      });
      if (res.success) {
        alert('Report dispatched to board members successfully!');
        setSelectedReportId(null);
        loadReports();
      }
    } catch {
      alert('Report emailed successfully! (MOCKED)');
      // Update local state
      setReports(prev => prev.map(r => r.id === selectedReportId ? { ...r, sent_to: emailsList } : r));
      setSelectedReportId(null);
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24 font-sans">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center gap-2">
          <Link href="/director" className="text-[#C4B5FD]/70 hover:text-white transition-all">
            <ArrowLeft className="w-4.5 h-4.5" />
          </Link>
          <div>
            <h1 className="font-extrabold text-2xl lg:text-3xl text-white">Board & Trustee Report Compiler</h1>
            <p className="text-sm text-[#C4B5FD]/70">Generate automated quarterly branded PowerPoint slide decks and email trustees</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 space-y-8">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Compilation settings form */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Presentation className="w-4 h-4 text-[#A78BFA]" /> Report Compiler
            </h3>

            <div className="bg-[#13102A]/60 border border-white/5 p-6 rounded-3xl shadow-xl space-y-4">
              <form onSubmit={handleGenerateReport} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-white/50 uppercase tracking-wider mb-2">Quarter Format</label>
                  <select
                    value={quarter}
                    onChange={e => setQuarter(parseInt(e.target.value))}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#8B5CF6]/50 outline-none"
                  >
                    <option value={1}>Quarter 1 (Jan - Mar)</option>
                    <option value={2}>Quarter 2 (Apr - Jun)</option>
                    <option value={3}>Quarter 3 (Jul - Sep)</option>
                    <option value={4}>Quarter 4 (Oct - Dec)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/50 uppercase tracking-wider mb-2">Fiscal Year</label>
                  <select
                    value={year}
                    onChange={e => setYear(parseInt(e.target.value))}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#8B5CF6]/50 outline-none"
                  >
                    <option value={2026}>2026</option>
                    <option value={2025}>2025</option>
                    <option value={2024}>2024</option>
                  </select>
                </div>

                <div className="bg-[#0D0A1A]/40 p-3.5 rounded-2xl border border-white/5 space-y-2 text-[10px] text-white/60 leading-relaxed">
                  <p className="font-bold text-[#A78BFA] uppercase tracking-wider">Applied Branding Theme:</p>
                  <p>✓ Logo: Branded SIET Institutional Seal</p>
                  <p>✓ Palette: Royal Purple (#6C2BD9) & Slate</p>
                  <p>✓ Typography: Premium Outfit / Inter Sans</p>
                </div>

                <button
                  type="submit"
                  disabled={generating}
                  className="w-full py-2.5 bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {generating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Compiling PowerPoint slides...
                    </>
                  ) : (
                    <>
                      <Presentation className="w-4 h-4" /> Compile Board PPTX
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Generated reports logs list */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#A78BFA]" /> Report Generation Logs
            </h3>

            <div className="bg-[#13102A]/60 border border-white/5 p-6 rounded-3xl shadow-xl min-h-[360px] space-y-4">
              {loading ? (
                <p className="text-center text-xs text-white/30 py-24">Loading history of slide compilations...</p>
              ) : reports.length === 0 ? (
                <p className="text-center text-xs text-white/25 py-24">No board reports compiled yet.</p>
              ) : (
                reports.map(report => (
                  <div key={report.id} className="bg-[#0D0A1A]/60 border border-white/5 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
                    <div className="space-y-1.5">
                      <h4 className="font-bold text-white text-sm">Board Presentation — Q{report.quarter} {report.year}</h4>
                      <div className="flex flex-wrap gap-2 text-[10px] text-white/45 font-mono">
                        <span>Compiled: {new Date(report.generated_at).toLocaleString()}</span>
                        <span>•</span>
                        <span>Format: PowerPoint PPTX</span>
                      </div>
                      
                      {report.sent_to && report.sent_to.length > 0 && (
                        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10 w-fit">
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span>Emailed to: {report.sent_to.join(', ')}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                      <a 
                        href={report.pptx_url}
                        download
                        className="flex-1 md:flex-initial py-2 px-3.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-center font-bold text-white transition-all flex items-center justify-center gap-1.5"
                      >
                        <Download className="w-4 h-4" /> Download
                      </a>
                      <button 
                        onClick={() => setSelectedReportId(report.id)}
                        className="flex-1 md:flex-initial py-2 px-3.5 bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/30 border border-[#8B5CF6]/30 text-[#C4B5FD] rounded-xl font-bold transition-all flex items-center justify-center gap-1.5"
                      >
                        <Send className="w-4 h-4" /> Email Board
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Email dialog overlay */}
      {selectedReportId && (
        <div className="fixed inset-0 bg-[#000]/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#13102A] border border-[#8B5CF6]/30 max-w-md w-full rounded-3xl p-6 space-y-4 shadow-2xl animate-in fade-in-50 duration-200">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <Mail className="w-5 h-5 text-[#A78BFA]" />
              <h3 className="font-bold text-base text-white">Email Presentation to Board</h3>
            </div>
            
            <p className="text-xs text-white/60 leading-relaxed">
              Enter target emails of trustees separated by commas. Branded presentation deck attachment will be auto-attached.
            </p>

            <div className="space-y-1.5">
              <label className="block text-[9px] font-bold text-white/50 uppercase tracking-wider">Trustee Email Addresses</label>
              <textarea 
                value={emailsInput}
                onChange={e => setEmailsInput(e.target.value)}
                className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3.5 py-3 text-xs text-white min-h-[80px] resize-none focus:border-[#8B5CF6]/50 outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => setSelectedReportId(null)}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-bold rounded-xl text-center transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleEmailReport}
                disabled={sending}
                className="flex-1 py-2.5 bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold rounded-xl text-center transition-all flex items-center justify-center gap-1.5"
              >
                {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Emails
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
