"use client";

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Award, FileText, ChevronRight, Download, Users, 
  MapPin, ShieldCheck, ArrowRight
} from 'lucide-react';

export default function PublicMeritListsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const round = params.round as string;
  const router = useRouter();

  const [selectedProgramId, setSelectedProgramId] = useState('a1111111-1111-1111-1111-111111111111');
  const [selectedRound, setSelectedRound] = useState(round || '1');

  // Programs reference
  const programs = [
    { id: 'a1111111-1111-1111-1111-111111111111', name: 'B.Tech Computer Science (B.Tech CSE)', code: 'BTECH-CSE' },
    { id: 'a1111111-1111-1111-1111-111111111112', name: 'B.Tech Artificial Intelligence (B.Tech AI-DS)', code: 'BTECH-AIDS' },
    { id: 'a1111111-1111-1111-1111-111111111113', name: 'Master of Business Administration (MBA)', code: 'MBA-CORE' }
  ];

  // Mock cutoffs
  const cutoffs: { [progId: string]: { [cat: string]: number } } = {
    'a1111111-1111-1111-1111-111111111111': { General: 84.5, OBC: 78.2, SC: 69.5, ST: 62.0, EWS: 81.4 },
    'a1111111-1111-1111-1111-111111111112': { General: 81.2, OBC: 75.0, SC: 66.8, ST: 60.5, EWS: 78.0 },
    'a1111111-1111-1111-1111-111111111113': { General: 75.6, OBC: 70.2, SC: 62.0, ST: 58.5, EWS: 72.8 }
  };

  // Mock list entries
  const entries = [];

  const currentCutoffs = cutoffs[selectedProgramId] || {};
  const currentProgram = programs.find(p => p.id === selectedProgramId);

  return (
    <div className="min-h-screen bg-[#0D0A1A] text-white p-4 md:p-8">
      {/* Background blobs */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-[#6C2BD9]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-[#13102A]/85 backdrop-blur-md p-6 rounded-3xl border border-[#6C2BD9]/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <Award className="w-8 h-8 text-[#A78BFA]" />
              Official Admissions Merit Lists
            </h1>
            <p className="text-[#A78BFA]/70 mt-1">
              Select program and round index parameters to audit published rankings & category cutoffs.
            </p>
          </div>
          <button 
            onClick={() => alert('PDF Merit List generated successfully.')}
            className="px-5 py-2.5 bg-[#6C2BD9]/25 hover:bg-[#6C2BD9]/45 border border-[#6C2BD9]/45 text-[#A78BFA] hover:text-white font-bold rounded-xl transition-all flex items-center gap-1.5 text-xs shrink-0"
          >
            <Download className="w-4 h-4" /> Download PDF List
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-[#13102A]/50 backdrop-blur-md rounded-2xl border border-[#6C2BD9]/15 p-5">
            <label className="text-[10px] uppercase font-bold text-[#A78BFA]/50 tracking-wider">Select Degree Program</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
              {programs.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProgramId(p.id)}
                  className={`px-4 py-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                    selectedProgramId === p.id 
                      ? 'bg-[#6C2BD9]/20 border-[#8B5CF6] text-white' 
                      : 'bg-[#0D0A1A]/40 border-white/5 text-white/50 hover:bg-[#6C2BD9]/5'
                  }`}
                >
                  <span className="block font-bold">{p.code}</span>
                  <span className="block mt-0.5 text-[10px] opacity-80 truncate">{p.name.replace(/Bachelor of Technology in |Master of /,'')}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#13102A]/50 backdrop-blur-md rounded-2xl border border-[#6C2BD9]/15 p-5">
            <label className="text-[10px] uppercase font-bold text-[#A78BFA]/50 tracking-wider">Select Admission Round</label>
            <div className="flex gap-3 mt-3">
              {['1', '2', '3'].map(r => (
                <button
                  key={r}
                  onClick={() => setSelectedRound(r)}
                  className={`flex-1 py-3 rounded-xl border text-xs font-bold transition-all ${
                    selectedRound === r 
                      ? 'bg-[#6C2BD9]/20 border-[#8B5CF6] text-white' 
                      : 'bg-[#0D0A1A]/40 border-white/5 text-white/50 hover:bg-[#6C2BD9]/5'
                  }`}
                >
                  Round {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cutoff Criteria */}
        <div className="bg-[#13102A]/50 backdrop-blur-md rounded-2xl border border-[#6C2BD9]/15 p-5">
          <span className="text-[10px] uppercase font-bold text-[#A78BFA]/50 tracking-widest block mb-4">Round {selectedRound} Cutoff Percentiles — {currentProgram?.code}</span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {Object.keys(currentCutoffs).map((cat) => (
              <div key={cat} className="p-4 rounded-xl bg-[#0D0A1A]/50 border border-[#6C2BD9]/10 text-center">
                <span className="text-[10px] text-[#A78BFA]/50 uppercase font-bold tracking-wider">{cat}</span>
                <span className="block text-xl font-mono font-black text-white mt-1">{currentCutoffs[cat]}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ranks Table */}
        <div className="bg-[#13102A]/50 backdrop-blur-md rounded-3xl border border-[#6C2BD9]/20 overflow-hidden shadow-xl">
          <div className="p-5 border-b border-[#6C2BD9]/15 flex justify-between items-center bg-[#0D0A1A]/30">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-[#A78BFA]" />
              Ranked Candidates List
            </span>
            <span className="text-[10px] font-mono text-[#A78BFA]/60">Showing 7 entries matched cutoff</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#6C2BD9]/10 text-[10px] uppercase font-bold text-[#A78BFA]/60 bg-[#0D0A1A]/20">
                  <th className="py-3.5 px-6">Overall Rank</th>
                  <th className="py-3.5 px-6">Application ID</th>
                  <th className="py-3.5 px-6">Candidate Name</th>
                  <th className="py-3.5 px-6">Merit Score</th>
                  <th className="py-3.5 px-6">Category</th>
                  <th className="py-3.5 px-6">Offer Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#6C2BD9]/10 text-xs">
                {entries.map((entry) => (
                  <tr key={entry.rank} className="hover:bg-[#6C2BD9]/5 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-white">#{entry.rank}</td>
                    <td className="py-4 px-6 font-mono text-[#A78BFA]">{entry.appNo}</td>
                    <td className="py-4 px-6 font-bold">{entry.name}</td>
                    <td className="py-4 px-6 font-mono font-bold text-emerald-400">{entry.score}%</td>
                    <td className="py-4 px-6">{entry.category}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        entry.status === 'offered' 
                          ? 'bg-amber-500/15 text-amber-400' 
                          : 'bg-white/5 text-white/50'
                      }`}>
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4">
          <button 
            onClick={() => router.push(`/admissions/${slug}`)}
            className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl border border-white/10 transition-all text-xs"
          >
            Admissions Gateway
          </button>
          <button 
            onClick={() => router.push(`/admissions/${slug}/apply`)}
            className="px-6 py-2.5 bg-[#6C2BD9] hover:bg-[#8B5CF6] text-white font-bold rounded-xl transition-all text-xs flex items-center gap-1.5"
          >
            Apply Online <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
