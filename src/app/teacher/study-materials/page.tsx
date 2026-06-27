"use client";

import React, { useState, useEffect } from 'react';
import { Search, Upload, FileText, Download, Trash2, Plus, X, Filter, BookOpen, Video, Presentation, FileQuestion } from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
  'Question Bank': '❓', PPT: '📊', Syllabus: '📋', Other: '📁',
};

const MOCK_MATERIALS: Material[] = [
  { id: '1', title: 'Data Structures - Chapter 1 Notes', description: 'Introduction to arrays, linked lists, and basic data structures', subject: 'Data Structures', file_url: '#', file_name: 'ds_ch1.pdf', file_type: 'pdf', file_size_kb: 2048, category: 'Notes', semester: 3, download_count: 45, uploaded_by_name: 'Prof. Sharma', created_at: '2026-05-10' },
  { id: '2', title: 'DBMS Lab Manual', description: 'Complete lab exercises for database management systems course', subject: 'DBMS', file_url: '#', file_name: 'dbms_lab.pdf', file_type: 'pdf', file_size_kb: 5120, category: 'Lab Manual', semester: 4, download_count: 78, uploaded_by_name: 'Prof. Sharma', created_at: '2026-05-08' },
  { id: '3', title: 'Operating Systems - Video Lecture 1', description: 'Process management and CPU scheduling overview', subject: 'Operating Systems', file_url: '#', file_name: 'os_lecture1.mp4', file_type: 'mp4', file_size_kb: 153600, category: 'Video', semester: 4, download_count: 112, uploaded_by_name: 'Prof. Sharma', created_at: '2026-05-06' },
  { id: '4', title: 'Computer Networks PPT', description: 'OSI model and TCP/IP protocol stack presentation', subject: 'Computer Networks', file_url: '#', file_name: 'cn_osi_model.pptx', file_type: 'pptx', file_size_kb: 3072, category: 'PPT', semester: 5, download_count: 33, uploaded_by_name: 'Prof. Mehta', created_at: '2026-05-04' },
  { id: '5', title: 'Mathematics - Question Bank', description: 'Previous year questions and practice problems for mid-term', subject: 'Mathematics', file_url: '#', file_name: 'math_qb.pdf', file_type: 'pdf', file_size_kb: 1024, category: 'Question Bank', semester: 2, download_count: 201, uploaded_by_name: 'Prof. Sharma', created_at: '2026-04-28' },
  { id: '6', title: 'Semester 5 Syllabus', description: 'Complete syllabus for all subjects in semester 5', subject: 'General', file_url: '#', file_name: 'sem5_syllabus.pdf', file_type: 'pdf', file_size_kb: 512, category: 'Syllabus', semester: 5, download_count: 89, uploaded_by_name: 'Prof. Sharma', created_at: '2026-04-20' },
  { id: '7', title: 'OOP with Java Textbook', description: 'Reference textbook covering object-oriented programming concepts', subject: 'OOP', file_url: '#', file_name: 'oop_java.pdf', file_type: 'pdf', file_size_kb: 8192, category: 'Textbook', semester: 3, download_count: 156, uploaded_by_name: 'Prof. Sharma', created_at: '2026-04-15' },
  { id: '8', title: 'Web Development Project Guide', description: 'Step-by-step guide for the semester-end web development project', subject: 'Web Development', file_url: '#', file_name: 'web_guide.pdf', file_type: 'pdf', file_size_kb: 1536, category: 'Other', semester: 6, download_count: 67, uploaded_by_name: 'Prof. Sharma', created_at: '2026-04-10' },
];

export default function TeacherStudyMaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: '', subject: '', category: 'Notes', description: '', semester: '3', file: null as File | null });
  const [uploading, setUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await apiGet('/core/study-materials');
      if (res.success && res.materials?.length > 0) {
        setMaterials(res.materials);
      } else {
        setMaterials(MOCK_MATERIALS);
      }
    } catch {
      setMaterials(MOCK_MATERIALS);
    } finally {
      setLoading(false);
    }
  };

  const filtered = materials.filter(m => {
    if (category !== 'All' && m.category !== category) return false;
    if (search && !m.title.toLowerCase().includes(search.toLowerCase()) && !m.subject?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const formatSize = (kb: number) => {
    if (kb > 1024) return `${(kb / 1024).toFixed(1)} MB`;
    return `${kb} KB`;
  };

  const handleUpload = async () => {
    if (!uploadForm.title || !uploadForm.subject || !uploadForm.file) return;
    setUploading(true);
    try {
      const fileExt = uploadForm.file.name.split('.').pop();
      const fileName = `study-materials/${Date.now()}_${uploadForm.file.name}`;
      const { data: storageData, error: storageError } = await supabase.storage
        .from('study-materials')
        .upload(fileName, uploadForm.file);

      console.log('Storage upload result:', storageData, storageError);

      if (storageError) throw new Error('File upload failed: ' + storageError.message);

      const { data: urlData } = supabase.storage
        .from('study-materials')
        .getPublicUrl(fileName);

      const file_url = urlData.publicUrl;
      console.log('Public URL:', file_url);

      const res = await apiPost('campusCore/study-materials', {
        title: uploadForm.title,
        subject: uploadForm.subject,
        category: uploadForm.category,
        description: uploadForm.description,
        semester: parseInt(uploadForm.semester),
        file_name: uploadForm.file.name,
        file_size_kb: Math.round(uploadForm.file.size / 1024),
        file_type: fileExt,
        file_url: file_url,
      });

      console.log('API response:', res);

      if (res.success) {
        loadData();
        setShowUploadModal(false);
        setUploadForm({ title: '', subject: '', category: 'Notes', description: '', semester: '3', file: null });
      }
    } catch (err: any) {
      console.error(err);
      const newMaterial: Material = {
        id: Date.now().toString(),
        title: uploadForm.title,
        subject: uploadForm.subject,
        category: uploadForm.category,
        description: uploadForm.description,
        semester: parseInt(uploadForm.semester),
        file_url: '#',
        file_name: uploadForm.file?.name || '',
        file_type: uploadForm.file?.name.split('.').pop() || 'pdf',
        file_size_kb: Math.round((uploadForm.file?.size || 0) / 1024),
        download_count: 0,
        uploaded_by_name: 'You',
        created_at: new Date().toISOString().split('T')[0],
      };
      setMaterials(prev => [newMaterial, ...prev]);
      setShowUploadModal(false);
      setUploadForm({ title: '', subject: '', category: 'Notes', description: '', semester: '3', file: null });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiPost(`/core/study-materials/${id}/delete`, {});
    } catch { /* ignore */ }
    setMaterials(prev => prev.filter(m => m.id !== id));
    setDeleteConfirm(null);
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-[#A78BFA]" />
            </div>
            <div>
              <h1 className="font-heading font-extrabold text-2xl">Study Materials</h1>
              <p className="text-xs text-[#C4B5FD]/70 font-light">Upload and manage course materials for students</p>
            </div>
          </div>
          <button onClick={() => setShowUploadModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#7C3AED] text-white text-xs font-bold flex items-center gap-2 transition-all">
            <Upload className="w-4 h-4" /> Upload Material
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#C4B5FD]/40" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#13102A] border border-[#6C2BD9]/30 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none focus:border-[#8B5CF6]"
              placeholder="Search by title or subject..." />
          </div>
          <div className="text-[10px] text-[#C4B5FD]/50">{filtered.length} material{filtered.length !== 1 ? 's' : ''}</div>
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
            <div key={m.id} className="glass-panel rounded-2xl p-5 border border-white/5 hover:border-[#6C2BD9]/30 transition-all">
              <div className="flex items-center gap-4">
                <div className="text-2xl">{CATEGORY_ICONS[m.category] || '📁'}</div>
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
                <div className="flex items-center gap-2 flex-shrink-0">
                  {deleteConfirm === m.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleDelete(m.id)}
                        className="px-2 py-1 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-bold hover:bg-red-500/30 transition-all">
                        Confirm
                      </button>
                      <button onClick={() => setDeleteConfirm(null)}
                        className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[#C4B5FD]/60 text-[10px] font-bold hover:text-white transition-all">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <button onClick={() => {
                        if (!m.file_url || m.file_url === '#') {
                          alert('No file available for download.');
                          return;
                        }
                        const link = document.createElement('a');
                        link.href = m.file_url;
                        link.download = m.title || 'download';
                        link.target = '_blank';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                        className="p-2 rounded-xl bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 text-[#A78BFA] hover:bg-[#6C2BD9]/30 transition-all">
                        <Download className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteConfirm(m.id)}
                        className="p-2 rounded-xl bg-white/5 border border-white/10 text-red-400/60 hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-400 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats bar */}
        <div className="glass-panel rounded-2xl p-5 border border-white/5">
          <div className="flex justify-between text-[10px] text-[#C4B5FD]/50">
            <span>Total Materials: <span className="text-white font-bold">{materials.length}</span></span>
            <span>Total Downloads: <span className="text-white font-bold">{materials.reduce((a, m) => a + m.download_count, 0)}</span></span>
            <span>Storage Used: <span className="text-white font-bold">{formatSize(materials.reduce((a, m) => a + m.file_size_kb, 0))}</span></span>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#13102A] border border-[#6C2BD9]/30 rounded-2xl p-6 w-full max-w-lg flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-extrabold text-lg">Upload Material</h2>
              <button onClick={() => setShowUploadModal(false)} className="text-[#C4B5FD]/40 hover:text-white transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] text-[#C4B5FD]/60 font-bold mb-1 block">Title *</label>
                <input value={uploadForm.title} onChange={e => setUploadForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full bg-[#0D0A1A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#8B5CF6]"
                  placeholder="Enter material title" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-[#C4B5FD]/60 font-bold mb-1 block">Subject *</label>
                  <input value={uploadForm.subject} onChange={e => setUploadForm(p => ({ ...p, subject: e.target.value }))}
                    className="w-full bg-[#0D0A1A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#8B5CF6]"
                    placeholder="e.g. Data Structures" />
                </div>
                <div>
                  <label className="text-[10px] text-[#C4B5FD]/60 font-bold mb-1 block">Semester</label>
                  <select value={uploadForm.semester} onChange={e => setUploadForm(p => ({ ...p, semester: e.target.value }))}
                    className="w-full bg-[#0D0A1A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#8B5CF6]">
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[#C4B5FD]/60 font-bold mb-1 block">Category</label>
                <div className="flex gap-2 flex-wrap">
                  {CATEGORIES.filter(c => c !== 'All').map(c => (
                    <button key={c} onClick={() => setUploadForm(p => ({ ...p, category: c }))}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                        uploadForm.category === c
                          ? 'bg-[#6C2BD9]/30 border border-[#6C2BD9]/50 text-white'
                          : 'bg-white/5 border border-white/10 text-[#C4B5FD]/60 hover:text-white'
                      }`}>
                      {CATEGORY_ICONS[c]} {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[#C4B5FD]/60 font-bold mb-1 block">Description</label>
                <textarea value={uploadForm.description} onChange={e => setUploadForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full bg-[#0D0A1A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#8B5CF6] resize-none h-20"
                  placeholder="Brief description of the material" />
              </div>

              <div>
                <label className="text-[10px] text-[#C4B5FD]/60 font-bold mb-1 block">File *</label>
                <label className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-[#6C2BD9]/30 bg-[#0D0A1A] cursor-pointer hover:border-[#8B5CF6] transition-all">
                  <Upload className="w-5 h-5 text-[#A78BFA]" />
                  <div className="flex-1">
                    {uploadForm.file ? (
                      <span className="text-xs text-white">{uploadForm.file.name} ({formatSize(Math.round(uploadForm.file.size / 1024))})</span>
                    ) : (
                      <span className="text-xs text-[#C4B5FD]/40">Click to select file (PDF, PPTX, MP4, etc.)</span>
                    )}
                  </div>
                  <input type="file" className="hidden" onChange={e => setUploadForm(p => ({ ...p, file: e.target.files?.[0] || null }))} />
                </label>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[#C4B5FD]/60 text-xs font-bold hover:text-white transition-all">
                Cancel
              </button>
              <button onClick={handleUpload} disabled={uploading || !uploadForm.title || !uploadForm.subject || !uploadForm.file}
                className="px-4 py-2 rounded-xl bg-[#6C2BD9] hover:bg-[#7C3AED] text-white text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                {uploading ? (
                  <span className="animate-pulse">Uploading...</span>
                ) : (
                  <><Upload className="w-4 h-4" /> Upload</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
