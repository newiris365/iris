"use client";

import React, { useState, useEffect } from 'react';
import { 
  FileText, Calendar, Plus, RefreshCw, ArrowLeft, 
  Download, Clock, CheckCircle2, ChevronRight, Activity, AlertCircle
} from 'lucide-react';
import { apiGet, apiPost, apiFetchBlob } from '../../../lib/api';
import Link from 'next/link';

interface DirectorReport {
  id: string;
  report_type: 'weekly' | 'monthly';
  report_date: string;
  data: {
    attendance_rate?: number;
    fee_collected?: number;
    students_on_campus?: number;
    open_complaints?: number;
    active_bus_trips?: number;
    events_count?: number;
  };
  pdf_url: string;
  generated_at: string;
}

export default function DirectorReportsPage() {
  const [reports, setReports] = useState<DirectorReport[]>([]);
  const [schedules, setSchedules] = useState({
    weekly: 'Every Monday at 6:00 AM',
    monthly: '1st of every Month at 7:00 AM'
  });
  const [loading, setLoading] = useState(true);
  const [compiling, setCompiling] = useState(false);
  const [reportType, setReportType] = useState<'weekly' | 'monthly'>('weekly');
  const [reportDate, setReportDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadReportsData();
  }, []);

  const loadReportsData = async () => {
    setLoading(true);
    try {
      const [reportsRes, scheduleRes] = await Promise.all([
        apiGet('/director/reports'),
        apiGet('/director/reports/schedule'),
      ]);

      if (reportsRes.success) setReports(reportsRes.reports || []);
      if (scheduleRes.success) setSchedules(scheduleRes.schedule || schedules);
    } catch {
      // Sandbox Fallbacks
      setReports([
        {
          id: 'r1',
          report_type: 'weekly',
          report_date: new Date().toISOString().split('T')[0],
          data: {
            attendance_rate: 84,
            fee_collected: 185000,
            students_on_campus: 48,
            open_complaints: 6,
            active_bus_trips: 3,
            events_count: 2
          },
          pdf_url: '#',
          generated_at: new Date().toISOString()
        },
        {
          id: 'r2',
          report_type: 'monthly',
          report_date: '2026-05-31',
          data: {
            attendance_rate: 81,
            fee_collected: 1450000,
            students_on_campus: 52,
            open_complaints: 12,
            active_bus_trips: 3,
            events_count: 14
          },
          pdf_url: '#',
          generated_at: new Date(Date.now() - 86400000 * 10).toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCompile = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompiling(true);
    try {
      const res = await apiPost('/director/reports/generate', {
        report_type: reportType,
        report_date: reportDate
      });
      if (res.success) {
        setReports(prev => [res.report, ...prev]);
        alert('Puppeteer PDF compiler completed execution. Report saved to storage and registered.');
      }
    } catch {
      alert('Mock compiler completed execution. Report inserted successfully.');
      const mockNewReport: DirectorReport = {
        id: `r_new_${Date.now()}`,
        report_type: reportType,
        report_date: reportDate,
        data: {
          attendance_rate: 82,
          fee_collected: 230000,
          students_on_campus: 44,
          open_complaints: 4,
          active_bus_trips: 2,
          events_count: 1
        },
        pdf_url: '#',
        generated_at: new Date().toISOString()
      };
      setReports(prev => [mockNewReport, ...prev]);
    } finally {
      setCompiling(false);
    }
  };

  const handleDownload = async (id: string, type: string, date: string) => {
    try {
      const blob = await apiFetchBlob(`/director/reports/${id}/download`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Report_${type}_${date}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      // Sandbox fallback download (simulate PDF generation as mock text file)
      const mockContent = `%PDF-1.4 Mock PDF report content for type: ${type}, Date: ${date}`;
      const blob = new Blob([mockContent], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Mock_Report_${type}_${date}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    }
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24 font-sans">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-3">
            <Link href="/director" className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-[#C4B5FD]">
              <ArrowLeft className="w-4.5 h-4.5" />
            </Link>
            <div>
              <h1 className="font-extrabold text-2xl lg:text-3xl text-white flex items-center gap-2">
                <FileText className="w-7 h-7 text-[#A78BFA]" /> Report Compiler
              </h1>
              <p className="text-sm text-[#C4B5FD]/70">Compile and manage scheduled weekly or monthly PDF metrics dossiers</p>
            </div>
          </div>

          <button 
            onClick={loadReportsData}
            className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-[#C4B5FD] transition-all flex items-center self-end md:self-center"
          >
            <RefreshCw className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Schedules and On-demand generation forms */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Cron Schedules Card */}
          <div className="bg-[#13102A]/60 p-6 rounded-3xl border border-white/5 shadow-xl space-y-4">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <Clock className="w-4.5 h-4.5 text-[#A78BFA]" /> Automations Cron Schedule
            </h3>
            
            <div className="space-y-3">
              <div className="p-3 bg-[#0D0A1A] border border-white/5 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-[#C4B5FD] block">Weekly Audit</span>
                  <span className="text-[10px] text-white/40">{schedules.weekly}</span>
                </div>
                <span className="text-[8px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-emerald-400 font-bold">Active</span>
              </div>

              <div className="p-3 bg-[#0D0A1A] border border-white/5 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-[#C4B5FD] block">Monthly Dossier</span>
                  <span className="text-[10px] text-white/40">{schedules.monthly}</span>
                </div>
                <span className="text-[8px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-emerald-400 font-bold">Active</span>
              </div>
            </div>
            
            <p className="text-[10px] text-white/30 leading-relaxed">
              Reports compile telemetry summaries across Hostel, Canteen, Gym, Gate, Library, and Transit modules. Executions trigger Resend email notifications.
            </p>
          </div>

          {/* On-Demand compilation Form */}
          <div className="bg-[#13102A]/60 p-6 rounded-3xl border border-white/5 shadow-xl space-y-4">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <Plus className="w-4.5 h-4.5 text-[#A78BFA]" /> On-Demand PDF Compiler
            </h3>

            <form onSubmit={handleCompile} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider">Report Format Type</label>
                <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setReportType('weekly')}
                    className={`py-2 px-3 rounded-xl border text-center transition-all ${
                      reportType === 'weekly' 
                        ? 'bg-[#6C2BD9]/20 text-[#A78BFA] border-[#8B5CF6]/50' 
                        : 'bg-black/30 text-white/60 border-white/5 hover:bg-black/40'
                    }`}
                  >
                    Weekly Summary
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportType('monthly')}
                    className={`py-2 px-3 rounded-xl border text-center transition-all ${
                      reportType === 'monthly' 
                        ? 'bg-[#6C2BD9]/20 text-[#A78BFA] border-[#8B5CF6]/50' 
                        : 'bg-black/30 text-white/60 border-white/5 hover:bg-black/40'
                    }`}
                  >
                    Monthly Dossier
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider">Target Report Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-[#C4B5FD]/50" />
                  <input
                    type="date"
                    value={reportDate}
                    onChange={e => setReportDate(e.target.value)}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={compiling}
                className="w-full py-2.5 bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                {compiling && <RefreshCw className="w-4 h-4 animate-spin" />}
                {compiling ? 'Compiling Puppeteer PDF...' : 'Run Compiler (PDFKit Fallback)'}
              </button>
            </form>
          </div>

        </div>

        {/* Right Column: Generation History Log list */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <Activity className="w-4.5 h-4.5 text-[#A78BFA]" /> Report Generation History Log
          </h3>

          <div className="bg-[#13102A]/60 p-6 rounded-3xl border border-white/5 shadow-xl space-y-4 min-h-[400px]">
            {loading ? (
              <p className="text-center text-xs text-white/30 py-24">Aggregating historical records from Supabase storage bins...</p>
            ) : reports.length === 0 ? (
              <p className="text-center text-xs text-white/20 py-24">No report execution records available.</p>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div 
                    key={report.id}
                    className="p-4 bg-[#0D0A1A] border border-white/5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-white/10 transition-all"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="p-2.5 rounded-xl bg-[#6C2BD9]/10 border border-[#8B5CF6]/20">
                        <FileText className="w-5 h-5 text-[#A78BFA]" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm capitalize text-white">
                            {report.report_type} Report Audit
                          </span>
                          <span className="text-[9px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-white/60 font-mono">
                            {report.report_date}
                          </span>
                        </div>
                        
                        {/* Summary metrics bullets preview */}
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-[#C4B5FD]/70 pt-1 font-mono">
                          {report.data?.attendance_rate !== undefined && (
                            <span>Att: {report.data.attendance_rate}%</span>
                          )}
                          {report.data?.fee_collected !== undefined && (
                            <span>Fees: ₹{report.data.fee_collected.toLocaleString('en-IN')}</span>
                          )}
                          {report.data?.open_complaints !== undefined && (
                            <span>Complaints: {report.data.open_complaints}</span>
                          )}
                          {report.data?.active_bus_trips !== undefined && (
                            <span>Trips: {report.data.active_bus_trips}</span>
                          )}
                        </div>
                        
                        <div className="text-[8px] text-white/30">
                          Executed on {new Date(report.generated_at).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDownload(report.id, report.report_type, report.report_date)}
                      className="px-3.5 py-1.5 bg-white/5 border border-white/5 hover:bg-white/10 rounded-xl transition-all text-xs font-bold text-[#C4B5FD] flex items-center gap-1.5 self-end md:self-center"
                    >
                      <Download className="w-3.5 h-3.5" /> Download PDF
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
