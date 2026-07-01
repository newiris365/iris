"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  GraduationCap, Calendar, Clock, Phone, Mail, HelpCircle, 
  ChevronRight, ArrowRight, ShieldCheck, DollarSign
} from 'lucide-react';

interface Program {
  id: string;
  name: string;
  code: string;
  degree_type: string;
  duration_years: number;
  total_seats: number;
  application_fee: number;
  eligibility_criteria: {
    min_12th_pc?: number;
    min_grad_cgpa?: number;
    required_subjects?: string[];
  };
}

export default function PublicAdmissionsLanding() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();

  const [programs, setPrograms] = useState<Program[]>([
    {
      id: 'a1111111-1111-1111-1111-111111111111',
      name: 'Bachelor of Technology in Computer Science (B.Tech CSE)',
      code: 'BTECH-CSE',
      degree_type: 'UG',
      duration_years: 4,
      total_seats: 120,
      application_fee: 1000,
      eligibility_criteria: { min_12th_pc: 60, required_subjects: ['Physics', 'Mathematics'] }
    },
    {
      id: 'a1111111-1111-1111-1111-111111111112',
      name: 'Bachelor of Technology in Artificial Intelligence (B.Tech AI-DS)',
      code: 'BTECH-AIDS',
      degree_type: 'UG',
      duration_years: 4,
      total_seats: 60,
      application_fee: 1200,
      eligibility_criteria: { min_12th_pc: 65, required_subjects: ['Physics', 'Mathematics'] }
    },
    {
      id: 'a1111111-1111-1111-1111-111111111113',
      name: 'Master of Business Administration (MBA)',
      code: 'MBA-CORE',
      degree_type: 'PG',
      duration_years: 2,
      total_seats: 60,
      application_fee: 1500,
      eligibility_criteria: { min_grad_cgpa: 6 }
    }
  ]);
  const [countdown, setCountdown] = useState('30d 00h 00m 00s');

  useEffect(() => {
    const target = new Date();
    target.setDate(target.getDate() + 30); // 30 days deadline

    const interval = setInterval(() => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) {
        setCountdown('Admission Closed');
        clearInterval(interval);
        return;
      }
      const days = Math.floor(diff / (24 * 3600 * 1000));
      const hours = Math.floor((diff % (24 * 3600 * 1000)) / (3600 * 1000));
      const minutes = Math.floor((diff % (3600 * 1000)) / (60 * 1000));
      const seconds = Math.floor((diff % (60 * 1000)) / 1000);
      setCountdown(`${days}d ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0D0A1A] text-white selection:bg-[#6C2BD9]">
      {/* Background radial effects */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#6C2BD9]/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-[#8B5CF6]/5 rounded-full blur-[180px] pointer-events-none" />

      {/* Navigation */}
      <nav className="border-b border-[#6C2BD9]/20 bg-[#13102A]/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center font-black shadow-lg shadow-[#6C2BD9]/30">
              I
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight block">SIN INSTITUTE</span>
              <span className="text-[10px] text-[#A78BFA] tracking-widest font-mono block">CAMPUS GATEWAY</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push(`/admissions/${slug}/track`)}
              className="text-sm font-semibold hover:text-[#A78BFA] transition-colors"
            >
              Track Application
            </button>
            <button 
              onClick={() => router.push(`/admissions/${slug}/merit-list/1`)}
              className="text-sm font-semibold hover:text-[#A78BFA] transition-colors"
            >
              Public Merit List
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6C2BD9]/20 border border-[#6C2BD9]/40 text-[#A78BFA] text-xs font-mono mb-6 uppercase tracking-wider">
          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
          Admissions Open — Academic Cycle 2026-27
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mt-2 bg-gradient-to-r from-white via-[#E0E7FF] to-[#A78BFA] bg-clip-text text-transparent">
          Shape Your Future at SIN Institute
        </h1>
        <p className="text-[#A78BFA]/70 max-w-2xl mx-auto mt-6 text-base md:text-lg leading-relaxed">
          Unlock institutional excellence through next-generation curriculum programs in computer science, machine intelligence, and corporate strategy.
        </p>

        {/* Countdown timer card */}
        <div className="max-w-md mx-auto mt-12 bg-[#13102A]/75 backdrop-blur-md border border-[#6C2BD9]/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 bg-red-500/10 text-red-400 border-l border-b border-red-500/20 text-[10px] uppercase font-bold tracking-widest rounded-bl-xl">
            Closing Soon
          </div>
          <span className="text-xs text-[#A78BFA]/60 font-semibold uppercase tracking-wider block">Application Deadline Countdown</span>
          <span className="text-3xl md:text-4xl font-mono font-black text-[#A78BFA] tracking-tighter block mt-3">
            {countdown}
          </span>
          <button
            onClick={() => router.push(`/admissions/${slug}/apply`)}
            className="w-full mt-6 py-4 bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] hover:from-[#8B5CF6] hover:to-[#A78BFA] text-white font-bold rounded-2xl transition-all shadow-lg shadow-[#6C2BD9]/20 flex items-center justify-center gap-2 group"
          >
            Apply Now
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Programs List */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-2xl md:text-3xl font-extrabold mb-10 text-center flex items-center justify-center gap-3">
          <GraduationCap className="w-8 h-8 text-[#A78BFA]" />
          Available Admissions Programs
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {programs.map(p => (
            <div key={p.id} className="bg-[#13102A]/50 backdrop-blur-md rounded-2xl border border-[#6C2BD9]/20 p-6 flex flex-col justify-between hover:border-[#6C2BD9]/50 transition-all duration-300">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 text-[#A78BFA]">{p.degree_type} Program</span>
                <h3 className="text-lg font-bold text-white mt-3 leading-snug">{p.name}</h3>
                <div className="mt-4 space-y-2 text-xs text-[#A78BFA]/70">
                  <div className="flex justify-between border-b border-[#6C2BD9]/10 pb-1.5">
                    <span>Program Code:</span>
                    <span className="font-mono font-semibold text-white">{p.code}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#6C2BD9]/10 pb-1.5">
                    <span>Duration:</span>
                    <span className="text-white font-semibold">{p.duration_years} Years</span>
                  </div>
                  <div className="flex justify-between border-b border-[#6C2BD9]/10 pb-1.5">
                    <span>Total Seats Available:</span>
                    <span className="text-white font-semibold">{p.total_seats}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#6C2BD9]/10 pb-1.5">
                    <span>Application Fee:</span>
                    <span className="text-white font-semibold flex items-center"><DollarSign className="w-3 h-3 text-[#A78BFA]" />{p.application_fee}</span>
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-xl bg-[#0D0A1A]/60 border border-[#6C2BD9]/10">
                  <span className="text-[10px] uppercase font-bold text-[#A78BFA]/50 tracking-widest block mb-2">Eligibility Criteria</span>
                  <ul className="text-xs space-y-1.5 text-white/90">
                    {p.eligibility_criteria.min_12th_pc && (
                      <li className="flex items-start gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Min 12th marks percentage: {p.eligibility_criteria.min_12th_pc}%</span>
                      </li>
                    )}
                    {p.eligibility_criteria.min_grad_cgpa && (
                      <li className="flex items-start gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Min graduation CGPA score: {p.eligibility_criteria.min_grad_cgpa} / 10</span>
                      </li>
                    )}
                    {p.eligibility_criteria.required_subjects && (
                      <li className="flex items-start gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-[#A78BFA] shrink-0 mt-0.5" />
                        <span>Mandatory subjects: {p.eligibility_criteria.required_subjects.join(', ')}</span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
              <button 
                onClick={() => router.push(`/admissions/${slug}/apply`)}
                className="w-full mt-6 py-3 bg-[#6C2BD9]/10 hover:bg-[#6C2BD9]/30 border border-[#6C2BD9]/40 text-[#A78BFA] hover:text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                Register & Apply
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-2xl md:text-3xl font-extrabold mb-10 text-center flex items-center justify-center gap-3">
          <HelpCircle className="w-8 h-8 text-[#A78BFA]" />
          Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          {[
            { q: 'How does the multi-preference program selection work?', a: 'You can choose up to 3 programs in order of preference during application. The merit list calculator will evaluate your score against cutoffs sequentially according to your preferred selections.' },
            { q: 'What files should I prepare for uploading?', a: 'You need to upload passport size photo (max 50KB), your signature, Aadhar card scan, 10th and 12th board marksheet copies (PDF/PNG format under 2MB each).' },
            { q: 'Are application fees refundable?', a: 'No, application registration fees paid online via Razorpay card/UPI gateway channels are strictly non-refundable.' },
            { q: 'How will I receive notifications about my merit ranking?', a: 'Once the admissions officer publishes the merit list rounds, automated notifications are broadcasted instantly to your registered email and WhatsApp number.' }
          ].map((item, idx) => (
            <div key={idx} className="bg-[#13102A]/40 border border-[#6C2BD9]/20 rounded-2xl p-5">
              <h4 className="font-bold text-sm text-[#A78BFA]">{item.q}</h4>
              <p className="text-xs text-[#E0E7FF]/70 mt-2 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer Contact bar */}
      <footer className="border-t border-[#6C2BD9]/20 bg-[#13102A]/80 py-10 text-center">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <span className="text-xs text-[#A78BFA]/60 font-mono">© 2026 SIN Education & Technology Pvt. Ltd. All rights reserved.</span>
          <div className="flex gap-6 text-xs text-[#A78BFA]/80">
            <span className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-emerald-400" /> +91 291 276 3310</span>
            <span className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-[#A78BFA]" /> admissions@siet.edu.in</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
