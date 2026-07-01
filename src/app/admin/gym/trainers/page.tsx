"use client";

import React, { useState, useEffect } from 'react';
import { Dumbbell, Plus, Trash2, ShieldAlert, Sparkles, User, ArrowLeft, UserPlus } from 'lucide-react';
import { apiGet, apiPost } from '../../../../lib/api';
import Link from 'next/link';

export default function AdminGymTrainers() {
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [specInput, setSpecInput] = useState('');
  const [specs, setSpecs] = useState<string[]>([]);
  const [photoUrl, setPhotoUrl] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadTrainers();
  }, []);

  const loadTrainers = async () => {
    setLoading(true);
    try {
      const res = await apiGet('/fitzone/gym/trainers');
      if (res.success && res.trainers?.length > 0) {
        setTrainers(res.trainers);
      }
    } catch (err) {
      console.log('Error loading trainers, using mocks');
      setTrainers([]);
    } finally {
      setLoading(false);
    }
  };

  const addSpecTag = () => {
    if (!specInput) return;
    if (!specs.includes(specInput)) {
      setSpecs(prev => [...prev, specInput]);
    }
    setSpecInput('');
  };

  const removeSpecTag = (index: number) => {
    setSpecs(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (specs.length === 0) {
      alert('Add at least one specialization tag!');
      return;
    }
    try {
      const res = await apiPost('/fitzone/gym/trainers', {
        name,
        bio,
        specializations: specs,
        photo_url: photoUrl || null,
        is_active: true
      });

      if (res.success) {
        setSuccess('Gym trainer profile created successfully!');
        setName('');
        setBio('');
        setSpecs([]);
        setPhotoUrl('');
        loadTrainers();
      } else {
        setError(res.error || 'Failed to create trainer profile.');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred.');
    }
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6C2BD9]/30 via-[#0D0A1A] to-[#0D0A1A]" />
        <div className="relative max-w-7xl mx-auto px-6 pt-10 pb-6">
          <Link href="/admin/gym" className="flex items-center gap-1.5 text-xs text-[#C4B5FD]/70 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <User className="w-6 h-6 text-[#A78BFA]" />
            <h1 className="font-extrabold text-2xl lg:text-3xl text-white">Trainer Profile Setup</h1>
          </div>
          <p className="text-xs text-[#C4B5FD]/70">Configure wellness coaching personnel details, specialties, and active accounts.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Add Trainer Form */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          <form onSubmit={handleCreate} className="glass-panel p-6 rounded-3xl border border-white/5 bg-[#13102A]/40 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-[#A78BFA]" /> Register Gym Trainer
            </h3>

            <div>
              <label className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold block mb-1">Trainer Name</label>
              <input
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., John Doe"
                className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold block mb-1">Photo URL (Optional)</label>
              <input
                value={photoUrl}
                onChange={e => setPhotoUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold block mb-1">Specializations</label>
              <div className="flex gap-2">
                <input
                  value={specInput}
                  onChange={e => setSpecInput(e.target.value)}
                  placeholder="e.g., CrossFit"
                  className="flex-1 px-3 py-2 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none"
                />
                <button
                  type="button"
                  onClick={addSpecTag}
                  className="px-3 rounded-xl bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 text-xs font-bold text-[#A78BFA] hover:bg-[#6C2BD9]/35"
                >
                  Add
                </button>
              </div>

              {/* Specialization Tags */}
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {specs.map((s, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-[#6C2BD9]/25 text-[#C4B5FD] text-[9px] font-bold flex items-center gap-1">
                    {s}
                    <button type="button" onClick={() => removeSpecTag(i)} className="text-red-400 font-extrabold hover:text-red-300">×</button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold block mb-1">Short Bio</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Brief summary of certifications and training approach..."
                rows={3}
                className="w-full px-4 py-2 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-xs font-bold text-white shadow-lg mt-2"
            >
              Save Trainer Profile
            </button>
          </form>
        </div>

        {/* Existing Trainers List */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> {error}
            </div>
          )}
          {success && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> {success}
            </div>
          )}

          <h3 className="text-sm font-bold text-white mb-2">Registered Trainers</h3>

          <div className="flex flex-col gap-3">
            {loading ? (
              <div className="py-8 text-center text-xs text-[#C4B5FD]/45">Loading trainers roster...</div>
            ) : trainers.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#C4B5FD]/30">No trainers registered. Fill the form to log profile details.</div>
            ) : (
              trainers.map(t => (
                <div
                  key={t.id}
                  className="glass-panel p-5 rounded-2xl border border-white/5 bg-[#13102A]/20 flex items-start gap-4 hover:border-[#6C2BD9]/20 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center shadow-md flex-shrink-0">
                    <User className="w-6 h-6 text-white" />
                  </div>

                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-white">{t.name}</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {t.specializations?.map((s: string, idx: number) => (
                        <span key={idx} className="px-1.5 py-0.5 rounded bg-[#6C2BD9]/15 text-[#C4B5FD]/90 text-[8px] font-semibold">
                          {s}
                        </span>
                      ))}
                    </div>
                    {t.bio && <p className="text-[11px] text-[#C4B5FD]/55 mt-2 leading-relaxed">"{t.bio}"</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
