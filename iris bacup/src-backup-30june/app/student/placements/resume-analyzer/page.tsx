"use client";

import React, { useState } from 'react';
import {
  ArrowLeft, FileText, CheckCircle2, AlertCircle, Sparkles,
  RefreshCw, TrendingUp, Layers, Check
} from 'lucide-react';
import { apiPost } from '../../../../lib/api';

export default function StudentResumeAnalyzer() {
  const [resumeText, setResumeText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeText.trim()) return;

    setLoading(true);
    try {
      const res = await apiPost('/placements/ai/resume-score', { resume_text: resumeText });
      if (res.success && res.analysis) {
        setResult(res.analysis);
      }
    } catch (err) {
      console.log('Failed analyzing');
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-6 lg:p-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex items-center gap-3">
          <a href="/student/placements" className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#C4B5FD]/70 hover:text-white hover:border-[#6C2BD9]/40 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </a>
          <div>
            <h1 className="font-extrabold text-2xl text-white">AI Resume Analyzer</h1>
            <p className="text-xs text-[#C4B5FD]/70">Leverage Claude AI algorithms to scan resume context and fetch tailoring suggestions.</p>
          </div>
        </div>

        {/* Form & Results split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Input Panel */}
          <div className="lg:col-span-7 p-6 rounded-2xl bg-[#13102A]/85 border border-[#6C2BD9]/20 flex flex-col gap-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#A78BFA]" />
              Paste Resume Content
            </h2>
            
            <form onSubmit={handleAnalyze} className="flex flex-col gap-4">
              <textarea
                required
                value={resumeText}
                onChange={e => setResumeText(e.target.value)}
                placeholder="Paste your raw resume text (experience, skills, projects, certifications)..."
                rows={12}
                className="w-full px-4 py-3 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white placeholder:text-[#C4B5FD]/30 outline-none focus:border-[#6C2BD9]/50 resize-none font-mono"
              />
              
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-xs font-bold text-white flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#6C2BD9]/35 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Evaluating Resume...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" /> Start AI Audit
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Results Display */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {result ? (
              <>
                {/* Score Gauge Card */}
                <div className="p-6 rounded-2xl bg-[#13102A]/85 border border-[#6C2BD9]/20 flex flex-col items-center gap-4 text-center">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#C4B5FD]/60">AI Evaluation Index</span>
                  
                  {/* Gauge */}
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="64" cy="64" r="54" className="stroke-white/5" strokeWidth="10" fill="transparent" />
                      <circle
                        cx="64" cy="64" r="54"
                        className="stroke-[#6C2BD9]"
                        strokeWidth="10"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 54}
                        strokeDashoffset={2 * Math.PI * 54 * (1 - result.score_overall / 100)}
                      />
                    </svg>
                    <span className="absolute text-3xl font-extrabold text-white">{result.score_overall}</span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center justify-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-emerald-400" /> Great Profile Match
                    </h3>
                    <p className="text-[10px] text-[#C4B5FD]/50 mt-1">Matched roles: {result.matched_roles?.join(', ')}</p>
                  </div>
                </div>

                {/* score Breakdown */}
                <div className="p-5 rounded-2xl bg-[#13102A]/85 border border-[#6C2BD9]/20 flex flex-col gap-3">
                  <h3 className="font-bold text-xs text-white">Score Breakdown</h3>
                  
                  <div className="flex flex-col gap-2.5 text-[10px] text-[#C4B5FD]/70">
                    <div className="flex justify-between">
                      <span>Formatting & Layout</span>
                      <span className="font-bold text-white">{result.breakdown?.formatting} / 20</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-[#6C2BD9]" style={{ width: `${(result.breakdown?.formatting / 20) * 100}%` }} />
                    </div>

                    <div className="flex justify-between">
                      <span>Content Quality</span>
                      <span className="font-bold text-white">{result.breakdown?.content_quality} / 30</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-[#6C2BD9]" style={{ width: `${(result.breakdown?.content_quality / 30) * 100}%` }} />
                    </div>

                    <div className="flex justify-between">
                      <span>Skills Relevance</span>
                      <span className="font-bold text-white">{result.breakdown?.skills_relevance} / 25</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-[#6C2BD9]" style={{ width: `${(result.breakdown?.skills_relevance / 25) * 100}%` }} />
                    </div>

                    <div className="flex justify-between">
                      <span>Achievements Quantification</span>
                      <span className="font-bold text-white">{result.breakdown?.achievements} / 25</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-[#6C2BD9]" style={{ width: `${(result.breakdown?.achievements / 25) * 100}%` }} />
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="p-5 rounded-2xl bg-[#13102A]/85 border border-[#6C2BD9]/20 flex flex-col gap-3">
                  <h3 className="font-bold text-xs text-white">Suggested Actions</h3>
                  <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-1">
                    {result.suggestions?.map((tip: string, idx: number) => (
                      <div key={idx} className="flex gap-2 text-[10px] leading-relaxed text-[#C4B5FD]/70">
                        <Check className="w-4 h-4 text-[#A78BFA] shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center bg-[#13102A]/85 border border-white/5 rounded-2xl text-[#C4B5FD]/40 text-xs">
                Paste resume text and start evaluation to receive interactive dashboard parameters.
              </div>
            )}
          </div>

        </div>

      </div>
    </main>
  );
}
