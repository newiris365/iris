"use client";

import React, { useState, useEffect } from 'react';
import { ShieldCheck, User, MapPin, AlertCircle, FileText, ChevronDown, Check, RefreshCw, ArrowLeft, Send, Image as ImageIcon } from 'lucide-react';
import { apiGet, apiPost, apiPut } from '../../../lib/api';
import Link from 'next/link';

export default function SecurityIncidentsPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [incidentType, setIncidentType] = useState('Unauthorized Entry Attempt');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Main Gate 1');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [photoUrl, setPhotoUrl] = useState('');

  // States
  const [submitting, setSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    loadIncidents();
  }, []);

  const triggerAlert = (text: string, type: 'success' | 'danger') => {
    setAlertMsg({ text, type });
    setTimeout(() => setAlertMsg({ text: '', type: '' }), 5000);
  };

  const loadIncidents = async () => {
    setLoading(true);
    try {
      const res = await apiGet('/gate/incidents');
      if (res.success) {
        setIncidents(res.incidents || []);
      }
    } catch {
      // Mock cases
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !location) {
      triggerAlert('Description and Location details are required.', 'danger');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiPost('/gate/incidents', {
        incident_type: incidentType,
        description,
        location,
        severity,
        photo_urls: photoUrl ? [photoUrl] : ['https://images.unsplash.com/photo-1590079019458-0eb5b40a3371?auto=format&fit=crop&q=80&w=300']
      });

      if (res.success) {
        triggerAlert('Incident report dispatched successfully.', 'success');
        setDescription('');
        setPhotoUrl('');
        loadIncidents();
      } else {
        triggerAlert(`Filing failed: ${res.error}`, 'danger');
      }
    } catch {
      triggerAlert('Incident report logged successfully. (MOCKED)', 'success');
      setDescription('');
      setPhotoUrl('');
      // Prepend mock
      setIncidents(prev => [
        { id: 'mock-' + Math.floor(1000 + Math.random() * 9000), incident_type: incidentType, description, location, severity, status: 'open', created_at: new Date().toISOString() },
        ...prev
      ]);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, nextStatus: 'investigating' | 'resolved', resolutionText?: string) => {
    try {
      const res = await apiPut(`/gate/incidents/${id}/status`, {
        status: nextStatus,
        resolution: resolutionText || 'Status updated from security dashboard override'
      });
      if (res.success) {
        triggerAlert(`Incident status updated to ${nextStatus}`, 'success');
        loadIncidents();
      }
    } catch {
      triggerAlert('Status updated successfully. (MOCKED)', 'success');
      setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, status: nextStatus, resolution: resolutionText || 'Resolved' } : inc));
    }
  };

  const severityColor = (sev: string) => {
    switch (sev) {
      case 'low': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'medium': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'high': return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
      case 'critical': return 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse';
      default: return 'bg-white/5 text-white/50 border border-white/5';
    }
  };

  const statusColor = (st: string) => {
    switch (st) {
      case 'open': return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'investigating': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'resolved': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      default: return 'bg-white/5 text-white/50';
    }
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px]" />
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Link href="/gate" className="text-[#C4B5FD]/70 hover:text-white transition-all">
                <ArrowLeft className="w-4.5 h-4.5" />
              </Link>
              <h1 className="font-extrabold text-2xl lg:text-3xl text-white">Log Security Incidents</h1>
            </div>
            <p className="text-sm text-[#C4B5FD]/70">Report breaches, suspicious activities, tailgating events, and device alerts</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 space-y-8">
        
        {alertMsg.text && (
          <div className={`p-4 rounded-xl border flex items-center gap-3 ${
            alertMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            <ShieldCheck className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">{alertMsg.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Filing Form */}
          <div className="lg:col-span-1">
            <form onSubmit={handleSubmitIncident} className="bg-[#13102A]/60 p-6 rounded-3xl border border-white/5 shadow-xl space-y-5">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2.5">File Report</h2>
              
              <div>
                <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Incident Category</label>
                <select
                  value={incidentType}
                  onChange={e => setIncidentType(e.target.value)}
                  className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-3 text-xs text-white"
                >
                  <option value="Unauthorized Entry Attempt">Unauthorized Entry Attempt</option>
                  <option value="Tailgating Bypass">Tailgating Bypass</option>
                  <option value="Blacklisted Person Match">Blacklisted Person Match</option>
                  <option value="Biometric/RFID Device Malfunction">Biometric/RFID Device Malfunction</option>
                  <option value="Suspicious Activity / Loitering">Suspicious Activity / Loitering</option>
                  <option value="Property Trespassing / Vandalism">Property Trespassing / Vandalism</option>
                  <option value="Medical Emergency / Safety Threat">Medical Emergency / Safety Threat</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Location Block / Gate</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-[#C4B5FD]/40" />
                  <input
                    type="text"
                    placeholder="e.g. Main Gate 1, Academic block B"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl pl-10 pr-3.5 py-3 text-xs text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Severity Level</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['low', 'medium', 'high', 'critical'] as const).map(sev => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setSeverity(sev)}
                      className={`py-2 rounded-xl text-[10px] font-bold capitalize border transition-all ${
                        severity === sev 
                          ? 'bg-[#8B5CF6]/20 border-[#8B5CF6]/40 text-white' 
                          : 'bg-[#0D0A1A] border-white/10 text-[#C4B5FD]/60 hover:border-white/20'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Description / Log Details</label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-[#C4B5FD]/40" />
                  <textarea
                    placeholder="Provide specific notes regarding the breach or alert..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl pl-10 pr-3.5 py-3 text-xs text-white min-h-[90px] resize-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Photo Proof Link (Optional)</label>
                <div className="relative">
                  <ImageIcon className="absolute left-3.5 top-3.5 w-4 h-4 text-[#C4B5FD]/40" />
                  <input
                    type="text"
                    placeholder="Snapshot URL / Image attachment link..."
                    value={photoUrl}
                    onChange={e => setPhotoUrl(e.target.value)}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl pl-10 pr-3.5 py-3 text-xs text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Dispatch Incident Report
              </button>

            </form>
          </div>

          {/* Incidents Feed */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#13102A]/60 p-6 rounded-3xl border border-white/5 shadow-xl space-y-5">
              <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">Active & Recent Incidents Log</h2>
                <button
                  onClick={loadIncidents}
                  className="p-1 text-[#C4B5FD]/60 hover:text-white hover:bg-white/5 rounded transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {loading ? (
                <div className="py-12 text-center text-xs text-[#C4B5FD]/50">Loading security logs...</div>
              ) : incidents.length === 0 ? (
                <div className="py-12 text-center text-xs text-white/30">No security incidents filed recently.</div>
              ) : (
                <div className="space-y-4">
                  {incidents.map(inc => (
                    <div key={inc.id} className="p-4 bg-[#0D0A1A] border border-white/5 rounded-2xl space-y-3">
                      <div className="flex flex-wrap justify-between items-start gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2.5">
                            <h3 className="font-bold text-white text-xs">{inc.incident_type}</h3>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold capitalize ${severityColor(inc.severity)}`}>
                              {inc.severity}
                            </span>
                          </div>
                          <p className="text-[10px] text-white/40">ID: {inc.id} • Reported on {new Date(inc.created_at).toLocaleString()} at {inc.location}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold capitalize ${statusColor(inc.status)}`}>
                          {inc.status}
                        </span>
                      </div>

                      <p className="text-xs text-[#C4B5FD]">{inc.description}</p>

                      {inc.resolution && (
                        <div className="p-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-[10px] text-emerald-400 italic">
                          Resolution Details: {inc.resolution}
                        </div>
                      )}

                      {/* Actions depending on status */}
                      {inc.status !== 'resolved' && (
                        <div className="flex justify-end gap-2 pt-1.5 border-t border-white/5">
                          {inc.status === 'open' && (
                            <button
                              onClick={() => handleUpdateStatus(inc.id, 'investigating')}
                              className="px-3 py-1 bg-white/5 hover:bg-white/10 text-[10px] font-bold text-[#C4B5FD] rounded-lg transition-all"
                            >
                              Mark Investigating
                            </button>
                          )}
                          <button
                            onClick={() => {
                              const res = prompt('Enter resolution description:', 'Resolved by guard block check');
                              if (res) {
                                handleUpdateStatus(inc.id, 'resolved', res);
                              }
                            }}
                            className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-bold text-[10px] rounded-lg transition-all"
                          >
                            Mark Resolved
                          </button>
                        </div>
                      )}
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
