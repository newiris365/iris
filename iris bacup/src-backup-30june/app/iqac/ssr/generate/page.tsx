"use client";

import React, { useState } from 'react';
import { FileText, Download, CheckCircle2, Sparkles, RefreshCw } from 'lucide-react';

export default function IqacSsrGenerator() {
  const [compiling, setCompiling] = useState(false);

  const handleDownload = async () => {
    setCompiling(true);
    try {
      // Direct browser download of PDFKit stream
      window.open('/api/naac/ssr/generate', '_blank');
      
      setTimeout(() => {
        setCompiling(false);
      }, 1500);
    } catch (err) {
      alert('Failed to trigger PDF build stream.');
      setCompiling(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-2 w-full flex flex-col gap-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[#6C2BD9]/30 bg-gradient-to-r from-[#13102A] to-[#1E193C] p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] text-[#A78BFA] font-bold uppercase tracking-widest font-mono">Accreditation Document Compiler</span>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">NAAC SSR PDF Generator</h1>
          <p className="text-xs text-[#C4B5FD]/70 max-w-xl">
            Compile the entire Self-Study Report (SSR) criteria index tables and generated qualitative narratives into a publication-ready PDF booklet.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compilation checklist */}
        <div className="lg:col-span-2 glass-panel border border-[#6C2BD9]/25 rounded-2xl p-6 bg-[#13102A]/40 flex flex-col gap-5">
          <h3 className="font-extrabold text-sm text-white border-b border-white/5 pb-3">SSR Report Components Checklist</h3>
          
          <div className="flex flex-col gap-3.5 text-xs text-[#C4B5FD]/90">
            {[
              { component: 'Criterion 1: Curricular Flexibility Matrix', ready: true },
              { component: 'Criterion 2: Teaching Ratios & Roster Data', ready: true },
              { component: 'Criterion 3: Faculty Development Certificates', ready: true },
              { component: 'Criterion 4: Infrastructure budget audits & maps', ready: true },
              { component: 'Criterion 5: Student achievements registers', ready: true },
              { component: 'Criterion 6: Institutional leadership drafts', ready: true },
              { component: 'Criterion 7: Green campus declarations', ready: true }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl bg-[#0D0A1A]/60 border border-white/5">
                <span>{item.component}</span>
                <span className="flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Compiles
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Panel */}
        <div className="glass-panel border border-[#6C2BD9]/25 rounded-2xl p-6 bg-[#13102A]/20 flex flex-col gap-4 text-center items-center justify-center">
          <FileText className="w-16 h-16 text-[#8B5CF6] mb-2 animate-pulse" />
          
          <h3 className="font-extrabold text-base text-white">Export Self-Study Report</h3>
          <p className="text-xs text-[#C4B5FD]/75 leading-relaxed">
            Click compile to generate the server-side PDF stream. The PDF maps all 7 qualitative descriptions and student indexes.
          </p>

          <button
            onClick={handleDownload}
            disabled={compiling}
            className="w-full mt-4 py-3 px-4 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-white font-bold text-xs shadow-lg shadow-[#6C2BD9]/25 hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50 border border-[#A78BFA]/20"
          >
            {compiling ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Compiling Report...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> Download Compiled SSR PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
