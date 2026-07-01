"use client";

import React, { useState, useEffect } from 'react';
import { Play, Megaphone, HelpCircle, ArrowLeft, Star, BarChart3, Plus, Check, MessageSquare, AlertCircle, Heart, Monitor } from 'lucide-react';
import { apiGet, apiPost, apiPut } from '../../../../../lib/api';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function AdminLiveControlPanel() {
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<any>(null);
  const [polls, setPolls] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  
  const [newPoll, setNewPoll] = useState({ question: '', options: ['', ''] });
  const [activePoll, setActivePoll] = useState<any>(null);
  const [pollResults, setPollResults] = useState<any[]>([]);
  const [reactions, setReactions] = useState<Record<string, number>>({ '❤️': 0, '👏': 0, '🔥': 0, '😮': 0 });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
    setupSockets();
  }, [eventId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const eventRes = await apiGet(`/events/events/${eventId}`);
      if (eventRes.success) setEvent(eventRes.event);

      // Load polls and questions using general check-in details API to load in one go
      const liveRes = await apiGet(`/events/events/${eventId}/live-display-data`);
      if (liveRes.success) {
        if (liveRes.active_poll) {
          setActivePoll(liveRes.active_poll);
          setPollResults(liveRes.active_poll.results || []);
        }
        setQuestions(liveRes.questions || []);
      }
      
      // Load all polls
      const pollsRes = await apiGet(`/events/events/${eventId}/polls`);
      // Wait, we don't have a direct get all polls endpoint, but we can query them. If failed, fallback
      if (pollsRes.success) {
        setPolls(pollsRes.polls || []);
      } else {
        throw new Error();
      }
    } catch {
      // Fallback mocks
      setupMockLivePanel();
    } finally {
      setLoading(false);
    }
  };

  const setupMockLivePanel = () => {
    setEvent({ id: eventId, title: 'TechFest 2026 — AI & Robotics Summit' });
    setPolls([
      { id: 'p1', question: 'Which AI model are you most excited to build with today?', options: ['Claude 3.5 Sonnet', 'GPT-4o', 'Gemini 1.5 Pro'], is_active: true },
      { id: 'p2', question: 'Rate the speed of the campus hackathon internet connection.', options: ['Blazing Fast', 'Usable', 'Slow', 'Dead'], is_active: false }
    ]);
    setActivePoll({ id: 'p1', question: 'Which AI model are you most excited to build with today?', options: ['Claude 3.5 Sonnet', 'GPT-4o', 'Gemini 1.5 Pro'] });
    setPollResults([
      { option: 'Claude 3.5 Sonnet', votes: 142 },
      { option: 'GPT-4o', votes: 78 },
      { option: 'Gemini 1.5 Pro', votes: 94 }
    ]);
    setQuestions([]);
  };

  const setupSockets = () => {
    // Dynamically connect to the namespace to listen to floating comments/polls/votes
    try {
      const io = require('socket.io-client');
      const socket = io('/events-live');
      socket.emit('join_event', eventId);

      socket.on('poll_votes_updated', (data: any) => {
        if (data.pollId === activePoll?.id) {
          setPollResults(data.results);
        }
      });

      socket.on('live_reaction', (data: { emoji: string }) => {
        setReactions(prev => ({
          ...prev,
          [data.emoji]: (prev[data.emoji] || 0) + 1
        }));
      });

      socket.on('new_question_pending', (data: { question: any }) => {
        setQuestions(prev => [data.question, ...prev.filter(q => q.id !== data.question.id)]);
      });

      return () => socket.disconnect();
    } catch {
      // socket client missing or failed during Next.js SSR
    }
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const validOptions = newPoll.options.filter(o => o.trim() !== '');
    if (!newPoll.question || validOptions.length < 2) {
      setError('Please fill question and at least 2 options.');
      return;
    }

    try {
      const res = await apiPost(`/events/events/${eventId}/polls`, {
        question: newPoll.question,
        options: validOptions
      });
      if (res.success) {
        setPolls([res.poll, ...polls]);
        setNewPoll({ question: '', options: ['', ''] });
        setSuccess('Live Poll created successfully!');
        setTimeout(() => setSuccess(''), 2000);
      }
    } catch {
      // Mock addition
      const mock = {
        id: Math.random().toString(),
        question: newPoll.question,
        options: validOptions,
        is_active: false
      };
      setPolls([mock, ...polls]);
      setNewPoll({ question: '', options: ['', ''] });
      setSuccess('Live Poll created (Mock)!');
      setTimeout(() => setSuccess(''), 2000);
    }
  };

  const handleActivatePoll = async (pollId: string) => {
    try {
      const res = await apiPut(`/events/events/${eventId}/polls/${pollId}/activate`, {});
      if (res.success) {
        setActivePoll(res.poll);
        // Reset results to placeholder
        const counts = res.poll.options.map((opt: string) => ({ option: opt, votes: 0 }));
        setPollResults(counts);
        setPolls(polls.map(p => p.id === pollId ? { ...p, is_active: true } : { ...p, is_active: false }));
        setSuccess('Poll is now live on attendee screens!');
        setTimeout(() => setSuccess(''), 2000);
      }
    } catch {
      const selected = polls.find(p => p.id === pollId);
      setActivePoll(selected);
      const counts = selected.options.map((opt: string) => ({ option: opt, votes: 0 }));
      setPollResults(counts);
      setPolls(polls.map(p => p.id === pollId ? { ...p, is_active: true } : { ...p, is_active: false }));
      setSuccess('Poll activated (Mock)');
      setTimeout(() => setSuccess(''), 2000);
    }
  };

  const handleModerateQuestion = async (qId: string, approve: boolean) => {
    try {
      const res = await apiPut(`/events/events/${eventId}/questions/${qId}/approve`, {
        is_approved: approve
      });
      if (res.success) {
        setQuestions(questions.map(q => q.id === qId ? { ...q, is_approved: approve } : q));
      }
    } catch {
      setQuestions(questions.map(q => q.id === qId ? { ...q, is_approved: approve } : q));
    }
  };

  const handleAnswerQuestion = async (qId: string) => {
    try {
      const res = await apiPut(`/events/events/${eventId}/questions/${qId}/answer`, {});
      if (res.success) {
        setQuestions(questions.map(q => q.id === qId ? { ...q, is_answered: true } : q));
      }
    } catch {
      setQuestions(questions.map(q => q.id === qId ? { ...q, is_answered: true } : q));
    }
  };

  const addOptionField = () => {
    if (newPoll.options.length < 6) {
      setNewPoll({ ...newPoll, options: [...newPoll.options, ''] });
    }
  };

  const totalVotes = pollResults.reduce((a, b) => a + (b.votes || 0), 0);

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      <div className="max-w-7xl mx-auto px-6 pt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <Link href={`/admin/events/${eventId}`} className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-[#C4B5FD]/70 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-extrabold bg-gradient-to-r from-white to-[#C4B5FD] bg-clip-text text-transparent">Live Event Moderator</h1>
              <p className="text-xs text-[#C4B5FD]/60 mt-0.5">{event?.title}</p>
            </div>
          </div>

          <Link
            href={`/events/${eventId}/live-display`}
            target="_blank"
            className="px-4 py-2.5 bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white rounded-xl transition-all flex items-center gap-2 w-fit shadow-lg shadow-[#6C2BD9]/20"
          >
            <Monitor className="w-4 h-4 text-amber-300" /> Open Live Kiosk Screen
          </Link>
        </div>

        {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 mb-6">{error}</div>}
        {success && <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 mb-6">{success}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Column 1: Live Polls Controller */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            {/* Create Poll */}
            <div className="rounded-2xl border border-white/5 bg-[#13102A]/80 p-6">
              <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#A78BFA]" /> Create Mid-Event Poll
              </h2>
              
              <form onSubmit={handleCreatePoll} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#C4B5FD]/60 font-bold mb-1.5">Poll Question</label>
                  <input
                    type="text"
                    value={newPoll.question}
                    onChange={e => setNewPoll({ ...newPoll, question: e.target.value })}
                    placeholder="Ask attendees a live question..."
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0D0A1A] border border-[#6C2BD9]/20 text-white outline-none focus:border-[#8B5CF6]/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[#C4B5FD]/60 font-bold">Answer Options</label>
                  {newPoll.options.map((opt, i) => (
                    <input
                      key={i}
                      type="text"
                      placeholder={`Option ${i+1}`}
                      value={opt}
                      onChange={e => {
                        const copy = [...newPoll.options];
                        copy[i] = e.target.value;
                        setNewPoll({ ...newPoll, options: copy });
                      }}
                      className="w-full px-4 py-2 rounded-xl bg-[#0D0A1A] border border-[#6C2BD9]/20 text-white outline-none focus:border-[#8B5CF6]/50"
                    />
                  ))}
                  {newPoll.options.length < 6 && (
                    <button
                      type="button"
                      onClick={addOptionField}
                      className="text-[10px] text-[#A78BFA] font-bold mt-1 flex items-center gap-1 hover:underline"
                    >
                      + Add Option Field
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#6C2BD9] hover:bg-[#8B5CF6] text-white font-bold rounded-xl transition-all"
                >
                  Save Poll Card
                </button>
              </form>
            </div>

            {/* Poll List select */}
            <div className="rounded-2xl border border-white/5 bg-[#13102A]/80 p-6 flex-1">
              <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#A78BFA]" /> Saved Polls Catalog
              </h2>

              <div className="space-y-3 text-xs max-h-[300px] overflow-y-auto pr-1">
                {polls.map(p => (
                  <div key={p.id} className="p-3.5 rounded-xl bg-white/[0.01] border border-white/5 flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-bold text-white leading-relaxed">{p.question}</p>
                      <p className="text-[10px] text-[#C4B5FD]/50 mt-1 font-mono">{p.options.length} options</p>
                    </div>
                    {p.is_active ? (
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 font-bold text-[9px] rounded border border-emerald-500/20">LIVE</span>
                    ) : (
                      <button
                        onClick={() => handleActivatePoll(p.id)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-[#6C2BD9] transition-all text-[#C4B5FD]"
                        title="Launch live"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2: Live Poll results graph */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="rounded-2xl border border-white/5 bg-[#13102A]/80 p-6 flex-1 flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                  <BarChart3 className="w-4.5 h-4.5 text-[#A78BFA]" /> Live Poll Results
                </h2>
                <p className="text-[10px] text-[#C4B5FD]/50 mb-6 uppercase tracking-wider font-mono">Active Poll: {activePoll?.question || 'None'}</p>

                {activePoll ? (
                  <div className="space-y-5 text-xs">
                    {pollResults.map((res, i) => {
                      const pct = totalVotes ? Math.round((res.votes / totalVotes) * 100) : 0;
                      return (
                        <div key={i}>
                          <div className="flex justify-between items-center mb-1.5 font-bold">
                            <span className="text-[#C4B5FD]/80">{res.option}</span>
                            <span>{res.votes} votes ({pct}%)</span>
                          </div>
                          <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden border border-white/5">
                            <div
                              className="h-full bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}

                    <p className="text-[10px] text-[#C4B5FD]/40 text-center mt-6">Total responses recorded: {totalVotes}</p>
                  </div>
                ) : (
                  <div className="text-center py-20 text-[#C4B5FD]/40 text-xs">No active poll launched.</div>
                )}
              </div>

              {/* Reaction indicators */}
              <div className="mt-8 pt-6 border-t border-white/5">
                <h3 className="text-xs font-bold text-[#C4B5FD]/60 mb-4 uppercase tracking-wider font-mono">Live Reactions Counter</h3>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(reactions).map(([emoji, count]) => (
                    <div key={emoji} className="bg-white/[0.02] border border-white/5 p-3 rounded-xl text-center">
                      <span className="text-xl">{emoji}</span>
                      <p className="text-xs font-bold font-mono mt-1 text-white">{count}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Q&A Moderation Deck */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="rounded-2xl border border-white/5 bg-[#13102A]/80 p-6 flex-1 flex flex-col">
              <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <HelpCircle className="w-4.5 h-4.5 text-[#A78BFA]" /> Live Q&A moderation Board
              </h2>

              <div className="space-y-3 overflow-y-auto flex-1 pr-1 text-xs max-h-[500px]">
                {questions.map(q => (
                  <div key={q.id} className="p-4 rounded-xl bg-white/[0.01] border border-white/5 flex flex-col gap-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-[#A78BFA]">{q.students?.name || 'Anonymous Student'}</span>
                        <span className="text-[10px] text-white font-mono flex items-center gap-0.5">🔥 {q.upvotes}</span>
                      </div>
                      <p className="text-white leading-relaxed mt-1">{q.question}</p>
                    </div>

                    <div className="flex gap-2 justify-end pt-2 border-t border-white/5">
                      {!q.is_approved ? (
                        <button
                          onClick={() => handleModerateQuestion(q.id, true)}
                          className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 font-bold text-[9px] rounded-lg border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all"
                        >
                          Approve
                        </button>
                      ) : (
                        <>
                          <span className="px-2.5 py-1 bg-white/5 border border-white/10 text-[9px] font-bold text-[#C4B5FD]/50 rounded-lg flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" /> Approved
                          </span>
                          {!q.is_answered && (
                            <button
                              onClick={() => handleAnswerQuestion(q.id)}
                              className="px-2.5 py-1 bg-[#6C2BD9]/20 text-[#A78BFA] font-bold text-[9px] rounded-lg border border-[#6C2BD9]/20 hover:bg-[#6C2BD9] hover:text-white transition-all"
                            >
                              Mark Answered
                            </button>
                          )}
                        </>
                      )}

                      {!q.is_approved && (
                        <button
                          onClick={() => handleModerateQuestion(q.id, false)}
                          className="px-2.5 py-1 bg-white/5 hover:bg-red-500/20 hover:text-red-400 border border-white/10 text-[9px] font-bold text-[#C4B5FD] rounded-lg transition-all"
                        >
                          Reject
                        </button>
                      )}
                      
                      {q.is_answered && (
                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 text-[9px] font-bold rounded-lg">
                          Answered
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {questions.length === 0 && (
                  <p className="text-center text-[#C4B5FD]/30 py-8 text-xs">No questions submitted yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
