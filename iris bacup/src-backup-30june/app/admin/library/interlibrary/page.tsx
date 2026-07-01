"use client";

import React, { useState, useEffect } from 'react';
import { Shuffle, CheckCircle, Truck, RefreshCw, Ship, MapPin, ExternalLink, Calendar, Search } from 'lucide-react';
import { apiGet, apiPut } from '../../../../lib/api';

export default function AdminInterlibraryPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  // Forms Tracking States
  const [trackingInputs, setTrackingInputs] = useState<{ [key: string]: string }>({});

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Current Institution ID context
  const [institutionId, setInstitutionId] = useState('');

  // Campuses mapper
  const campuses: { [key: string]: string } = {
    'i0000000-0000-0000-0000-000000000001': 'IRIS Main Campus Library',
    'i0000000-0000-0000-0000-000000000002': 'IRIS North Campus Library',
    'i0000000-0000-0000-0000-000000000003': 'IRIS West Engineering Center'
  };

  useEffect(() => {
    // Resolve logged in staff user profile to get institution_id
    const userStr = localStorage.getItem('iris_user_profile');
    const user = userStr ? JSON.parse(userStr) : null;
    const instId = user?.institution_id || 'i0000000-0000-0000-0000-000000000001';
    setInstitutionId(instId);
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const res = await apiGet('/library/interlibrary/requests');
      if (res.success) {
        setRequests(res.requests || []);
      }
    } catch (err) {
      console.error(err);
      // Mocks fallback
      setRequests([
        {
          id: 'ill1',
          books: { title: 'Introduction to Algorithms', author: 'Thomas Cormen' },
          requesting_institution_id: 'i0000000-0000-0000-0000-000000000002',
          providing_institution_id: 'i0000000-0000-0000-0000-000000000001',
          status: 'pending',
          courier_tracking: null,
          created_at: '2026-06-09T08:00:00Z'
        },
        {
          id: 'ill2',
          books: { title: 'Calculus: Early Transcendentals', author: 'James Stewart' },
          requesting_institution_id: 'i0000000-0000-0000-0000-000000000001',
          providing_institution_id: 'i0000000-0000-0000-0000-000000000003',
          status: 'shipped',
          courier_tracking: 'FedEx - 998822001',
          created_at: '2026-06-08T14:30:00Z'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (requestId: string, status: string, tracking?: string) => {
    setSubmittingId(requestId);
    setMessage(null);
    try {
      const res = await apiPut(`/library/interlibrary/requests/${requestId}/status`, {
        status,
        courier_tracking: tracking || null
      });

      if (res.success) {
        setMessage({ type: 'success', text: `Request successfully transitioned to ${status}.` });
        loadRequests();
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to update request status.' });
    } finally {
      setSubmittingId(null);
    }
  };

  const handleTrackingInputChange = (reqId: string, val: string) => {
    setTrackingInputs({
      ...trackingInputs,
      [reqId]: val
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2.5 py-1 rounded-full text-[9px] font-bold bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 uppercase">Pending</span>;
      case 'approved':
        return <span className="px-2.5 py-1 rounded-full text-[9px] font-bold bg-blue-500/10 border border-blue-500/20 text-blue-400 uppercase">Approved</span>;
      case 'shipped':
        return <span className="px-2.5 py-1 rounded-full text-[9px] font-bold bg-orange-500/10 border border-orange-500/20 text-orange-400 uppercase">Shipped</span>;
      case 'delivered':
        return <span className="px-2.5 py-1 rounded-full text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase">Delivered</span>;
      case 'returned':
        return <span className="px-2.5 py-1 rounded-full text-[9px] font-bold bg-purple-500/10 border border-purple-500/20 text-purple-400 uppercase">Returned</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[9px] font-bold bg-white/10 text-white uppercase">{status}</span>;
    }
  };

  // Separate inbound and outbound
  const inboundRequests = requests.filter(r => r.providing_institution_id === institutionId);
  const outboundRequests = requests.filter(r => r.requesting_institution_id === institutionId);

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6C2BD9]/15 via-[#0D0A1A] to-[#0D0A1A]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/5 rounded-full blur-[120px]" />
        
        <div className="relative max-w-7xl mx-auto px-6 pt-10 pb-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#6C2BD9]/25">
              <Shuffle className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-2xl lg:text-3xl text-white">Partner Loans Manager</h1>
              <p className="text-sm text-[#C4B5FD]/70">Admin Console • Review requests and update shipping logs for interlibrary sharing</p>
            </div>
          </div>
          <button onClick={loadRequests} className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-[#C4B5FD]/80 hover:text-white">
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

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-2 border-[#6C2BD9] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Inbound Requests Panel */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Truck className="w-4.5 h-4.5 text-[#A78BFA]" /> Inbound Sharing Requests (Our Campus is Provider)
              </h3>
              
              <div className="space-y-4">
                {inboundRequests.map((req) => (
                  <div key={req.id} className="glass-panel p-5 rounded-3xl border border-white/5 bg-[#13102A]/60 shadow-xl space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] uppercase font-mono text-[#C4B5FD]/40">ILL ID: {req.id}</span>
                        <h4 className="text-xs font-extrabold text-white mt-0.5">{req.books?.title}</h4>
                        <p className="text-[10px] text-[#C4B5FD]/60 mt-0.5">Requester: {campuses[req.requesting_institution_id] || 'Partner Library'}</p>
                      </div>
                      <div>
                        {getStatusBadge(req.status)}
                      </div>
                    </div>

                    {/* Action form based on current request status */}
                    <div className="pt-3 border-t border-white/5 flex flex-wrap gap-2.5 items-end justify-between">
                      {req.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateStatus(req.id, 'approved')}
                          disabled={submittingId === req.id}
                          className="px-4 py-2 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-[10px] font-bold text-white transition-all shadow-md disabled:opacity-55"
                        >
                          {submittingId === req.id ? 'Approving...' : 'Approve Loan Request'}
                        </button>
                      )}

                      {req.status === 'approved' && (
                        <div className="w-full flex flex-col sm:flex-row gap-2 items-end">
                          <div className="flex-1 space-y-1 w-full">
                            <label className="block text-[9px] uppercase tracking-wider text-[#C4B5FD]/50">Courier Info & Tracking Code</label>
                            <input
                              type="text"
                              placeholder="e.g. DTDC - DX100223"
                              value={trackingInputs[req.id] || ''}
                              onChange={(e) => handleTrackingInputChange(req.id, e.target.value)}
                              className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2 text-[11px] text-white focus:outline-none focus:border-[#6C2BD9]/50"
                            />
                          </div>
                          <button
                            onClick={() => handleUpdateStatus(req.id, 'shipped', trackingInputs[req.id])}
                            disabled={submittingId === req.id || !trackingInputs[req.id]?.trim()}
                            className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-[10px] font-bold text-white transition-all shadow-md disabled:opacity-55 shrink-0"
                          >
                            Mark Shipped
                          </button>
                        </div>
                      )}

                      {req.status === 'shipped' && (
                        <button
                          onClick={() => handleUpdateStatus(req.id, 'delivered')}
                          disabled={submittingId === req.id}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-[10px] font-bold text-white transition-all shadow-md disabled:opacity-55"
                        >
                          Mark as Delivered
                        </button>
                      )}

                      {req.status === 'delivered' && (
                        <button
                          onClick={() => handleUpdateStatus(req.id, 'returned')}
                          disabled={submittingId === req.id}
                          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-[10px] font-bold text-white transition-all shadow-md disabled:opacity-55"
                        >
                          Mark as Returned
                        </button>
                      )}

                      {req.status === 'returned' && (
                        <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Book returned successfully.
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {inboundRequests.length === 0 && (
                  <div className="glass-panel p-10 rounded-3xl border border-white/5 bg-[#13102A]/60 shadow-xl text-center text-xs text-[#C4B5FD]/30">
                    No inbound share requests pending actions.
                  </div>
                )}
              </div>
            </div>

            {/* Outbound Requests Panel */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Shuffle className="w-4.5 h-4.5 text-[#A78BFA]" /> Outbound Requests (Our Campus requested)
              </h3>
              
              <div className="space-y-4">
                {outboundRequests.map((req) => (
                  <div key={req.id} className="glass-panel p-5 rounded-3xl border border-white/5 bg-[#13102A]/60 shadow-xl space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] uppercase font-mono text-[#C4B5FD]/40">ILL ID: {req.id}</span>
                        <h4 className="text-xs font-extrabold text-white mt-0.5">{req.books?.title}</h4>
                        <p className="text-[10px] text-[#C4B5FD]/60 mt-0.5">Provider: {campuses[req.providing_institution_id] || 'Partner Library'}</p>
                      </div>
                      <div>
                        {getStatusBadge(req.status)}
                      </div>
                    </div>

                    {req.courier_tracking && (
                      <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-[10px] font-mono text-[#C4B5FD] flex justify-between items-center">
                        <span>Courier Code: {req.courier_tracking}</span>
                        <span className="text-[#A78BFA] flex items-center gap-0.5">In Transit <Truck className="w-3.5 h-3.5 animate-pulse" /></span>
                      </div>
                    )}
                  </div>
                ))}

                {outboundRequests.length === 0 && (
                  <div className="glass-panel p-10 rounded-3xl border border-white/5 bg-[#13102A]/60 shadow-xl text-center text-xs text-[#C4B5FD]/30">
                    No outbound loan requests active.
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </main>
  );
}
