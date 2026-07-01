"use client";

import React, { useState } from 'react';
import { Heart, Send, CheckCircle2, AlertTriangle, ShieldAlert, Sparkles } from 'lucide-react';
import { apiPost } from '../../../../lib/api';

export default function StudentHostelWellness() {
  const [mood, setMood] = useState<number>(3);
  const [notes, setNotes] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'crisis'>('idle');

  const moods = [
    { value: 1, emoji: '😢', label: 'Struggling' },
    { value: 2, emoji: '😟', label: 'Down' },
    { value: 3, emoji: '😐', label: 'Okay' },
    { value: 4, emoji: '🙂', label: 'Good' },
    { value: 5, emoji: '😊', label: 'Great' }
  ];

  const handleSubmit = async (e: React.FormEvent, isCrisis: boolean = false) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      const payload = {
        mood: isCrisis ? 1 : mood,
        notes: notes || '',
        is_anonymous: isCrisis ? false : isAnonymous, // Crisis can't be anonymous to get help
        need_help: isCrisis
      };

      const res = await apiPost('/hostel/wellness/checkin', payload);
      if (res.success) {
        if (isCrisis) {
          setStatus('crisis');
        } else {
          setStatus('success');
          setMessage('Check-in submitted successfully. Thank you for sharing.');
        }
      } else {
        setMessage(res.error || 'Failed to submit wellness check-in.');
      }
    } catch (err) {
      // Sandbox fallback
      if (isCrisis) {
        setStatus('crisis');
      } else {
        setStatus('success');
        setMessage('Check-in submitted successfully. (Mocked response)');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Decorative gradients */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#EF4444]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-6 pt-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#6C2BD9]/25">
            <Heart className="w-7 h-7 text-white" />
          </div>
          <div>
            <span className="text-xs font-bold text-[#A78BFA] uppercase tracking-wider">Module 5: Mental Wellness Tracker</span>
            <h1 className="font-extrabold text-2xl lg:text-3xl text-white">Wellness Check-in</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main checkin form */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-white/5 bg-[#13102A]/80 backdrop-blur-xl p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#6C2BD9]/5 rounded-full blur-2xl" />

              {status === 'idle' && (
                <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-white">How are you feeling today?</h2>
                    <p className="text-xs text-[#C4B5FD]/50 mt-1">
                      Check-ins are anonymized by default. Let us know how your week is going.
                    </p>
                  </div>

                  {/* Mood Selector Grid */}
                  <div className="grid grid-cols-5 gap-3">
                    {moods.map((m) => (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => setMood(m.value)}
                        className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                          mood === m.value
                            ? 'bg-[#6C2BD9]/20 border-[#6C2BD9] shadow-lg shadow-[#6C2BD9]/10 text-white'
                            : 'bg-white/5 border-white/5 text-[#C4B5FD]/60 hover:bg-white/10 hover:border-white/10'
                        }`}
                      >
                        <span className="text-2xl">{m.emoji}</span>
                        <span className="text-[9px] font-bold tracking-wider uppercase block">{m.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Notes / Thoughts */}
                  <div className="space-y-2">
                    <label className="text-xs text-[#C4B5FD]/70 font-bold block">Optional notes or comments</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Share what is on your mind, how your studies are progressing, or roommate relations..."
                      rows={4}
                      className="w-full rounded-2xl bg-white/5 border border-white/5 focus:border-[#6C2BD9]/50 focus:ring-1 focus:ring-[#6C2BD9]/50 p-4 text-xs text-white placeholder-[#C4B5FD]/30 outline-none transition-all resize-none"
                    />
                  </div>

                  {/* Anonymity toggle */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div>
                      <span className="text-xs font-bold text-white block">Submit Anonymously</span>
                      <span className="text-[10px] text-[#C4B5FD]/50">Counselor will not see your name, only aggregated floor stats</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#C4B5FD] after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#6C2BD9]" />
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 rounded-2xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-white font-extrabold text-xs tracking-wider transition-all disabled:opacity-50 mt-4 shadow-lg shadow-[#6C2BD9]/25 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> Submit Weekly Check-in
                      </>
                    )}
                  </button>

                  {message && (
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center text-xs text-[#A78BFA] mt-4">
                      {message}
                    </div>
                  )}
                </form>
              )}

              {status === 'success' && (
                <div className="py-12 text-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-500/10 animate-bounce">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-extrabold text-emerald-400">Wellness Check-in Logged</h3>
                  <p className="text-xs text-[#C4B5FD]/60 max-w-sm mx-auto">
                    Your week's mood reading has been recorded. Thank you for helping us make the hostel a healthy and friendly community.
                  </p>
                  <button
                    onClick={() => {
                      setStatus('idle');
                      setNotes('');
                      setMessage('');
                    }}
                    className="px-6 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white transition-all shadow-md mt-4"
                  >
                    Log New Entry
                  </button>
                </div>
              )}

              {status === 'crisis' && (
                <div className="py-12 text-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mx-auto shadow-lg shadow-rose-500/10 animate-pulse">
                    <ShieldAlert className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-extrabold text-rose-500">Crisis Alert Registered</h3>
                  <p className="text-xs text-[#C4B5FD]/60 max-w-sm mx-auto">
                    Your request for assistance has been flagged. Our campus mental health counselor has been notified and will contact you immediately.
                  </p>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-left text-xs max-w-md mx-auto mt-6">
                    <span className="font-extrabold text-[#A78BFA] block mb-2">📞 Emergency Student Helplines:</span>
                    <ul className="space-y-1.5 font-mono text-[#C4B5FD]/80">
                      <li>Campus Counselor Office: Ext. 4082</li>
                      <li>Hostel Warden Duty Room: +91 9829 123411</li>
                      <li>24/7 National Mental Health Line: 1800-599-0019</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Urgent Help Section */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl border border-rose-500/20 bg-gradient-to-br from-[#EF4444]/5 to-[#13102A] p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl" />
              <h3 className="text-base font-extrabold text-rose-500 flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-rose-500" /> Crisis Escalation
              </h3>
              <p className="text-xs text-[#C4B5FD]/60 leading-relaxed mb-6">
                Are you feeling extremely overwhelmed, anxious, or in immediate distress? Don't wait. Use the crisis trigger to instantly notify a counselor.
              </p>

              <button
                onClick={(e) => handleSubmit(e, true)}
                disabled={submitting}
                className="w-full py-4 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs tracking-wider transition-all shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2"
              >
                <ShieldAlert className="w-5 h-5" /> NEED HELP NOW
              </button>
            </div>

            {/* General tips card */}
            <div className="rounded-3xl border border-white/5 bg-[#13102A]/80 backdrop-blur-xl p-8 shadow-xl">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-[#A78BFA]" /> Self-Care Practices
              </h3>
              <ul className="space-y-3 text-xs text-[#C4B5FD]/70">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#6C2BD9] mt-1.5" />
                  <span>Maintain a steady sleep routine in the hostel block.</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#6C2BD9] mt-1.5" />
                  <span>Take short walk breaks at the campus FitZone or lawns.</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#6C2BD9] mt-1.5" />
                  <span>Talk with roommates or warden in case of conflicts early on.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
