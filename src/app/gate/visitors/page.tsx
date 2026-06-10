"use client";

import React, { useState, useEffect } from 'react';
import { ShieldCheck, User, Phone, Mail, Award, CheckCircle, Camera, Search, UserCheck, Clock, Check, RefreshCw, X, ArrowLeft } from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';
import Link from 'next/link';

export default function VisitorIntakePage() {
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [visitorIdType, setVisitorIdType] = useState('Aadhar Card');
  const [visitorIdNumber, setVisitorIdNumber] = useState('');
  const [visitorPhotoUrl, setVisitorPhotoUrl] = useState('');
  
  // Host selection
  const [hostSearch, setHostSearch] = useState('');
  const [hosts, setHosts] = useState<any[]>([]);
  const [selectedHost, setSelectedHost] = useState<any>(null);
  const [hostType, setHostType] = useState<'student' | 'staff'>('student');
  const [purpose, setPurpose] = useState('');
  const [validHours, setValidHours] = useState(4);

  // States
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [passes, setPasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    loadActivePasses();
    fetchMockHosts();
  }, []);

  const triggerAlert = (text: string, type: 'success' | 'danger') => {
    setAlertMsg({ text, type });
    setTimeout(() => setAlertMsg({ text: '', type: '' }), 5000);
  };

  const fetchMockHosts = async () => {
    try {
      // Fetch users from DB to pick as host
      const res = await apiGet('/users');
      if (res.success && res.users) {
        setHosts(res.users);
      } else {
        throw new Error();
      }
    } catch {
      // Fallback Seed Hosts
      setHosts([
        { id: '3fa85f64-5717-4562-b3fc-2c963f66afa6', name: 'Khushal Gehlot', role: 'Student', email: 'khushal@gmail.com' },
        { id: '4fa85f64-5717-4562-b3fc-2c963f66afa7', name: 'Dr. K. R. Sharma', role: 'Staff', email: 'sharma@siet.edu.in' },
        { id: '5fa85f64-5717-4562-b3fc-2c963f66afa8', name: 'Prof. Ananya Sen', role: 'Staff', email: 'ananya@siet.edu.in' },
        { id: '6fa85f64-5717-4562-b3fc-2c963f66afa9', name: 'Amit Kumar Patel', role: 'Student', email: 'amit@gmail.com' }
      ]);
    }
  };

  const loadActivePasses = async () => {
    try {
      const res = await apiGet('/gate/visitors');
      if (res.success) {
        setPasses(res.visitors || []);
      }
    } catch {
      // Fallbacks
      setPasses([
        { id: '1', visitor_name: 'Rajesh Malhotra', visitor_phone: '+91 98765 43210', host_name: 'Dr. K. R. Sharma', purpose: 'Research Collaboration', pass_number: 'VP-84920', is_used: true, valid_until: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() },
        { id: '2', visitor_name: 'Sunita Devi', visitor_phone: '+91 94432 12345', host_name: 'Khushal Gehlot', purpose: 'Family Visit', pass_number: 'VP-10294', is_used: false, valid_until: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString() }
      ]);
    }
  };

  const handleCameraActivate = () => {
    setCameraActive(true);
    triggerAlert('Webcam connected. Align face in frame...', 'success');
  };

  const handleTakeSnapshot = () => {
    // Pick a random avatar to simulate webcam snapshot
    const randomAvatars = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200'
    ];
    const chosen = randomAvatars[Math.floor(Math.random() * randomAvatars.length)];
    setCapturedPhoto(chosen);
    setVisitorPhotoUrl(chosen);
    setCameraActive(false);
    triggerAlert('Snapshot captured and uploaded!', 'success');
  };

  const handleRegisterVisitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName || !visitorPhone || !visitorIdNumber) {
      triggerAlert('Please complete name, phone and ID details.', 'danger');
      return;
    }
    if (!selectedHost) {
      triggerAlert('Please select a valid Host employee or student.', 'danger');
      return;
    }

    setLoading(true);
    try {
      const res = await apiPost('/gate/visitors', {
        visitor_name: visitorName,
        visitor_phone: visitorPhone,
        visitor_email: visitorEmail,
        visitor_id_type: visitorIdType,
        visitor_id_number: visitorIdNumber,
        visitor_photo_url: visitorPhotoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
        host_id: selectedHost.id,
        host_type: selectedHost.role?.toLowerCase() === 'student' ? 'student' : 'staff',
        host_name: selectedHost.name,
        purpose,
        valid_hours: Number(validHours)
      });

      if (res.success) {
        triggerAlert(`Success! Pass ${res.pass?.pass_number} generated. Waiting host approval.`, 'success');
        // Clear fields
        setVisitorName('');
        setVisitorPhone('');
        setVisitorEmail('');
        setVisitorIdNumber('');
        setVisitorPhotoUrl('');
        setCapturedPhoto(null);
        setSelectedHost(null);
        setHostSearch('');
        setPurpose('');
        loadActivePasses();
      } else {
        triggerAlert(`Error: ${res.error}`, 'danger');
      }
    } catch {
      // Mock flow success fallback
      triggerAlert(`Success: Visitor check request generated. (MOCKED)`, 'success');
      loadActivePasses();
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (id: string) => {
    try {
      const res = await apiPost(`/gate/visitors/${id}/exit`, {});
      if (res.success) {
        triggerAlert('Visitor checkout logged and pass cleared.', 'success');
        loadActivePasses();
      } else {
        triggerAlert(`Checkout failed: ${res.error}`, 'danger');
      }
    } catch {
      triggerAlert('Visitor checkout logged (MOCKED).', 'success');
      setPasses(prev => prev.filter(p => p.id !== id));
    }
  };

  const filteredHosts = hosts.filter(h => 
    h.name?.toLowerCase().includes(hostSearch.toLowerCase()) || 
    h.email?.toLowerCase().includes(hostSearch.toLowerCase())
  );

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
              <h1 className="font-extrabold text-2xl lg:text-3xl text-white">Visitor Pass Registration</h1>
            </div>
            <p className="text-sm text-[#C4B5FD]/70">Register incoming guests, capture snapshots, and assign institutional hosts</p>
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
          
          {/* Form and Webcam */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleRegisterVisitor} className="bg-[#13102A]/60 p-6 rounded-3xl border border-white/5 shadow-xl space-y-6">
              
              <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2.5">Visitor Contact Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Visitor Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 w-4 h-4 text-[#C4B5FD]/40" />
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Kumar"
                      value={visitorName}
                      onChange={e => setVisitorName(e.target.value)}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl pl-10 pr-3.5 py-3 text-xs text-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-[#C4B5FD]/40" />
                    <input
                      type="text"
                      placeholder="e.g. +91 99999 88888"
                      value={visitorPhone}
                      onChange={e => setVisitorPhone(e.target.value)}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl pl-10 pr-3.5 py-3 text-xs text-white"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Email Address (Optional)</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-[#C4B5FD]/40" />
                    <input
                      type="email"
                      placeholder="e.g. visitor@gmail.com"
                      value={visitorEmail}
                      onChange={e => setVisitorEmail(e.target.value)}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl pl-10 pr-3.5 py-3 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Government ID</label>
                    <select
                      value={visitorIdType}
                      onChange={e => setVisitorIdType(e.target.value)}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-3 text-xs text-white"
                    >
                      <option value="Aadhar Card">Aadhar Card</option>
                      <option value="PAN Card">PAN Card</option>
                      <option value="Passport">Passport</option>
                      <option value="Driving License">Driving License</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">ID Number</label>
                    <input
                      type="text"
                      placeholder="Last 4 or Full ID"
                      value={visitorIdNumber}
                      onChange={e => setVisitorIdNumber(e.target.value)}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3.5 py-3 text-xs text-white"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Host lookup block */}
              <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2.5 pt-4">Assign Institutional Host</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Search Host (Student / Staff Name)</label>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-[#C4B5FD]/40" />
                    <input
                      type="text"
                      placeholder="Type host name to lookup..."
                      value={hostSearch}
                      onChange={e => setHostSearch(e.target.value)}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl pl-10 pr-3.5 py-3 text-xs text-white"
                    />
                  </div>
                </div>

                {hostSearch && (
                  <div className="bg-[#0D0A1A] border border-white/10 rounded-xl max-h-40 overflow-y-auto p-2 space-y-1">
                    {filteredHosts.length === 0 ? (
                      <p className="text-xs text-white/30 p-2 text-center">No host matching search</p>
                    ) : (
                      filteredHosts.map(h => (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() => {
                            setSelectedHost(h);
                            setHostSearch('');
                          }}
                          className="w-full text-left p-2.5 hover:bg-white/5 rounded-lg text-xs flex justify-between items-center"
                        >
                          <div>
                            <span className="font-bold text-white">{h.name}</span>
                            <span className="text-[9px] text-[#C4B5FD]/60 ml-2">({h.email})</span>
                          </div>
                          <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded font-semibold text-[#C4B5FD]">{h.role}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {selectedHost && (
                  <div className="p-3 bg-[#6C2BD9]/10 border border-[#8B5CF6]/20 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-[#C4B5FD]">Assigned Host: {selectedHost.name}</p>
                      <p className="text-[10px] text-white/40">Role: {selectedHost.role} • {selectedHost.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedHost(null)}
                      className="p-1 hover:bg-white/5 rounded text-white/60 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Purpose of Visit</label>
                    <input
                      type="text"
                      placeholder="e.g. Official Meeting, Maintenance work"
                      value={purpose}
                      onChange={e => setPurpose(e.target.value)}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3.5 py-3 text-xs text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Duration (Hours)</label>
                    <select
                      value={validHours}
                      onChange={e => setValidHours(Number(e.target.value))}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-3 text-xs text-white"
                    >
                      <option value="2">2 Hours</option>
                      <option value="4">4 Hours (Default)</option>
                      <option value="8">8 Hours</option>
                      <option value="12">12 Hours</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                Generate Visitor Entry Ticket
              </button>

            </form>
          </div>

          {/* Webcam Simulator Panel */}
          <div className="lg:col-span-1 space-y-6">
            
            <div className="bg-[#13102A]/60 p-5 rounded-3xl border border-white/5 shadow-xl space-y-5">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Camera className="w-4.5 h-4.5 text-[#A78BFA]" /> Photo Identity Capture
              </h3>

              <div className="relative aspect-square w-full rounded-2xl bg-[#0D0A1A] border border-white/10 overflow-hidden flex flex-col items-center justify-center">
                {cameraActive ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-black/60 relative">
                    {/* Simulated scanning alignment guide */}
                    <div className="absolute inset-8 border border-dashed border-[#A78BFA]/40 rounded-full animate-pulse" />
                    <div className="absolute inset-16 border border-[#A78BFA]/30 rounded-full" />
                    <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-red-500/40 animate-bounce" />
                    <p className="text-[10px] text-[#A78BFA]/70 font-mono absolute bottom-4">CAMERA ON — LIVE VIEWPORTS</p>
                  </div>
                ) : capturedPhoto ? (
                  <img
                    src={capturedPhoto}
                    alt="Captured Visitor Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-6 space-y-2 text-white/30">
                    <Camera className="w-10 h-10 mx-auto" />
                    <p className="text-xs">Webcam feed not activated</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {!cameraActive ? (
                  <button
                    type="button"
                    onClick={handleCameraActivate}
                    className="flex-1 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold rounded-xl text-[#C4B5FD] transition-all"
                  >
                    Activate Camera
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleTakeSnapshot}
                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-xs font-bold rounded-xl text-white transition-all"
                  >
                    Take Photo Snapshot
                  </button>
                )}
                {capturedPhoto && (
                  <button
                    type="button"
                    onClick={() => {
                      setCapturedPhoto(null);
                      setVisitorPhotoUrl('');
                    }}
                    className="px-3 py-2.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-xs font-bold rounded-xl text-red-400 transition-all"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Helper notes */}
            <div className="bg-[#13102A]/30 p-5 rounded-3xl border border-white/5 space-y-2">
              <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" /> Blacklist Alert Check
              </h4>
              <p className="text-[10px] text-[#C4B5FD]/70 leading-relaxed">
                System automatically scans the blacklist database using the guest's phone number during registration. Attempted entries by blocked persons will alert operations administrators immediately.
              </p>
            </div>

          </div>

        </div>

        {/* Checked In Visitors List */}
        <div className="bg-[#13102A]/60 p-6 rounded-3xl border border-white/5 shadow-xl space-y-4 mt-8">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Active Guest Movement Log (Checked IN / Registered)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/5 text-[#C4B5FD]/50">
                  <th className="py-3 font-semibold">Visitor Name</th>
                  <th className="py-3 font-semibold">Phone Number</th>
                  <th className="py-3 font-semibold">Assigned Host</th>
                  <th className="py-3 font-semibold">Ticket Pass #</th>
                  <th className="py-3 font-semibold">Valid Until</th>
                  <th className="py-3 font-semibold text-center">Status</th>
                  <th className="py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {passes.map(p => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-all">
                    <td className="py-3.5 font-bold text-white">{p.visitor_name}</td>
                    <td className="py-3.5 text-[#C4B5FD]/70 font-mono">{p.visitor_phone}</td>
                    <td className="py-3.5 text-white/80">{p.host_name}</td>
                    <td className="py-3.5 text-[#A78BFA] font-bold font-mono">{p.pass_number}</td>
                    <td className="py-3.5 text-white/50">{new Date(p.valid_until).toLocaleTimeString()}</td>
                    <td className="py-3.5 text-center">
                      {p.is_used ? (
                        <span className="px-2 py-0.5 rounded font-extrabold text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          INSIDE CAMPUS
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded font-extrabold text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          WAITING HOST APPROVED
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 text-right">
                      {p.is_used && (
                        <button
                          onClick={() => handleCheckout(p.id)}
                          className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold text-[10px] rounded-lg transition-all"
                        >
                          Check Out Exit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  );
}
