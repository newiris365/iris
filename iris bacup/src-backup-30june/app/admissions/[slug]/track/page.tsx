"use client";

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  FileSearch, ChevronRight, RefreshCw, CheckCircle, Clock, 
  UserCheck, Award, GraduationCap, XCircle
} from 'lucide-react';

export default function TrackApplicationPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();

  const [appNumber, setAppNumber] = useState('');
  const [dob, setDob] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);

    try {
      // Direct mock response since tracking is public and no token is present initially
      setTimeout(() => {
        if (appNumber.includes('123') || appNumber.toLowerCase().includes('siet')) {
          setResult({
            application_number: appNumber,
            name: 'Khushal Student',
            dob: dob || '2004-06-15',
            status: 'under_review', // 'submitted','under_review','shortlisted','merit_listed','waitlisted','offered','admitted'
            merit_score: 84.5,
            submitted_at: '2026-06-10T08:30:00Z',
            programs: [
              { name: 'B.Tech Computer Science (B.Tech CSE)', preference: 1, status: 'pending' },
              { name: 'B.Tech Artificial Intelligence (B.Tech AI-DS)', preference: 2, status: 'pending' }
            ]
          });
        } else {
          setError('Application number or date of birth mismatch. Try code SIET-2026-123456');
        }
        setLoading(false);
      }, 1000);
    } catch {
      setError('Connection timeout. Please retry later.');
      setLoading(false);
    }
  };

  const getStatusStep = (status: string) => {
    const steps = ['submitted', 'under_review', 'shortlisted', 'merit_listed', 'offered', 'admitted'];
    return steps.indexOf(status);
  };

  const currentStepIdx = result ? getStatusStep(result.status) : 0;

  return (
    <div className="min-h-screen bg-[#0D0A1A] text-white p-4 md:p-8 flex items-center justify-center relative">
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-[#6C2BD9]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-2xl w-full bg-[#13102A]/85 backdrop-blur-md rounded-3xl border border-[#6C2BD9]/30 p-6 md:p-10 shadow-2xl relative">
        <div className="flex items-center gap-3 border-b border-[#6C2BD9]/20 pb-5 mb-8">
          <FileSearch className="w-8 h-8 text-[#A78BFA]" />
          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">Track Application Status</h2>
            <p className="text-xs text-[#A78BFA]/60 mt-0.5">Enter application details to view real-time operations audit logs.</p>
          </div>
        </div>

        {!result ? (
          <form onSubmit={handleTrackSubmit} className="space-y-5">
            {error && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div>
              <label className="text-[10px] uppercase font-bold text-[#A78BFA]/50 tracking-wider">Application ID Number</label>
              <input 
                type="text" 
                required
                placeholder="Format: SIET-2026-XXXXXX"
                value={appNumber}
                onChange={(e) => setAppNumber(e.target.value)}
                className="w-full mt-1.5 px-4 py-2.5 bg-[#0D0A1A] border border-[#6C2BD9]/20 focus:border-[#8B5CF6] rounded-xl text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-[#A78BFA]/50 tracking-wider">Date of Birth</label>
              <input 
                type="date" 
                required
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full mt-1.5 px-4 py-2.5 bg-[#0D0A1A] border border-[#6C2BD9]/20 focus:border-[#8B5CF6] rounded-xl text-sm focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#6C2BD9] hover:bg-[#8B5CF6] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
              Track Processing Timeline
            </button>
          </form>
        ) : (
          <div className="space-y-8">
            {/* Quick Profile Brief */}
            <div className="p-4 border border-[#6C2BD9]/25 rounded-2xl bg-[#0D0A1A]/40 flex justify-between items-center text-xs">
              <div>
                <p className="font-bold text-sm text-white">{result.name}</p>
                <p className="text-[#A78BFA]/60 mt-1">Application No: {result.application_number}</p>
              </div>
              <div className="text-right">
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 text-[#A78BFA] uppercase">
                  {result.status.replace('_', ' ')}
                </span>
                <p className="text-[#A78BFA]/50 text-[10px] mt-1">Submitted: {new Date(result.submitted_at).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Timeline Progress Tracker */}
            <div className="space-y-4">
              <span className="text-[10px] uppercase font-bold text-[#A78BFA]/50 tracking-widest block">Application Pipeline Progress</span>
              
              <div className="relative pl-8 space-y-6">
                {/* Timeline vertical bar */}
                <div className="absolute top-2 bottom-2 left-[11px] w-0.5 bg-[#6C2BD9]/25" />

                {[
                  { label: 'Submitted', desc: 'Application locked and processing fees cleared.', step: 0, icon: CheckCircle },
                  { label: 'Under Review', desc: 'Academics marksheets and category certificates undergoing audit checks.', step: 1, icon: Clock },
                  { label: 'Shortlisted', desc: 'Candidate meets minimum cutoffs and eligibility criteria.', step: 2, icon: UserCheck },
                  { label: 'Merit Listed', desc: 'Assigned index rankings for seat allocation.', step: 3, icon: Award },
                  { label: 'Offer Sent', desc: 'Provisional allocation offer issued for confirmation.', step: 4, icon: GraduationCap },
                  { label: 'Admitted', desc: 'Seat securement fee received and student record enrolled.', step: 5, icon: CheckCircle }
                ].map((s) => {
                  const isCurrent = currentStepIdx === s.step;
                  const isCompleted = currentStepIdx > s.step;
                  const Icon = s.icon;
                  return (
                    <div key={s.step} className="relative flex gap-4">
                      {/* Node point indicator */}
                      <div className={`absolute -left-[29px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center border text-[10px] z-10 ${
                        isCurrent 
                          ? 'bg-[#6C2BD9] border-[#8B5CF6] text-white animate-pulse' 
                          : isCompleted 
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' 
                            : 'bg-white/5 border-white/10 text-white/30'
                      }`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className={`text-sm font-bold ${isCurrent ? 'text-[#A78BFA]' : isCompleted ? 'text-white' : 'text-white/40'}`}>{s.label}</h4>
                        <p className="text-xs text-white/60 mt-0.5 leading-relaxed">{s.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-4 border-t border-[#6C2BD9]/20 pt-6">
              <button 
                onClick={() => setResult(null)}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-all text-xs"
              >
                Track Another ID
              </button>
              <button 
                onClick={() => router.push(`/admissions/${slug}`)}
                className="flex-1 py-3 bg-[#6C2BD9] hover:bg-[#8B5CF6] text-white font-bold rounded-xl transition-all text-xs"
              >
                Return to Landing Portal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
