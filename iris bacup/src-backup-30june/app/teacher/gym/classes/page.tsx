"use client";

import React, { useState, useEffect } from 'react';
import { 
  Video, Plus, Trash2, Calendar, Clock, RefreshCw, Layers, Award, Film, Play, CheckCircle
} from 'lucide-react';
import { apiGet, apiPost } from '../../../../lib/api';

interface VirtualClass {
  id: string;
  title: string;
  description?: string;
  video_url?: string;
  thumbnail_url?: string;
  duration_minutes?: number;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  category?: 'Cardio' | 'HIIT' | 'Strength' | 'Yoga' | 'Stretch';
  is_live: boolean;
  scheduled_at?: string;
  view_count: number;
}

export default function TeacherVirtualClassesPage() {
  const [classes, setClasses] = useState<VirtualClass[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Form States
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<'Cardio' | 'HIIT' | 'Strength' | 'Yoga' | 'Stretch'>('Cardio');
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [isLive, setIsLive] = useState<boolean>(true);
  const [scheduledAt, setScheduledAt] = useState<string>('');
  const [duration, setDuration] = useState<number>(30);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const res = await apiGet('/fitzone/gym/classes');
      if (res.success && res.classes) {
        setClasses(res.classes);
      }
    } catch (err) {
      console.log('Error loading virtual classes, using mocks');
      const mockClasses: VirtualClass[] = [
        {
          id: 'v1',
          title: 'Power HIIT Cardio Rush',
          description: 'A high-intensity interval training session designed to raise your heart rate and burn fat fast.',
          difficulty: 'Intermediate',
          category: 'HIIT',
          duration_minutes: 30,
          is_live: false,
          view_count: 142,
          thumbnail_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&q=80'
        },
        {
          id: 'v2',
          title: 'Live Morning Vinyasa Yoga Flow',
          description: 'Start your day with an energizing flow focusing on breath-to-movement sequences and flexibility.',
          difficulty: 'Beginner',
          category: 'Yoga',
          duration_minutes: 45,
          is_live: true,
          scheduled_at: new Date(Date.now() + 10 * 60000).toISOString(),
          view_count: 85,
          thumbnail_url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=80'
        }
      ];
      setClasses(mockClasses);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMessage('');

    try {
      const res = await apiPost('/fitzone/gym/classes', {
        title,
        description: description || undefined,
        category,
        difficulty,
        is_live: isLive,
        scheduled_at: isLive && scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        duration_minutes: Number(duration),
        video_url: !isLive && videoUrl ? videoUrl : undefined,
        thumbnail_url: thumbnailUrl || undefined
      });

      if (res.success) {
        setSuccessMessage(`Successfully ${isLive ? 'scheduled live stream' : 'uploaded class'}!`);
        // Reset form
        setTitle('');
        setDescription('');
        setScheduledAt('');
        setVideoUrl('');
        setThumbnailUrl('');
        loadClasses();
      } else {
        alert(res.error || 'Failed to submit virtual class');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred creating virtual class');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0A1A] text-white flex justify-center items-center">
        <RefreshCw className="w-8 h-8 text-[#6C2BD9] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0A1A] text-white p-4 md:p-6 lg:p-8 max-w-5xl mx-auto flex flex-col gap-6">
      
      {/* Header Banner */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-[#13102A]/80 border border-[#6C2BD9]/30 p-6 rounded-3xl relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#8B5CF6]/5 rounded-full blur-2xl -z-10" />
        
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center shadow-lg">
            <Video className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl md:text-2xl text-white">Trainer Streaming Manager</h1>
            <p className="text-xs text-[#C4B5FD]/70">Schedule Jitsi live streaming classes or host pre-recorded tutorial videos.</p>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/35 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <p className="text-xs text-white font-semibold">{successMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Side: Create / Schedule Class Form (2/5 size) */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="glass-panel border border-[#6C2BD9]/25 p-6 rounded-3xl space-y-5 bg-[#13102A]/80 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5 border-b border-white/5 pb-2">
              <Plus className="w-5 h-5 text-[#A78BFA]" /> Publish Workout Session
            </h3>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider block font-bold">Class Title</label>
              <input 
                type="text" 
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. HIIT Abs Blast"
                className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider block font-bold">Description</label>
              <textarea 
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Session layout, targets, and needed equipment..."
                rows={2}
                className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50 resize-none"
              />
            </div>

            {/* Category + Difficulty */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider block font-bold">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50"
                >
                  <option value="Cardio">Cardio 🏃</option>
                  <option value="HIIT">HIIT ⚡</option>
                  <option value="Strength">Strength 💪</option>
                  <option value="Yoga">Yoga 🧘</option>
                  <option value="Stretch">Stretch 🌀</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider block font-bold">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>

            {/* Session Type (Live Checkbox) */}
            <div className="flex items-center gap-3 p-3 bg-[#0D0A1A] border border-white/5 rounded-xl">
              <input 
                type="checkbox"
                id="isLive"
                checked={isLive}
                onChange={e => setIsLive(e.target.checked)}
                className="w-4 h-4 rounded accent-[#6C2BD9] bg-black border-white/10"
              />
              <label htmlFor="isLive" className="text-xs font-bold text-white cursor-pointer select-none">
                Schedule as Live Jitsi Class 🎙️
              </label>
            </div>

            {/* Duration */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider block font-bold">Duration (Minutes)</label>
              <input 
                type="number" 
                min="5" max="180"
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50 font-mono"
              />
            </div>

            {/* Live date OR Video URL */}
            {isLive ? (
              <div className="space-y-1.5 animate-fadeIn">
                <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider block font-bold">Scheduled At</label>
                <input 
                  type="datetime-local" 
                  required
                  value={scheduledAt}
                  onChange={e => setScheduledAt(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50"
                />
              </div>
            ) : (
              <div className="space-y-1.5 animate-fadeIn">
                <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider block font-bold">Video File Link / ID</label>
                <input 
                  type="text" 
                  required
                  value={videoUrl}
                  onChange={e => setVideoUrl(e.target.value)}
                  placeholder="e.g. https://www.w3schools.com/html/mov_bbb.mp4"
                  className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50"
                />
              </div>
            )}

            {/* Thumbnail */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider block font-bold">Cover Photo URL</label>
              <input 
                type="text" 
                value={thumbnailUrl}
                onChange={e => setThumbnailUrl(e.target.value)}
                placeholder="e.g. https://images.unsplash.com/photo-..."
                className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50"
              />
            </div>

            <button 
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white rounded-xl transition-all shadow-lg shadow-[#6C2BD9]/25 disabled:opacity-50"
            >
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : 'Publish Class Session'}
            </button>
          </form>
        </div>

        {/* Right Side: Published Classes (3/5 size) */}
        <div className="lg:col-span-3 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <Layers className="w-5 h-5 text-[#A78BFA]" /> Published Classes Registry
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classes.map(c => (
              <div key={c.id} className="glass-panel border border-white/5 rounded-2xl bg-[#13102A]/40 overflow-hidden flex flex-col justify-between p-4 shadow-xl">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] bg-[#6C2BD9]/20 border border-[#6C2BD9]/40 text-[#C4B5FD] font-bold px-2 py-0.5 rounded uppercase">
                      {c.category}
                    </span>
                    {c.is_live ? (
                      <span className="bg-red-500/20 border border-red-500/40 text-red-400 text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                        Live Session
                      </span>
                    ) : (
                      <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                        Recorded
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="font-bold text-xs text-white line-clamp-1">{c.title}</h4>
                    <p className="text-[10px] text-[#C4B5FD]/50 line-clamp-2 mt-1">{c.description || 'No description provided.'}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-[9px] text-[#C4B5FD]/50">
                  <span className="font-mono">{c.duration_minutes} Mins • {c.difficulty}</span>
                  <span className="font-mono font-bold text-[#A78BFA]">{c.view_count} check-ins</span>
                </div>
              </div>
            ))}

            {classes.length === 0 && (
              <div className="col-span-full py-16 text-center text-xs text-[#C4B5FD]/45">
                No classes published yet.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
