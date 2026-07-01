"use client";

import React, { useState, useEffect } from 'react';
import { Award, ArrowLeft, Download, Share2, Search, Calendar, CheckCircle, ExternalLink } from 'lucide-react';
import { apiGet } from '../../../lib/api';
import Link from 'next/link';

export default function StudentCertificatesPage() {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sharingId, setSharingId] = useState<string | null>(null);

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    try {
      const userStr = localStorage.getItem('iris_user_profile');
      const user = userStr ? JSON.parse(userStr) : null;
      const studentId = user?.student_id || user?.id || '';

      const res = await apiGet(`/events/events/certificates/student/${studentId}`);
      if (res.success) {
        setCertificates(res.certificates || []);
      } else {
        throw new Error('API error');
      }
    } catch {
      // Fallback mocks
      setCertificates([
        {
          id: 'c1',
          certificate_type: 'winner',
          rank: 1,
          verification_code: 'CERT-A7XFGL2P-9M2Q',
          url: 'https://dummy-certificates.iris365.in/certs/1/s1.pdf',
          issued_at: '2026-06-05T18:00:00Z',
          events: { title: 'CodeStorm — 24hr Hackathon', category: 'Hackathon' }
        },
        {
          id: 'c2',
          certificate_type: 'volunteer',
          rank: null,
          verification_code: 'CERT-M3WNPQ7Y-8B9P',
          url: 'https://dummy-certificates.iris365.in/certs/2/s1.pdf',
          issued_at: '2026-05-26T17:00:00Z',
          events: { title: 'Design Thinking Workshop', category: 'Workshop' }
        },
        {
          id: 'c3',
          certificate_type: 'participation',
          rank: null,
          verification_code: 'CERT-Z9RTY4AQ-1X4V',
          url: 'https://dummy-certificates.iris365.in/certs/3/s1.pdf',
          issued_at: '2026-06-08T23:00:00Z',
          events: { title: 'Cultural Nite: Rhythm & Hues', category: 'Cultural' }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleShareLinkedIn = (cert: any) => {
    const certUrl = `${window.location.origin}/verify/certificate/${cert.verification_code}`;
    const text = `I'm thrilled to share that I have earned a Certificate of ${cert.certificate_type.toUpperCase()} ${
      cert.rank ? `(Rank: #${cert.rank})` : ''
    } for the event "${cert.events?.title}" at IRIS 365! Verified link: ${certUrl}`;
    
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(certUrl)}&text=${encodeURIComponent(text)}`;
    window.open(linkedInUrl, '_blank');
  };

  const filtered = certificates.filter(c =>
    c.events?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.certificate_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.verification_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#6C2BD9]/5 rounded-full blur-[120px]" />
      
      <div className="max-w-7xl mx-auto px-6 pt-8 relative z-10">
        <Link href="/student/dashboard" className="inline-flex items-center gap-2 text-xs font-bold text-[#C4B5FD]/50 hover:text-[#A78BFA] transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 flex items-center justify-center shadow-lg shadow-[#6C2BD9]/10">
              <Award className="w-8 h-8 text-[#A78BFA]" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-extrabold bg-gradient-to-r from-white to-[#C4B5FD] bg-clip-text text-transparent">Certificate Wallet</h1>
              <p className="text-xs text-[#C4B5FD]/60 mt-1">Verify, download, or share your earned credentials</p>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-[#C4B5FD]/40 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search credentials..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-[#13102A]/80 border border-[#6C2BD9]/20 text-xs text-white placeholder-[#C4B5FD]/30 focus:border-[#8B5CF6]/50 focus:ring-1 focus:ring-[#8B5CF6]/50 transition-all outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-10 h-10 border-2 border-[#6C2BD9] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-[#13102A]/40 py-24 text-center">
            <Award className="w-12 h-12 text-[#C4B5FD]/20 mx-auto mb-3" />
            <p className="text-sm text-[#C4B5FD]/40">No certificates found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(cert => (
              <div
                key={cert.id}
                className="rounded-2xl border border-white/5 bg-[#13102A]/80 backdrop-blur-md p-6 flex flex-col justify-between hover:border-[#6C2BD9]/30 transition-all group hover:-translate-y-1 duration-300"
              >
                <div>
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border capitalize ${
                      cert.certificate_type === 'winner' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                      cert.certificate_type === 'volunteer' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                      cert.certificate_type === 'speaker' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                      'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    }`}>
                      {cert.certificate_type} {cert.rank ? `#${cert.rank}` : ''}
                    </span>
                    <span className="text-[10px] text-[#C4B5FD]/40 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(cert.issued_at)}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-white line-clamp-2 mb-2 group-hover:text-[#A78BFA] transition-colors">{cert.events?.title}</h3>
                  <p className="text-[10px] text-[#C4B5FD]/50 mb-4 font-mono">ID: {cert.verification_code}</p>
                </div>

                <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-white/5">
                  <div className="flex gap-2">
                    <a
                      href={cert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-white transition-all flex items-center justify-center gap-2"
                    >
                      <Download className="w-3.5 h-3.5 text-[#A78BFA]" /> Download PDF
                    </a>
                    
                    <Link
                      href={`/verify/certificate/${cert.verification_code}`}
                      className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center justify-center"
                      title="Verify Certificate"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#C4B5FD]" />
                    </Link>
                  </div>

                  <button
                    onClick={() => handleShareLinkedIn(cert)}
                    className="w-full py-2.5 rounded-lg bg-[#0077B5] hover:bg-[#0077B5]/90 text-[10px] font-bold text-white transition-all flex items-center justify-center gap-2"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Share to LinkedIn
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
