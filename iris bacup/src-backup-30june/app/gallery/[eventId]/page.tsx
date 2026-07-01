"use client";

import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, ArrowLeft, Heart, MessageCircle, AlertCircle, Maximize2, X, Tag } from 'lucide-react';
import { apiGet } from '../../../lib/api';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function PublicEventGalleryPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [activePhoto, setActivePhoto] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [eventId]);

  const loadData = async () => {
    try {
      const [eventRes, photosRes] = await Promise.all([
        apiGet(`/events/events/${eventId}`),
        apiGet(`/events/events/${eventId}/photos`)
      ]);

      if (eventRes.success) setEvent(eventRes.event);
      if (photosRes.success) {
        // Only show published photos in public gallery
        const published = (photosRes.photos || []).filter((p: any) => p.is_published !== false);
        setPhotos(published);
      } else {
        throw new Error('API failure');
      }
    } catch {
      // Mock Fallbacks
      setEvent({ id: eventId, title: 'TechFest 2026 — AI & Robotics Summit' });
      setPhotos([
        { id: 'p1', photo_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800', caption: 'Opening keynote session with full house.', is_featured: true, tagged_students: ['Aarav Sharma'] },
        { id: 'p2', photo_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800', caption: 'Hackathon team debugging code late night.', is_featured: false, tagged_students: ['Neha Gupta', 'Rahul Verma'] },
        { id: 'p3', photo_url: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800', caption: 'Speaker panel discussion on AI Ethics.', is_featured: false, tagged_students: [] }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#6C2BD9]/5 rounded-full blur-[120px]" />

      <div className="max-w-7xl mx-auto px-6 pt-8 relative z-10">
        <Link href={`/student/events`} className="inline-flex items-center gap-2 text-xs font-bold text-[#C4B5FD]/50 hover:text-[#A78BFA] transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Events
        </Link>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-10 h-10 border-2 border-[#6C2BD9] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div>
            {/* Header info */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 flex items-center justify-center shadow-lg">
                <ImageIcon className="w-7 h-7 text-[#A78BFA]" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-extrabold bg-gradient-to-r from-white to-[#C4B5FD] bg-clip-text text-transparent">Event Gallery</h1>
                <p className="text-xs text-[#C4B5FD]/60 mt-1">Official highlights and snaps from "{event?.title}"</p>
              </div>
            </div>

            {photos.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 py-24 text-center">
                <ImageIcon className="w-12 h-12 text-[#C4B5FD]/20 mx-auto mb-3" />
                <p className="text-sm text-[#C4B5FD]/40">No photos published in this gallery yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {photos.map(p => (
                  <div
                    key={p.id}
                    onClick={() => setActivePhoto(p)}
                    className="rounded-2xl border border-white/5 bg-[#13102A]/80 overflow-hidden hover:border-[#6C2BD9]/30 hover:scale-[1.02] transition-all cursor-pointer group"
                  >
                    <div className="aspect-[16/10] overflow-hidden relative bg-black/40">
                      <img
                        src={p.photo_url}
                        alt={p.caption || 'Event snapshot'}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                        <span className="p-2 rounded-lg bg-[#6C2BD9] text-white">
                          <Maximize2 className="w-4 h-4" />
                        </span>
                      </div>
                    </div>

                    {p.caption && (
                      <div className="p-4">
                        <p className="text-xs text-white leading-relaxed line-clamp-2">{p.caption}</p>
                        {p.tagged_students && p.tagged_students.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2.5">
                            {p.tagged_students.map((tag: string, idx: number) => (
                              <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[9px] text-[#A78BFA]">
                                <Tag className="w-2.5 h-2.5" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fullscreen Photo Lightbox Overlay */}
      {activePhoto && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-6 transition-all">
          <button
            onClick={() => setActivePhoto(null)}
            className="absolute top-6 right-6 p-2.5 rounded-full bg-white/5 hover:bg-white/10 transition-all border border-white/10 text-white"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="max-w-4xl w-full flex flex-col gap-4">
            <div className="w-full aspect-[16/10] max-h-[70vh] rounded-2xl overflow-hidden border border-white/10 bg-black flex items-center justify-center">
              <img
                src={activePhoto.photo_url}
                alt={activePhoto.caption || 'Event image'}
                className="w-full h-full object-contain"
              />
            </div>
            
            {activePhoto.caption && (
              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <p className="text-sm text-white leading-relaxed">{activePhoto.caption}</p>
                {activePhoto.tagged_students && activePhoto.tagged_students.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="text-[10px] uppercase font-bold text-[#C4B5FD]/40 flex items-center gap-1 mr-1">
                      <Tag className="w-3.5 h-3.5" /> Tagged Students:
                    </span>
                    {activePhoto.tagged_students.map((tag: string, idx: number) => (
                      <span key={idx} className="px-2.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-[#A78BFA]">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
