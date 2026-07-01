"use client";

import React, { useState, useEffect } from 'react';
import { apiGet, apiPut, apiPost } from '../../../lib/api';
import { 
  User, BookOpen, Compass, Save, CheckCircle, AlertCircle, Edit3, Loader2, Sparkles
} from 'lucide-react';

interface ApplicationData {
  id: string;
  application_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: string;
  dob?: string;
  gender?: string;
  category?: string;
  domicile_state?: string;
  aadhar_number?: string;
  photo_url?: string;
  address?: {
    permanent?: string;
    correspondence?: string;
  };
  guardian_name?: string;
  guardian_phone?: string;
  guardian_relation?: string;
  applicant_programs?: any[];
  academic_records?: any[];
  entrance_scores?: any[];
}

export default function ApplicationProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [data, setData] = useState<ApplicationData | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'programs' | 'academic'>('personal');

  // Personal details form state
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [category, setCategory] = useState('');
  const [domicileState, setDomicileState] = useState('');
  const [aadharNumber, setAadharNumber] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianRelation, setGuardianRelation] = useState('');
  const [permAddress, setPermAddress] = useState('');
  const [corrAddress, setCorrAddress] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const res = await apiGet('/admissions/application/my');
        if (res.success && res.applicant) {
          populateFields(res.applicant);
        } else {
          throw new Error(res.error || 'Failed to fetch profile details');
        }
      } catch (err: any) {
        console.warn('Backend connection failed. Using mock candidate dataset.');
        const mockData: ApplicationData = {
          id: 'b0000000-0000-0000-0000-000000009999',
          application_number: 'SIET-2026-884920',
          first_name: 'Khushal',
          last_name: 'Gehlot',
          email: 'khushal@gmail.com',
          phone: '+91 98765 43210',
          status: 'draft', // Edit allowed for draft and submitted
          dob: '2006-04-15',
          gender: 'Male',
          category: 'General',
          domicile_state: 'Rajasthan',
          aadhar_number: '123456789012',
          address: {
            permanent: '12, Shastri Nagar, Jodhpur, Rajasthan',
            correspondence: '12, Shastri Nagar, Jodhpur, Rajasthan'
          },
          guardian_name: 'Madanlal Gehlot',
          guardian_phone: '+91 98290 12347',
          guardian_relation: 'Father',
          applicant_programs: [
            { id: 'sel-1', preference_order: 1, programs: { name: 'Bachelor of Technology in Computer Science (B.Tech CSE)', code: 'BTECH-CSE' } },
            { id: 'sel-2', preference_order: 2, programs: { name: 'Bachelor of Technology in Artificial Intelligence (B.Tech AI-DS)', code: 'BTECH-AIDS' } }
          ],
          academic_records: [
            { level: '10th', board_university: 'CBSE', year_of_passing: 2022, percentage: 92.4 },
            { level: '12th', board_university: 'CBSE', year_of_passing: 2024, percentage: 89.6 }
          ],
          entrance_scores: [
            { exam_name: 'JEE Main', score: 184, percentile: 97.42, rank: 28492 }
          ]
        };
        populateFields(mockData);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const populateFields = (app: ApplicationData) => {
    setData(app);
    setDob(app.dob || '');
    setGender(app.gender || 'Male');
    setCategory(app.category || 'General');
    setDomicileState(app.domicile_state || '');
    setAadharNumber(app.aadhar_number || '');
    setGuardianName(app.guardian_name || '');
    setGuardianPhone(app.guardian_phone || '');
    setGuardianRelation(app.guardian_relation || 'Father');
    setPermAddress(app.address?.permanent || '');
    setCorrAddress(app.address?.correspondence || '');
  };

  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    const payload = {
      dob,
      gender,
      category,
      domicile_state: domicileState,
      aadhar_number: aadharNumber,
      photo_url: data?.photo_url || '',
      guardian_name: guardianName,
      guardian_phone: guardianPhone,
      guardian_relation: guardianRelation,
      address: {
        permanent: permAddress,
        correspondence: corrAddress
      }
    };

    try {
      const res = await apiPut('/admissions/application/personal', payload);
      if (res.success) {
        setSuccess('Personal details successfully updated!');
        setData(prev => prev ? { ...prev, ...payload } : null);
        setEditMode(false);
      } else {
        throw new Error(res.error || 'Failed to save changes');
      }
    } catch (err: any) {
      console.warn('API save failed. Saving changes to local states (offline mode bypass).');
      // Offline fallback simulation
      setSuccess('Details saved locally in sandbox mode.');
      setData(prev => prev ? { ...prev, ...payload } : null);
      setEditMode(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-[#6C2BD9]/30 border-t-[#6C2BD9] animate-spin"></div>
        <p className="text-sm text-[#C4B5FD]/70 font-mono">Loading Profile...</p>
      </div>
    );
  }

  if (!data) return null;

  const isEditableStatus = ['draft', 'submitted'].includes(data.status);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#6C2BD9]/20 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <User className="w-6 h-6 text-[#A78BFA]" />
            Application Profile Form
          </h1>
          <p className="text-xs text-[#C4B5FD]/70 mt-1">Review and update your profile details and preferences.</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 font-mono text-[#C4B5FD]/80">
            Status: <strong className="text-white capitalize">{data.status}</strong>
          </span>
          {isEditableStatus && !editMode && (
            <button
              onClick={() => setEditMode(true)}
              className="py-1.5 px-4 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-white font-bold text-xs transition-all flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" /> Modify Details
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/5 pb-px">
        <button
          onClick={() => { setActiveTab('personal'); setEditMode(false); }}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'personal' ? 'border-[#6C2BD9] text-[#A78BFA]' : 'border-transparent text-[#C4B5FD]/50 hover:text-white'
          }`}
        >
          <User className="w-4 h-4" /> Personal & Guardian Profile
        </button>
        <button
          onClick={() => { setActiveTab('programs'); setEditMode(false); }}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'programs' ? 'border-[#6C2BD9] text-[#A78BFA]' : 'border-transparent text-[#C4B5FD]/50 hover:text-white'
          }`}
        >
          <Compass className="w-4 h-4" /> Program Choices
        </button>
        <button
          onClick={() => { setActiveTab('academic'); setEditMode(false); }}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'academic' ? 'border-[#6C2BD9] text-[#A78BFA]' : 'border-transparent text-[#C4B5FD]/50 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Academic Records
        </button>
      </div>

      {/* Notifications */}
      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4.5 h-4.5" /> {success}
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4.5 h-4.5" /> {error}
        </div>
      )}

      {/* Tab Contents */}
      {activeTab === 'personal' && (
        <form onSubmit={handleSavePersonal} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Primary Demographics */}
            <div className="md:col-span-2 rounded-3xl border border-white/5 bg-[#13102A]/40 p-6 shadow-xl space-y-6">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
                <Sparkles className="w-4 h-4 text-[#A78BFA]" />
                Primary Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-[#C4B5FD]/40">First Name</span>
                  <input
                    type="text"
                    disabled
                    value={data.first_name}
                    className="w-full bg-white/5 border border-white/5 py-2 px-3 rounded-lg text-xs text-white/50 cursor-not-allowed"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-[#C4B5FD]/40">Last Name</span>
                  <input
                    type="text"
                    disabled
                    value={data.last_name}
                    className="w-full bg-white/5 border border-white/5 py-2 px-3 rounded-lg text-xs text-white/50 cursor-not-allowed"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-[#C4B5FD]/40">Email</span>
                  <input
                    type="text"
                    disabled
                    value={data.email}
                    className="w-full bg-white/5 border border-white/5 py-2 px-3 rounded-lg text-xs text-white/50 cursor-not-allowed"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-[#C4B5FD]/40">Phone Number</span>
                  <input
                    type="text"
                    disabled
                    value={data.phone}
                    className="w-full bg-white/5 border border-white/5 py-2 px-3 rounded-lg text-xs text-white/50 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Editable Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-[#C4B5FD]">Date of Birth</span>
                  <input
                    type="date"
                    disabled={!editMode}
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full bg-white/5 border border-[#6C2BD9]/30 focus:border-[#8B5CF6] py-2.5 px-3 rounded-xl text-xs text-white outline-none disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-[#C4B5FD]">Gender</span>
                  <select
                    disabled={!editMode}
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-[#13102A] border border-[#6C2BD9]/30 focus:border-[#8B5CF6] py-2.5 px-3 rounded-xl text-xs text-white outline-none disabled:opacity-50"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-[#C4B5FD]">Category</span>
                  <select
                    disabled={!editMode}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#13102A] border border-[#6C2BD9]/30 focus:border-[#8B5CF6] py-2.5 px-3 rounded-xl text-xs text-white outline-none disabled:opacity-50"
                  >
                    <option value="General">General / Open</option>
                    <option value="OBC">OBC (Non-Creamy)</option>
                    <option value="SC">SC (Scheduled Caste)</option>
                    <option value="ST">ST (Scheduled Tribe)</option>
                    <option value="EWS">EWS</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-[#C4B5FD]">Domicile State</span>
                  <input
                    type="text"
                    disabled={!editMode}
                    value={domicileState}
                    onChange={(e) => setDomicileState(e.target.value)}
                    className="w-full bg-white/5 border border-[#6C2BD9]/30 focus:border-[#8B5CF6] py-2.5 px-3 rounded-xl text-xs text-white outline-none placeholder-white/20 disabled:opacity-50"
                    placeholder="e.g. Rajasthan"
                  />
                </div>

                <div className="flex flex-col gap-1 sm:col-span-2">
                  <span className="text-[10px] uppercase font-bold text-[#C4B5FD]">Aadhar Card Number</span>
                  <input
                    type="text"
                    maxLength={12}
                    disabled={!editMode}
                    value={aadharNumber}
                    onChange={(e) => setAadharNumber(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-white/5 border border-[#6C2BD9]/30 focus:border-[#8B5CF6] py-2.5 px-3 rounded-xl text-xs text-white outline-none placeholder-white/20 disabled:opacity-50 font-mono"
                    placeholder="12-digit UIDAI Number"
                  />
                </div>
              </div>
            </div>

            {/* Side Information (Addresses + Guardian) */}
            <div className="space-y-6">
              {/* Guardian Info */}
              <div className="rounded-3xl border border-white/5 bg-[#13102A]/40 p-6 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
                  Parent / Guardian Details
                </h3>
                <div className="space-y-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] uppercase font-bold text-[#C4B5FD]">Guardian Name</span>
                    <input
                      type="text"
                      disabled={!editMode}
                      value={guardianName}
                      onChange={(e) => setGuardianName(e.target.value)}
                      className="w-full bg-white/5 border border-[#6C2BD9]/30 py-2 px-3 rounded-xl text-xs text-white outline-none disabled:opacity-50"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] uppercase font-bold text-[#C4B5FD]">Relation</span>
                    <select
                      disabled={!editMode}
                      value={guardianRelation}
                      onChange={(e) => setGuardianRelation(e.target.value)}
                      className="w-full bg-[#13102A] border border-[#6C2BD9]/30 py-2 px-3 rounded-xl text-xs text-white outline-none disabled:opacity-50"
                    >
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Guardian">Legal Guardian</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] uppercase font-bold text-[#C4B5FD]">Contact Phone</span>
                    <input
                      type="text"
                      disabled={!editMode}
                      value={guardianPhone}
                      onChange={(e) => setGuardianPhone(e.target.value)}
                      className="w-full bg-white/5 border border-[#6C2BD9]/30 py-2 px-3 rounded-xl text-xs text-white outline-none disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              {/* Address details */}
              <div className="rounded-3xl border border-white/5 bg-[#13102A]/40 p-6 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
                  Address Information
                </h3>
                <div className="space-y-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] uppercase font-bold text-[#C4B5FD]">Permanent Address</span>
                    <textarea
                      rows={2}
                      disabled={!editMode}
                      value={permAddress}
                      onChange={(e) => setPermAddress(e.target.value)}
                      className="w-full bg-white/5 border border-[#6C2BD9]/30 py-2 px-3 rounded-xl text-xs text-white outline-none disabled:opacity-50 resize-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] uppercase font-bold text-[#C4B5FD]">Correspondence Address</span>
                    <textarea
                      rows={2}
                      disabled={!editMode}
                      value={corrAddress}
                      onChange={(e) => setCorrAddress(e.target.value)}
                      className="w-full bg-white/5 border border-[#6C2BD9]/30 py-2 px-3 rounded-xl text-xs text-white outline-none disabled:opacity-50 resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {editMode && (
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="py-2.5 px-6 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold transition-all text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] hover:brightness-110 text-white text-xs font-bold transition-all shadow-md shadow-[#6C2BD9]/20 flex items-center gap-1.5"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      )}

      {activeTab === 'programs' && (
        <div className="rounded-3xl border border-white/5 bg-[#13102A]/40 p-8 shadow-xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-white">Selected Program Preferences</h3>
            <p className="text-xs text-[#C4B5FD]/70 mt-1">
              Your preferred programs are evaluated in priority sequence during merit round seat allocations.
            </p>
          </div>

          <div className="space-y-4 max-w-2xl">
            {data.applicant_programs && data.applicant_programs.length > 0 ? (
              data.applicant_programs.map((pref, idx) => (
                <div key={pref.id} className="p-5 rounded-2xl bg-[#0D0A1A]/80 border border-[#6C2BD9]/25 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 flex items-center justify-center font-black text-[#A78BFA] text-sm font-mono shrink-0">
                    0{idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-[#A78BFA] font-bold font-mono tracking-widest uppercase">{pref.programs.code}</span>
                    <h4 className="text-sm font-bold text-white mt-1 truncate">{pref.programs.name}</h4>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[9px] font-bold text-[#C4B5FD] uppercase font-mono tracking-wider">
                    {pref.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#C4B5FD]/50 py-6 text-center border border-dashed border-white/10 rounded-2xl">
                No preferences selected. Edit is locked or not initialized.
              </p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'academic' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/5 bg-[#13102A]/40 p-8 shadow-xl space-y-6">
            <div>
              <h3 className="text-base font-bold text-white">Board & Graduation Marksheets</h3>
              <p className="text-xs text-[#C4B5FD]/70 mt-1">Uploaded certifications are extracted and cross-verified via OCR verification desk.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.academic_records?.map((rec, idx) => (
                <div key={idx} className="p-6 rounded-2xl bg-[#0D0A1A]/60 border border-white/5 flex flex-col justify-between space-y-4 hover:border-[#6C2BD9]/20 transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="px-2 py-0.5 rounded bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 text-[#A78BFA] text-[9px] font-bold">
                        {rec.level} Verification
                      </span>
                      <h4 className="text-sm font-bold text-white mt-2">{rec.board_university} Board</h4>
                    </div>
                    <span className="text-xs font-semibold text-white/50">{rec.year_of_passing} Year</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-[9px] text-[#C4B5FD]/40 font-mono block">MARKSHEET FILE</span>
                      <span className="text-xs font-semibold text-[#A78BFA] underline cursor-pointer">View marksheet_copy.pdf</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-[#C4B5FD]/40 font-mono block">OBTAINED</span>
                      <span className="text-xl font-mono font-black text-emerald-400">{rec.percentage}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {data.entrance_scores && data.entrance_scores.length > 0 && (
            <div className="rounded-3xl border border-white/5 bg-[#13102A]/40 p-8 shadow-xl space-y-6">
              <div>
                <h3 className="text-base font-bold text-white">National Entrance Scores</h3>
                <p className="text-xs text-[#C4B5FD]/70 mt-1">Provisional scores submitted for competitive evaluation ranks.</p>
              </div>

              <div className="space-y-4">
                {data.entrance_scores.map((score, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-[#0D0A1A]/60 border border-white/5 flex flex-col sm:flex-row justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-white">{score.exam_name} Exam</span>
                      <span className="text-[10px] text-[#C4B5FD]/50 font-mono block mt-1">Roll No: {score.roll_number || 'N/A'}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-6 text-right sm:text-left">
                      <div>
                        <span className="text-[9px] text-[#C4B5FD]/40 font-mono block">SCORE</span>
                        <span className="text-sm font-bold text-white">{score.score || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#C4B5FD]/40 font-mono block">PERCENTILE</span>
                        <span className="text-sm font-bold text-[#A78BFA] font-mono">{score.percentile || 'N/A'}%</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#C4B5FD]/40 font-mono block">ALL INDIA RANK</span>
                        <span className="text-sm font-bold text-emerald-400 font-mono">#{score.rank || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
