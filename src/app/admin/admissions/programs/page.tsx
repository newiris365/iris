"use client";

import React, { useState, useEffect } from 'react';
import { apiGet, apiPost } from '../../../../lib/api';
import { 
  Plus, CheckCircle, AlertCircle, Loader2, Compass, ShieldCheck, 
  Trash, Edit3, DollarSign, HelpCircle
} from 'lucide-react';

interface ProgramRecord {
  id: string;
  name: string;
  code: string;
  degree_type: string;
  duration_years: number;
  total_seats: number;
  application_fee: number;
  eligibility_criteria?: {
    min_12th_pc?: number;
    required_subjects?: string[];
  };
}

export default function AdminProgramsPage() {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [programs, setPrograms] = useState<ProgramRecord[]>([]);

  // Form states: Create Program
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [degreeType, setDegreeType] = useState('UG');
  const [duration, setDuration] = useState(4);
  const [seats, setSeats] = useState(60);
  const [fee, setFee] = useState(1000);
  
  // Eligibility criteria form states
  const [min12thPc, setMin12thPc] = useState(60);
  const [reqSubjects, setReqSubjects] = useState('Physics, Mathematics');

  async function loadPrograms() {
    try {
      const res = await apiGet('/admissions/siet-jodhpur/programs');
      if (res.success && res.programs) {
        setPrograms(res.programs);
      } else {
        setPrograms([]);
      }
    } catch {
      // Backend not reachable — show empty
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPrograms();
  }, []);

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError(null);
    setSuccess(null);

    const payload = {
      name,
      code: code.toUpperCase(),
      degree_type: degreeType,
      duration_years: Number(duration),
      total_seats: Number(seats),
      application_fee: Number(fee),
      eligibility_criteria: {
        min_12th_pc: Number(min12thPc),
        required_subjects: reqSubjects ? reqSubjects.split(',').map(s => s.trim()) : []
      }
    };

    // Simulate insert in database
    setTimeout(() => {
      const mockNew: ProgramRecord = {
        id: `p-mock-${Date.now()}`,
        ...payload
      };
      setPrograms(prev => [...prev, mockNew]);
      setSuccess('Degree program registered successfully!');
      
      setName('');
      setCode('');
      setSeats(60);
      setFee(1000);
      
      setProcessing(false);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-[#6C2BD9]/30 border-t-[#6C2BD9] animate-spin"></div>
        <p className="text-sm text-[#C4B5FD]/70 font-mono">Loading Courses...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4.5 h-4.5" /> {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Form: Create Program */}
        <div className="space-y-6">
          <form onSubmit={handleCreateProgram} className="rounded-3xl border border-white/5 bg-[#13102A]/40 p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-white/5">
              <Plus className="w-4 h-4 text-[#A78BFA]" /> Configure Program
            </h3>

            <div className="flex flex-col gap-1">
              <span className="text-[9px] uppercase font-bold text-[#C4B5FD]">Program Name</span>
              <input
                type="text" required value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Master of Business Administration"
                className="w-full bg-[#13102A] border border-[#6C2BD9]/30 py-2 px-3 rounded-xl text-xs text-white placeholder-white/20 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] uppercase font-bold text-[#C4B5FD]">Course Code</span>
                <input
                  type="text" required value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. MBA-CORE"
                  className="w-full bg-[#13102A] border border-[#6C2BD9]/30 py-2 px-3 rounded-xl text-xs text-white placeholder-white/20 outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] uppercase font-bold text-[#C4B5FD]">Degree Type</span>
                <select
                  value={degreeType}
                  onChange={(e) => setDegreeType(e.target.value)}
                  className="w-full bg-[#13102A] border border-[#6C2BD9]/30 py-2 px-3 rounded-xl text-xs text-white"
                >
                  <option value="UG">UG</option>
                  <option value="PG">PG</option>
                  <option value="PHD">Ph.D</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] uppercase font-bold text-[#C4B5FD]">Duration</span>
                <input
                  type="number" required value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full bg-[#13102A] border border-white/10 py-2 px-3 rounded-xl text-xs text-white"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] uppercase font-bold text-[#C4B5FD]">Seats</span>
                <input
                  type="number" required value={seats}
                  onChange={(e) => setSeats(Number(e.target.value))}
                  className="w-full bg-[#13102A] border border-white/10 py-2 px-3 rounded-xl text-xs text-white"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] uppercase font-bold text-[#C4B5FD]">Fee (₹)</span>
                <input
                  type="number" required value={fee}
                  onChange={(e) => setFee(Number(e.target.value))}
                  className="w-full bg-[#13102A] border border-white/10 py-2 px-3 rounded-xl text-xs text-white"
                />
              </div>
            </div>

            {/* Eligibility Config */}
            <div className="space-y-3 pt-3 border-t border-white/5">
              <span className="text-[10px] uppercase font-bold text-[#A78BFA] tracking-wider block">Eligibility rules</span>
              
              <div className="flex flex-col gap-1">
                <span className="text-[9px] uppercase font-bold text-[#C4B5FD]">Min 12th Marks (%)</span>
                <input
                  type="number" required value={min12thPc}
                  onChange={(e) => setMin12thPc(Number(e.target.value))}
                  className="w-full bg-[#13102A] border border-white/10 py-2 px-3 rounded-xl text-xs text-white"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[9px] uppercase font-bold text-[#C4B5FD]">Required Subjects</span>
                <input
                  type="text" value={reqSubjects}
                  onChange={(e) => setReqSubjects(e.target.value)}
                  placeholder="Physics, Mathematics"
                  className="w-full bg-[#13102A] border border-white/10 py-2 px-3 rounded-xl text-xs text-white placeholder-white/20 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={processing}
              className="w-full py-2.5 bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] hover:brightness-110 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-[#6C2BD9]/20 flex justify-center items-center gap-1"
            >
              {processing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Create Program</span>
            </button>
          </form>
        </div>

        {/* Right Active list */}
        <div className="lg:col-span-2 rounded-3xl border border-white/5 bg-[#13102A]/40 p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white">Active Programs Setup</h3>
          
          <div className="space-y-4">
            {programs.map((p) => (
              <div 
                key={p.id} 
                className="p-5 rounded-2xl bg-[#0D0A1A]/60 border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-[#6C2BD9]/20 transition-all duration-300"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 text-[#A78BFA] text-[9px] font-bold">{p.degree_type} Program</span>
                    <span className="text-xs font-mono font-semibold text-white/50">{p.code}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-1 leading-snug">{p.name}</h4>
                  
                  <div className="pt-2 text-[10px] text-[#C4B5FD]/70 space-y-1">
                    <p>• Seats Available: <strong className="text-white">{p.total_seats}</strong> | Duration: <strong className="text-white">{p.duration_years} Years</strong></p>
                    {p.eligibility_criteria && (
                      <p>• Cutoff threshold: <strong className="text-emerald-400">{p.eligibility_criteria.min_12th_pc}% marks</strong> in 12th board</p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[9px] text-[#C4B5FD]/40 font-mono block">APPLICATION FEE</span>
                  <span className="text-sm font-mono font-black text-white flex items-center justify-end gap-0.5 mt-1">
                    ₹{p.application_fee}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
