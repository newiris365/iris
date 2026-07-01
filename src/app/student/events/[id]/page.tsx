"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, Ticket, ArrowLeft, CreditCard, Star, Share2, Heart, Bell, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiGet, apiPost } from '../../../../lib/api';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.id as string;
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('about');

  useEffect(() => { loadEvent(); }, [eventId]);

  const loadEvent = async () => {
    try {
      const res = await apiGet(`/events/events/${eventId}`);
      if (res.success) {
        setEvent(res.event);
      } else {
        throw new Error('API error');
      }
    } catch {
      // Fallback mock
      setEvent({
        id: eventId,
        title: 'TechFest 2026 — AI & Robotics Summit',
        description: 'The flagship technology summit featuring hackathons, workshops, and keynote speakers from leading tech companies. Join us for 2 days of innovation, networking, and learning. This year features tracks on Artificial Intelligence, Robotics, IoT, and Cybersecurity.\n\nHighlights:\n• Keynote by industry leaders from Google, Microsoft, and NVIDIA\n• 24-hour hackathon with prizes worth ₹5,00,000\n• Hands-on workshops on ML, Computer Vision, and NLP\n• Startup pitch competition\n• Networking dinner with alumni in tech',
        category: 'Tech',
        venue: 'Main Auditorium, Block A',
        start_datetime: '2026-06-20T10:00:00Z',
        end_datetime: '2026-06-21T18:00:00Z',
        max_participants: 500,
        registration_count: 347,
        volunteer_count: 24,
        avg_rating: '4.5',
        feedback_count: 89,
        is_paid: true,
        ticket_price: 299,
        status: 'Scheduled',
        banner_url: null,
        tags: ['AI', 'Robotics', 'Innovation', 'Hackathon'],
        registration_deadline: '2026-06-19T23:59:59Z'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setRegistering(true);
    setError('');
    try {
      const userStr = localStorage.getItem('iris_user_profile');
      const user = userStr ? JSON.parse(userStr) : null;
      const studentId = user?.student_id || user?.id || '';

      if (event.is_paid) {
        // Initiate Razorpay payment
        const orderRes = await apiPost('/events/events/tickets/initiate', {
          event_id: eventId,
          student_id: studentId
        });

        if (!orderRes.success) throw new Error(orderRes.error);

        // First register (pending payment)
        const regRes = await apiPost(`/events/events/${eventId}/register`, { student_id: studentId });
        if (!regRes.success) throw new Error(regRes.error);

        // Open Razorpay checkout
        if (typeof window !== 'undefined' && (window as any).Razorpay) {
          const options = {
            key: orderRes.key_id,
            amount: orderRes.amount,
            currency: orderRes.currency,
            name: 'IRIS Events',
            description: event.title,
            order_id: orderRes.order_id,
            handler: async (response: any) => {
              await apiPost('/events/events/tickets/verify', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                registration_id: regRes.registration.id
              });
              setRegistered(true);
              setTicketNumber(regRes.registration.ticket_number);
            },
            theme: { color: '#6C2BD9' }
          };
          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        } else {
          // Mock mode - just mark as registered
          setRegistered(true);
          setTicketNumber(regRes.registration.ticket_number);
        }
      } else {
        // Free event
        const res = await apiPost(`/events/events/${eventId}/register`, { student_id: studentId });
        if (res.success) {
          setRegistered(true);
          setTicketNumber(res.registration.ticket_number);
        } else {
          throw new Error(res.error);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setRegistering(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0D0A1A] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#6C2BD9] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!event) {
    return (
      <main className="min-h-screen bg-[#0D0A1A] flex items-center justify-center text-white">
        <p>Event not found.</p>
      </main>
    );
  }

  const spotsLeft = event.max_participants ? event.max_participants - (event.registration_count || 0) : null;
  const isFull = spotsLeft !== null && spotsLeft <= 0;
  const deadlinePassed = event.registration_deadline && new Date(event.registration_deadline) < new Date();

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-6 pt-6">
        <Link href="/student/events" className="inline-flex items-center gap-2 text-xs font-bold text-[#C4B5FD]/60 hover:text-[#A78BFA] transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Events
        </Link>
      </div>

      {/* Hero Banner */}
      <div className="relative overflow-hidden mt-4">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6C2BD9]/20 via-[#0D0A1A] to-[#0D0A1A]" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#8B5CF6]/8 rounded-full blur-[150px]" />

        <div className="relative max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 text-[#A78BFA]">
              {event.category}
            </span>
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
              event.status === 'Scheduled' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' :
              event.status === 'Ongoing' ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' :
              event.status === 'Completed' ? 'bg-blue-500/15 border-blue-500/30 text-blue-400' :
              'bg-red-500/15 border-red-500/30 text-red-400'
            } border`}>
              {event.status}
            </span>
            {event.is_paid ? (
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                ₹{event.ticket_price}
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                FREE
              </span>
            )}
          </div>

          <h1 className="text-3xl lg:text-4xl font-extrabold text-white mb-4">{event.title}</h1>

          <div className="flex flex-wrap gap-5 text-sm text-[#C4B5FD]/70">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#A78BFA]" />
              {formatDate(event.start_datetime)} — {formatDate(event.end_datetime)}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#A78BFA]" />
              {formatTime(event.start_datetime)}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#A78BFA]" />
              {event.venue || 'TBA'}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
        {/* Left / Main Column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/5">
            {['about', 'schedule', 'tags'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === tab
                    ? 'bg-[#6C2BD9] text-white shadow-lg shadow-[#6C2BD9]/20'
                    : 'text-[#C4B5FD]/50 hover:text-white'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-6">
              <h2 className="text-lg font-bold text-white mb-4">About This Event</h2>
              <div className="text-sm text-[#C4B5FD]/70 leading-relaxed whitespace-pre-line">
                {event.description}
              </div>
            </div>
          )}

          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <div className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-6">
              <h2 className="text-lg font-bold text-white mb-4">Event Schedule</h2>
              <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                  <div className="w-1 rounded-full bg-gradient-to-b from-[#6C2BD9] to-[#8B5CF6]" />
                  <div>
                    <p className="text-xs font-bold text-[#A78BFA]">{formatDate(event.start_datetime)}</p>
                    <p className="text-sm text-white font-semibold">Start: {formatTime(event.start_datetime)}</p>
                    <p className="text-[11px] text-[#C4B5FD]/50 mt-1">Event begins at {event.venue}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-1 rounded-full bg-gradient-to-b from-[#8B5CF6] to-[#A78BFA]" />
                  <div>
                    <p className="text-xs font-bold text-[#A78BFA]">{formatDate(event.end_datetime)}</p>
                    <p className="text-sm text-white font-semibold">End: {formatTime(event.end_datetime)}</p>
                    <p className="text-[11px] text-[#C4B5FD]/50 mt-1">Event concludes with closing ceremony</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tags Tab */}
          {activeTab === 'tags' && (
            <div className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-6">
              <h2 className="text-lg font-bold text-white mb-4">Tags & Topics</h2>
              <div className="flex flex-wrap gap-2">
                {(event.tags || []).map((tag: string) => (
                  <span key={tag} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-[#C4B5FD]/80">
                    #{tag}
                  </span>
                ))}
                {(!event.tags || event.tags.length === 0) && (
                  <p className="text-xs text-[#C4B5FD]/40">No tags added for this event.</p>
                )}
              </div>
            </div>
          )}

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl border border-white/5 bg-[#13102A]/40 p-4 text-center">
              <p className="text-2xl font-extrabold text-white">{event.registration_count || 0}</p>
              <p className="text-[10px] text-[#C4B5FD]/50 mt-1">Registered</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-[#13102A]/40 p-4 text-center">
              <p className="text-2xl font-extrabold text-white">{event.volunteer_count || 0}</p>
              <p className="text-[10px] text-[#C4B5FD]/50 mt-1">Volunteers</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-[#13102A]/40 p-4 text-center">
              <p className="text-2xl font-extrabold text-white">{event.avg_rating || '—'}</p>
              <p className="text-[10px] text-[#C4B5FD]/50 mt-1">Avg Rating</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-[#13102A]/40 p-4 text-center">
              <p className="text-2xl font-extrabold text-white">{event.feedback_count || 0}</p>
              <p className="text-[10px] text-[#C4B5FD]/50 mt-1">Reviews</p>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Registration Card */}
        <div className="flex flex-col gap-5">
          <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-[#13102A] to-[#1A1538] p-6 sticky top-6">
            {registered ? (
              <>
                <div className="text-center mb-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Registered!</h3>
                  <p className="text-xs text-[#C4B5FD]/60 mt-1">You're all set for this event.</p>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center mb-4">
                  <p className="text-[10px] text-[#C4B5FD]/40 mb-1">Your Ticket</p>
                  <p className="text-lg font-mono font-bold text-[#A78BFA]">{ticketNumber}</p>
                </div>

                <Link
                  href="/student/events/my-tickets"
                  className="w-full py-3 rounded-xl bg-[#6C2BD9] text-xs font-bold text-white text-center block hover:bg-[#8B5CF6] transition-all"
                >
                  View My Tickets
                </Link>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-white mb-4">Register Now</h3>

                {event.is_paid && (
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 mb-4">
                    <span className="text-xs text-[#C4B5FD]/60">Ticket Price</span>
                    <span className="text-xl font-extrabold text-white">₹{event.ticket_price}</span>
                  </div>
                )}

                {spotsLeft !== null && (
                  <div className="mb-4">
                    <div className="flex justify-between text-[10px] text-[#C4B5FD]/50 mb-1.5">
                      <span>{event.registration_count} registered</span>
                      <span>{spotsLeft} spots left</span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] rounded-full transition-all"
                        style={{ width: `${Math.min(100, (event.registration_count / event.max_participants) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {event.registration_deadline && (
                  <div className="flex items-center gap-2 text-xs text-[#C4B5FD]/60 mb-4">
                    <Bell className="w-3.5 h-3.5" />
                    Deadline: {formatDate(event.registration_deadline)}
                  </div>
                )}

                {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 mb-4 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                  </div>
                )}

                <button
                  onClick={handleRegister}
                  disabled={registering || isFull || deadlinePassed}
                  className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    isFull || deadlinePassed
                      ? 'bg-white/5 text-[#C4B5FD]/30 cursor-not-allowed'
                      : 'bg-[#6C2BD9] text-white hover:bg-[#8B5CF6] shadow-lg shadow-[#6C2BD9]/30'
                  }`}
                >
                  {registering ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : isFull ? (
                    'Event Full'
                  ) : deadlinePassed ? (
                    'Deadline Passed'
                  ) : event.is_paid ? (
                    <><CreditCard className="w-4 h-4" /> Pay & Register — ₹{event.ticket_price}</>
                  ) : (
                    <><Ticket className="w-4 h-4" /> Register for Free</>
                  )}
                </button>
              </>
            )}
          </div>

          {/* Quick Info Card */}
          <div className="rounded-2xl border border-white/5 bg-[#13102A]/40 p-5">
            <h4 className="text-xs font-bold text-[#C4B5FD]/60 mb-3">Event Info</h4>
            <div className="flex flex-col gap-3 text-xs">
              <div className="flex justify-between">
                <span className="text-[#C4B5FD]/50">Category</span>
                <span className="text-white font-semibold">{event.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#C4B5FD]/50">Capacity</span>
                <span className="text-white font-semibold">{event.max_participants || 'Unlimited'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#C4B5FD]/50">Duration</span>
                <span className="text-white font-semibold">
                  {Math.ceil((new Date(event.end_datetime).getTime() - new Date(event.start_datetime).getTime()) / (1000 * 60 * 60))}h
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#C4B5FD]/50">Status</span>
                <span className="text-emerald-400 font-semibold">{event.status}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
