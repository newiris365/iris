"use client";

import React, { useState, useEffect } from 'react';
import { BookOpen, Download, Search } from 'lucide-react';
import { apiGet } from '../../../lib/api';

interface Material {
  id: string;
  title: string;
  subject: string;
  category: string;
  file_url: string;
  file_type: string;
  download_count: number;
  uploaded_by_name: string;
  created_at: string;
}

const CATEGORIES = ['All', 'Notes', 'Lab Manual', 'Textbook', 'Video', 'PPT', 'Question Bank', 'Syllabus'];

export default function FacultyStudyMaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiGet('campusCore/study-materials');
        if (res.success) setMaterials(res.materials || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const filtered = materials.filter(m =>
    (category === 'All' || m.category === category) &&
    (!search || m.title.toLowerCase().includes(search.toLowerCase()) || m.subject?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <BookOpen size={24} className="text-blue-400" />
        Study Materials
      </h1>

      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            placeholder="Search materials..." />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${category === c ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">No materials found.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(m => (
            <div key={m.id} className="bg-white/5 rounded-xl p-4 border border-white/10 flex items-center gap-4 hover:border-blue-500/30 transition-all">
              <div className="text-2xl">{m.file_type === 'pdf' ? '📄' : m.file_type === 'mp4' ? '🎥' : '📁'}</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{m.title}</p>
                <p className="text-xs text-slate-400">{m.subject} · {m.category} · {m.uploaded_by_name}</p>
              </div>
              <span className="text-xs text-slate-400">{m.download_count} downloads</span>
              <button className="px-3 py-2 rounded-lg bg-blue-600/20 text-blue-400 text-xs hover:bg-blue-600/30">
                <Download size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
