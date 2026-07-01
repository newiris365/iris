"use client";

import React, { useState } from 'react';
import {
  FileSpreadsheet, Download, HelpCircle, ArrowLeft,
  FileText, Sparkles, CheckCircle2, ShieldAlert
} from 'lucide-react';
import { apiGet, apiFetchBlob } from '../../../lib/api';

export default function TpoReportsManager() {
  const [loadingBrochure, setLoadingBrochure] = useState(false);
  const [loadingNirf, setLoadingNirf] = useState(false);
  
  const [nirfData, setNirfData] = useState<any>({
    academic_year: '2026-27',
    total_graduating: 360,
    total_placed: 215,
    median_salary: 650000,
    higher_studies_opted: 35
  });

  const handleDownloadBrochure = async () => {
    setLoadingBrochure(true);
    try {
      const blob = await apiFetchBlob('/placements/reports/annual');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'SIET_Placement_Brochure_2026.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Failed downloading brochure PDF. Please check server connections.');
    }
    setLoadingBrochure(false);
  };

  const handleExportNirf = async () => {
    setLoadingNirf(true);
    try {
      const res = await apiGet('/placements/reports/nirf');
      if (res.success && res.report) {
        setNirfData(res.report);
      }
      
      // Export as CSV fallback download
      const headers = ['Academic Year', 'Total Graduating', 'Total Placed', 'Median Salary', 'Higher Studies Opted\n'];
      const row = [nirfData.academic_year, nirfData.total_graduating, nirfData.total_placed, nirfData.median_salary, nirfData.higher_studies_opted];
      const csvContent = headers.join(',') + row.join(',');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NIRF_Placements_Report_${nirfData.academic_year}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.log('Error generating NIRF CSV');
    }
    setLoadingNirf(false);
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-6 lg:p-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="w-8 h-8 text-[#A78BFA]" />
          <div>
            <h1 className="font-extrabold text-2xl text-white">Reports & Statistics Cell</h1>
            <p className="text-xs text-[#C4B5FD]/70">Compile high-quality placement statistics brochures or export accredited NIRF worksheets.</p>
          </div>
        </div>

        {/* Report downloads cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Brochure card */}
          <div className="p-6 rounded-2xl bg-[#13102A]/85 border border-[#6C2BD9]/20 flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-sm text-white mt-1">Annual Placements Brochure</h2>
              <p className="text-[10px] leading-relaxed text-[#C4B5FD]/60">
                Compiles visited MNC recruitment lists, average CTC packages, branch success metrics, and highlighted candidate testimonial slides.
              </p>
            </div>

            <button
              onClick={handleDownloadBrochure}
              disabled={loadingBrochure}
              className="py-3 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white transition-all shadow-lg shadow-[#6C2BD9]/25 flex items-center justify-center gap-1.5"
            >
              {loadingBrochure ? 'Compiling PDF...' : 'Download PDF Brochure'}
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* NIRF csv card */}
          <div className="p-6 rounded-2xl bg-[#13102A]/85 border border-[#6C2BD9]/20 flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-sm text-white mt-1">NIRF accreditation Export</h2>
              <p className="text-[10px] leading-relaxed text-[#C4B5FD]/60">
                Compiles specific parameters matching the National Institutional Ranking Framework (NIRF) layout schema, calculating median packages.
              </p>
            </div>

            <button
              onClick={handleExportNirf}
              disabled={loadingNirf}
              className="py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-xs font-bold text-white transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5"
            >
              {loadingNirf ? 'Calculating...' : 'Export NIRF CSV'}
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* Live NIRF Numbers Preview */}
        <div className="p-6 rounded-2xl bg-[#13102A]/85 border border-white/5 flex flex-col gap-4">
          <h3 className="font-bold text-xs text-white">NIRF Parameters Preview (Academic Year: {nirfData.academic_year})</h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center mt-1">
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[9px] uppercase font-bold text-[#C4B5FD]/50">Graduating Count</span>
              <h4 className="text-lg font-extrabold text-white mt-1">{nirfData.total_graduating}</h4>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[9px] uppercase font-bold text-[#C4B5FD]/50">Placed Count</span>
              <h4 className="text-lg font-extrabold text-white mt-1">{nirfData.total_placed}</h4>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[9px] uppercase font-bold text-[#C4B5FD]/50">Median CTC Package</span>
              <h4 className="text-lg font-extrabold text-emerald-400 mt-1">₹{nirfData.median_salary / 100000} LPA</h4>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[9px] uppercase font-bold text-[#C4B5FD]/50">Higher Studies</span>
              <h4 className="text-lg font-extrabold text-white mt-1">{nirfData.higher_studies_opted}</h4>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
