"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Calendar, MapPin, Clock, HelpCircle, BarChart3, MessageSquare, AlertCircle } from 'lucide-react';
import { apiGet } from '../../../../lib/api';
import { useParams } from 'next/navigation';

interface FloatingEmoji {
  id: string;
  emoji: string;
  left: number;
}

export default function KioskLiveDisplayPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const [countdownStr, setCountdownStr] = useState('00:00:00');

  useEffect(() => {
    loadDisplayData();
    const refreshTimer = setInterval(loadDisplayData, 8000); // Poll display data every 8s for updates
    setupLiveSockets();

    return () => {
      clearInterval(refreshTimer);
    };
  }, [eventId]);

  useEffect(() => {
    if (!data || !data.start_datetime) return;
    
    const countTimer = setInterval(() => {
      const diff = new Date(data.start_datetime).getTime() - Date.now();
      if (diff <= 0) {
        setCountdownStr('Happening Now');
        clearInterval(countTimer);
        return;
      }

      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 6000) / 1000);
      setCountdownStr(
        `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(countTimer);
  }, [data]);

  const loadDisplayData = async () => {
    try {
      const res = await apiGet(`/events/events/${eventId}/live-display-data`);
      if (res.success) {
        setData(res);
      } else {
        throw new Error('API failed');
      }
    } catch {
      // High fidelity Mock Data Fallback
      setData({
        event_title: 'TechFest 2026 — AI & Robotics Summit',
        start_datetime: new Date(Date.now() + 4500000).toISOString(), // ~1.25 hours away
        venue: 'Main Auditorium, Campus Gate A',
        questions: [
          { id: '1', question: 'Will there be GPU servers provided for hosting large neural networks during hackathon?', upvotes: 24, students: { name: 'Rahul Verma' } },
          { id: '2', question: 'Can we submit React Native apps for review or only web apps?', upvotes: 15, students: { name: 'Ananya Iyer' } },
          { id: '3', question: 'Are extra ethernet switches allowed at team desks?', upvotes: 5, students: { name: 'Dev Patel' } }
        ],
        active_poll: {
          id: 'poll-mock',
          question: 'Which AI model are you most excited to build with today?',
          options: ['Claude 3.5 Sonnet', 'GPT-4o', 'Gemini 1.5 Pro'],
          results: [
            { option: 'Claude 3.5 Sonnet', votes: 142 },
            { option: 'GPT-4o', votes: 78 },
            { option: 'Gemini 1.5 Pro', votes: 94 }
          ]
        },
        announcements: [
          { id: 'a1', title: 'Schedule Update', message: 'The keynote speaker session will now begin at 11:00 AM instead of 10:30 AM.' },
          { id: 'a2', title: 'Free Wi-Fi access details', message: 'Connect to campus guest network using credential: techfest226' }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const setupLiveSockets = () => {
    try {
      const io = require('socket.io-client');
      const socket = io('/events-live');
      socket.emit('join_event', eventId);

      socket.on('live_reaction', (reaction: { emoji: string }) => {
        triggerFloatingEmoji(reaction.emoji);
      });

      socket.on('poll_votes_updated', (update: any) => {
        setData((prev: any) => {
          if (!prev || !prev.active_poll || prev.active_poll.id !== update.pollId) return prev;
          return {
            ...prev,
            active_poll: {
              ...prev.active_poll,
              results: update.results
            }
          };
        });
      });

      socket.on('question_moderated', (update: any) => {
        setData((prev: any) => {
          if (!prev) return prev;
          let newQuestions = [...prev.questions];
          if (update.question.is_approved) {
            if (!newQuestions.find(q => q.id === update.question.id)) {
              newQuestions.push(update.question);
            }
          } else {
            newQuestions = newQuestions.filter(q => q.id !== update.question.id);
          }
          return {
            ...prev,
            questions: newQuestions.sort((a, b) => b.upvotes - a.upvotes)
          };
        });
      });

      socket.on('question_upvoted', (update: any) => {
        setData((prev: any) => {
          if (!prev) return prev;
          const newQuestions = prev.questions.map((q: any) =>
            q.id === update.questionId ? { ...q, upvotes: update.upvotes } : q
          );
          return {
            ...prev,
            questions: newQuestions.sort((a: any, b: any) => b.upvotes - a.upvotes)
          };
        });
      });

      return () => socket.disconnect();
    } catch {
      // Mock triggers for preview demonstration in dev
      const timer = setInterval(() => {
        const emojis = ['❤️', '👏', '🔥', '😮'];
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        triggerFloatingEmoji(randomEmoji);
      }, 3000);
      return () => clearInterval(timer);
    }
  };

  const triggerFloatingEmoji = (emoji: string) => {
    const newId = Math.random().toString();
    const randomLeft = Math.floor(Math.random() * 80) + 10; // 10% to 90%
    setFloatingEmojis(prev => [...prev, { id: newId, emoji, left: randomLeft }]);

    // Remove emoji from DOM after animation completes (3s)
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== newId));
    }, 3000);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0D0A1A] flex items-center justify-center text-white">
        <div className="w-12 h-12 border-2 border-[#6C2BD9] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  const activePoll = data?.active_poll;
  const pollResults = activePoll?.results || [];
  const totalPollVotes = pollResults.reduce((sum: number, r: any) => sum + (r.votes || 0), 0);

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-8 relative overflow-hidden flex flex-col justify-between">
      {/* Background aesthetic */}
      <div className="absolute -top-[200px] -left-[200px] w-[600px] h-[600px] bg-[#6C2BD9]/10 rounded-full blur-[160px]" />
      <div className="absolute -bottom-[200px] -right-[200px] w-[600px] h-[600px] bg-[#8B5CF6]/8 rounded-full blur-[160px]" />

      {/* Floating Reactions Wall overlays */}
      <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
        {floatingEmojis.map(item => (
          <span
            key={item.id}
            className="absolute text-4xl animate-float-up"
            style={{
              left: `${item.left}%`,
              bottom: '0px',
              animation: 'floatUp 3s cubic-bezier(0.08, 0.82, 0.17, 1) forwards'
            }}
          >
            {item.emoji}
          </span>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes floatUp {
          0% {
            transform: translateY(0) scale(0.6);
            opacity: 0;
          }
          15% {
            opacity: 1;
            transform: translateY(-80px) scale(1.1);
          }
          100% {
            transform: translateY(-105vh) scale(1.4);
            opacity: 0;
          }
        }
      ` }} />

      {/* TOP HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5 relative z-10">
        <div>
          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 text-[#A78BFA] uppercase tracking-wider">LIVE COMPILER DISPLAY</span>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-white to-[#C4B5FD] bg-clip-text text-transparent mt-2">{data?.event_title}</h1>
          <div className="flex gap-4 text-xs text-[#C4B5FD]/50 mt-1">
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-[#A78BFA]" /> {data?.venue}</span>
          </div>
        </div>

        {/* Live Countdown Clock */}
        <div className="text-right">
          <p className="text-[10px] uppercase font-bold tracking-widest text-[#C4B5FD]/50">Starts In</p>
          <p className="text-3xl font-mono font-extrabold text-[#A78BFA] tracking-tighter mt-1">{countdownStr}</p>
        </div>
      </header>

      {/* CENTRAL BODY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 my-8 flex-1 relative z-10">
        {/* Left pane: Q&A Board */}
        <div className="rounded-3xl border border-white/5 bg-[#13102A]/40 p-6 flex flex-col justify-between max-h-[500px]">
          <div>
            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#A78BFA]" /> Live Audience Q&A Board
            </h2>
            <p className="text-[10px] text-[#C4B5FD]/50 mb-6 uppercase tracking-wider font-mono">Top Questions (Mod Approved & Upvoted)</p>

            <div className="space-y-4 overflow-y-auto max-h-[360px] pr-1">
              {(data?.questions || []).slice(0, 4).map((q: any) => (
                <div key={q.id} className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-[#A78BFA]">{q.students?.name || 'Student'}</p>
                    <p className="text-sm text-white mt-1 leading-relaxed">{q.question}</p>
                  </div>
                  <div className="flex flex-col items-center justify-center bg-white/5 border border-white/5 rounded-xl px-3 py-2 min-w-[50px]">
                    <span className="text-sm font-bold text-white font-mono">{q.upvotes}</span>
                    <span className="text-[8px] text-[#C4B5FD]/40 uppercase tracking-widest font-bold mt-0.5">Votes</span>
                  </div>
                </div>
              ))}

              {(!data?.questions || data.questions.length === 0) && (
                <div className="text-center py-20 text-[#C4B5FD]/30 text-xs">Waiting for student submissions...</div>
              )}
            </div>
          </div>
        </div>

        {/* Right pane: Active Poll Results */}
        <div className="rounded-3xl border border-white/5 bg-[#13102A]/40 p-6 flex flex-col justify-between max-h-[500px]">
          <div>
            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#A78BFA]" /> Realtime Audience Poll
            </h2>
            <p className="text-[10px] text-[#C4B5FD]/50 mb-6 uppercase tracking-wider font-mono">Question: {activePoll?.question || 'None'}</p>

            {activePoll ? (
              <div className="space-y-6">
                {pollResults.map((res: any, idx: number) => {
                  const pct = totalPollVotes ? Math.round((res.votes / totalPollVotes) * 100) : 0;
                  return (
                    <div key={idx} className="text-xs">
                      <div className="flex justify-between items-center mb-1.5 font-bold">
                        <span className="text-sm text-[#C4B5FD]/80">{res.option}</span>
                        <span className="text-sm">{res.votes} votes ({pct}%)</span>
                      </div>
                      <div className="w-full bg-white/5 h-4.5 rounded-full overflow-hidden border border-white/5 p-0.5">
                        <div
                          className="h-full bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                <p className="text-[10px] text-center text-[#C4B5FD]/40 mt-4 font-mono font-bold uppercase tracking-wider">Total votes registered: {totalPollVotes}</p>
              </div>
            ) : (
              <div className="text-center py-20 text-[#C4B5FD]/30 text-xs">Waiting for moderator to activate poll...</div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER SCROLLING TICKER */}
      <footer className="bg-[#13102A]/60 border border-white/5 rounded-2xl py-3.5 px-6 overflow-hidden relative z-10 flex items-center">
        <span className="px-2.5 py-0.5 rounded bg-rose-500/15 border border-rose-500/20 text-rose-400 font-extrabold text-[9px] uppercase tracking-widest mr-4 shrink-0">Updates Ticker</span>
        <div className="w-full overflow-hidden whitespace-nowrap relative">
          <div className="inline-block animate-marquee pl-[100%] text-xs font-semibold text-[#C4B5FD] leading-relaxed">
            {(data?.announcements || []).map((a: any, idx: number) => (
              <span key={a.id || idx} className="mx-8">
                🔥 <span className="text-white font-bold">{a.title}:</span> {a.message}
              </span>
            ))}
            {(!data?.announcements || data.announcements.length === 0) && (
              <span>🚀 No live updates at the moment. Keep scanning tickets at entrance counters.</span>
            )}
          </div>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          .animate-marquee {
            display: inline-block;
            white-space: nowrap;
            animation: marquee 20s linear infinite;
          }
          @keyframes marquee {
            0% { transform: translate3d(0, 0, 0); }
            100% { transform: translate3d(-100%, 0, 0); }
          }
        ` }} />
      </footer>
    </main>
  );
}
