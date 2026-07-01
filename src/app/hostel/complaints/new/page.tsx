"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Send, AlertCircle } from 'lucide-react';
import { apiGet, apiPost } from '../../../../lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NewComplaintPage() {
  const router = useRouter();
  const [allocation, setAllocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [form, setForm] = useState({
    title: '',
    category: 'maintenance',
    priority: 'medium',
    description: ''
  });

  useEffect(() => {
    loadAllocation();
  }, []);

  const loadAllocation = async () => {
    try {
      // Force demo student ID so the seeded data always shows up for testing
      const studentId = '';

      const res = await apiGet(`/hostel/allocations?studentId=${studentId}&t=${Date.now()}`);
      if (res.success) {
        if (res.allocations?.length > 0) {
          setAllocation(res.allocations[0]);
        } else {
          setErrorMsg('No active room allocation found. You cannot raise a complaint.');
        }
      } else {
        setErrorMsg(res.error || 'Failed to load allocation from server.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load room allocation from server.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setErrorMsg('Please specify a complaint title.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      if (!allocation) {
        setErrorMsg('No room allocation found. Cannot submit complaint.');
        setSubmitting(false);
        return;
      }
      
      const payload = {
        student_id: allocation.student_id,
        room_id: allocation.room_id,
        category: form.category,
        title: form.title,
        description: form.description,
        priority: form.priority,
        photo_urls: []
      };

      const res = await apiPost('/hostel/complaints', payload);
      if (res.success) {
        router.push('/hostel/complaints');
      } else {
        setErrorMsg(res.error || 'Failed to submit complaint. Please check fields.');
      }
    } catch (err) {
      setErrorMsg('An error occurred while submitting complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0D0A1A] flex items-center justify-center text-white">
        <div className="w-10 h-10 border-2 border-[#6C2BD9] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-xl mx-auto px-6 py-6 flex items-center gap-3">
          <Link href="/hostel/complaints" className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-[#C4B5FD]/70 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-extrabold text-xl">Raise Maintenance Issue</h1>
            <p className="text-[10px] text-[#C4B5FD]/50">For Room: {allocation?.hostel_rooms?.room_number || 'N/A'}</p>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 mt-8">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 mb-6 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="rounded-3xl border border-white/5 bg-[#13102A]/60 p-6 space-y-6 shadow-xl">
          <div>
            <label className="block text-xs font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Complaint Title</label>
            <input
              type="text"
              placeholder="e.g. Geyser not heating water / Wall socket broken"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-white/20 focus:border-[#6C2BD9]/50 focus:outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Category</label>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-3 text-xs text-white focus:border-[#6C2BD9]/50 focus:outline-none transition-all capitalize"
              >
                {['maintenance', 'cleanliness', 'electrical', 'plumbing', 'internet', 'security', 'roommate', 'food', 'other'].map(cat => (
                  <option key={cat} value={cat} className="bg-[#13102A]">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Priority</label>
              <select
                value={form.priority}
                onChange={e => setForm({ ...form, priority: e.target.value })}
                className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-3 text-xs text-white focus:border-[#6C2BD9]/50 focus:outline-none transition-all capitalize"
              >
                {['low', 'medium', 'high', 'urgent'].map(prio => (
                  <option key={prio} value={prio} className="bg-[#13102A]">
                    {prio}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Description & Context</label>
            <textarea
              rows={4}
              placeholder="Describe the issue in detail. If applicable, mention exact location or behavior..."
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-white/20 focus:border-[#6C2BD9]/50 focus:outline-none transition-all resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] disabled:bg-[#6C2BD9]/50 text-xs font-bold text-white transition-all shadow-lg shadow-[#6C2BD9]/30 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" /> Submit Complaint
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
