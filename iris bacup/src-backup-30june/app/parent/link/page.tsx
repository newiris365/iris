"use client";

import React, { useState, useEffect } from 'react';
import { Link2, Shield, CheckCircle, Phone, AlertCircle, Loader2 } from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';

export default function ParentLinkPage() {
  const [step, setStep] = useState<'phone' | 'otp' | 'link' | 'done'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [childDob, setChildDob] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [linkedStudent, setLinkedStudent] = useState<string | null>(null);
  const [timer, setTimer] = useState(60);

  // Timer for OTP resend
  useEffect(() => {
    if (step === 'otp' && timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [step, timer]);

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await apiPost('/auth/parent-otp', { phone, purpose: 'link_child' });
      if (res.success) {
        setStep('otp');
        setTimer(60);
      } else {
        setError(res.error || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await apiPost('/auth/parent-verify-otp', { phone, otp, purpose: 'link_child' });
      if (res.success) {
        setStep('link');
      } else {
        setError(res.error || 'Invalid OTP');
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
        setStep('done');
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

        {/* Steps Indicator */}
        <div className="flex items-center justify-center gap-2">
          {['phone', 'otp', 'link'].map((s, i) => (
            <React.Fragment key={s}>
              {i > 0 && <div className={`w-8 h-px ${step === 'phone' || (step === 'otp' && i === 0) || (step === 'link' && i <= 1) || step === 'done' ? 'bg-[#6C2BD9]' : 'bg-white/20'}`} />}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${
                (step === 'phone' && i === 0) || (step === 'otp' && i <= 1) || (step === 'link' && i <= 2) || step === 'done'
                  ? 'bg-[#6C2BD9] border-[#6C2BD9] text-white'
                  : 'bg-white/5 border-white/20 text-[#C4B5FD]/40'
              }`}>
                {step === 'done' ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {/* Step 1: Phone */}
        {step === 'phone' && (
          <div className="glass-panel rounded-2xl p-6 border border-white/5 flex flex-col gap-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 flex items-center justify-center">
                <Phone className="w-5 h-5 text-[#A78BFA]" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm">Verify Your Phone</h3>
                <p className="text-[10px] text-[#C4B5FD]/50">We&apos;ll send an OTP to this number</p>
              </div>
            </div>
            <input value={phone} onChange={e => { setPhone(e.target.value); setError(''); }}
              className="bg-[#13102A] border border-[#6C2BD9]/30 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#8B5CF6]"
              placeholder="+91 XXXXX XXXXX" maxLength={15} />
            <button onClick={handleSendOtp} disabled={loading}
              className="px-4 py-3 rounded-xl bg-[#6C2BD9] hover:bg-[#5B21B6] text-white text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
              Send OTP
            </button>
          </div>
        )}

        {/* Step 2: OTP */}
        {step === 'otp' && (
          <div className="glass-panel rounded-2xl p-6 border border-white/5 flex flex-col gap-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#A78BFA]" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm">Enter OTP</h3>
                <p className="text-[10px] text-[#C4B5FD]/50">Sent to {phone}</p>
              </div>
            </div>
            <input value={otp} onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setError(''); }}
              className="bg-[#13102A] border border-[#6C2BD9]/30 rounded-xl px-4 py-3 text-sm text-white text-center tracking-[0.5em] outline-none focus:border-[#8B5CF6]"
              placeholder="000000" maxLength={6} />
            <button onClick={handleVerifyOtp} disabled={loading}
              className="px-4 py-3 rounded-xl bg-[#6C2BD9] hover:bg-[#5B21B6] text-white text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Verify OTP
            </button>
            <button onClick={() => { if (timer === 0) { setTimer(60); handleSendOtp(); } }} disabled={timer > 0}
              className="text-xs text-[#C4B5FD]/60 hover:text-[#C4B5FD] transition-all disabled:opacity-30">
              {timer > 0 ? `Resend OTP in ${timer}s` : 'Resend OTP'}
            </button>
          </div>
        )}

        {/* Step 3: Link Child */}
        {step === 'link' && (
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
        )}

        {/* Step 4: Done */}
        {step === 'done' && (
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

        {/* Security Note */}
        <div className="text-center text-[10px] text-[#C4B5FD]/30 flex items-center justify-center gap-1">
          <Shield className="w-3 h-3" /> Your data is encrypted and secure. OTP expires in 10 minutes.
        </div>
      </div>
    </main>
  );
}
