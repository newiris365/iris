"use client";

import React, { useState, useEffect } from 'react';
import { Shuffle, Plus, Clock, Truck, ShieldAlert, CheckCircle, Navigation, RefreshCw } from 'lucide-react';
import { apiGet, apiPost } from '../../../../lib/api';

export default function InterlibraryLoansPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [selectedBookId, setSelectedBookId] = useState('');
  const [selectedPartnerId, setSelectedPartnerId] = useState('');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Mock partners list
  const partnerCampuses = [
    { id: 'i0000000-0000-0000-0000-000000000002', name: 'IRIS North Campus Library' },
    { id: 'i0000000-0000-0000-0000-000000000003', name: 'IRIS West Engineering Center' }
  ];

  useEffect(() => {
    loadILLData();
  }, []);

  const loadILLData = async () => {
    try {
      const [reqsRes, booksRes] = await Promise.all([
        apiGet('/library/interlibrary/requests'),
        apiGet('/library/books')
      ]);

      if (reqsRes.success) {
        setRequests(reqsRes.requests || []);
      }
      if (booksRes.success) {
        // Show books that might be interesting to request
        setBooks(booksRes.books || []);
      }
    } catch (err) {
      console.error(err);
      // Fallback mocks
      setRequests([
        {
          id: 'ill1',
          books: { title: 'Introduction to Algorithms', author: 'Thomas Cormen' },
          providing_institution_id: 'i0000000-0000-0000-0000-000000000002',
          status: 'shipped',
          courier_tracking: 'FedEx - 99120384219',
          created_at: '2026-06-08T10:00:00Z'
        },
        {
          id: 'ill2',
          books: { title: 'Calculus: Early Transcendentals', author: 'James Stewart' },
          providing_institution_id: 'i0000000-0000-0000-0000-000000000003',
          status: 'pending',
          courier_tracking: null,
          created_at: '2026-06-09T11:45:00Z'
        }
      ]);
      setBooks([
        { id: 'b1', title: 'Introduction to Algorithms', author: 'Thomas H. Cormen' },
        { id: 'b3', title: 'Calculus: Early Transcendentals', author: 'James Stewart' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookId || !selectedPartnerId) return;

    setSubmitting(true);
    setMessage(null);
    try {
      const res = await apiPost('/library/interlibrary/request', {
        providing_institution_id: selectedPartnerId,
        book_id: selectedBookId
      });

      if (res.success) {
        setMessage({ type: 'success', text: 'Interlibrary loan request submitted successfully!' });
        setSelectedBookId('');
        setSelectedPartnerId('');
        loadILLData();
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to create interlibrary loan request.' });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2.5 py-1 rounded-full text-[9px] font-bold bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 capitalize">Pending Approval</span>;
      case 'approved':
        return <span className="px-2.5 py-1 rounded-full text-[9px] font-bold bg-blue-500/10 border border-blue-500/20 text-blue-400 capitalize">Approved</span>;
      case 'shipped':
        return <span className="px-2.5 py-1 rounded-full text-[9px] font-bold bg-orange-500/10 border border-orange-500/20 text-orange-400 capitalize">Shipped</span>;
      case 'delivered':
        return <span className="px-2.5 py-1 rounded-full text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 capitalize">Delivered</span>;
      case 'returned':
        return <span className="px-2.5 py-1 rounded-full text-[9px] font-bold bg-purple-500/10 border border-purple-500/20 text-purple-400 capitalize">Returned</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[9px] font-bold bg-white/10 text-white capitalize">{status}</span>;
    }
  };

  const getPartnerName = (partnerId: string) => {
    const partner = partnerCampuses.find(p => p.id === partnerId);
    return partner ? partner.name : 'Partner Library';
  };

  // Stepper steps configuration
  const steps = ['pending', 'approved', 'shipped', 'delivered', 'returned'];
  const getStepIndex = (status: string) => steps.indexOf(status);

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6C2BD9]/15 via-[#0D0A1A] to-[#0D0A1A]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-6 pt-10 pb-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#6C2BD9]/25">
              <Shuffle className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-2xl lg:text-3xl text-white">Interlibrary Loans</h1>
              <p className="text-sm text-[#C4B5FD]/70">Borrow books unavailable locally from partner campuses • Track delivery timelines</p>
            </div>
          </div>
          <button onClick={loadILLData} className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-[#C4B5FD]/80 hover:text-white">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-6">
        {/* Status Messages */}
        {message && (
          <div className={`p-4 rounded-xl border mb-6 text-xs font-semibold ${
            message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Create Request Form */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-[#13102A]/60 shadow-xl">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#A78BFA]" /> Request Partner Loan
              </h3>
              
              <form onSubmit={handleRequestLoan} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#C4B5FD]/70 mb-1">Partner Campus Library</label>
                  <select
                    value={selectedPartnerId}
                    onChange={(e) => setSelectedPartnerId(e.target.value)}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#6C2BD9]/50"
                    required
                  >
                    <option value="">-- Choose providing campus --</option>
                    {partnerCampuses.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#C4B5FD]/70 mb-1">Book to Request</label>
                  <select
                    value={selectedBookId}
                    onChange={(e) => setSelectedBookId(e.target.value)}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#6C2BD9]/50"
                    required
                  >
                    <option value="">-- Select book from catalogue --</option>
                    {books.map(b => (
                      <option key={b.id} value={b.id}>{b.title} (by {b.author})</option>
                    ))}
                  </select>
                </div>

                <div className="p-3.5 rounded-xl bg-[#6C2BD9]/10 border border-[#6C2BD9]/20 text-[10px] text-[#C4B5FD]/80 leading-relaxed">
                  <strong>Notice:</strong> Interlibrary requests are processed within 24 hours. Librarians will coordinate physical shipping via registered couriers.
                </div>

                <button
                  type="submit"
                  disabled={submitting || !selectedBookId || !selectedPartnerId}
                  className="w-full py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white transition-all shadow-lg shadow-[#6C2BD9]/30 disabled:opacity-55"
                >
                  {submitting ? 'Submitting...' : 'Request Book Loan'}
                </button>
              </form>
            </div>
          </div>

          {/* Right Columns: Requests History and Tracking */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xs font-bold text-[#C4B5FD]/70 uppercase tracking-wider">My Interlibrary Requests</h3>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-[#6C2BD9] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : requests.length === 0 ? (
              <div className="glass-panel p-12 rounded-3xl border border-white/5 bg-[#13102A]/60 shadow-xl text-center text-xs text-[#C4B5FD]/30">
                You have not created any interlibrary loan requests yet.
              </div>
            ) : (
              <div className="space-y-6">
                {requests.map((req) => {
                  const currentStepIdx = getStepIndex(req.status);
                  return (
                    <div key={req.id} className="glass-panel p-6 rounded-3xl border border-white/5 bg-[#13102A]/60 shadow-xl space-y-5">
                      {/* Header details */}
                      <div className="flex flex-wrap justify-between items-start gap-4">
                        <div>
                          <span className="text-[9px] uppercase font-mono text-[#C4B5FD]/40">ILL ID: {req.id}</span>
                          <h4 className="text-sm font-extrabold text-white mt-0.5">{req.books?.title}</h4>
                          <p className="text-[10px] text-[#C4B5FD]/60 mt-0.5">by {req.books?.author} • Provider: {getPartnerName(req.providing_institution_id)}</p>
                        </div>
                        <div>
                          {getStatusBadge(req.status)}
                        </div>
                      </div>

                      {/* Stepper tracking visualization */}
                      <div className="relative pt-4 pb-2">
                        {/* Step line */}
                        <div className="absolute top-[28px] left-3 right-3 h-0.5 bg-white/5 z-0" />
                        <div
                          className="absolute top-[28px] left-3 h-0.5 bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] transition-all z-0"
                          style={{ width: `${Math.max(0, (currentStepIdx / (steps.length - 1)) * 100)}%` }}
                        />

                        {/* Step nodes */}
                        <div className="flex justify-between relative z-10">
                          {steps.map((stepName, stepIdx) => {
                            const isDone = currentStepIdx >= stepIdx;
                            return (
                              <div key={stepName} className="flex flex-col items-center gap-1.5">
                                <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-[9px] font-bold transition-all ${
                                  isDone
                                    ? 'bg-[#6C2BD9] border-[#8B5CF6] text-white shadow-md shadow-[#6C2BD9]/30'
                                    : 'bg-[#0D0A1A] border-white/10 text-[#C4B5FD]/30'
                                }`}>
                                  {stepIdx + 1}
                                </div>
                                <span className={`text-[8px] font-semibold uppercase tracking-wider transition-colors ${
                                  isDone ? 'text-white' : 'text-[#C4B5FD]/30'
                                }`}>
                                  {stepName}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Tracking code information */}
                      {req.courier_tracking && (
                        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 text-[#C4B5FD]/70">
                            <Truck className="w-4 h-4 text-[#A78BFA]" /> Courier Tracking Details:
                          </div>
                          <span className="font-mono font-bold text-white flex items-center gap-1">
                            {req.courier_tracking} <Navigation className="w-3 h-3 text-[#A78BFA]" />
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
