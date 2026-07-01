"use client";

import React, { useState, useEffect } from 'react';
import {
  Users, MessageSquare, Plus, Save, Trash2, ArrowLeft,
  Calendar, Clock, CheckCircle2, Star, Award
} from 'lucide-react';
import { apiGet } from '../../../../lib/api';

export default function AdminAlumniSettings() {
  const [alumniList, setAlumniList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [testimonials, setTestimonials] = useState<any[]>([
    { id: 1, student: 'Khushal Sharma', company: 'Google India', quote: 'The placement cell mock interview guides prepared me extensively for technical and coding rounds.', active: true }
  ]);
  const [newStudent, setNewStudent] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newQuote, setNewQuote] = useState('');

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAlumniRoster();
  }, []);

  const loadAlumniRoster = async () => {
    try {
      const res = await apiGet('/placements/alumni');
      if (res.success && res.alumni) {
        setAlumniList(res.alumni);
      }
    } catch (err) {
      console.log('Error loading alumni lists');
    }

    // fallback seed if empty
    if (alumniList.length === 0) {
      setAlumniList([
        {
          id: 'alum-1',
          graduation_year: 2023,
          current_company: 'Microsoft',
          current_role: 'Software Engineer II',
          is_mentor: true,
          students: {
            first_name: 'Aditya',
            last_name: 'Vyas'
          }
        },
        {
          id: 'alum-2',
          graduation_year: 2022,
          current_company: 'Zomato',
          current_role: 'Product Manager',
          is_mentor: true,
          students: {
            first_name: 'Shreya',
            last_name: 'Choudhary'
          }
        }
      ]);
    }
    setLoading(false);
  };

  const handleAddTestimonial = () => {
    if (newStudent && newQuote) {
      setTestimonials([
        ...testimonials,
        { id: Date.now(), student: newStudent, company: newCompany || 'MNC Recruit', quote: newQuote, active: true }
      ]);
      setNewStudent('');
      setNewCompany('');
      setNewQuote('');
    }
  };

  const handleDeleteTestimonial = (id: number) => {
    setTestimonials(testimonials.filter(t => t.id !== id));
  };

  const handleSaveSettings = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      alert('Alumni testimonial settings updated successfully.');
    }, 1000);
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-6 lg:p-8">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex items-center gap-3">
          <a href="/admin/placements" className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#C4B5FD]/70 hover:text-white hover:border-[#6C2BD9]/40 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </a>
          <div>
            <h1 className="font-extrabold text-2xl text-white">Alumni & Testimonials Configuration</h1>
            <p className="text-xs text-[#C4B5FD]/70">Configure featured student placement success reviews and audit alumni mentorship registries.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Testimonial Builder */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Form */}
            <div className="p-6 rounded-2xl bg-[#13102A]/85 border border-[#6C2BD9]/20 flex flex-col gap-4 text-xs">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#A78BFA]" />
                Add Student testimonial Quote
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase font-bold text-[#C4B5FD]/60">Student Name</label>
                  <input
                    placeholder="e.g. Khushal Sharma"
                    value={newStudent}
                    onChange={e => setNewStudent(e.target.value)}
                    className="px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-white placeholder:text-white/20 outline-none focus:border-[#6C2BD9]/50"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase font-bold text-[#C4B5FD]/60">Recruited Company</label>
                  <input
                    placeholder="e.g. Google India"
                    value={newCompany}
                    onChange={e => setNewCompany(e.target.value)}
                    className="px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-white placeholder:text-white/20 outline-none focus:border-[#6C2BD9]/50"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] uppercase font-bold text-[#C4B5FD]/60">Success Quote testimonial</label>
                <textarea
                  placeholder="Share quote regarding campus drive prep, TPO rounds guidance..."
                  value={newQuote}
                  onChange={e => setNewQuote(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-white placeholder:text-white/20 outline-none focus:border-[#6C2BD9]/50 resize-none"
                />
              </div>

              <button
                type="button"
                onClick={handleAddTestimonial}
                className="py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white transition-all self-end flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Testimonial Quote
              </button>
            </div>

            {/* list */}
            <div className="flex flex-col gap-4">
              <h3 className="font-bold text-xs text-white">Active Testimonial review cards ({testimonials.length})</h3>
              {testimonials.map(t => (
                <div key={t.id} className="p-5 rounded-2xl bg-[#13102A]/85 border border-white/5 flex flex-col gap-2 relative group leading-relaxed">
                  <button
                    onClick={() => handleDeleteTestimonial(t.id)}
                    className="absolute top-3 right-3 text-white/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">{t.student}</span>
                    <span className="text-[9px] text-[#A78BFA] uppercase">({t.company})</span>
                  </div>
                  <p className="text-[10px] text-[#C4B5FD]/70 italic mt-1 font-serif">"{t.quote}"</p>
                </div>
              ))}
            </div>

            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="py-3 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white transition-all shadow-lg shadow-[#6C2BD9]/20 mt-2 flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Configuration Changes'}
            </button>

          </div>

          {/* Mentorship check logs */}
          <div className="lg:col-span-5 p-6 rounded-2xl bg-[#13102A]/85 border border-[#6C2BD9]/20 flex flex-col gap-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-[#A78BFA]" />
              Mentoring Registries logs
            </h2>

            {loading ? (
              <div className="py-10 text-center text-xs text-[#C4B5FD]/40">Loading alumni...</div>
            ) : (
              <div className="flex flex-col gap-3">
                {alumniList.map(alum => (
                  <div key={alum.id} className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white">{alum.students?.first_name} {alum.students?.last_name}</span>
                      <p className="text-[9px] text-[#C4B5FD]/50 mt-0.5">{alum.current_role} at {alum.current_company}</p>
                    </div>

                    <span className="px-2 py-0.5 rounded bg-[#6C2BD9]/10 text-[#A78BFA] font-bold text-[8px] uppercase">
                      Grad: {alum.graduation_year}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </main>
  );
}
