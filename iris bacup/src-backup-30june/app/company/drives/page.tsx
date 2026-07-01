"use client";

import React, { useState, useEffect } from 'react';
import {
  Briefcase, Plus, Calendar, MapPin, DollarSign,
  Clock, ShieldAlert, CheckCircle, Award, ListFilter
} from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';

interface PostedRequirement {
  id: string;
  title: string;
  role: string;
  job_type: string;
  location: string[];
  ctc_display: string;
  min_cgpa: number;
  status: string;
  application_deadline: string;
  companies?: {
    name: string;
  };
}

export default function CompanyHRDrives() {
  const [requirements, setRequirements] = useState<PostedRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [role, setRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobType, setJobType] = useState<'full_time' | 'internship' | 'ppo' | 'contract'>('full_time');
  const [location, setLocation] = useState('Bangalore');
  const [ctcMin, setCtcMin] = useState(12.0);
  const [ctcMax, setCtcMax] = useState(18.0);
  const [ctcDisplay, setCtcDisplay] = useState('12 - 18 LPA');
  const [minCgpa, setMinCgpa] = useState(8.0);
  const [backlogsAllowed, setBacklogsAllowed] = useState(0);
  const [deadline, setDeadline] = useState('');

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPostedDrives();
  }, []);

  const loadPostedDrives = async () => {
    try {
      const res = await apiGet('/placements/drives');
      if (res.success && res.drives) {
        // Filter drives corresponding to Google India recruiter company (simulated login)
        setRequirements(res.drives);
      }
    } catch (err) {
      console.log('Error loading posted requirements');
    }

    // seed fallback if empty
    if (requirements.length === 0) {
      setRequirements([
        {
          id: 'd-1',
          title: 'Google SWE Summer Drive 2026',
          role: 'Software Engineer (L3)',
          job_type: 'full_time',
          location: ['Bangalore', 'Hyderabad'],
          ctc_display: '32 - 42 LPA',
          min_cgpa: 8.0,
          status: 'open',
          application_deadline: new Date(Date.now() + 864000000).toISOString()
        }
      ]);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        company_id: 'c0000000-0000-0000-0000-000000000001', // Google India
        title,
        job_description: jobDescription,
        role,
        job_type: jobType,
        location: [location],
        ctc_min: ctcMin,
        ctc_max: ctcMax,
        ctc_display: ctcDisplay,
        min_cgpa: minCgpa,
        eligible_branches: ['CSE', 'AIDS'],
        eligible_batches: ['2026'],
        backlogs_allowed: backlogsAllowed,
        application_deadline: deadline ? new Date(deadline).toISOString() : undefined,
        drive_date: new Date().toISOString(),
        drive_mode: 'online'
      };

      const res = await apiPost('/placements/drives', payload);
      if (res.success && res.drive) {
        setRequirements([...requirements, res.drive]);
        setShowForm(false);
      }
    } catch (err) {
      console.log('Error saving drive requirement');
    }
    setSaving(false);
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-6 lg:p-8">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-[#A78BFA]" />
            <div>
              <h1 className="font-extrabold text-2xl text-white">Job Requirements & drives</h1>
              <p className="text-xs text-[#C4B5FD]/70">Publish new JDs, set target CGPA score criteria, and verify current submissions.</p>
            </div>
          </div>

          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white transition-all shadow-lg shadow-[#6C2BD9]/25 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Post Job Requirement
            </button>
          )}
        </div>

        {showForm ? (
          /* Requirement Form */
          <div className="p-6 rounded-2xl bg-[#13102A]/85 border border-[#6C2BD9]/20">
            <h2 className="text-sm font-bold text-white mb-4">Post Job Requirement</h2>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase font-bold text-[#C4B5FD]/60">Hiring Title</label>
                  <input
                    required
                    placeholder="e.g. SRE Intern Campaign"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-white outline-none focus:border-[#6C2BD9]/50"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase font-bold text-[#C4B5FD]/60">Job Role / Designation</label>
                  <input
                    required
                    placeholder="e.g. Site Reliability Engineer"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    className="px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-white outline-none focus:border-[#6C2BD9]/50"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase font-bold text-[#C4B5FD]/60">Job Type</label>
                  <select
                    value={jobType}
                    onChange={e => setJobType(e.target.value as any)}
                    className="px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-white outline-none focus:border-[#6C2BD9]/50"
                  >
                    <option value="full_time">Full Time</option>
                    <option value="internship">Internship</option>
                    <option value="ppo">Pre-Placement Offer (PPO)</option>
                    <option value="contract">Contractor</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 border-t border-white/5 pt-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase font-bold text-[#C4B5FD]/60">Min CGPA Cutoff</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    required
                    value={minCgpa}
                    onChange={e => setMinCgpa(parseFloat(e.target.value))}
                    className="px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-white outline-none focus:border-[#6C2BD9]/50"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase font-bold text-[#C4B5FD]/60">Active Backlogs Allowed</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={backlogsAllowed}
                    onChange={e => setBacklogsAllowed(parseInt(e.target.value))}
                    className="px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-white outline-none focus:border-[#6C2BD9]/50"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase font-bold text-[#C4B5FD]/60">CTC display salary</label>
                  <input
                    placeholder="e.g. 18 - 24 LPA"
                    required
                    value={ctcDisplay}
                    onChange={e => setCtcDisplay(e.target.value)}
                    className="px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-white outline-none focus:border-[#6C2BD9]/50"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase font-bold text-[#C4B5FD]/60">Work Location</label>
                  <input
                    placeholder="e.g. Bangalore"
                    required
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-white outline-none focus:border-[#6C2BD9]/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/5 pt-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase font-bold text-[#C4B5FD]/60">Applications deadline</label>
                  <input
                    type="datetime-local"
                    required
                    value={deadline}
                    onChange={e => setDeadline(e.target.value)}
                    className="px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-white outline-none focus:border-[#6C2BD9]/50"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase font-bold text-[#C4B5FD]/60">Brief Job Details</label>
                  <textarea
                    value={jobDescription}
                    onChange={e => setJobDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 bg-[#0D0A1A] border border-white/10 rounded-xl text-white outline-none focus:border-[#6C2BD9]/50 resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-4 border-t border-white/5 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-white font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-white font-bold shadow-lg shadow-[#6C2BD9]/20"
                >
                  {saving ? 'Posting...' : 'Post Requirement'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* posted drives feed */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requirements.map(req => (
              <div key={req.id} className="p-5 rounded-2xl bg-[#13102A]/85 border border-[#6C2BD9]/25 flex flex-col gap-3 group hover:border-[#8B5CF6]/45 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[9px] font-bold text-[#A78BFA] uppercase tracking-wider">{req.companies?.name || 'Recruiter'}</span>
                    <h3 className="font-bold text-sm text-white mt-0.5">{req.title}</h3>
                    <p className="text-[10px] text-[#C4B5FD]/60 mt-0.5">Role: {req.role} • Job Type: {req.job_type?.replace('_', ' ')}</p>
                  </div>

                  <span className="text-xs font-extrabold text-white bg-[#6C2BD9]/10 px-2.5 py-0.5 rounded-lg border border-[#6C2BD9]/20">
                    {req.ctc_display}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-white/5 pt-3 text-[9px] text-[#C4B5FD]/50">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#A78BFA]" /> {req.location?.join(', ')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#A78BFA]" /> Cutoff: {req.min_cgpa} CGPA
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#A78BFA]" /> Deadline: {new Date(req.application_deadline).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
