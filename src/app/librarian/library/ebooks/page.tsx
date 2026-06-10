"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Search, Plus, Sparkles, AlertCircle, CheckCircle, FileText, Download, Eye } from 'lucide-react';
import { apiGet, apiPost } from '../../../../lib/api';
import Link from 'next/link';

export default function LibrarianEbooksPage() {
  const [ebooks, setEbooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const [form, setForm] = useState({
    title: '',
    author: '',
    category: 'Syllabus Note',
    department: 'CSE',
    semester: '4',
    description: '',
    file_url: '',
    cover_url: '',
    file_size_mb: 5,
    tags: [] as string[],
    access_level: 'all'
  });

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadEbooks();
  }, []);

  const loadEbooks = async () => {
    try {
      const res = await apiGet('/library/ebooks');
      if (res.success) {
        setEbooks(res.ebooks || []);
      }
    } catch {
      // Mock Fallbacks
      setEbooks([
        { id: 'eb1', title: 'Algorithms Design Manual', author: 'Steven S. Skiena', category: 'Textbook', department: 'CSE', semester: '4', download_count: 42, view_count: 120, file_size_mb: 4.8 },
        { id: 'eb2', title: 'Compilers: Principles, Techniques, & Tools', author: 'Alfred V. Aho', category: 'Textbook', department: 'CSE', semester: '5', download_count: 19, view_count: 89, file_size_mb: 12.3 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.file_url.trim()) {
      setErrorMsg('Book Title and File Download URL are required.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await apiPost('/library/ebooks', form);
      if (res.success) {
        setSuccessMsg('Digital resource registered successfully.');
        setShowAddForm(false);
        setForm({
          title: '', author: '', category: 'Syllabus Note', department: 'CSE', semester: '4',
          description: '', file_url: '', cover_url: '', file_size_mb: 5, tags: [], access_level: 'all'
        });
        loadEbooks();
      } else {
        setErrorMsg(res.error || 'Failed to create ebook.');
      }
    } catch {
      // Mock Success
      const mockEbook = {
        id: 'mock-eb-' + Math.random(),
        download_count: 0,
        view_count: 0,
        ...form
      };
      setEbooks([mockEbook, ...ebooks]);
      setSuccessMsg('Digital resource registered successfully! (Mock Mode)');
      setShowAddForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px]" />
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/librarian/library" className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-[#C4B5FD]/70 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="font-extrabold text-xl">E-Resource portal Manager</h1>
              <p className="text-[10px] text-[#C4B5FD]/50">Configure syllabus notes, upload textbooks, and track downloads</p>
            </div>
          </div>

          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white transition-all shadow flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Digital Resource
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8">
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 mb-6">
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 mb-6">
            {errorMsg}
          </div>
        )}

        {/* Add Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-[#0D0A1A]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-[#13102A] p-6 max-w-lg w-full space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#A78BFA]" /> Upload E-Resource
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-1">Resource Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Compiler design class notes"
                      value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-2 text-xs text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-1">Author / Staff</label>
                    <input
                      type="text"
                      placeholder="e.g. Prof. Alfred Aho"
                      value={form.author}
                      onChange={e => setForm({ ...form, author: e.target.value })}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-1">Category</label>
                    <select
                      value={form.category}
                      onChange={e => setForm({ ...form, category: e.target.value })}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white"
                    >
                      <option value="Syllabus Note">Syllabus Note</option>
                      <option value="Textbook">Textbook</option>
                      <option value="Research Paper">Research Paper</option>
                      <option value="Question Paper">Question Paper</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-1">Department</label>
                    <input
                      type="text"
                      placeholder="e.g. CSE"
                      value={form.department}
                      onChange={e => setForm({ ...form, department: e.target.value })}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-1">Semester</label>
                    <input
                      type="text"
                      placeholder="e.g. 4"
                      value={form.semester}
                      onChange={e => setForm({ ...form, semester: e.target.value })}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-1">Document File URL</label>
                    <input
                      type="text"
                      placeholder="e.g. https://supabase.co/storage/file.pdf"
                      value={form.file_url}
                      onChange={e => setForm({ ...form, file_url: e.target.value })}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-2 text-xs text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-1">File Size (MB)</label>
                    <input
                      type="number"
                      value={form.file_size_mb}
                      onChange={e => setForm({ ...form, file_size_mb: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-1">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Short description summary..."
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold transition-all shadow flex items-center justify-center"
                >
                  {submitting ? 'Registering...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* List index */}
        <h2 className="text-sm font-bold text-[#C4B5FD]/80 mb-4">Active digital resources</h2>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-2 border-[#6C2BD9] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="rounded-3xl border border-white/5 bg-[#13102A]/60 overflow-hidden shadow-xl">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-white/5 bg-white/5 text-[9px] text-[#C4B5FD]/50 font-bold uppercase tracking-wider">
                  <th className="p-4">Resource Details</th>
                  <th className="p-4">Size</th>
                  <th className="p-4">Class Target</th>
                  <th className="p-4 text-center"><Eye className="w-4 h-4 mx-auto" /> Views</th>
                  <th className="p-4 text-center"><Download className="w-4 h-4 mx-auto" /> Downloads</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-[#C4B5FD]/80">
                {ebooks.map(eb => (
                  <tr key={eb.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-white">{eb.title}</p>
                      <p className="text-[10px] text-[#C4B5FD]/50 mt-0.5">{eb.author} • {eb.category}</p>
                    </td>
                    <td className="p-4 font-mono">{eb.file_size_mb ? `${eb.file_size_mb} MB` : '—'}</td>
                    <td className="p-4 font-semibold text-[#A78BFA]">{eb.department} Sem {eb.semester}</td>
                    <td className="p-4 text-center font-bold text-white">{eb.view_count || 0}</td>
                    <td className="p-4 text-center font-bold text-white">{eb.download_count || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
