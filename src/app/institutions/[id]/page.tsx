"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin, Phone, Mail, Globe, ArrowLeft, GraduationCap, School,
  ExternalLink, AlertCircle, Loader2, ChevronRight, BookOpen, Building2
} from 'lucide-react';

interface Institution {
  id: string;
  name: string;
  type: string;
  institute_type: string;
  city: string;
  state: string;
  logo_url?: string;
  address?: string;
  phone?: string;
  email?: string;
}

export default function InstitutionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [institution, setInstitution] = useState<Institution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    fetch(`/api/institutions/public?id=${encodeURIComponent(id)}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Institution not found');
        setInstitution(json.institution);
      })
      .catch((err) => {
        setError(err.message || 'Could not load institution details.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const isSchool = institution?.institute_type === 'school';

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0A1A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-[#C4B5FD]/60">
          <Loader2 className="w-8 h-8 animate-spin text-[#8B5CF6]" />
          <p className="text-sm">Loading institution details…</p>
        </div>
      </div>
    );
  }

  // ── Error / Not found ──
  if (error || !institution) {
    return (
      <div className="min-h-screen bg-[#0D0A1A] flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Institution Not Found</h2>
          <p className="text-sm text-[#C4B5FD]/60 mb-6">
            {error || 'This institution is not publicly listed or does not exist.'}
          </p>
          <Link
            href="/home"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-white font-bold text-sm hover:brightness-110 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Institutions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0A1A] text-white selection:bg-[#6C2BD9]/40">
      {/* Background effects */}
      <div className="fixed top-0 left-1/3 w-[600px] h-[600px] bg-[#6C2BD9]/8 rounded-full blur-[160px] pointer-events-none" />

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 border-b border-[#6C2BD9]/20 bg-[#0D0A1A]/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center shadow-md shadow-[#6C2BD9]/30">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-base tracking-tight">
              IRIS <span className="text-[#8B5CF6]">365</span>
            </span>
          </Link>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#C4B5FD]/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </nav>

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-12">
        {/* ── Hero card ── */}
        <div className="bg-[#13102A]/80 border border-white/10 rounded-3xl overflow-hidden mb-8">
          {/* Banner strip */}
          <div className="h-24 bg-gradient-to-r from-[#6C2BD9]/30 via-[#8B5CF6]/20 to-[#06B6D4]/10" />

          {/* Institution identity */}
          <div className="px-6 sm:px-8 pb-8 -mt-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
              {/* Logo */}
              <div className="w-20 h-20 rounded-2xl bg-[#0D0A1A] border-2 border-[#6C2BD9]/40 flex items-center justify-center overflow-hidden shadow-lg shadow-[#6C2BD9]/20 shrink-0">
                {institution.logo_url ? (
                  <img
                    src={institution.logo_url}
                    alt={institution.name}
                    className="w-full h-full object-contain p-1.5"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="text-3xl">{isSchool ? '🏫' : '🏛️'}</span>
                )}
              </div>

              {/* Name / type */}
              <div className="flex-1 min-w-0">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border mb-2 ${
                  isSchool
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-violet-500/10 border-violet-500/20 text-violet-400'
                }`}>
                  {isSchool ? <School className="w-3 h-3" /> : <GraduationCap className="w-3 h-3" />}
                  {isSchool ? 'School' : 'College / University'}
                </span>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
                  {institution.name}
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* ── Details grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Info panel */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-[#13102A]/60 border border-white/10 rounded-2xl p-6">
              <h2 className="text-sm font-bold text-[#C4B5FD] mb-4 uppercase tracking-wider">
                Institution Details
              </h2>
              <dl className="space-y-3 text-sm">
                {(institution.city || institution.state) && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-[#6C2BD9] mt-0.5 shrink-0" />
                    <div>
                      <dt className="text-[10px] text-[#C4B5FD]/40 uppercase tracking-wider font-semibold mb-0.5">Location</dt>
                      <dd className="text-white font-medium">
                        {[institution.city, institution.state].filter(Boolean).join(', ')}
                      </dd>
                    </div>
                  </div>
                )}
                {institution.address && (
                  <div className="flex items-start gap-3">
                    <Building2 className="w-4 h-4 text-[#6C2BD9] mt-0.5 shrink-0" />
                    <div>
                      <dt className="text-[10px] text-[#C4B5FD]/40 uppercase tracking-wider font-semibold mb-0.5">Address</dt>
                      <dd className="text-white/80">{institution.address}</dd>
                    </div>
                  </div>
                )}
                {institution.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-[#6C2BD9] mt-0.5 shrink-0" />
                    <div>
                      <dt className="text-[10px] text-[#C4B5FD]/40 uppercase tracking-wider font-semibold mb-0.5">Phone</dt>
                      <dd className="text-white/80">{institution.phone}</dd>
                    </div>
                  </div>
                )}
                {institution.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-[#6C2BD9] mt-0.5 shrink-0" />
                    <div>
                      <dt className="text-[10px] text-[#C4B5FD]/40 uppercase tracking-wider font-semibold mb-0.5">Email</dt>
                      <dd className="text-white/80">{institution.email}</dd>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <Globe className="w-4 h-4 text-[#6C2BD9] mt-0.5 shrink-0" />
                  <div>
                    <dt className="text-[10px] text-[#C4B5FD]/40 uppercase tracking-wider font-semibold mb-0.5">Type</dt>
                    <dd className="text-white/80 capitalize">{institution.institute_type || institution.type}</dd>
                  </div>
                </div>
              </dl>
            </div>
          </div>

          {/* Apply CTA panel */}
          <div className="flex flex-col gap-4">
            <div className="bg-gradient-to-br from-[#6C2BD9]/20 to-[#8B5CF6]/10 border border-[#6C2BD9]/30 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-6 h-6 text-[#A78BFA]" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Ready to Apply?</h3>
              <p className="text-[11px] text-[#C4B5FD]/60 mb-5 leading-relaxed">
                Start your application for {institution.name}. Admissions for 2026–27 are open.
              </p>
              <button
                id={`apply-detail-btn-${institution.id}`}
                onClick={() => router.push(`/admissions/${institution.id}/apply`)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] hover:brightness-110 text-white font-bold text-sm transition-all shadow-lg shadow-[#6C2BD9]/25 flex items-center justify-center gap-2"
              >
                Apply Now
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Back to listings */}
            <Link
              href="/home"
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-semibold text-[#C4B5FD] hover:text-white transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              All Institutions
            </Link>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-8 px-6 bg-[#090615] text-center text-xs text-[#C4B5FD]/40 mt-10">
        <p>© 2026 SIN Education and Technology Pvt. Ltd. All rights reserved.</p>
      </footer>
    </div>
  );
}
