"use client";

import React, { useState, useEffect } from 'react';
import { Search, UserPlus, ShieldAlert, Trash2, ArrowLeft, RefreshCw, Phone, FileText } from 'lucide-react';
import { apiGet, apiPost, apiDelete } from '../../../../lib/api';
import Link from 'next/link';

export default function AdminBlacklistManagementPage() {
  const [blacklist, setBlacklist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [reason, setReason] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  // Action states
  const [submitting, setSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    loadBlacklist();
  }, []);

  const triggerAlert = (text: string, type: 'success' | 'danger') => {
    setAlertMsg({ text, type });
    setTimeout(() => setAlertMsg({ text: '', type: '' }), 5000);
  };

  const loadBlacklist = async () => {
    setLoading(true);
    try {
      const res = await apiGet('/gate/blacklist');
      if (res.success) {
        setBlacklist(res.blacklist || []);
      }
    } catch {
      // Mock Fallbacks
      setBlacklist([
        { id: 'bl-1', name: 'Suresh Singhania', phone: '+91 98765 43222', id_number: 'Aadhaar: 228844991100', reason: 'Suspicious activity near hostel block last semester', added_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString() },
        { id: 'bl-2', name: 'Rakesh Yadav', phone: '+91 91234 56789', id_number: 'Driving License: DL-10029', reason: 'Attempted laptop theft from parking lot block', added_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBlacklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !reason) {
      triggerAlert('Name, Phone and Reason are required.', 'danger');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiPost('/gate/blacklist', {
        name,
        phone,
        id_number: idNumber,
        reason,
        photo_url: photoUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=200'
      });

      if (res.success) {
        triggerAlert('Person successfully blacklisted.', 'success');
        setName('');
        setPhone('');
        setIdNumber('');
        setReason('');
        setPhotoUrl('');
        loadBlacklist();
      } else {
        triggerAlert(`Failed: ${res.error}`, 'danger');
      }
    } catch {
      triggerAlert('Person blacklisted successfully. (MOCKED)', 'success');
      setBlacklist(prev => [
        { id: 'mock-' + Math.floor(100 + Math.random() * 900), name, phone, id_number: idNumber, reason, added_at: new Date().toISOString() },
        ...prev
      ]);
      setName('');
      setPhone('');
      setIdNumber('');
      setReason('');
      setPhotoUrl('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveBlacklist = async (id: string) => {
    if (!confirm('Are you sure you want to remove this person from the blacklist?')) return;

    try {
      const res = await apiDelete(`/gate/blacklist/${id}`);
      if (res.success) {
        triggerAlert('Removed from blacklist.', 'success');
        loadBlacklist();
      }
    } catch {
      triggerAlert('Removed from blacklist. (MOCKED)', 'success');
      setBlacklist(prev => prev.filter(item => item.id !== id));
    }
  };

  const filteredBlacklist = blacklist.filter(item => 
    item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.reason?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px]" />
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Link href="/admin/gate" className="text-[#C4B5FD]/70 hover:text-white transition-all">
                <ArrowLeft className="w-4.5 h-4.5" />
              </Link>
              <h1 className="font-extrabold text-2xl lg:text-3xl text-white">Blacklist Registry</h1>
            </div>
            <p className="text-sm text-[#C4B5FD]/70">Add and manage profiles of blacklisted individuals to automatically block their entry attempts</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 space-y-8">
        
        {alertMsg.text && (
          <div className={`p-4 rounded-xl border flex items-center gap-3 ${
            alertMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            <ShieldAlert className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">{alertMsg.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Blacklist Addition Form */}
          <div className="lg:col-span-1">
            <form onSubmit={handleAddBlacklist} className="bg-[#13102A]/60 p-6 rounded-3xl border border-white/5 shadow-xl space-y-4">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2.5 flex items-center gap-1.5 text-red-400">
                <ShieldAlert className="w-4.5 h-4.5" /> Blacklist Profile
              </h2>

              <div>
                <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Suresh Singhania"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3.5 py-3 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Phone Number (Checks Scans)</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-[#C4B5FD]/40" />
                  <input
                    type="text"
                    placeholder="e.g. +91 98765 43222"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl pl-10 pr-3.5 py-3 text-xs text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Govt ID Reference (Optional)</label>
                <input
                  type="text"
                  placeholder="Aadhaar / DL Reference number"
                  value={idNumber}
                  onChange={e => setIdNumber(e.target.value)}
                  className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3.5 py-3 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Reason for Blacklisting</label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-[#C4B5FD]/40" />
                  <textarea
                    placeholder="Provide specific incident description or reason..."
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl pl-10 pr-3.5 py-3 text-xs text-white min-h-[80px] resize-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Photo URL (Optional)</label>
                <input
                  type="text"
                  placeholder="Reference photo link..."
                  value={photoUrl}
                  onChange={e => setPhotoUrl(e.target.value)}
                  className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3.5 py-3 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Add Profile to Blacklist
              </button>

            </form>
          </div>

          {/* Blacklist List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#13102A]/60 p-6 rounded-3xl border border-white/5 shadow-xl space-y-5">
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-white/5 pb-4">
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">Blacklisted Profiles Registry</h2>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-[#C4B5FD]/40" />
                  <input
                    type="text"
                    placeholder="Search blocked lists..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white"
                  />
                </div>
              </div>

              {loading ? (
                <div className="py-12 text-center text-xs text-white/30">Loading blacklist...</div>
              ) : filteredBlacklist.length === 0 ? (
                <div className="py-12 text-center text-xs text-white/20">No matching blacklisted profiles found.</div>
              ) : (
                <div className="space-y-4">
                  {filteredBlacklist.map(item => (
                    <div key={item.id} className="p-4 bg-[#0D0A1A] border border-white/5 rounded-2xl flex justify-between items-start gap-4 hover:border-red-500/20 transition-all">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-xs text-white">{item.name}</h3>
                          <span className="text-[9px] text-red-400 font-semibold font-mono">{item.phone}</span>
                        </div>
                        {item.id_number && (
                          <p className="text-[10px] text-white/40 font-mono">{item.id_number}</p>
                        )}
                        <p className="text-xs text-[#C4B5FD] bg-red-500/[0.02] border border-red-500/5 p-2 rounded-xl">
                          <strong>Reason:</strong> {item.reason}
                        </p>
                        <p className="text-[8px] text-white/20">Added on: {new Date(item.added_at).toLocaleDateString()}</p>
                      </div>
                      
                      <button
                        onClick={() => handleRemoveBlacklist(item.id)}
                        className="p-2 hover:bg-white/5 rounded-xl text-white/50 hover:text-red-400 transition-all"
                        title="Remove from blacklist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
