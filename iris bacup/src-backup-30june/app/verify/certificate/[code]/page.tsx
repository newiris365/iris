"use client";

import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Award, Calendar, ExternalLink, ArrowLeft, Bookmark } from 'lucide-react';
import { apiGet } from '../../../../lib/api';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function CertificateVerificationPage() {
  const params = useParams();
  const code = params.code as string;

  const [verification, setVerification] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    verifyCode();
  }, [code]);

  const verifyCode = async () => {
    try {
      const res = await apiGet(`/events/certificates/verify/${code}`);
      if (res.success && res.valid) {
        setVerification(res.certificate);
      } else {
        throw new Error(res.error || 'Invalid verification code.');
      }
    } catch (err: any) {
      setError(err.message || 'Credential verification failed. Check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white flex flex-col justify-between p-6 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#6C2BD9]/5 rounded-full blur-[120px]" />
      
      <div className="max-w-md mx-auto w-full my-auto z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-[#C4B5FD]/50 hover:text-[#A78BFA] transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to IRIS 365
          </Link>
          <h1 className="text-xl font-extrabold tracking-wider uppercase bg-gradient-to-r from-white to-[#C4B5FD] bg-clip-text text-transparent">Credential Verifier</h1>
          <p className="text-[10px] text-[#C4B5FD]/40 mt-1 uppercase tracking-widest font-bold">Secure Verification System</p>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-white/5 bg-[#13102A]/80 p-8 text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-2 border-[#6C2BD9] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-xs text-[#C4B5FD]/60">Cryptographic signature verification in progress...</p>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-rose-500/20 bg-[#13102A]/80 p-8 text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
              <ShieldAlert className="w-7 h-7 text-rose-400" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Invalid Credential</h2>
            <p className="text-xs text-rose-400 mb-6 leading-relaxed">{error}</p>
            <p className="text-[10px] text-[#C4B5FD]/40 font-mono select-all p-3 rounded-xl bg-black/40 border border-white/5 w-full">Code: {code}</p>
          </div>
        ) : (
          <div className="rounded-3xl border border-emerald-500/30 bg-[#13102A]/80 backdrop-blur-md overflow-hidden shadow-2xl shadow-emerald-500/5">
            {/* Verification banner header */}
            <div className="bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 border-b border-emerald-500/20 px-6 py-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xs uppercase font-extrabold tracking-wider text-emerald-400">Verified Credential</h2>
                <p className="text-[9px] text-[#C4B5FD]/50 font-mono mt-0.5">Hash: {code.slice(0, 15)}...</p>
              </div>
            </div>

            {/* Recipient details */}
            <div className="p-6 space-y-5">
              <div className="text-center pb-4 border-b border-white/5">
                <Award className="w-12 h-12 text-amber-400 mx-auto mb-2" />
                <h3 className="font-extrabold text-lg text-white leading-relaxed">{verification.students?.name}</h3>
                <p className="text-[11px] text-[#C4B5FD]/60 mt-0.5 font-mono">{verification.students?.roll_number} • {verification.students?.department}</p>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between items-start gap-4">
                  <span className="text-[#C4B5FD]/50 w-24 shrink-0">Event</span>
                  <span className="text-white font-semibold text-right leading-relaxed">{verification.events?.title}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#C4B5FD]/50">Certificate Type</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 capitalize">
                    {verification.certificate_type} {verification.rank ? `#${verification.rank}` : ''}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#C4B5FD]/50">Issued Date</span>
                  <span className="text-white font-semibold">{formatDate(verification.issued_at)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#C4B5FD]/50">Verification Code</span>
                  <span className="text-[#A78BFA] font-mono font-bold select-all">{verification.verification_code}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex gap-3">
                <a
                  href={verification.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Award className="w-4 h-4 text-[#A78BFA]" /> View PDF Certificate
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="text-center text-[10px] text-[#C4B5FD]/30 py-4 relative z-10">
        IRIS 365 Platform Cryptographic Security Registry. All rights reserved.
      </footer>
    </main>
  );
}
