"use client";

import React, { useState } from 'react';
import { Dumbbell, Search, Plus, Trash2, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { apiPost } from '../../../../lib/api';

const PREBUILT_EXERCISES = [
  'Bench Press', 'Squats', 'Deadlifts', 'Overhead Press',
  'Bicep Curls', 'Tricep Pushdowns', 'Lateral Raises',
  'Lat Pulldowns', 'Leg Press', 'Plank', 'Push-ups', 'Pull-ups'
];

interface WorkoutSet {
  reps: number;
  weight: number;
}

interface LoggedExercise {
  name: string;
  sets: WorkoutSet[];
}

export default function StudentWorkoutLogger() {
  const [search, setSearch] = useState('');
  const [duration, setDuration] = useState(45);
  const [selfRating, setSelfRating] = useState(4);
  const [trainerNotes, setTrainerNotes] = useState('');
  const [loggedExercises, setLoggedExercises] = useState<LoggedExercise[]>([]);
  const [customExercise, setCustomExercise] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const filteredPrebuilt = PREBUILT_EXERCISES.filter(ex =>
    ex.toLowerCase().includes(search.toLowerCase())
  );

  const addExercise = (name: string) => {
    if (loggedExercises.some(e => e.name === name)) return;
    setLoggedExercises(prev => [...prev, { name, sets: [{ reps: 10, weight: 10 }] }]);
  };

  const addCustomExercise = () => {
    if (!customExercise || loggedExercises.some(e => e.name === customExercise)) return;
    addExercise(customExercise);
    setCustomExercise('');
  };

  const removeExercise = (index: number) => {
    setLoggedExercises(prev => prev.filter((_, i) => i !== index));
  };

  const addSet = (exerciseIndex: number) => {
    setLoggedExercises(prev => prev.map((ex, idx) => {
      if (idx !== exerciseIndex) return ex;
      const lastSet = ex.sets[ex.sets.length - 1] || { reps: 10, weight: 10 };
      return { ...ex, sets: [...ex.sets, { ...lastSet }] };
    }));
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    setLoggedExercises(prev => prev.map((ex, idx) => {
      if (idx !== exerciseIndex) return ex;
      return { ...ex, sets: ex.sets.filter((_, sIdx) => sIdx !== setIndex) };
    }));
  };

  const updateSet = (exerciseIndex: number, setIndex: number, field: 'reps' | 'weight', val: number) => {
    setLoggedExercises(prev => prev.map((ex, idx) => {
      if (idx !== exerciseIndex) return ex;
      return {
        ...ex,
        sets: ex.sets.map((s, sIdx) => sIdx === setIndex ? { ...s, [field]: val } : s)
      };
    }));
  };

  const handleSave = async () => {
    if (loggedExercises.length === 0) {
      alert('Add at least one exercise to save!');
      return;
    }
    setSaving(true);
    setSaved(false);
    try {
      const userStr = localStorage.getItem('iris_user_profile');
      const user = userStr ? JSON.parse(userStr) : null;
      const studentId = user?.student_id || 's0000000-0000-0000-0000-000000000001';

      const res = await apiPost('/fitzone/gym/workouts', {
        student_id: studentId,
        duration_minutes: duration,
        self_rating: selfRating,
        trainer_notes: trainerNotes,
        exercises: loggedExercises
      });

      if (res.success) {
        setSaved(true);
        setLoggedExercises([]);
        setTrainerNotes('');
      } else {
        alert(res.error || 'Failed to save workout.');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred.');
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
          <div className="flex items-center gap-3 mb-2">
            <Dumbbell className="w-6 h-6 text-[#A78BFA]" />
            <h1 className="font-extrabold text-2xl lg:text-3xl text-white">Log Today's Workout</h1>
          </div>
          <p className="text-xs text-[#C4B5FD]/70">Track sets, reps, and weights to calculate calorie output.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Columns: Exercises selection & library search */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-[#13102A]/40 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white">Exercise Library</h3>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C4B5FD]/40" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search exercises..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white placeholder:text-[#C4B5FD]/30 outline-none focus:border-[#6C2BD9]/50"
              />
            </div>

            {/* List */}
            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
              {filteredPrebuilt.map((name, idx) => (
                <button
                  key={idx}
                  onClick={() => addExercise(name)}
                  className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-[#6C2BD9]/25 text-left text-xs text-[#C4B5FD]/85 transition-colors"
                >
                  <span>{name}</span>
                  <Plus className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <div className="border-t border-white/5 pt-3">
              <label className="text-[10px] text-[#C4B5FD]/40 uppercase font-bold block mb-1">Or Add Custom</label>
              <div className="flex gap-2">
                <input
                  value={customExercise}
                  onChange={e => setCustomExercise(e.target.value)}
                  placeholder="e.g., Hammer Curls"
                  className="flex-1 px-3 py-2 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50"
                />
                <button
                  onClick={addCustomExercise}
                  className="px-3 rounded-xl bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 text-xs font-bold text-[#A78BFA] hover:bg-[#6C2BD9]/35"
                >
                  Add
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Right Columns: Active workout session logger details */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {saved && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Workout logged successfully! Check your stats in Progress.
            </div>
          )}

          {/* Form parameters */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-[#13102A]/20 grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold block mb-1">Duration (minutes)</label>
              <input
                type="number"
                value={duration}
                onChange={e => setDuration(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold block mb-1">Self Rating (1-5)</label>
              <select
                value={selfRating}
                onChange={e => setSelfRating(parseInt(e.target.value))}
                className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50"
              >
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} - {n === 5 ? 'Excellent' : n === 1 ? 'Poor' : 'Good'}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold block mb-1">Session Notes / Feeling</label>
              <textarea
                value={trainerNotes}
                onChange={e => setTrainerNotes(e.target.value)}
                placeholder="How did you feel today? Any custom notes?"
                rows={2}
                className="w-full px-4 py-2 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white placeholder:text-[#C4B5FD]/30 outline-none focus:border-[#6C2BD9]/50 resize-none"
              />
            </div>
          </div>

          {/* Added exercises table list */}
          <div className="flex flex-col gap-4">
            {loggedExercises.map((ex, exIdx) => (
              <div key={exIdx} className="glass-panel p-5 rounded-2xl border border-[#6C2BD9]/15 bg-gradient-to-tr from-[#13102A]/80 to-[#191632] flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Dumbbell className="w-4 h-4 text-[#A78BFA]" /> {ex.name}
                  </h4>
                  <button
                    onClick={() => removeExercise(exIdx)}
                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Sets List */}
                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-12 gap-2 text-[10px] uppercase font-bold text-[#C4B5FD]/40">
                    <div className="col-span-2 text-center">Set</div>
                    <div className="col-span-4">Reps</div>
                    <div className="col-span-4">Weight (kg)</div>
                    <div className="col-span-2"></div>
                  </div>

                  {ex.sets.map((s, sIdx) => (
                    <div key={sIdx} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-2 text-center text-xs font-bold text-white/80">{sIdx + 1}</div>
                      <div className="col-span-4">
                        <input
                          type="number"
                          value={s.reps}
                          onChange={e => updateSet(exIdx, sIdx, 'reps', parseInt(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 bg-[#0D0A1A] border border-white/10 rounded-lg text-xs text-center"
                        />
                      </div>
                      <div className="col-span-4">
                        <input
                          type="number"
                          value={s.weight}
                          onChange={e => updateSet(exIdx, sIdx, 'weight', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 bg-[#0D0A1A] border border-white/10 rounded-lg text-xs text-center"
                        />
                      </div>
                      <div className="col-span-2 text-right">
                        <button
                          onClick={() => removeSet(exIdx, sIdx)}
                          className="p-1 rounded bg-white/5 hover:bg-white/10 text-[#C4B5FD]/60"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => addSet(exIdx)}
                    className="mt-1 w-full py-1.5 rounded-lg border border-dashed border-white/10 hover:border-[#6C2BD9]/30 text-[10px] font-bold text-[#C4B5FD]/60 hover:text-[#A78BFA] transition-colors"
                  >
                    + Add Set
                  </button>
                </div>

              </div>
            ))}

            {loggedExercises.length === 0 && (
              <div className="py-12 text-center text-xs text-[#C4B5FD]/30">Add exercises from the library to configure your workout logs.</div>
            )}
          </div>

          {loggedExercises.length > 0 && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-sm font-bold text-white shadow-lg transition-all"
            >
              {saving ? 'Saving...' : 'Save Workout'}
            </button>
          )}

        </div>

      </div>
    </main>
  );
}
