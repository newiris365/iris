"use client";

import React, { useState } from 'react';
import {
  ArrowLeft, Bot, MessageSquare, Sparkles, Send,
  HelpCircle, RefreshCw, Award, CheckCircle, BrainCircuit
} from 'lucide-react';
import { apiPost } from '../../../../lib/api';

const MOCK_QUESTIONS = [
  { id: 1, text: 'Explain what happens when you type a URL in a browser and press enter?' },
  { id: 2, text: 'What is database normalization and when should you choose to denormalize?' },
  { id: 3, text: 'Explain the difference between call, apply, and bind in JavaScript.' }
];

export default function StudentMockInterview() {
  const [interviewType, setInterviewType] = useState('technical');
  const [started, setStarted] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleStart = () => {
    setStarted(true);
    setCurrentIdx(0);
    setResponses({});
    setResult(null);
  };

  const handleNext = () => {
    if (currentIdx < MOCK_QUESTIONS.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const qnas = MOCK_QUESTIONS.map(q => ({
        question: q.text,
        response: responses[q.id] || ''
      }));

      const res = await apiPost('/placements/ai/mock-interview', {
        interview_type: interviewType,
        responses: qnas
      });

      if (res.success) {
        setResult(res);
      }
    } catch (err) {
      console.log('Error evaluating mock interview');
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-6 lg:p-8">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex items-center gap-3">
          <a href="/student/placements" className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#C4B5FD]/70 hover:text-white hover:border-[#6C2BD9]/40 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </a>
          <div>
            <h1 className="font-extrabold text-2xl text-white">AI Mock Interview Console</h1>
            <p className="text-xs text-[#C4B5FD]/70">Practice real-time technical & behavioral questions scored by Claude AI.</p>
          </div>
        </div>

        {!started ? (
          /* Select Configuration Panel */
          <div className="p-6 rounded-2xl bg-[#13102A]/85 border border-[#6C2BD9]/20 flex flex-col gap-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-[#A78BFA]" />
              Select Interview Settings
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { type: 'technical', title: 'Technical Rounds', desc: 'DSA, System Design, SQL' },
                { type: 'hr', title: 'HR & Behavior', desc: 'Conflict resolution, goals' },
                { type: 'gd', title: 'GD Simulation', desc: 'Case studies, market sizing' }
              ].map(item => (
                <button
                  key={item.type}
                  onClick={() => setInterviewType(item.type)}
                  className={`p-4 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                    interviewType === item.type
                      ? 'bg-[#6C2BD9]/10 border-[#6C2BD9] shadow-lg shadow-[#6C2BD9]/10'
                      : 'bg-white/5 border-white/5 hover:border-[#6C2BD9]/30'
                  }`}
                >
                  <span className="text-xs font-bold text-white">{item.title}</span>
                  <span className="text-[9px] text-[#C4B5FD]/50 leading-normal">{item.desc}</span>
                </button>
              ))}
            </div>

            <button
              onClick={handleStart}
              className="mt-2 py-3 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white transition-all shadow-lg shadow-[#6C2BD9]/20 flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-amber-300" /> Start Practice Round
            </button>
          </div>
        ) : result ? (
          /* Scoring Report */
          <div className="flex flex-col gap-6">
            
            {/* Summary Score Card */}
            <div className="p-6 rounded-2xl bg-[#13102A]/85 border border-[#6C2BD9]/20 flex flex-col items-center gap-3 text-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#C4B5FD]/60">AI Competency Evaluation</span>
              <div className="w-20 h-20 rounded-full bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 flex items-center justify-center text-2xl font-extrabold text-white">
                {result.score}%
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Mock Feedback Summary</h3>
                <p className="text-[10px] leading-relaxed text-[#C4B5FD]/60 mt-1 max-w-md">{result.feedback}</p>
              </div>
              
              <button
                onClick={handleStart}
                className="mt-1 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-[#C4B5FD]/80 hover:text-white hover:border-[#6C2BD9]/45 transition-all"
              >
                Retake Session
              </button>
            </div>

            {/* Questions detail feedback */}
            <div className="flex flex-col gap-4">
              <h3 className="font-bold text-xs text-white">Question-by-Question Diagnostics</h3>
              {result.questions?.map((item: any, idx: number) => (
                <div key={idx} className="p-5 rounded-2xl bg-[#13102A]/85 border border-[#6C2BD9]/20 flex flex-col gap-2 leading-relaxed">
                  <span className="text-[9px] font-bold text-[#A78BFA] uppercase">QUESTION {idx + 1}</span>
                  <p className="text-xs text-white font-bold">{item.question}</p>
                  <p className="text-[10px] text-[#C4B5FD]/60 mt-1 pl-3 border-l border-white/10 italic">
                    Your Response: "{responses[idx + 1] || 'No response recorded.'}"
                  </p>
                  <div className="p-3.5 rounded-xl bg-[#6C2BD9]/5 border border-[#6C2BD9]/20 text-[10px] text-[#C4B5FD]/80 mt-2">
                    <span className="font-bold text-white flex items-center gap-1 mb-1">
                      <Bot className="w-3.5 h-3.5 text-[#A78BFA]" /> AI Feedback:
                    </span>
                    {item.feedback}
                  </div>
                </div>
              ))}
            </div>

          </div>
        ) : (
          /* Q&A Interactive Desk */
          <div className="p-6 rounded-2xl bg-[#13102A]/85 border border-[#6C2BD9]/20 flex flex-col gap-5">
            <div className="flex justify-between items-center text-[10px] text-[#C4B5FD]/50">
              <span className="font-bold uppercase tracking-wider text-[#A78BFA]">Active Practice</span>
              <span>Question {currentIdx + 1} of {MOCK_QUESTIONS.length}</span>
            </div>

            {/* active Q */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-sm font-bold text-white leading-relaxed">
              {MOCK_QUESTIONS[currentIdx].text}
            </div>

            {/* Answer Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] uppercase font-bold text-[#C4B5FD]/60">Your Answer (Voice transcription fallback)</label>
              <textarea
                value={responses[MOCK_QUESTIONS[currentIdx].id] || ''}
                onChange={e => setResponses({ ...responses, [MOCK_QUESTIONS[currentIdx].id]: e.target.value })}
                placeholder="Type your response covering systems logic, architecture patterns, or coding trade-offs..."
                rows={8}
                className="w-full px-4 py-3 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white placeholder:text-[#C4B5FD]/30 outline-none focus:border-[#6C2BD9]/50 resize-none font-mono"
              />
            </div>

            {/* Navigation Panel */}
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={currentIdx === 0}
                  onClick={handlePrev}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-[#C4B5FD]/70 hover:text-white disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={currentIdx === MOCK_QUESTIONS.length - 1}
                  onClick={handleNext}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-[#C4B5FD]/70 hover:text-white disabled:opacity-40"
                >
                  Next
                </button>
              </div>

              {currentIdx === MOCK_QUESTIONS.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white transition-all shadow-lg shadow-[#6C2BD9]/20 flex items-center gap-1.5"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Evaluating...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" /> Submit Interview
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="px-5 py-2.5 rounded-xl bg-[#6C2BD9]/10 border border-[#6C2BD9]/30 text-xs font-bold text-[#A78BFA] hover:bg-[#6C2BD9]/20 transition-all"
                >
                  Save & Next
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
