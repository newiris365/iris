"use client";

import React, { useState } from 'react';
import { Link2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { apiPost } from '../../../lib/api';

export default function ParentLinkPage() {
  const [rollNumber, setRollNumber] = useState('');
  const [childDob, setChildDob] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [linkedStudent, setLinkedStudent] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleLinkChild = async () => {
    if (!rollNumber || !childDob) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await apiPost('/auth/parent-link-child', { roll_number: rollNumber, child_dob: childDob });
      if (res.success) {
        setLinkedStudent(res.student_name || rollNumber);
        setDone(true);
      } else {
        setError(res.error || 'Failed to link student');
      }
    } catch (err) {
      setError('Linking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-6">
      <div className="max-w-lg mx-auto flex flex-col gap-8">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 flex items-center justify-center mx-auto mb-4">
            <Link2 className="w-8 h-8 text-[#A78BFA]" />
          </div>
          <h1 className="font-heading font-extrabold text-2xl">Link Your Child</h1>
          <p className="text-xs text-[#C4B5FD]/70 font-light mt-1">Connect to your child&apos;s academic records</p>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {/* Link Child Form */}
        {!done ? (
          <div className="glass-panel rounded-2xl p-6 border border-white/5 flex flex-col gap-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 flex items-center justify-center">
                <Link2 className="w-5 h-5 text-[#A78BFA]" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm">Link Your Child</h3>
                <p className="text-[10px] text-[#C4B5FD]/50">Enter your child&apos;s details to verify</p>
              </div>
            </div>
            <div>
              <label className="text-[10px] text-[#C4B5FD]/50 mb-1 block">Child&apos;s Roll Number</label>
              <input value={rollNumber} onChange={e => { setRollNumber(e.target.value); setError(''); }}
                className="w-full bg-[#13102A] border border-[#6C2BD9]/30 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#8B5CF6]"
                placeholder="e.g. 23CS1001" />
            </div>
            <div>
              <label className="text-[10px] text-[#C4B5FD]/50 mb-1 block">Child&apos;s Date of Birth</label>
              <input type="date" value={childDob} onChange={e => { setChildDob(e.target.value); setError(''); }}
                className="w-full bg-[#13102A] border border-[#6C2BD9]/30 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#8B5CF6]" />
            </div>
            <button onClick={handleLinkChild} disabled={loading}
              className="px-4 py-3 rounded-xl bg-[#6C2BD9] hover:bg-[#5B21B6] text-white text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
              Link Child
            </button>
          </div>
        ) : (
          /* Success */
          <div className="glass-panel rounded-2xl p-8 border border-white/5 flex flex-col gap-4 items-center text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="font-heading font-bold text-lg">Successfully Linked!</h3>
            <p className="text-xs text-[#C4B5FD]/70">You are now connected to <strong className="text-white">{linkedStudent}</strong></p>
            <p className="text-[10px] text-[#C4B5FD]/50">You can now view your child&apos;s attendance, fees, exam results, and more in the Parent Portal.</p>
            <button onClick={() => window.location.href = '/parent/dashboard'}
              className="px-6 py-3 rounded-xl bg-[#6C2BD9] hover:bg-[#5B21B6] text-white text-sm font-bold transition-all">
              Go to Parent Portal
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
