"use client";

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Plus, RefreshCw, Trash2, Edit, Save, 
  HelpCircle, Sparkles, MessageSquare, AlertCircle, Check
} from 'lucide-react';
import { apiGet, apiPost, apiPut, apiDelete } from '../../../../lib/api';
import Link from 'next/link';

interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  module: string;
  usage_count: number;
  is_active: boolean;
}

interface Suggestion {
  id: string;
  question: string;
  count: number;
  category: string;
}

export default function AdminFAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState('General');
  const [moduleName, setModuleName] = useState('Core');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadFAQData();
  }, []);

  const loadFAQData = async () => {
    setLoading(true);
    try {
      const faqRes = await apiGet('/ai/faq');
      const sugRes = await apiGet('/ai/faq/suggestions');

      if (faqRes.success) setFaqs(faqRes.faqs || []);
      if (sugRes.success) setSuggestions(sugRes.suggestions || []);
    } catch {
      // Sandbox Fallbacks
      setFaqs([
        { id: 'f1', category: 'General', question: 'What is IRIS 365?', answer: 'IRIS 365 is our campus operating system that unifies hostel, library, gym, transit, and canteen facilities.', module: 'Core', usage_count: 342, is_active: true },
        { id: 'f2', category: 'Finance', question: 'How do I pay my semester fees?', answer: 'Navigate to the billing console (/student/fees) or click the "Pay Now" link in your AI chats to pay securely via Razorpay.', module: 'Finance', usage_count: 184, is_active: true },
        { id: 'f3', category: 'Library', question: 'What are the library overdue charges?', answer: 'Overdue library books carry a fine of ₹10 per day, which accumulates under your unpaid fines registry.', module: 'Library', usage_count: 98, is_active: true }
      ]);
      setSuggestions([
        { id: 's1', question: 'How can I register a visitor for hostel block?', count: 47, category: 'Hostel' },
        { id: 's2', question: 'What is the refund policy for canteen wallet?', count: 28, category: 'Canteen' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiPost('/ai/faq', {
        question,
        answer,
        category,
        module: moduleName
      });

      if (res.success) {
        setFaqs(prev => [res.faq, ...prev]);
        resetForm();
        alert('Canonical QA record registered and embedded successfully.');
      }
    } catch {
      // Sandbox mock create
      const mockNew: FAQ = {
        id: `f_mock_${Date.now()}`,
        category,
        question,
        answer,
        module: moduleName,
        usage_count: 0,
        is_active: true
      };
      setFaqs(prev => [mockNew, ...prev]);
      resetForm();
      alert('Canonical QA record registered successfully (MOCKED).');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    try {
      const res = await apiPut(`/ai/faq/${editingId}`, {
        question,
        answer,
        category,
        module: moduleName
      });

      if (res.success) {
        setFaqs(prev => prev.map(f => f.id === editingId ? res.faq : f));
        resetForm();
        alert('FAQ updated successfully.');
      }
    } catch {
      setFaqs(prev => prev.map(f => f.id === editingId ? { ...f, question, answer, category, module: moduleName } : f));
      resetForm();
      alert('FAQ updated successfully (MOCKED).');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;
    try {
      const res = await apiDelete(`/ai/faq/${id}`);
      if (res.success) {
        setFaqs(prev => prev.filter(f => f.id !== id));
      }
    } catch {
      setFaqs(prev => prev.filter(f => f.id !== id));
    }
  };

  const handleEditClick = (faq: FAQ) => {
    setEditingId(faq.id);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setCategory(faq.category);
    setModuleName(faq.module);
    setShowAddForm(true);
  };

  const handleAddSuggestion = (sug: Suggestion) => {
    setQuestion(sug.question);
    setCategory(sug.category);
    setModuleName(sug.category);
    setShowAddForm(true);
    // Remove suggestion from list
    setSuggestions(prev => prev.filter(s => s.id !== sug.id));
  };

  const resetForm = () => {
    setEditingId(null);
    setQuestion('');
    setAnswer('');
    setCategory('General');
    setModuleName('Core');
    setShowAddForm(false);
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24 font-sans">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px]" />
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-3">
            <Link href="/admin/ai" className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-[#C4B5FD]">
              <ArrowLeft className="w-4.5 h-4.5" />
            </Link>
            <div>
              <h1 className="font-extrabold text-2xl lg:text-3xl text-white">FAQ Knowledge Base</h1>
              <p className="text-sm text-[#C4B5FD]/70">Deploy canonical QAs to block unnecessary Claude API costs matching &gt;0.85 similarity</p>
            </div>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={() => { resetForm(); setShowAddForm(true); }}
              className="px-4 py-2.5 bg-[#6C2BD9] hover:bg-[#8B5CF6] transition-all rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add FAQ Entry
            </button>
            <button 
              onClick={loadFAQData}
              className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-[#C4B5FD] transition-all"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 space-y-6">
        
        {/* Weekly auto FAQ suggestions section */}
        {suggestions.length > 0 && (
          <div className="bg-[#1E1B4B]/30 border border-[#8B5CF6]/20 p-5 rounded-3xl space-y-3.5 shadow-xl backdrop-blur-md">
            <h3 className="text-xs font-bold text-[#A78BFA] uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-amber-300 fill-amber-300" /> Auto-FAQ suggestions (Weekly logs cluster)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suggestions.map((sug) => (
                <div 
                  key={sug.id}
                  className="p-4 bg-[#0D0A1A] border border-white/5 rounded-2xl flex justify-between items-center text-xs gap-3"
                >
                  <div className="space-y-1">
                    <p className="font-bold text-white">"{sug.question}"</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] bg-[#6C2BD9]/15 border border-[#8B5CF6]/30 px-2 py-0.5 rounded text-[#C4B5FD] font-bold">
                        {sug.category}
                      </span>
                      <span className="text-[9px] text-[#A78BFA] font-bold">
                        Asked {sug.count} times this week
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAddSuggestion(sug)}
                    className="px-3 py-1.5 bg-[#6C2BD9] hover:bg-[#8B5CF6] transition-all text-[10px] font-bold rounded-xl text-white"
                  >
                    Add Answer
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add/Edit Form Panel */}
        {showAddForm && (
          <div className="bg-[#13102A]/60 p-6 rounded-3xl border border-white/5 shadow-xl space-y-4 max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-extrabold text-sm text-white">
              {editingId ? 'Edit FAQ Ledger Record' : 'Create Canonical FAQ Record'}
            </h3>

            <form onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider">Question text</label>
                <input
                  type="text"
                  placeholder="Enter user query wording..."
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider">Answer canonical markdown response</label>
                <textarea
                  placeholder="Enter response message content. Supports standard markdown, bullet marks and hyperlinks."
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white min-h-[90px] resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider">Category Tag</label>
                  <input
                    type="text"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider">Module Link</label>
                  <select
                    value={moduleName}
                    onChange={e => setModuleName(e.target.value)}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="Core">Core System</option>
                    <option value="Finance">Finance / Fees</option>
                    <option value="Hostel">Hostel Block</option>
                    <option value="Library">Library+</option>
                    <option value="Transit">Transit Routes</option>
                    <option value="Canteen">Canteen Specials</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-[#C4B5FD] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#6C2BD9] hover:bg-[#8B5CF6] rounded-xl text-xs font-bold text-white transition-all flex items-center gap-1"
                >
                  <Save className="w-3.5 h-3.5" /> Save QA
                </button>
              </div>
            </form>
          </div>
        )}

        {/* FAQs Registry List */}
        <div className="bg-[#13102A]/60 p-6 rounded-3xl border border-white/5 shadow-xl space-y-4">
          <div className="flex justify-between items-center border-b border-white/5 pb-2 text-xs font-bold">
            <span>Configured FAQ Knowledge Base</span>
            <span className="text-[#C4B5FD]/60 font-mono font-normal">
              {faqs.length} Canonical matches mapped
            </span>
          </div>

          {loading ? (
            <p className="text-center text-xs text-white/30 py-16">Fetching configured knowledge registers...</p>
          ) : faqs.length === 0 ? (
            <p className="text-center text-xs text-white/25 py-16">No FAQs configured yet. Click Add FAQ to begin.</p>
          ) : (
            <div className="space-y-4">
              {faqs.map((faq) => (
                <div 
                  key={faq.id}
                  className="p-4 bg-[#0D0A1A] border border-white/5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-white/10 transition-all"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] bg-[#6C2BD9]/15 border border-[#8B5CF6]/30 px-2 py-0.5 rounded text-[#C4B5FD] font-bold">
                        {faq.category}
                      </span>
                      <span className="text-[9px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-white/60 font-mono">
                        {faq.module}
                      </span>
                      <h4 className="font-extrabold text-sm text-white">{faq.question}</h4>
                    </div>
                    <p className="text-xs text-[#C4B5FD]/75 leading-relaxed">{faq.answer}</p>
                    <span className="text-[9px] text-[#A78BFA] font-bold block pt-1 font-mono">
                      Matched {faq.usage_count} times dynamically (cost saved)
                    </span>
                  </div>

                  <div className="flex gap-2 self-end md:self-center">
                    <button
                      onClick={() => handleEditClick(faq)}
                      className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-[#C4B5FD]"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(faq.id)}
                      className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-red-500/15 hover:text-red-400 hover:border-red-500/30 transition-all text-white/50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
