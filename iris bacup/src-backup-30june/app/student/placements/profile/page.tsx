"use client";

import React, { useState, useEffect } from 'react';
import {
  FileText, Award, Layers, Plus, Trash2, ArrowLeft,
  Linkedin, Github, Globe, Save, HelpCircle, CheckCircle
} from 'lucide-react';
import { apiGet, apiPut } from '../../../../lib/api';

export default function StudentPlacementProfile() {
  const [resumeUrl, setResumeUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [cgpa, setCgpa] = useState(8.5);
  const [activeBacklogs, setActiveBacklogs] = useState(0);
  const [totalBacklogs, setTotalBacklogs] = useState(0);
  const [skills, setSkills] = useState<string[]>(['React', 'Node.js', 'TypeScript', 'PostgreSQL']);
  const [newSkill, setNewSkill] = useState('');
  
  const [certifications, setCertifications] = useState<any[]>([
    { title: 'AWS Certified Cloud Practitioner', issuer: 'Amazon Web Services', year: '2025' }
  ]);
  
  const [projects, setProjects] = useState<any[]>([
    { name: 'IRIS Campus Management', description: 'Next.js based portal with Supabase database integrations.', link: 'https://github.com/example/iris' }
  ]);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const localProfile = localStorage.getItem('iris_user_profile');
      if (localProfile) {
        const user = JSON.parse(localProfile);
        const res = await apiGet(`/placements/applications/student/${user.id}`);
        // We can mock check student profile values or mock fetch from backend
      }
    } catch (err) {
      console.log('Using mock values');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // Simulate API save
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 1000);
  };

  const addSkill = () => {
    if (newSkill && !skills.includes(newSkill)) {
      setSkills([...skills, newSkill]);
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const addCert = () => {
    setCertifications([...certifications, { title: '', issuer: '', year: '' }]);
  };

  const updateCert = (index: number, key: string, value: string) => {
    const updated = [...certifications];
    updated[index][key] = value;
    setCertifications(updated);
  };

  const removeCert = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index));
  };

  const addProject = () => {
    setProjects([...projects, { name: '', description: '', link: '' }]);
  };

  const updateProject = (index: number, key: string, value: string) => {
    const updated = [...projects];
    updated[index][key] = value;
    setProjects(updated);
  };

  const removeProject = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index));
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-6 lg:p-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex items-center gap-3">
          <a href="/student/placements" className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#C4B5FD]/70 hover:text-white hover:border-[#6C2BD9]/40 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </a>
          <div>
            <h1 className="font-extrabold text-2xl text-white">Placement Profile Builder</h1>
            <p className="text-xs text-[#C4B5FD]/70">Maintain up-to-date resumes, certifications, and portfolio links for campus drive eligibility.</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-6">
          
          {/* Main Credentials & Resumes */}
          <div className="p-6 rounded-2xl bg-[#13102A]/85 border border-[#6C2BD9]/20 flex flex-col gap-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#A78BFA]" />
              Resume & Portfolio Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-[#C4B5FD]/60">Resume Link (PDF URL)</label>
                <input
                  type="url"
                  required
                  placeholder="https://supabase.co/storage/v1/object/public/resumes/..."
                  value={resumeUrl || 'https://supabase.co/storage/v1/object/public/resumes/my_resume.pdf'}
                  onChange={e => setResumeUrl(e.target.value)}
                  className="px-4 py-3 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white placeholder:text-[#C4B5FD]/30 outline-none focus:border-[#6C2BD9]/50"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-[#C4B5FD]/60">CGPA</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    required
                    value={cgpa}
                    onChange={e => setCgpa(parseFloat(e.target.value))}
                    className="px-4 py-3 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-[#C4B5FD]/60">Active Backlogs</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={activeBacklogs}
                    onChange={e => setActiveBacklogs(parseInt(e.target.value))}
                    className="px-4 py-3 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-[#C4B5FD]/60">Total Backlogs</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={totalBacklogs}
                    onChange={e => setTotalBacklogs(parseInt(e.target.value))}
                    className="px-4 py-3 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-[#C4B5FD]/60 flex items-center gap-1">
                  <Linkedin className="w-3 h-3 text-blue-400" /> LinkedIn URL
                </label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/username"
                  value={linkedinUrl}
                  onChange={e => setLinkedinUrl(e.target.value)}
                  className="px-4 py-3 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white placeholder:text-[#C4B5FD]/30 outline-none focus:border-[#6C2BD9]/50"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-[#C4B5FD]/60 flex items-center gap-1">
                  <Github className="w-3 h-3 text-white" /> GitHub URL
                </label>
                <input
                  type="url"
                  placeholder="https://github.com/username"
                  value={githubUrl}
                  onChange={e => setGithubUrl(e.target.value)}
                  className="px-4 py-3 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white placeholder:text-[#C4B5FD]/30 outline-none focus:border-[#6C2BD9]/50"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-[#C4B5FD]/60 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-[#A78BFA]" /> Portfolio Website
                </label>
                <input
                  type="url"
                  placeholder="https://portfolio.me"
                  value={portfolioUrl}
                  onChange={e => setPortfolioUrl(e.target.value)}
                  className="px-4 py-3 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white placeholder:text-[#C4B5FD]/30 outline-none focus:border-[#6C2BD9]/50"
                />
              </div>
            </div>
          </div>

          {/* Technical Skills */}
          <div className="p-6 rounded-2xl bg-[#13102A]/85 border border-[#6C2BD9]/20 flex flex-col gap-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#A78BFA]" />
              Core Competencies & Skills
            </h2>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add skill (e.g. Docker, Python, AWS)"
                value={newSkill}
                onChange={e => setNewSkill(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                className="flex-1 px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white placeholder:text-[#C4B5FD]/30 outline-none focus:border-[#6C2BD9]/50"
              />
              <button
                type="button"
                onClick={addSkill}
                className="px-4 py-2.5 rounded-xl bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 text-xs font-bold text-[#A78BFA] hover:bg-[#6C2BD9]/35 transition-all"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
              {skills.map(skill => (
                <span key={skill} className="px-3 py-1.5 rounded-xl bg-[#6C2BD9]/10 border border-[#6C2BD9]/25 text-xs text-white flex items-center gap-1.5 font-medium">
                  {skill}
                  <button type="button" onClick={() => removeSkill(skill)} className="text-white/40 hover:text-red-400 font-bold">×</button>
                </span>
              ))}
            </div>
          </div>

          {/* Certifications and Projects */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Certifications Card */}
            <div className="p-6 rounded-2xl bg-[#13102A]/85 border border-[#6C2BD9]/20 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#A78BFA]" />
                  Certifications
                </h2>
                <button
                  type="button"
                  onClick={addCert}
                  className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-[#C4B5FD]/70 hover:text-white hover:border-[#6C2BD9]/30 transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
                {certifications.map((cert, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-2 relative group">
                    <button
                      type="button"
                      onClick={() => removeCert(idx)}
                      className="absolute top-2 right-2 text-white/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <input
                      placeholder="Certification Title"
                      required
                      value={cert.title}
                      onChange={e => updateCert(idx, 'title', e.target.value)}
                      className="bg-transparent text-xs text-white font-bold border-b border-white/5 focus:border-[#6C2BD9] outline-none pb-1"
                    />
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <input
                        placeholder="Issuer"
                        required
                        value={cert.issuer}
                        onChange={e => updateCert(idx, 'issuer', e.target.value)}
                        className="bg-transparent text-[10px] text-[#C4B5FD]/70 outline-none"
                      />
                      <input
                        placeholder="Year"
                        required
                        value={cert.year}
                        onChange={e => updateCert(idx, 'year', e.target.value)}
                        className="bg-transparent text-[10px] text-[#C4B5FD]/70 text-right outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Projects Card */}
            <div className="p-6 rounded-2xl bg-[#13102A]/85 border border-[#6C2BD9]/20 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#A78BFA]" />
                  Key Projects
                </h2>
                <button
                  type="button"
                  onClick={addProject}
                  className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-[#C4B5FD]/70 hover:text-white hover:border-[#6C2BD9]/30 transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
                {projects.map((proj, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-2 relative group">
                    <button
                      type="button"
                      onClick={() => removeProject(idx)}
                      className="absolute top-2 right-2 text-white/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <input
                      placeholder="Project Name"
                      required
                      value={proj.name}
                      onChange={e => updateProject(idx, 'name', e.target.value)}
                      className="bg-transparent text-xs text-white font-bold border-b border-white/5 focus:border-[#6C2BD9] outline-none pb-1"
                    />
                    <input
                      placeholder="Short description..."
                      required
                      value={proj.description}
                      onChange={e => updateProject(idx, 'description', e.target.value)}
                      className="bg-transparent text-[10px] text-[#C4B5FD]/60 outline-none pb-1"
                    />
                    <input
                      placeholder="GitHub/Live Demo Link"
                      value={proj.link || ''}
                      onChange={e => updateProject(idx, 'link', e.target.value)}
                      className="bg-transparent text-[9px] text-[#A78BFA] outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Submit Trigger */}
          <div className="flex items-center justify-between gap-4 mt-2">
            <span className="text-[10px] text-[#C4B5FD]/50">Verify all information before clicking save.</span>
            
            <div className="flex items-center gap-3">
              {saved && (
                <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                  <CheckCircle className="w-4 h-4" /> Profile saved!
                </span>
              )}
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white transition-all shadow-lg shadow-[#6C2BD9]/25 flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>

        </form>

      </div>
    </main>
  );
}
