"use client";

import React, { useState, useEffect } from 'react';
import { Users, Award, Book, Calendar, MessageSquare, Send, Sparkles, CheckCircle, RefreshCw } from 'lucide-react';
import { apiGet, apiPost } from '../../../../lib/api';

export default function BookClubsPage() {
  const [clubs, setClubs] = useState<any[]>([]);
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDiscussions, setLoadingDiscussions] = useState(false);

  // Join/Join status State
  const [studentId, setStudentId] = useState('');
  
  // Responding to discussion
  const [activeDiscussionId, setActiveDiscussionId] = useState('');
  const [responseInput, setResponseInput] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);

  // Certificate Modal State
  const [certificate, setCertificate] = useState<any>(null);
  const [showCertModal, setShowCertModal] = useState(false);
  const [certMessage, setCertMessage] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('iris_user_profile');
    const user = userStr ? JSON.parse(userStr) : null;
    const stdId = user?.student_id || user?.id || '';
    setStudentId(stdId);
    loadClubs();
  }, []);

  const loadClubs = async () => {
    try {
      const res = await apiGet('/library/book-clubs');
      if (res.success) {
        setClubs(res.book_clubs || []);
        if (res.book_clubs?.length > 0) {
          // Keep active selected club or select first
          const current = selectedClub ? res.book_clubs.find((c: any) => c.id === selectedClub.id) : res.book_clubs[0];
          if (current) {
            setSelectedClub(current);
            loadDiscussions(current.id);
          }
        }
      }
    } catch (err) {
      console.error(err);
      // Fallback Mock Clubs
      const mockClubs = [
        {
          id: 'c1',
          name: 'Algorithms & Computing club',
          schedule: 'Every Friday at 4 PM',
          members: [studentId, 's2', 's3'],
          current_book_id: 'b1',
          books: { title: 'Introduction to Algorithms', author: 'Thomas Cormen', cover_image_url: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300' }
        },
        {
          id: 'c2',
          name: 'AI Frontiers Circle',
          schedule: 'Every Monday at 6 PM',
          members: ['s4', 's5'],
          current_book_id: 'b2',
          books: { title: 'Artificial Intelligence: A Modern Approach', author: 'Stuart Russell', cover_image_url: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=300' }
        }
      ];
      setClubs(mockClubs);
      setSelectedClub(mockClubs[0]);
      // Load mock discussions directly
      setDiscussions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDiscussions = async (clubId: string) => {
    setLoadingDiscussions(true);
    try {
      const res = await apiGet(`/library/book-clubs/${clubId}/discussions`);
      if (res.success) {
        setDiscussions(res.discussions || []);
        if (res.discussions?.length > 0) {
          setActiveDiscussionId(res.discussions[0].id);
        } else {
          setActiveDiscussionId('');
        }
      }
    } catch {
      // offline fallback handled by loadClubs error
    } finally {
      setLoadingDiscussions(false);
    }
  };

  const handleSelectClub = (club: any) => {
    setSelectedClub(club);
    loadDiscussions(club.id);
  };

  const handleJoinClub = async (clubId: string) => {
    try {
      const res = await apiPost(`/library/book-clubs/${clubId}/join`, {});
      if (res.success) {
        loadClubs();
      }
    } catch (err) {
      console.error('Failed to join club', err);
    }
  };

  const handlePostResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!responseInput.trim() || !activeDiscussionId || !selectedClub) return;

    setSubmittingResponse(true);
    try {
      const res = await apiPost('/library/book-clubs/discussions/respond', {
        discussion_id: activeDiscussionId,
        response: responseInput
      });

      if (res.success) {
        setResponseInput('');
        loadDiscussions(selectedClub.id);
      }
    } catch (err) {
      console.error('Failed to respond to thread', err);
    } finally {
      setSubmittingResponse(false);
    }
  };

  const handleClaimCertificate = async () => {
    if (!selectedClub) return;
    try {
      const res = await apiPost(`/library/book-clubs/${selectedClub.id}/certificate`, {});
      if (res.success) {
        setCertificate(res.certificate);
        setCertMessage(res.message || 'Awarded 200 XP points on reading challenge dashboard!');
        setShowCertModal(true);
      }
    } catch {
      // mock callback
      setCertificate({
        student_name: '',
        book_title: selectedClub.books?.title || selectedClub.name,
        verification_code: 'CERT-MOCK88',
        url: 'https://iris365.edu/verify/certificate/MOCK88'
      });
      setCertMessage('Awarded 200 XP points on reading challenge dashboard!');
      setShowCertModal(true);
    }
  };

  const isMember = selectedClub?.members?.includes(studentId);

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6C2BD9]/15 via-[#0D0A1A] to-[#0D0A1A]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/5 rounded-full blur-[120px]" />
        
        <div className="relative max-w-7xl mx-auto px-6 pt-10 pb-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#6C2BD9]/25">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-2xl lg:text-3xl text-white">Book Clubs</h1>
              <p className="text-sm text-[#C4B5FD]/70">Chapter discussion boards • Peer reviews • AI-suggested analytical questions</p>
            </div>
          </div>
          <button onClick={loadClubs} className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-[#C4B5FD]/80 hover:text-white">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-2 border-[#6C2BD9] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : clubs.length === 0 ? (
          <div className="text-center py-20 text-[#C4B5FD]/30 text-xs">
            No active book clubs registered for this campus.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Left Column: Clubs list */}
            <div className="lg:col-span-1 space-y-4">
              <h3 className="text-xs font-bold text-[#C4B5FD]/70 uppercase tracking-wider">Active Book Clubs</h3>
              <div className="space-y-3">
                {clubs.map((club) => {
                  const isActive = selectedClub?.id === club.id;
                  const isClubMem = club.members?.includes(studentId);
                  return (
                    <button
                      key={club.id}
                      onClick={() => handleSelectClub(club)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-[#1A1538] to-[#13102A] border-[#6C2BD9]/40 shadow-lg shadow-[#6C2BD9]/5'
                          : 'bg-[#13102A]/60 border-white/5 hover:bg-[#1A1538]'
                      }`}
                    >
                      <h4 className="text-xs font-extrabold text-white">{club.name}</h4>
                      <p className="text-[10px] text-[#C4B5FD]/60 mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#A78BFA]" /> {club.schedule}
                      </p>
                      
                      <div className="flex justify-between items-center mt-4 pt-3 border-t border-white/5">
                        <span className="text-[9px] text-[#C4B5FD]/40">{club.members?.length || 0} Members</span>
                        {isClubMem ? (
                          <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Joined</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-[#6C2BD9]/20 text-[#C4B5FD] hover:bg-[#6C2BD9] hover:text-white transition-colors">Join Club</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Columns: Club Forum / discussions */}
            <div className="lg:col-span-3 space-y-6">
              {/* Selected Club Cover Banner */}
              <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-[#13102A]/60 shadow-xl flex flex-col sm:flex-row gap-5 items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#6C2BD9]/5 rounded-full blur-3xl" />
                
                {selectedClub?.books?.cover_image_url ? (
                  <div className="w-24 aspect-[3/4] bg-white/5 rounded-xl overflow-hidden shadow-lg border border-white/10 shrink-0">
                    <img src={selectedClub.books.cover_image_url} alt={selectedClub.books.title} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-24 aspect-[3/4] bg-white/5 rounded-xl flex items-center justify-center text-white/20 border border-white/5 shrink-0">
                    <Book className="w-10 h-10" />
                  </div>
                )}

                <div className="flex-1 text-center sm:text-left space-y-2">
                  <h2 className="text-xl font-extrabold text-white">{selectedClub?.name}</h2>
                  <p className="text-xs text-[#C4B5FD]/70">Current Book: <span className="text-white font-bold">{selectedClub?.books?.title || 'None Selected'}</span></p>
                  <p className="text-[10px] text-[#C4B5FD]/50">Meeting Schedule: {selectedClub?.schedule}</p>

                  <div className="pt-2 flex flex-wrap gap-2.5 justify-center sm:justify-start">
                    {!isMember ? (
                      <button
                        onClick={() => handleJoinClub(selectedClub.id)}
                        className="px-4 py-2 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white transition-all shadow-md"
                      >
                        Join Book Club
                      </button>
                    ) : (
                      <>
                        <span className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Registered Member
                        </span>
                        <button
                          onClick={handleClaimCertificate}
                          className="px-4 py-2 rounded-xl bg-[#F59E0B] hover:bg-amber-600 text-xs font-bold text-black transition-all shadow-md flex items-center gap-1.5"
                        >
                          <Award className="w-4 h-4 text-black" /> Claim Completion Certificate
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Discussions Threads Grid */}
              {isMember ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Discussions Sidebar: chapters */}
                  <div className="space-y-3 lg:col-span-1">
                    <h3 className="text-xs font-bold text-[#C4B5FD]/70 uppercase tracking-wider">Discussion Topics</h3>
                    <div className="space-y-2">
                      {discussions.map((d) => {
                        const isActive = activeDiscussionId === d.id;
                        return (
                          <button
                            key={d.id}
                            onClick={() => {
                              setActiveDiscussionId(d.id);
                              setResponseInput('');
                            }}
                            className={`w-full text-left p-3.5 rounded-xl border text-xs font-bold transition-all ${
                              isActive
                                ? 'bg-[#6C2BD9]/20 border-[#6C2BD9]/40 text-[#A78BFA]'
                                : 'bg-white/5 border-white/5 text-[#C4B5FD]/70 hover:bg-white/10'
                            }`}
                          >
                            <span className="block text-[9px] uppercase tracking-wider opacity-60 mb-0.5">{d.chapter}</span>
                            <span className="line-clamp-2 leading-relaxed font-semibold">{d.question}</span>
                          </button>
                        );
                      })}
                      {discussions.length === 0 && (
                        <p className="text-[10px] text-[#C4B5FD]/30 py-6 text-center">No discussion topics posted yet.</p>
                      )}
                    </div>
                  </div>

                  {/* Discussions Chat Feed */}
                  <div className="lg:col-span-2 space-y-4">
                    {activeDiscussionId && discussions.find(d => d.id === activeDiscussionId) ? (() => {
                      const activeDisc = discussions.find(d => d.id === activeDiscussionId);
                      return (
                        <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-[#13102A]/60 shadow-xl flex flex-col justify-between min-h-[300px]">
                          <div>
                            {/* Question Section */}
                            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#6C2BD9]/20 to-[#8B5CF6]/10 border border-[#6C2BD9]/25 mb-6">
                              <div className="flex items-center gap-1.5 mb-2">
                                <Sparkles className="w-3.5 h-3.5 text-[#A78BFA] animate-pulse" />
                                <span className="text-[9px] uppercase tracking-wider text-[#A78BFA] font-bold">Chapter Discussion Thread</span>
                              </div>
                              <h4 className="text-xs font-extrabold text-[#DDD6FE]">{activeDisc.chapter}</h4>
                              <p className="text-xs text-white mt-1.5 leading-relaxed font-medium">"{activeDisc.question}"</p>
                            </div>

                            {/* Responses List */}
                            <div className="space-y-4 max-h-60 overflow-y-auto pr-1 mb-6">
                              {activeDisc.responses?.map((r: any, idx: number) => (
                                <div key={idx} className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-1">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-[#A78BFA]">{r.name}</span>
                                    <span className="text-[8px] text-[#C4B5FD]/40">{new Date(r.posted_at).toLocaleDateString()}</span>
                                  </div>
                                  <p className="text-xs text-[#C4B5FD]/90 leading-relaxed font-normal">{r.response}</p>
                                </div>
                              ))}
                              {(!activeDisc.responses || activeDisc.responses.length === 0) && (
                                <div className="text-center py-10 text-[10px] text-[#C4B5FD]/30">No responses posted yet. Be the first to share your thoughts!</div>
                              )}
                            </div>
                          </div>

                          {/* Response Form */}
                          <form onSubmit={handlePostResponse} className="flex bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2 items-center gap-2">
                            <input
                              type="text"
                              placeholder="Write your analytical response..."
                              value={responseInput}
                              onChange={(e) => setResponseInput(e.target.value)}
                              className="bg-transparent flex-1 text-xs text-white focus:outline-none placeholder-white/20 py-2.5"
                              required
                            />
                            <button
                              type="submit"
                              disabled={submittingResponse || !responseInput.trim()}
                              className="p-2 rounded-lg bg-[#6C2BD9] hover:bg-[#8B5CF6] text-white transition-all disabled:opacity-50"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </form>
                        </div>
                      );
                    })() : (
                      <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-[#13102A]/60 shadow-xl flex items-center justify-center min-h-[300px] text-xs text-[#C4B5FD]/30">
                        Select a discussion topic to read responses.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-[#13102A]/60 shadow-xl text-center text-xs text-[#C4B5FD]/40 py-12">
                  <MessageSquare className="w-10 h-10 mx-auto text-[#C4B5FD]/20 mb-3" />
                  You must join this book club to view discussion threads and post responses.
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* Certificate Modal */}
      {showCertModal && certificate && (
        <div className="fixed inset-0 z-50 bg-[#0D0A1A]/85 backdrop-blur-md flex items-center justify-center p-6">
          <div className="glass-panel p-8 rounded-3xl border border-[#F59E0B]/30 bg-[#13102A] max-w-xl w-full shadow-2xl relative space-y-6">
            
            {/* Certificate Border Canvas layout */}
            <div className="border-4 border-double border-[#F59E0B]/40 p-6 rounded-2xl bg-gradient-to-tr from-[#1A1538] to-[#0D0A1A] text-center space-y-5">
              <Award className="w-16 h-16 text-[#F59E0B] mx-auto fill-[#F59E0B]/10 animate-bounce" />
              
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-widest text-[#F59E0B] font-bold">Certificate of Completion</span>
                <h3 className="text-xl font-serif text-white">IRIS 365 Book Club Award</h3>
              </div>

              <p className="text-xs text-[#C4B5FD]/75 leading-relaxed font-serif px-4">
                This certifies that student <span className="text-white font-bold underline">{certificate.student_name}</span> has actively participated in the structured reading and chapter discussion board challenge for the book:
              </p>

              <h4 className="text-base font-extrabold text-[#F59E0B] italic font-serif">"{certificate.book_title}"</h4>

              <div className="pt-4 flex flex-col items-center gap-2">
                <span className="text-[9px] font-mono text-[#C4B5FD]/50">Verification Code: {certificate.verification_code}</span>
                <div className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold px-3 py-1 rounded-full uppercase">
                  {certMessage}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCertModal(false)}
                className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold transition-all"
              >
                Close Certificate
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
