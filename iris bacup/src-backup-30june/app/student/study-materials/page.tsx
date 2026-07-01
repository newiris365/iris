"use client";

import React, { useState, useEffect } from 'react';
import { BookOpen, Download, FileText, Search, Filter, Video, File, FileQuestion } from 'lucide-react';
import { apiGet } from '../../../lib/api';

interface Material {
  id: string;
  title: string;
  description: string;
  subject: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size_kb: number;
  category: string;
  semester: number;
  download_count: number;
  uploaded_by_name: string;
  created_at: string;
}

const CATEGORIES = ['All', 'Notes', 'Lab Manual', 'Textbook', 'Video', 'PPT', 'Question Bank', 'Syllabus', 'Other'];

const CATEGORY_ICONS: Record<string, string> = {
  Notes: '📝', 'Lab Manual': '🔬', 'Textbook': '📚', Video: '🎥',
  'Question Bank': '❓', 'PPT': '📊', Syllabus: '📋', Other: '📁',
};

export default function StudyMaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await apiGet('/core/study-materials');
      if (res.success) setMaterials(res.materials || []);
    } catch (err) {
      console.error('Failed to load materials', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = materials.filter(m => {
    if (category !== 'All' && m.category !== category) return false;
    if (search && !m.title.toLowerCase().includes(search.toLowerCase()) && !m.subject?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getFileIcon = (type: string) => {
    if (type === 'pdf') return '📄';
    if (type === 'mp4' || type === 'webm') return '🎥';
    return '📁';
  };

  const formatSize = (kb: number) => {
    if (kb > 1024) return `${(kb / 1024).toFixed(1)} MB`;
    return `${kb} KB`;
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-[#A78BFA]" />
          </div>
          <div>
            <h1 className="font-heading font-extrabold text-2xl">Study Materials</h1>
            <p className="text-xs text-[#C4B5FD]/70 font-light">Download notes, lab manuals, and resources</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#C4B5FD]/40" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#13102A] border border-[#6C2BD9]/30 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none focus:border-[#8B5CF6]"
              placeholder="Search by title or subject..." />
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-3 py-2 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all ${
                category === c
                  ? 'bg-[#6C2BD9]/30 border border-[#6C2BD9]/50 text-white'
                  : 'bg-white/5 border border-white/10 text-[#C4B5FD]/60 hover:text-white'
              }`}>
              {CATEGORY_ICONS[c]} {c}
            </button>
          ))}
        </div>

        {/* Materials list */}
        <div className="flex flex-col gap-3">
          {loading ? (
            <div className="glass-panel rounded-2xl p-8 text-center text-[#C4B5FD]/40 text-xs">Loading materials...</div>
          ) : filtered.length === 0 ? (
            <div className="glass-panel rounded-2xl p-8 text-center text-[#C4B5FD]/40 text-xs">No materials found</div>
          ) : filtered.map(m => (
            <div key={m.id} className="glass-panel rounded-2xl p-5 border border-white/5 flex items-center gap-4 hover:border-[#6C2BD9]/30 transition-all">
              <div className="text-2xl">{getFileIcon(m.file_type)}</div>
              <div className="flex-1">
                <h3 className="font-heading font-bold text-sm">{m.title}</h3>
                <div className="text-[10px] text-[#C4B5FD]/50 mt-0.5">
                  {m.subject} &middot; {m.category} {m.semester ? `&middot; Sem ${m.semester}` : ''} &middot; {m.uploaded_by_name}
                </div>
                {m.description && <p className="text-[10px] text-[#C4B5FD]/40 mt-1 line-clamp-1">{m.description}</p>}
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-[10px] text-[#C4B5FD]/40">{formatSize(m.file_size_kb)}</div>
                <div className="text-[9px] text-[#C4B5FD]/30">{m.download_count} downloads</div>
              </div>
              <button onClick={() => alert(`Downloading: ${m.file_url}`)}
                className="px-3 py-2 rounded-xl bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 text-[#A78BFA] text-xs font-bold flex items-center gap-1 hover:bg-[#6C2BD9]/30 transition-all">
                <Download className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
