"use client";

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Calendar, MapPin, Clock, Users, Ticket, DollarSign, 
  Trash2, Plus, Megaphone, Image as ImageIcon, Star, Download, Edit3, 
  CheckCircle, PlusCircle, UserPlus, AlertCircle, Sparkles, Send, FileText 
} from 'lucide-react';
import { apiGet, apiPost, apiPut, apiDelete } from '../../../../lib/api';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function ManageEventPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [budgetItems, setBudgetItems] = useState<any[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<any>({ total_estimated: 0, total_actual: 0, variance: 0 });
  const [photos, setPhotos] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [feedbackStats, setFeedbackStats] = useState<any>({ total_responses: 0, avg_overall_rating: 0 });
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('registrations');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [newVolunteer, setNewVolunteer] = useState({ student_id: '', role: 'Coordinator' });
  const [newBudgetItem, setNewBudgetItem] = useState({ category: 'Venue', description: '', estimated_amount: 0, actual_amount: 0, receipt_url: '' });
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', message: '', priority: 'normal', sent_via: ['push'] });
  const [newPhoto, setNewPhoto] = useState({ photo_url: '', caption: '', is_featured: false });
  const [searchReg, setSearchReg] = useState('');

  useEffect(() => {
    loadAllData();
  }, [eventId]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [
        eventRes, registrationsRes, volunteersRes, 
        budgetRes, photosRes, announcementsRes, feedbackRes
      ] = await Promise.all([
        apiGet(`/events/events/${eventId}`),
        apiGet(`/events/events/${eventId}/registrations`),
        apiGet(`/events/events/${eventId}/volunteers`),
        apiGet(`/events/events/${eventId}/budget`),
        apiGet(`/events/events/${eventId}/photos`),
        apiGet(`/events/events/${eventId}/announcements`),
        apiGet(`/events/events/${eventId}/feedback`)
      ]);

      if (eventRes.success) setEvent(eventRes.event);
      if (registrationsRes.success) setRegistrations(registrationsRes.registrations || []);
      if (volunteersRes.success) setVolunteers(volunteersRes.volunteers || []);
      if (budgetRes.success) {
        setBudgetItems(budgetRes.budget_items || []);
        setBudgetSummary(budgetRes.summary || { total_estimated: 0, total_actual: 0, variance: 0 });
      }
      if (photosRes.success) setPhotos(photosRes.photos || []);
      if (announcementsRes.success) setAnnouncements(announcementsRes.announcements || []);
      if (feedbackRes.success) {
        setFeedback(feedbackRes.feedback || []);
        setFeedbackStats(feedbackRes.stats || { total_responses: 0, avg_overall_rating: 0 });
      }
    } catch (err) {
      console.error(err);
      setError('Offline mode: Using mock event information.');
      // Mock fallbacks
      setupMockData();
    } finally {
      setLoading(false);
    }
  };

  const setupMockData = () => {
    setEvent({
      id: eventId,
      title: 'TechFest 2026 — AI & Robotics Summit',
      description: 'The flagship technology summit featuring hackathons, workshops, and keynote speakers from leading tech companies.',
      category: 'Tech',
      venue: 'Main Auditorium',
      start_datetime: '2026-06-20T10:00:00Z',
      end_datetime: '2026-06-21T18:00:00Z',
      max_participants: 500,
      registration_count: 347,
      volunteer_count: 12,
      avg_rating: '4.7',
      feedback_count: 4,
      is_paid: true,
      ticket_price: 299,
      status: 'Scheduled',
      tags: ['AI', 'Robotics', 'Innovation'],
      registration_deadline: '2026-06-19T23:59:59Z'
    });

    setRegistrations([
      { id: 'r1', ticket_number: 'EVT-A3F9K2L1', payment_status: 'Completed', amount_paid: 299, attendance_marked: true, checked_in_at: '2026-06-20T10:15:00Z', students: { name: 'Aarav Sharma', roll_number: 'CS23B1001', department: 'Computer Science' } },
      { id: 'r2', ticket_number: 'EVT-Z8X4P5W0', payment_status: 'Completed', amount_paid: 299, attendance_marked: false, checked_in_at: null, students: { name: 'Diya Patel', roll_number: 'EC23B2014', department: 'Electronics' } },
      { id: 'r3', ticket_number: 'EVT-M7B2N6X8', payment_status: 'Pending', amount_paid: 0, attendance_marked: false, checked_in_at: null, students: { name: 'Kabir Singh', roll_number: 'ME24M3002', department: 'Mechanical' } },
      { id: 'r4', ticket_number: 'EVT-T5V9C1X2', payment_status: 'Completed', amount_paid: 299, attendance_marked: true, checked_in_at: '2026-06-20T10:30:00Z', students: { name: 'Ananya Iyer', roll_number: 'CS23B1045', department: 'Computer Science' } }
    ]);

    setVolunteers([
      { id: 'v1', student_id: 's1', role: 'Technical Lead', students: { name: 'Rahul Verma', roll_number: 'CS22B1020', department: 'Computer Science' } },
      { id: 'v2', student_id: 's2', role: 'Logistics Manager', students: { name: 'Neha Gupta', roll_number: 'ME22B1040', department: 'Mechanical' } }
    ]);

    setBudgetItems([
      { id: 'b1', category: 'Venue', description: 'Auditorium Booking Charge', estimated_amount: 15000, actual_amount: 15000, status: 'approved' },
      { id: 'b2', category: 'Catering', description: 'Lunch & Snacks for attendees', estimated_amount: 45000, actual_amount: 42300, status: 'approved' },
      { id: 'b3', category: 'Prizes', description: 'Cash prize for Hackathon winner', estimated_amount: 50000, actual_amount: 50000, status: 'approved' },
      { id: 'b4', category: 'Marketing', description: 'Banners, brochures & posters', estimated_amount: 10000, actual_amount: 12500, status: 'pending' }
    ]);
    setBudgetSummary({ total_estimated: 120000, total_actual: 119800, variance: 200 });

    setPhotos([
      { id: 'p1', photo_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500', caption: 'Inauguration Ceremony Kickoff', is_featured: true },
      { id: 'p2', photo_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=500', caption: 'Students coding in Hackathon', is_featured: false }
    ]);

    setAnnouncements([
      { id: 'a1', title: 'Schedule Update', message: 'The keynote speaker session will now begin at 11:00 AM instead of 10:30 AM.', priority: 'high', sent_via: ['push', 'email'], created_at: '2026-06-09T09:00:00Z' },
      { id: 'a2', title: 'Free Wi-Fi access details', message: 'Connect to campus guest network using credential techfest2026', priority: 'normal', sent_via: ['push'], created_at: '2026-06-08T15:30:00Z' }
    ]);

    setFeedback([
      { id: 'f1', overall_rating: 5, comment: 'Amazing hackathon, learned a lot about robotics and AI!', students: { name: 'Aditya Sen' } },
      { id: 'f2', overall_rating: 4, comment: 'Great food and venue. The speakers were awesome.', students: { name: 'Pooja Hegde' } }
    ]);
    setFeedbackStats({ total_responses: 2, avg_overall_rating: 4.5 });
  };

  const handleUpdateStatus = async (status: string) => {
    try {
      const res = await apiPut(`/events/events/${eventId}`, { status });
      if (res.success) {
        setEvent({ ...event, status });
        showToast('Event status updated to ' + status);
      }
    } catch {
      setEvent({ ...event, status });
      showToast('Event status updated (Mock)');
    }
  };

  const handleCheckin = async (ticketNumber: string, regId: string) => {
    try {
      const res = await apiPost(`/events/events/${eventId}/checkin`, { ticket_number: ticketNumber });
      if (res.success) {
        setRegistrations(registrations.map(r => r.id === regId ? { ...r, attendance_marked: true, checked_in_at: new Date().toISOString() } : r));
        showToast('Check-in successful!');
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      // Offline implementation
      setRegistrations(registrations.map(r => r.id === regId ? { ...r, attendance_marked: true, checked_in_at: new Date().toISOString() } : r));
      showToast('Check-in successful (Mock mode)');
    }
  };

  const handleAddVolunteer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVolunteer.student_id) return;
    try {
      const res = await apiPost(`/events/events/${eventId}/volunteers`, {
        student_id: newVolunteer.student_id,
        role: newVolunteer.role
      });
      if (res.success) {
        loadAllData();
        setNewVolunteer({ student_id: '', role: 'Coordinator' });
        showToast('Volunteer added!');
      } else {
        throw new Error(res.error);
      }
    } catch {
      // Mock addition
      const mockVol = {
        id: Math.random().toString(),
        student_id: newVolunteer.student_id,
        role: newVolunteer.role,
        students: { name: 'Student ' + newVolunteer.student_id.slice(-4), roll_number: 'ST-' + newVolunteer.student_id.slice(-6), department: 'Engineering' }
      };
      setVolunteers([mockVol, ...volunteers]);
      setNewVolunteer({ student_id: '', role: 'Coordinator' });
      showToast('Volunteer added (Mock)');
    }
  };

  const handleRemoveVolunteer = async (volunteerId: string) => {
    try {
      const res = await apiDelete(`/events/events/${eventId}/volunteers/${volunteerId}`);
      if (res.success) {
        setVolunteers(volunteers.filter(v => v.id !== volunteerId));
        showToast('Volunteer removed');
      }
    } catch {
      setVolunteers(volunteers.filter(v => v.id !== volunteerId));
      showToast('Volunteer removed (Mock)');
    }
  };

  const handleAddBudgetItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiPost(`/events/events/${eventId}/budget`, {
        category: newBudgetItem.category,
        description: newBudgetItem.description,
        estimated_amount: Number(newBudgetItem.estimated_amount),
        actual_amount: Number(newBudgetItem.actual_amount),
        receipt_url: newBudgetItem.receipt_url || undefined
      });
      if (res.success) {
        loadAllData();
        setNewBudgetItem({ category: 'Venue', description: '', estimated_amount: 0, actual_amount: 0, receipt_url: '' });
        showToast('Budget item added');
      }
    } catch {
      // Mock
      const mockItem = {
        id: Math.random().toString(),
        category: newBudgetItem.category,
        description: newBudgetItem.description,
        estimated_amount: newBudgetItem.estimated_amount,
        actual_amount: newBudgetItem.actual_amount,
        status: 'pending'
      };
      setBudgetItems([mockItem, ...budgetItems]);
      const newEst = budgetSummary.total_estimated + newBudgetItem.estimated_amount;
      const newAct = budgetSummary.total_actual + newBudgetItem.actual_amount;
      setBudgetSummary({ total_estimated: newEst, total_actual: newAct, variance: newEst - newAct });
      setNewBudgetItem({ category: 'Venue', description: '', estimated_amount: 0, actual_amount: 0, receipt_url: '' });
      showToast('Budget item added (Mock)');
    }
  };

  const handleApproveBudget = async (itemId: string) => {
    try {
      const res = await apiPut(`/events/events/${eventId}/budget/${itemId}/approve`, {});
      if (res.success) {
        setBudgetItems(budgetItems.map(b => b.id === itemId ? { ...b, status: 'approved' } : b));
        showToast('Budget item approved!');
      }
    } catch {
      setBudgetItems(budgetItems.map(b => b.id === itemId ? { ...b, status: 'approved' } : b));
      showToast('Budget item approved (Mock)');
    }
  };

  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiPost(`/events/events/${eventId}/announcements`, {
        title: newAnnouncement.title,
        message: newAnnouncement.message,
        priority: newAnnouncement.priority,
        sent_via: newAnnouncement.sent_via
      });
      if (res.success) {
        setAnnouncements([res.announcement, ...announcements]);
        setNewAnnouncement({ title: '', message: '', priority: 'normal', sent_via: ['push'] });
        showToast('Announcement broadcasted!');
      }
    } catch {
      // Mock
      const mockAnn = {
        id: Math.random().toString(),
        title: newAnnouncement.title,
        message: newAnnouncement.message,
        priority: newAnnouncement.priority,
        sent_via: newAnnouncement.sent_via,
        created_at: new Date().toISOString()
      };
      setAnnouncements([mockAnn, ...announcements]);
      setNewAnnouncement({ title: '', message: '', priority: 'normal', sent_via: ['push'] });
      showToast('Announcement broadcasted (Mock)');
    }
  };

  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhoto.photo_url) return;
    try {
      const res = await apiPost(`/events/events/${eventId}/photos`, newPhoto);
      if (res.success) {
        setPhotos([res.photo, ...photos]);
        setNewPhoto({ photo_url: '', caption: '', is_featured: false });
        showToast('Photo uploaded!');
      }
    } catch {
      // Mock
      const mockPh = {
        id: Math.random().toString(),
        photo_url: newPhoto.photo_url,
        caption: newPhoto.caption,
        is_featured: newPhoto.is_featured
      };
      setPhotos([mockPh, ...photos]);
      setNewPhoto({ photo_url: '', caption: '', is_featured: false });
      showToast('Photo uploaded (Mock)');
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      const res = await apiDelete(`/events/events/${eventId}/photos/${photoId}`);
      if (res.success) {
        setPhotos(photos.filter(p => p.id !== photoId));
        showToast('Photo deleted');
      }
    } catch {
      setPhotos(photos.filter(p => p.id !== photoId));
      showToast('Photo deleted (Mock)');
    }
  };

  const handleDownloadPdf = () => {
    // Open standard PDF download route
    window.open(`http://localhost:4000/api/v1/events/events/${eventId}/report/pdf`, '_blank');
    showToast('Triggering PDF report generation...');
  };

  const showToast = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const filteredRegs = registrations.filter(r => 
    r.students?.name.toLowerCase().includes(searchReg.toLowerCase()) ||
    r.students?.roll_number.toLowerCase().includes(searchReg.toLowerCase()) ||
    r.ticket_number.toLowerCase().includes(searchReg.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0D0A1A] flex items-center justify-center text-white">
        <div className="w-10 h-10 border-2 border-[#6C2BD9] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!event) {
    return (
      <main className="min-h-screen bg-[#0D0A1A] flex flex-col items-center justify-center text-white gap-4">
        <p>Event not found or failed to load.</p>
        <Link href="/admin/events" className="px-5 py-2.5 bg-[#6C2BD9] text-xs font-bold rounded-xl flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Top Banner */}
      <div className="relative overflow-hidden border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#6C2BD9]/10 rounded-full blur-[100px]" />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Link href="/admin/events" className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-[#C4B5FD]/70 hover:text-white">
                <ArrowLeft className="w-4.5 h-4.5" />
              </Link>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#6C2BD9]/20 border border-[#6C2BD9]/20 text-[#A78BFA]">{event.category}</span>
                  <span className="text-[10px] text-[#C4B5FD]/40">{formatDate(event.start_datetime)}</span>
                </div>
                <h1 className="font-extrabold text-xl lg:text-2xl mt-1">{event.title}</h1>
                <p className="text-xs text-[#C4B5FD]/50 mt-0.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> {event.venue}
                </p>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {/* PDF download */}
              <button
                onClick={handleDownloadPdf}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition-all flex items-center gap-2"
              >
                <FileText className="w-4 h-4 text-[#A78BFA]" /> Report PDF
              </button>

              {/* Edit */}
              <Link
                href={`/admin/events/create?id=${eventId}`}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition-all flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4 text-[#A78BFA]" /> Edit Event
              </Link>

              {/* Status Update Dropdown/Buttons */}
              <select
                value={event.status}
                onChange={e => handleUpdateStatus(e.target.value)}
                className="px-4 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white transition-all border-none focus:ring-2 focus:ring-[#8B5CF6]/50 cursor-pointer"
              >
                <option value="draft">Draft</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="rounded-xl border border-white/5 bg-[#13102A]/60 p-4">
              <p className="text-xl font-extrabold text-white">{event.registration_count} / {event.max_participants || '∞'}</p>
              <p className="text-[10px] text-[#C4B5FD]/50 mt-1">Registrations Filled</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-[#13102A]/60 p-4">
              <p className="text-xl font-extrabold text-[#A78BFA]">{registrations.filter(r => r.attendance_marked).length}</p>
              <p className="text-[10px] text-[#C4B5FD]/50 mt-1">Checked In (Attended)</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-[#13102A]/60 p-4">
              <p className="text-xl font-extrabold text-emerald-400">₹{registrations.reduce((a, b) => a + (b.amount_paid || 0), 0).toLocaleString()}</p>
              <p className="text-[10px] text-[#C4B5FD]/50 mt-1">Revenue Collected</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-[#13102A]/60 p-4">
              <p className="text-xl font-extrabold text-rose-400">₹{budgetSummary.total_actual.toLocaleString()}</p>
              <p className="text-[10px] text-[#C4B5FD]/50 mt-1">Total Expenses</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8">
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 mb-6 flex items-center gap-2">
            <AlertCircle className="w-4.5 h-4.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-4 h-fit space-y-1">
            {[
              { id: 'registrations', label: 'Registrations', icon: Ticket },
              { id: 'volunteers', label: 'Volunteers', icon: Users },
              { id: 'budget', label: 'Budget & Finance', icon: DollarSign },
              { id: 'announcements', label: 'Announcements', icon: Megaphone },
              { id: 'photos', label: 'Photo Gallery', icon: ImageIcon },
              { id: 'feedback', label: 'Feedback & Ratings', icon: Star },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#6C2BD9] text-white shadow-lg shadow-[#6C2BD9]/20'
                    : 'text-[#C4B5FD]/50 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Main Area */}
          <div className="lg:col-span-3">
            {/* 1. REGISTRATIONS */}
            {activeTab === 'registrations' && (
              <div className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-[#A78BFA]" /> Participant List
                  </h2>
                  <input
                    type="text"
                    placeholder="Search by name, roll no, ticket..."
                    value={searchReg}
                    onChange={e => setSearchReg(e.target.value)}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#6C2BD9]/50 transition-colors w-full sm:w-64"
                  />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-white/5 text-[#C4B5FD]/40">
                        <th className="py-2.5 font-semibold">Student</th>
                        <th className="py-2.5 font-semibold">Roll No / Dept</th>
                        <th className="py-2.5 font-semibold">Ticket</th>
                        <th className="py-2.5 font-semibold">Payment</th>
                        <th className="py-2.5 text-right font-semibold">Check-in Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRegs.map(reg => (
                        <tr key={reg.id} className="border-b border-white/[0.02] hover:bg-white/[0.01] transition-colors">
                          <td className="py-3 text-white font-semibold">{reg.students?.name || 'N/A'}</td>
                          <td className="py-3 text-[#C4B5FD]/60">
                            <div>{reg.students?.roll_number}</div>
                            <div className="text-[9px] opacity-60">{reg.students?.department}</div>
                          </td>
                          <td className="py-3 font-mono text-xs text-[#A78BFA]">{reg.ticket_number}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              reg.payment_status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                            }`}>{reg.payment_status}</span>
                          </td>
                          <td className="py-3 text-right">
                            {reg.attendance_marked ? (
                              <span className="text-emerald-400 text-xs font-semibold flex items-center justify-end gap-1.5">
                                <CheckCircle className="w-3.5 h-3.5" /> Checked In
                              </span>
                            ) : (
                              <button
                                onClick={() => handleCheckin(reg.ticket_number, reg.id)}
                                className="px-3 py-1 rounded-lg bg-[#6C2BD9]/20 hover:bg-[#6C2BD9] text-[#A78BFA] hover:text-white transition-all text-[10px] font-bold"
                              >
                                Check In
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {filteredRegs.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-[#C4B5FD]/30">No registrations found matching criteria.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 2. VOLUNTEERS */}
            {activeTab === 'volunteers' && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-6 space-y-4">
                  <h2 className="text-base font-bold text-white border-b border-white/5 pb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#A78BFA]" /> Volunteers & Staff
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {volunteers.map(vol => (
                      <div key={vol.id} className="p-4 rounded-xl border border-white/5 bg-white/5 flex justify-between items-center">
                        <div>
                          <p className="text-xs font-bold text-white">{vol.students?.name || 'Student Volunteer'}</p>
                          <p className="text-[10px] text-[#C4B5FD]/50 mt-0.5">{vol.students?.roll_number} • {vol.role}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveVolunteer(vol.id)}
                          className="p-1.5 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {volunteers.length === 0 && (
                      <div className="col-span-2 text-center py-6 text-[#C4B5FD]/30 text-xs">No volunteers registered yet. Add one below.</div>
                    )}
                  </div>
                </div>

                {/* Add volunteer form */}
                <div className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-6">
                  <h3 className="text-sm font-bold text-[#A78BFA] mb-4 flex items-center gap-1.5">
                    <UserPlus className="w-4.5 h-4.5" /> Assign Volunteer Role
                  </h3>
                  <form onSubmit={handleAddVolunteer} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-[#C4B5FD]/60 font-semibold">Student ID / UID *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. s0000000..."
                        value={newVolunteer.student_id}
                        onChange={e => setNewVolunteer({ ...newVolunteer, student_id: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-[#6C2BD9]/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-[#C4B5FD]/60 font-semibold">Role / Responsibility *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Registration Desk, Media"
                        value={newVolunteer.role}
                        onChange={e => setNewVolunteer({ ...newVolunteer, role: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-[#6C2BD9]/50"
                      />
                    </div>
                    <button
                      type="submit"
                      className="py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white transition-all shadow-md shadow-[#6C2BD9]/20"
                    >
                      Assign Volunteer
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* 3. BUDGET & FINANCE */}
            {activeTab === 'budget' && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-4">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-[#A78BFA]" /> Budget & Expenses
                    </h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      budgetSummary.variance >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                    }`}>
                      Variance: ₹{budgetSummary.variance.toLocaleString()}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-white/5 text-[#C4B5FD]/40">
                          <th className="py-2 font-semibold">Category</th>
                          <th className="py-2 font-semibold">Description</th>
                          <th className="py-2 font-semibold">Estimated Amount</th>
                          <th className="py-2 font-semibold">Actual Spent</th>
                          <th className="py-2 text-right font-semibold">Status / Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {budgetItems.map(item => (
                          <tr key={item.id} className="border-b border-white/[0.02]">
                            <td className="py-3 text-white font-semibold">{item.category}</td>
                            <td className="py-3 text-[#C4B5FD]/60">{item.description || 'N/A'}</td>
                            <td className="py-3 text-[#C4B5FD]/80">₹{item.estimated_amount.toLocaleString()}</td>
                            <td className="py-3 text-[#C4B5FD]/80">₹{item.actual_amount.toLocaleString()}</td>
                            <td className="py-3 text-right">
                              {item.status === 'approved' ? (
                                <span className="text-emerald-400 text-xs font-bold flex items-center justify-end gap-1">
                                  <CheckCircle className="w-3.5 h-3.5" /> Approved
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleApproveBudget(item.id)}
                                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-white transition-all text-[9px] font-bold"
                                >
                                  Approve
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                        {budgetItems.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-[#C4B5FD]/30">No expenses recorded yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Add budget item form */}
                <div className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-6">
                  <h3 className="text-sm font-bold text-[#A78BFA] mb-4 flex items-center gap-1.5">
                    <PlusCircle className="w-4.5 h-4.5" /> Log Budget Item / Expense
                  </h3>
                  <form onSubmit={handleAddBudgetItem} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-[#C4B5FD]/60 font-semibold">Expense Category *</label>
                      <select
                        value={newBudgetItem.category}
                        onChange={e => setNewBudgetItem({ ...newBudgetItem, category: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-[#13102A] border border-white/10 text-xs text-white focus:outline-none focus:border-[#6C2BD9]/50"
                      >
                        {['Venue', 'Catering', 'Decoration', 'Marketing', 'Prizes', 'Logistics', 'Other'].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-[#C4B5FD]/60 font-semibold">Estimated Cost (INR) *</label>
                      <input
                        type="number"
                        min={0}
                        required
                        placeholder="Estimated"
                        value={newBudgetItem.estimated_amount}
                        onChange={e => setNewBudgetItem({ ...newBudgetItem, estimated_amount: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-[#6C2BD9]/50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-[#C4B5FD]/60 font-semibold">Actual Spent Cost (INR)</label>
                      <input
                        type="number"
                        min={0}
                        placeholder="Actual"
                        value={newBudgetItem.actual_amount}
                        onChange={e => setNewBudgetItem({ ...newBudgetItem, actual_amount: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-[#6C2BD9]/50"
                      />
                    </div>

                    <button
                      type="submit"
                      className="py-2 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white transition-all shadow-md shadow-[#6C2BD9]/20"
                    >
                      Log Expense
                    </button>

                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-[10px] text-[#C4B5FD]/60 font-semibold">Item Description / Vendor Detail *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Stage construction and LED lighting setup"
                        value={newBudgetItem.description}
                        onChange={e => setNewBudgetItem({ ...newBudgetItem, description: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-[10px] text-[# C4B5FD]/60 font-semibold">Receipt Image / Invoice URL</label>
                      <input
                        type="url"
                        placeholder="https://example.com/receipt.jpg"
                        value={newBudgetItem.receipt_url}
                        onChange={e => setNewBudgetItem({ ...newBudgetItem, receipt_url: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* 4. ANNOUNCEMENTS */}
            {activeTab === 'announcements' && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-6 space-y-4">
                  <h2 className="text-base font-bold text-white border-b border-white/5 pb-4 flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-[#A78BFA]" /> Broadcast History
                  </h2>

                  <div className="flex flex-col gap-4">
                    {announcements.map(ann => (
                      <div key={ann.id} className="p-4 rounded-xl border border-white/5 bg-white/5">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                            {ann.title}
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold ${
                              ann.priority === 'urgent' || ann.priority === 'high' ? 'bg-red-500/25 text-red-400 border border-red-500/30' : 'bg-white/10 text-[#C4B5FD]/70'
                            }`}>
                              {ann.priority}
                            </span>
                          </h4>
                          <span className="text-[9px] text-[#C4B5FD]/40">{new Date(ann.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-[#C4B5FD]/70 leading-relaxed">{ann.message}</p>
                        <div className="flex gap-2 mt-3 text-[9px] text-[#C4B5FD]/40">
                          <span>Sent via:</span>
                          {(ann.sent_via || []).map((ch: string) => (
                            <span key={ch} className="px-1.5 py-0.5 bg-white/5 border border-white/5 rounded text-[8px] uppercase text-white font-bold">{ch}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                    {announcements.length === 0 && (
                      <div className="text-center py-8 text-[#C4B5FD]/30 text-xs">No announcements broadcasted yet. Send one below!</div>
                    )}
                  </div>
                </div>

                {/* Broadcast Form */}
                <div className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-6">
                  <h3 className="text-sm font-bold text-[#A78BFA] mb-4 flex items-center gap-1.5">
                    <Send className="w-4.5 h-4.5" /> Broadcast Announcement
                  </h3>
                  <form onSubmit={handleAddAnnouncement} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-[#C4B5FD]/60 font-semibold">Announcement Title *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Schedule Update / Venue Change"
                          value={newAnnouncement.title}
                          onChange={e => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-[#6C2BD9]/50"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-[#C4B5FD]/60 font-semibold">Priority Level</label>
                        <select
                          value={newAnnouncement.priority}
                          onChange={e => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl bg-[#13102A] border border-white/10 text-xs text-white focus:outline-none"
                        >
                          <option value="low">Low</option>
                          <option value="normal">Normal</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent / Important</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-[#C4B5FD]/60 font-semibold">Broadcast Message *</label>
                      <textarea
                        rows={3}
                        required
                        placeholder="Write details of announcement that will be pushed to volunteers and registrants..."
                        value={newAnnouncement.message}
                        onChange={e => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-[#6C2BD9]/50 resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex gap-4">
                        <label className="text-[10px] text-[#C4B5FD]/60 font-semibold flex items-center gap-1.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={newAnnouncement.sent_via.includes('push')}
                            onChange={e => {
                              const channels = e.target.checked 
                                ? [...newAnnouncement.sent_via, 'push']
                                : newAnnouncement.sent_via.filter(c => c !== 'push');
                              setNewAnnouncement({ ...newAnnouncement, sent_via: channels });
                            }}
                            className="w-3.5 h-3.5 rounded bg-white/5 accent-[#6C2BD9]"
                          />
                          Push Notification
                        </label>

                        <label className="text-[10px] text-[#C4B5FD]/60 font-semibold flex items-center gap-1.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={newAnnouncement.sent_via.includes('email')}
                            onChange={e => {
                              const channels = e.target.checked 
                                ? [...newAnnouncement.sent_via, 'email']
                                : newAnnouncement.sent_via.filter(c => c !== 'email');
                              setNewAnnouncement({ ...newAnnouncement, sent_via: channels });
                            }}
                            className="w-3.5 h-3.5 rounded bg-white/5 accent-[#6C2BD9]"
                          />
                          Email Broadcaster
                        </label>

                        <label className="text-[10px] text-[#C4B5FD]/60 font-semibold flex items-center gap-1.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={newAnnouncement.sent_via.includes('whatsapp')}
                            onChange={e => {
                              const channels = e.target.checked 
                                ? [...newAnnouncement.sent_via, 'whatsapp']
                                : newAnnouncement.sent_via.filter(c => c !== 'whatsapp');
                              setNewAnnouncement({ ...newAnnouncement, sent_via: channels });
                            }}
                            className="w-3.5 h-3.5 rounded bg-white/5 accent-[#6C2BD9]"
                          />
                          WhatsApp API
                        </label>
                      </div>

                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white transition-all shadow-md shadow-[#6C2BD9]/20 flex items-center gap-1.5"
                      >
                        <Megaphone className="w-4 h-4" /> Send Announcement
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* 5. PHOTOS */}
            {activeTab === 'photos' && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-6 space-y-4">
                  <h2 className="text-base font-bold text-white border-b border-white/5 pb-4 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-[#A78BFA]" /> Photo Gallery
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {photos.map(ph => (
                      <div key={ph.id} className="relative group rounded-xl overflow-hidden border border-white/5 bg-[#13102A]">
                        <img src={ph.photo_url} alt={ph.caption} className="w-full h-40 object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex flex-col justify-end p-3">
                          <p className="text-[10px] text-white font-bold truncate">{ph.caption}</p>
                          {ph.is_featured && <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#6C2BD9] text-white w-fit mt-1">Featured</span>}
                        </div>
                        <button
                          onClick={() => handleDeletePhoto(ph.id)}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {photos.length === 0 && (
                      <div className="col-span-3 text-center py-8 text-[#C4B5FD]/30 text-xs">No photos uploaded to this event gallery. Add one below!</div>
                    )}
                  </div>
                </div>

                {/* Add Photo Form */}
                <div className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-6">
                  <h3 className="text-sm font-bold text-[#A78BFA] mb-4 flex items-center gap-1.5">
                    <PlusCircle className="w-4.5 h-4.5" /> Upload Event Photo URL
                  </h3>
                  <form onSubmit={handleAddPhoto} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-[#C4B5FD]/60 font-semibold">Photo Link / URL *</label>
                        <input
                          type="url"
                          required
                          placeholder="https://images.unsplash.com/photo-..."
                          value={newPhoto.photo_url}
                          onChange={e => setNewPhoto({ ...newPhoto, photo_url: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-[#C4B5FD]/60 font-semibold">Caption / Title</label>
                        <input
                          type="text"
                          placeholder="e.g. Winner award distribution ceremony"
                          value={newPhoto.caption}
                          onChange={e => setNewPhoto({ ...newPhoto, caption: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <label className="text-[10px] text-[#C4B5FD]/60 font-semibold flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newPhoto.is_featured}
                          onChange={e => setNewPhoto({ ...newPhoto, is_featured: e.target.checked })}
                          className="w-3.5 h-3.5 rounded bg-white/5 accent-[#6C2BD9]"
                        />
                        Mark as Featured (Shown on Event Card cover)
                      </label>

                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white transition-all shadow-md shadow-[#6C2BD9]/20"
                      >
                        Add to Gallery
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* 6. FEEDBACK & RATINGS */}
            {activeTab === 'feedback' && (
              <div className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-6 space-y-6">
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-400" /> Participant Feedback
                  </h2>
                  <div className="text-right">
                    <p className="text-lg font-extrabold text-white">{feedbackStats.avg_overall_rating} / 5.0</p>
                    <p className="text-[9px] text-[#C4B5FD]/40">Based on {feedbackStats.total_responses} responses</p>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  {feedback.map(fb => (
                    <div key={fb.id} className="p-4 rounded-xl border border-white/5 bg-white/5">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-white">{fb.students?.name || 'Anonymous Student'}</span>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <Star 
                              key={idx} 
                              className={`w-3.5 h-3.5 ${
                                idx < fb.overall_rating ? 'fill-amber-400 text-amber-400' : 'text-white/10'
                              }`} 
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-[#C4B5FD]/70 leading-relaxed italic">"{fb.comment || 'No comment provided.'}"</p>
                    </div>
                  ))}
                  {feedback.length === 0 && (
                    <div className="text-center py-8 text-[#C4B5FD]/30 text-xs">No feedback responses recorded for this event yet.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
