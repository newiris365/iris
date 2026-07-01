"use client";

import React, { useState, useEffect } from 'react';
import { 
  Play, Video, VideoOff, Search, Compass, RefreshCw, X, Award, ExternalLink, Calendar, Heart
} from 'lucide-react';
import { apiGet } from '../../../../lib/api';

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

export default function StudentVirtualClassesPage() {
  const [classes, setClasses] = useState<VirtualClass[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Streaming Player Modal
  const [activeStreamClass, setActiveStreamClass] = useState<VirtualClass | null>(null);
  const [streamUrl, setStreamUrl] = useState<string>('');
  const [streamLoading, setStreamLoading] = useState<boolean>(false);

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
          scheduled_at: new Date(Date.now() + 10 * 60000).toISOString(), // Starts in 10 mins
          view_count: 85,
          thumbnail_url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=80'
        },
        {
          id: 'v3',
          title: 'Full Body strength Conditioning',
          description: 'Compound lifts and muscular endurance focusing on form, core strength, and progressive load.',
          difficulty: 'Advanced',
          category: 'Strength',
          duration_minutes: 50,
          is_live: false,
          view_count: 219,
          thumbnail_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&q=80'
        },
        {
          id: 'v4',
          title: 'Deep Stretching & Recovery Session',
          description: 'Slow-paced restorative session aiming to lengthen muscle fibers and increase post-workout joint mobility.',
          difficulty: 'Beginner',
          category: 'Stretch',
          duration_minutes: 20,
          is_live: false,
          view_count: 98,
          thumbnail_url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=80'
        }
      ];
      setClasses(mockClasses);
    } finally {
      setLoading(false);
    }
  };

  const handleStartStream = async (vClass: VirtualClass) => {
    setActiveStreamClass(vClass);
    setStreamLoading(true);
    try {
      const res = await apiGet(`/fitzone/gym/classes/${vClass.id}/stream`);
      if (res.success && res.stream_url) {
        setStreamUrl(res.stream_url);
      } else {
        // Fallback Jitsi link if offline or missing
        setStreamUrl(vClass.is_live 
          ? `https://meet.jit.si/IRIS-FitZone-${vClass.id.substring(0,8)}` 
          : 'https://www.w3schools.com/html/mov_bbb.mp4' // Big Buck Bunny demo fallback
        );
      }
    } catch {
      setStreamUrl(vClass.is_live 
        ? `https://meet.jit.si/IRIS-FitZone-${vClass.id.substring(0,8)}` 
        : 'https://www.w3schools.com/html/mov_bbb.mp4'
      );
    } finally {
      setStreamLoading(false);
    }
  };

  const handleCloseStream = () => {
    setActiveStreamClass(null);
    setStreamUrl('');
  };

  const categories = ['All', 'HIIT', 'Strength', 'Yoga', 'Cardio', 'Stretch'];

  const filteredClasses = classes.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        c.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = selectedCategory === 'All' || c.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0A1A] text-white flex justify-center items-center">
        <RefreshCw className="w-8 h-8 text-[#6C2BD9] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0A1A] text-white p-4 md:p-6 lg:p-8 max-w-6xl mx-auto flex flex-col gap-6">
      
      {/* Header Banner */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-[#13102A]/80 border border-[#6C2BD9]/30 p-6 rounded-3xl relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#8B5CF6]/10 rounded-full blur-2xl -z-10" />
        
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center shadow-lg">
            <Video className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl md:text-2xl text-white">Virtual Fitness Classes</h1>
            <p className="text-xs text-[#C4B5FD]/70">Access live instructor Jitsi streams and premium on-demand video routines.</p>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#13102A] border border-white/5 p-4 rounded-2xl">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#C4B5FD]/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search classes..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50"
          />
        </div>
        
        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${
                selectedCategory === cat 
                  ? 'bg-[#6C2BD9]/20 border-[#6C2BD9] text-white' 
                  : 'bg-[#0D0A1A] border-white/5 text-[#C4B5FD]/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClasses.map(c => (
          <div key={c.id} className="glass-panel border border-white/5 rounded-3xl overflow-hidden bg-[#13102A]/40 flex flex-col justify-between group shadow-xl">
            {/* Thumbnail */}
            <div className="h-44 relative bg-black/60 overflow-hidden">
              {c.thumbnail_url ? (
                <img 
                  src={c.thumbnail_url} 
                  alt={c.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500 opacity-80"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <VideoOff className="w-10 h-10 text-white/20" />
                </div>
              )}
              
              {/* Badge for category */}
              <span className="absolute top-3 left-3 bg-[#6C2BD9] text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                {c.category}
              </span>

              {/* Live Tag or Duration */}
              {c.is_live ? (
                <span className="absolute top-3 right-3 bg-red-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                  ● Live Session
                </span>
              ) : (
                <span className="absolute bottom-3 right-3 bg-black/60 border border-white/10 text-white text-[9px] font-bold px-2 py-0.5 rounded-md">
                  {c.duration_minutes} Mins
                </span>
              )}
            </div>

            {/* Content Body */}
            <div className="p-5 flex-1 flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded border ${
                    c.difficulty === 'Beginner' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' :
                    c.difficulty === 'Intermediate' ? 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5' :
                    'text-rose-400 border-rose-500/20 bg-rose-500/5'
                  }`}>
                    {c.difficulty || 'General'}
                  </span>
                  <span className="text-[9px] text-[#C4B5FD]/50 font-mono">{c.view_count} views</span>
                </div>

                <h3 className="font-extrabold text-sm text-white leading-snug group-hover:text-[#A78BFA] transition-colors">{c.title}</h3>
                <p className="text-[11px] text-[#C4B5FD]/60 leading-relaxed line-clamp-2">{c.description || 'No description provided.'}</p>
              </div>

              {c.is_live && c.scheduled_at && (
                <div className="bg-[#6C2BD9]/10 border border-[#6C2BD9]/20 p-2.5 rounded-xl flex items-center gap-2 text-[10px]">
                  <Calendar className="w-4 h-4 text-[#A78BFA] shrink-0" />
                  <span className="text-white font-semibold">
                    Scheduled: {new Date(c.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}

              <button
                onClick={() => handleStartStream(c)}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  c.is_live 
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20' 
                    : 'bg-[#6C2BD9] hover:bg-[#8B5CF6] text-white shadow-lg shadow-[#6C2BD9]/20'
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                {c.is_live ? 'Join Live Jitsi stream' : 'Watch On-Demand Video'}
              </button>
            </div>
          </div>
        ))}

        {filteredClasses.length === 0 && (
          <div className="col-span-full py-16 text-center text-xs text-[#C4B5FD]/50">
            No virtual fitness classes found matching your query.
          </div>
        )}
      </div>

      {/* STREAM MODAL (JITSI OVERLAY / DEMO PLAYER) */}
      {activeStreamClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="relative w-full max-w-4xl bg-[#13102A] border border-[#6C2BD9]/30 rounded-3xl overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 bg-[#0D0A1A] border-b border-white/5">
              <div>
                <span className="text-[9px] uppercase tracking-widest text-[#A78BFA] font-black">
                  {activeStreamClass.is_live ? 'Live Stream Session' : 'Recorded Workout Video'}
                </span>
                <h2 className="text-sm font-extrabold text-white mt-0.5">{activeStreamClass.title}</h2>
              </div>
              <button 
                onClick={handleCloseStream}
                className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Video Player Box */}
            <div className="relative aspect-video bg-black w-full flex items-center justify-center">
              {streamLoading ? (
                <div className="text-center text-xs space-y-3">
                  <RefreshCw className="w-8 h-8 text-[#6C2BD9] animate-spin mx-auto" />
                  <p className="text-[#C4B5FD]/50 font-bold">Securing streaming signature key...</p>
                </div>
              ) : activeStreamClass.is_live ? (
                /* JITSI SECURE STREAM iframe */
                <iframe 
                  src={streamUrl}
                  allow="camera; microphone; fullscreen; display-capture; autoplay"
                  className="w-full h-full border-none"
                  title="Jitsi Live Workout"
                />
              ) : (
                /* STANDARD video file play */
                <video 
                  src={streamUrl} 
                  controls 
                  autoPlay 
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            {/* Action Bar */}
            <div className="p-4 bg-[#0D0A1A] border-t border-white/5 flex flex-wrap justify-between items-center gap-3">
              <span className="text-[10px] text-[#C4B5FD]/60 leading-relaxed max-w-md">
                {activeStreamClass.is_live 
                  ? '⚠️ Camera is disabled by default. You can enable it inside Jitsi if required for posture review.' 
                  : '✔️ Completed workouts can be logged in your fitzone activity log.'}
              </span>
              
              {activeStreamClass.is_live && (
                <a 
                  href={streamUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-bold text-white transition-all flex items-center gap-1.5"
                >
                  Open in New Tab <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
