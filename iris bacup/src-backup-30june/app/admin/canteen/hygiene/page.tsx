"use client";

import React, { useState } from 'react';
import { 
  ShieldCheck, AlertTriangle, Thermometer, Calendar, 
  Activity, Award, FileText, CheckCircle2, ShieldAlert 
} from 'lucide-react';

interface AuditLog {
  id: string;
  fridge_temperature: number;
  food_temperature: number;
  compliance_score: number;
  submitted_by: string;
  checklist_summary: string;
  created_at: string;
}

const MOCK_AUDITS: AuditLog[] = [
  { id: 'a-1', fridge_temperature: 4.1, food_temperature: 74.2, compliance_score: 95, submitted_by: 'Rajesh Kumar (Vendor Head)', checklist_summary: 'All 5 sanitation checks passed successfully', created_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString() },
  { id: 'a-2', fridge_temperature: 4.5, food_temperature: 73.8, compliance_score: 95, submitted_by: 'Rajesh Kumar (Vendor Head)', checklist_summary: 'All 5 sanitation checks passed successfully', created_at: new Date(Date.now() - 25 * 3600 * 1000).toISOString() },
  { id: 'a-3', fridge_temperature: 6.2, food_temperature: 68.5, compliance_score: 55, submitted_by: 'Vikram Patel (Kitchen Staff)', checklist_summary: '2 checks failed: staff gloves missing, food uncovered', created_at: new Date(Date.now() - 49 * 3600 * 1000).toISOString() },
  { id: 'a-4', fridge_temperature: 3.8, food_temperature: 75.0, compliance_score: 100, submitted_by: 'Rajesh Kumar (Vendor Head)', checklist_summary: 'All 5 sanitation checks passed successfully', created_at: new Date(Date.now() - 73 * 3600 * 1000).toISOString() },
];

export default function AdminHygienePage() {
  const [audits] = useState<AuditLog[]>(MOCK_AUDITS);
  
  // FSSAI license parameters (expires in 25 days - less than 30 days check trigger!)
  const [fssaiDetails] = useState({
    licenseNo: '10022013000542',
    expiresOn: '2026-07-05', // 25 days from June 10, 2026
    documentUrl: '#'
  });

  const daysToExpiry = Math.ceil((new Date(fssaiDetails.expiresOn).getTime() - new Date('2026-06-10').getTime()) / (1000 * 60 * 60 * 24));
  const isLicenseExpiringSoon = daysToExpiry < 30;

  const averageScore = Math.round(audits.reduce((s, a) => s + a.compliance_score, 0) / audits.length);

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      
      {/* Header Bar */}
      <div className="flex items-center gap-3 bg-[#13102A]/80 border border-white/5 p-6 rounded-3xl">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Hygiene Standards & FSSAI Compliance</h2>
          <p className="text-xs text-[#A78BFA]/70 mt-0.5">Track kitchen temperatures, sanitation score histories, and FSSAI renewal schedules.</p>
        </div>
      </div>

      {/* FSSAI License Expiring Soon Warning Banner */}
      {isLicenseExpiringSoon && (
        <div className="bg-red-500/10 border border-red-500/35 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-pulse">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <h4 className="font-bold text-white text-sm">FSSAI License Renewal Alert!</h4>
              <p className="text-[#C4B5FD]/75 mt-1">License No: <strong>{fssaiDetails.licenseNo}</strong> expires on <strong>{fssaiDetails.expiresOn}</strong> (expires in {daysToExpiry} days).</p>
            </div>
          </div>
          <button 
            onClick={() => alert("Simulating upload renewal documents flow...")}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-xl shrink-0 transition-all"
          >
            Upload Renewal Docs
          </button>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="glass-panel border border-white/5 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-xl" />
          <div className="text-[10px] text-[#A78BFA]/50 uppercase tracking-widest font-semibold">Average Canteen Grade</div>
          <div className="text-3xl font-black text-white mt-1">{averageScore}%</div>
          <p className="text-[10px] text-emerald-400 font-bold mt-1 flex items-center gap-0.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> A-Grade Cleanliness Rating
          </p>
        </div>

        <div className="glass-panel border border-white/5 rounded-2xl p-5 relative overflow-hidden">
          <div className="text-[10px] text-[#A78BFA]/50 uppercase tracking-widest font-semibold">Total Audits Conducted</div>
          <div className="text-3xl font-black text-white mt-1">{audits.length} logs</div>
          <p className="text-[10px] text-[#C4B5FD]/60 mt-1">Audit interval: Daily at 10 AM</p>
        </div>

        <div className="glass-panel border border-white/5 rounded-2xl p-5 relative overflow-hidden">
          <div className="text-[10px] text-[#A78BFA]/50 uppercase tracking-widest font-semibold">FSSAI Status</div>
          <div className="text-3xl font-black text-amber-400 mt-1">Review</div>
          <p className="text-[10px] text-[#C4B5FD]/60 mt-1">Renewal required by next month</p>
        </div>
      </div>

      {/* Temperature Charts / Audits list */}
      <div className="glass-panel border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <FileText className="w-4.5 h-4.5 text-[#A78BFA]" /> Raw Daily Checklist Audits Log
          </h3>
          <span className="text-xs text-[#C4B5FD]/50">Ledger Index</span>
        </div>

        <div className="divide-y divide-white/5 text-xs text-white">
          {audits.map(log => {
            const hasIssue = log.compliance_score < 75;
            return (
              <div 
                key={log.id} 
                className="p-5 hover:bg-white/[0.01] transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white">{log.submitted_by}</span>
                    <span className="text-[9px] text-[#C4B5FD]/45 font-semibold">• logged {new Date(log.created_at).toLocaleDateString([], {day: 'numeric', month: 'short'})} at {new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</span>
                  </div>
                  <p className="text-xs text-[#C4B5FD]/60 leading-relaxed font-medium">{log.checklist_summary}</p>
                  
                  {/* Temp strips */}
                  <div className="flex gap-4 text-[10px] text-[#C4B5FD]/45 mt-1 border-t border-white/5 pt-1.5 w-fit">
                    <span className="flex items-center gap-0.5"><Thermometer className="w-3.5 h-3.5 text-blue-400" /> Fridge: {log.fridge_temperature}°C</span>
                    <span className="flex items-center gap-0.5"><Thermometer className="w-3.5 h-3.5 text-orange-400" /> Food warm: {log.food_temperature}°C</span>
                  </div>
                </div>

                <div className="text-right shrink-0 self-start sm:self-center">
                  <span className={`text-xs font-bold px-3 py-1 rounded-lg border ${
                    hasIssue 
                      ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  }`}>
                    {log.compliance_score}% Score
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
