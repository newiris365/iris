"use client";

import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, Sparkles, ArrowLeft, Save } from 'lucide-react';
import { apiGet, apiPost } from '../../../../../lib/api';
import Link from 'next/link';

export default function TrainerEnterMetrics({ params }: { params: { id: string } }) {
  const studentId = params.id;
  const [student, setStudent] = useState<any>(null);
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [chest, setChest] = useState('');
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStudentDetails();
  }, []);

  const loadStudentDetails = async () => {
    setLoading(true);
    try {
      const res = await apiGet(`/students`);
      if (res.success && res.students?.length > 0) {
        const found = res.students.find((s: any) => s.id === studentId);
        setStudent(found);
      }
    } catch (err) {
      console.log('Error loading student details, using mock fallback');
      setStudent({
        id: studentId,
        name: 'Khushal Patel',
        roll_number: 'CS22B005',
        department: 'Computer Science'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSaving(true);
    try {
      const res = await apiPost('/fitzone/gym/metrics', {
        student_id: studentId,
        weight_kg: parseFloat(weight),
        height_cm: parseFloat(height),
        body_fat_percent: bodyFat ? parseFloat(bodyFat) : null,
        chest_cm: chest ? parseFloat(chest) : null,
        waist_cm: waist ? parseFloat(waist) : null,
        hips_cm: hips ? parseFloat(hips) : null,
        notes
      });

      if (res.success) {
        setSuccess(true);
        // Clear fields
        setWeight('');
        setHeight('');
        setBodyFat('');
        setChest('');
        setWaist('');
        setHips('');
        setNotes('');
      } else {
        setError(res.error || 'Failed to save body metrics.');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred while saving metrics.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6C2BD9]/30 via-[#0D0A1A] to-[#0D0A1A]" />
        <div className="relative max-w-7xl mx-auto px-6 pt-10 pb-6">
          <Link href="/teacher/gym/students" className="flex items-center gap-1.5 text-xs text-[#C4B5FD]/70 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Students
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-6 h-6 text-[#A78BFA]" />
            <h1 className="font-extrabold text-2xl lg:text-3xl text-white">Record Body Metrics</h1>
          </div>
          <p className="text-xs text-[#C4B5FD]/70">
            Log physical evaluation details for <span className="text-white font-extrabold">{student ? student.name : 'Student'}</span>.
          </p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6">
        
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 mb-6">
            <ShieldAlert className="w-4 h-4" /> {error}
          </div>
        )}
        {success && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 mb-6">
            <Sparkles className="w-4 h-4" /> Metrics saved successfully!
          </div>
        )}

        <form onSubmit={handleSave} className="glass-panel p-6 rounded-3xl border border-white/5 bg-[#13102A]/40 flex flex-col gap-4">
          <h2 className="text-sm font-bold text-white mb-2">Biometrics Entry Form</h2>

          {/* Weight & Height */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold block mb-1">Weight (kg) *</label>
              <input
                required
                type="number"
                step="0.1"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                placeholder="e.g., 75.4"
                className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold block mb-1">Height (cm) *</label>
              <input
                required
                type="number"
                step="0.1"
                value={height}
                onChange={e => setHeight(e.target.value)}
                placeholder="e.g., 176.5"
                className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50"
              />
            </div>
          </div>

          {/* Body Fat */}
          <div>
            <label className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold block mb-1">Body Fat Percent (%)</label>
            <input
              type="number"
              step="0.1"
              value={bodyFat}
              onChange={e => setBodyFat(e.target.value)}
              placeholder="e.g., 18.5"
              className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50"
            />
          </div>

          {/* Chest, Waist, Hips */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold block mb-1">Chest (cm)</label>
              <input
                type="number"
                step="0.1"
                value={chest}
                onChange={e => setChest(e.target.value)}
                placeholder="98"
                className="w-full px-2 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-center"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold block mb-1">Waist (cm)</label>
              <input
                type="number"
                step="0.1"
                value={waist}
                onChange={e => setWaist(e.target.value)}
                placeholder="82"
                className="w-full px-2 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-center"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold block mb-1">Hips (cm)</label>
              <input
                type="number"
                step="0.1"
                value={hips}
                onChange={e => setHips(e.target.value)}
                placeholder="94"
                className="w-full px-2 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-center"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold block mb-1">Trainer Remarks</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g., Increase protein intake, focus on hypertrophy routine..."
              rows={3}
              className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white placeholder:text-[#C4B5FD]/30 outline-none focus:border-[#6C2BD9]/50 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full mt-4 py-3.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-sm font-bold text-white shadow-lg flex items-center justify-center gap-1.5 transition-all"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving Biometrics...' : 'Save Biometrics'}
          </button>
        </form>

      </div>
    </main>
  );
}
