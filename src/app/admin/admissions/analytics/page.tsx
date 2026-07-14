"use client";

import React, { useState, useEffect } from 'react';
import { apiGet } from '../../../../lib/api';
import { 
  BarChart3, CheckCircle, AlertCircle, Loader2, Download, Printer, 
  MapPin, Users, HelpCircle, ShieldCheck
} from 'lucide-react';

interface FunnelItem {
  stage: string;
  value: number;
}

interface AisheMetric {
  degree: string;
  male: number;
  female: number;
  sc: number;
  st: number;
  obc: number;
  general: number;
}

interface AisheReport {
  title: string;
  academic_year: string;
  metrics: AisheMetric[];
}

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [funnel, setFunnel] = useState<FunnelItem[]>([]);
  const [report, setReport] = useState<AisheReport | null>(null);

  async function loadAnalyticsData() {
    try {
      const funnelRes = await apiGet('/admissions/analytics/funnel');
      const reportRes = await apiGet('/admissions/reports/aishe');

      if (funnelRes.success && funnelRes.funnel) {
        setFunnel(funnelRes.funnel);
      } else {
        setFunnel([]);
      }
      if (reportRes.success && reportRes.report) {
        setReport(reportRes.report);
      } else {
        setReport(null);
      }
    } catch {
      // Backend not reachable — show empty states
      setFunnel([]);
      setReport(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const printAisheReport = () => {
    if (!report) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
        <head>
          <title>${report.title} - ${report.academic_year}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #222; }
            h2, h3 { text-align: center; margin: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 35px; font-size: 13px; }
            th, td { border: 1px solid #aaa; padding: 10px; text-align: center; }
            th { bg-color: #f5f5f5; font-weight: bold; }
            .meta { text-align: center; margin-bottom: 25px; color: #555; font-size: 12px; }
          </style>
        </head>
        <body>
          <h2>${report.title}</h2>
          <div class="meta">Academic Year: ${report.academic_year} | Compiled: ${new Date().toLocaleDateString()}</div>
          <table>
            <thead>
              <tr>
                <th>Degree Program</th>
                <th>Male</th>
                <th>Female</th>
                <th>SC</th>
                <th>ST</th>
                <th>OBC</th>
                <th>General</th>
                <th>Total Enrollment</th>
              </tr>
            </thead>
            <tbody>
              ${report.metrics.map(m => `
                <tr>
                  <td style="text-align: left; font-weight: bold;">${m.degree}</td>
                  <td>${m.male}</td>
                  <td>${m.female}</td>
                  <td>${m.sc}</td>
                  <td>${m.st}</td>
                  <td>${m.obc}</td>
                  <td>${m.general}</td>
                  <td style="font-weight: bold;">${m.male + m.female}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>window.print();</script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-[#6C2BD9]/30 border-t-[#6C2BD9] animate-spin"></div>
        <p className="text-sm text-[#C4B5FD]/70 font-mono">Loading Analytics & Reports...</p>
      </div>
    );
  }

  const maxFunnelValue = funnel.length > 0 ? funnel[0].value : 1;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Funnel Chart */}
        <div className="lg:col-span-2 rounded-3xl border border-white/5 bg-[#13102A]/40 p-6 shadow-xl space-y-6">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4.5 h-4.5 text-[#A78BFA]" />
            Conversion Funnel Analysis
          </h3>

          <div className="space-y-4">
            {funnel.map((item, idx) => {
              const widthRatio = Math.round((item.value / maxFunnelValue) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-white/90">
                    <span>{item.stage}</span>
                    <span className="font-mono text-[#A78BFA]">{item.value.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-7 rounded-lg bg-white/5 overflow-hidden relative flex items-center pl-3">
                    <div 
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#6C2BD9]/30 to-[#8B5CF6]/50 transition-all duration-500"
                      style={{ width: `${widthRatio}%` }}
                    />
                    <span className="relative z-10 text-[9px] font-mono font-bold text-[#C4B5FD]">{widthRatio}% of top funnel</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: AISHE / UGC Surveys */}
        <div className="rounded-3xl border border-white/5 bg-[#13102A]/40 p-6 shadow-xl space-y-6">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <h3 className="text-sm font-bold text-white">AISHE Survey Logs</h3>
            <button
              onClick={printAisheReport}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all"
              title="Compile PDF"
            >
              <Printer className="w-4 h-4 text-[#A78BFA]" />
            </button>
          </div>

          <p className="text-xs text-[#C4B5FD]/70 leading-relaxed">
            Generate survey compilations formatted according to UGC guidelines and AISHE portal templates.
          </p>

          {report && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#0D0A1A]/80 border border-[#6C2BD9]/20 text-xs space-y-2">
                <span className="text-[10px] text-[#C4B5FD]/45 font-mono uppercase block">ACTIVE REPORT BOUNDS</span>
                <span className="font-bold text-white">{report.title}</span>
                <span className="block text-[10px] text-[#A78BFA] font-mono">Academic Cycle: {report.academic_year}</span>
              </div>

              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin">
                {report.metrics.map((m, idx) => (
                  <div key={idx} className="p-3 bg-[#0D0A1A]/50 border border-white/5 rounded-xl text-xs flex justify-between items-center">
                    <div>
                      <span className="font-bold text-white block">{m.degree}</span>
                      <span className="text-[9px] text-[#C4B5FD]/50 block mt-0.5">M: {m.male} | F: {m.female}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-[#C4B5FD]/50 block">Reservation</span>
                      <span className="text-[10px] font-mono text-[#A78BFA]">SC:{m.sc} ST:{m.st} OBC:{m.obc}</span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={printAisheReport}
                className="w-full py-2.5 bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] hover:brightness-110 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-[#6C2BD9]/20 flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Compile & Print Survey Report</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
