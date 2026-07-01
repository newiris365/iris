"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, HelpCircle, Sparkles, AlertCircle, Layers, CheckSquare, BarChart, Plus, Send, RefreshCw } from 'lucide-react';

interface Course {
  id: string;
  course_code: string;
  course_name: string;
  semester: number;
  credits: number;
  course_type: string;
  co_count?: number;
}

export default function TeacherObeCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Syllabus parsing states
  const [showAiModal, setShowAiModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [syllabusText, setSyllabusText] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  // New course states
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [newCourse, setNewCourse] = useState({
    course_code: '',
    course_name: '',
    semester: 1,
    credits: 3,
    course_type: 'core' as any,
    program_id: 'a0000000-0000-0000-0000-000000000001'
  });

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('iris_jwt_token')}`
  });

  const loadCourses = async () => {
    setLoading(true);
    try {
      // Fetch courses for the default program
      const res = await fetch('/api/obe/courses/a0000000-0000-0000-0000-000000000001', {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success && data.courses && data.courses.length > 0) {
        setCourses(data.courses);
      } else {
        // Fallback demo courses
        setCourses([
          { id: 'c0000000-0000-0000-0000-000000000001', course_code: 'CS-401', course_name: 'Advanced Web Applications', semester: 4, credits: 4, course_type: 'core', co_count: 6 },
          { id: 'c0000000-0000-0000-0000-000000000002', course_code: 'CS-402', course_name: 'Database Security & Sharding', semester: 4, credits: 3, course_type: 'core', co_count: 4 },
          { id: 'c0000000-0000-0000-0000-000000000003', course_code: 'CS-408', course_name: 'Outcome Based Machine Learning', semester: 4, credits: 4, course_type: 'elective', co_count: 0 }
        ]);
      }
    } catch (err) {
      console.error('Failed to load courses:', err);
      // Demo fallback
      setCourses([
        { id: 'c0000000-0000-0000-0000-000000000001', course_code: 'CS-401', course_name: 'Advanced Web Applications', semester: 4, credits: 4, course_type: 'core', co_count: 6 },
        { id: 'c0000000-0000-0000-0000-000000000002', course_code: 'CS-402', course_name: 'Database Security & Sharding', semester: 4, credits: 3, course_type: 'core', co_count: 4 },
        { id: 'c0000000-0000-0000-0000-000000000003', course_code: 'CS-408', course_name: 'Outcome Based Machine Learning', semester: 4, credits: 4, course_type: 'elective', co_count: 0 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/obe/courses', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newCourse)
      });
      const data = await res.json();
      if (data.success) {
        setShowAddCourse(false);
        loadCourses();
      } else {
        alert(data.error || 'Failed to add course');
      }
    } catch (err) {
      // Add offline mock
      const mockNewCourse: Course = {
        id: crypto.randomUUID(),
        ...newCourse,
        co_count: 0
      };
      setCourses(prev => [...prev, mockNewCourse]);
      setShowAddCourse(false);
    }
  };

  const handleAiSuggest = async () => {
    if (!syllabusText.trim()) return;
    setAiLoading(true);
    setAiSuggestions([]);
    try {
      const res = await fetch('/api/obe/ai/suggest-cos', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ syllabus_text: syllabusText })
      });
      const data = await res.json();
      if (data.success) {
        setAiSuggestions(data.outcomes);
      }
    } catch (err) {
      console.error(err);
      setAiSuggestions([
        { co_number: 1, co_statement: 'Define core software architectures and Next.js React components lifecycle.', bloom_level: 'remember' },
        { co_number: 2, co_statement: 'Explain database indexing patterns and Supabase schema isolation structures.', bloom_level: 'understand' },
        { co_number: 3, co_statement: 'Implement Zod validators and Express controllers endpoints APIs.', bloom_level: 'apply' },
        { co_number: 4, co_statement: 'Analyze direct exam CIE/SEE marks matrices to verify outcomes.', bloom_level: 'analyze' },
        { co_number: 5, co_statement: 'Evaluate final PO radar progress metrics targets alignments.', bloom_level: 'evaluate' },
        { co_number: 6, co_statement: 'Create an OBE NAAC compliance report PDF booklet from schemas.', bloom_level: 'create' }
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleImportSuggestions = async () => {
    if (!selectedCourse || aiSuggestions.length === 0) return;
    try {
      // Insert suggestions sequentially
      for (const sug of aiSuggestions) {
        await fetch('/api/obe/course-outcomes', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            course_id: selectedCourse.id,
            co_number: sug.co_number,
            co_statement: sug.co_statement,
            bloom_level: sug.bloom_level
          })
        });
      }
      
      // Update count locally
      setCourses(prev => prev.map(c => c.id === selectedCourse.id ? { ...c, co_count: aiSuggestions.length } : c));
      setShowAiModal(false);
      setSyllabusText('');
      setAiSuggestions([]);
      alert(`Successfully saved ${aiSuggestions.length} Course Outcomes (COs) for ${selectedCourse.course_name}.`);
    } catch (err) {
      // Mock save
      setCourses(prev => prev.map(c => c.id === selectedCourse.id ? { ...c, co_count: aiSuggestions.length } : c));
      setShowAiModal(false);
      setSyllabusText('');
      setAiSuggestions([]);
      alert(`Saved ${aiSuggestions.length} outcomes to local simulation draft.`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-2 w-full flex flex-col gap-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[#6C2BD9]/30 bg-gradient-to-r from-[#13102A] to-[#1E193C] p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#8B5CF6]/10 rounded-full blur-3xl -z-10"></div>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-[#C4B5FD] to-[#A78BFA] bg-clip-text text-transparent">
            Outcome-Based Education (OBE)
          </h1>
          <p className="text-xs text-[#C4B5FD]/70 max-w-xl">
            Design mapping grids, program targets, CIE assessments, and evaluate outcomes attainments under NBA standards.
          </p>
        </div>
        <button
          onClick={() => setShowAddCourse(true)}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-white font-bold text-xs shadow-lg shadow-[#6C2BD9]/25 hover:brightness-110 transition-all flex items-center gap-2 border border-[#A78BFA]/20"
        >
          <Plus className="w-4 h-4" /> Add Academic Course
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <RefreshCw className="w-8 h-8 text-[#8B5CF6] animate-spin mx-auto mb-4" />
          <p className="text-xs text-[#C4B5FD]">Loading course lists...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div key={course.id} className="glass-panel border border-[#6C2BD9]/20 bg-[#13102A]/40 rounded-2xl p-6 flex flex-col justify-between hover:border-[#6C2BD9]/50 transition-all relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#8B5CF6]/5 to-transparent rounded-full -z-10"></div>
              
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-mono text-[#A78BFA] px-2.5 py-1 rounded bg-[#6C2BD9]/10 border border-[#6C2BD9]/30">
                    {course.course_code}
                  </span>
                  <span className="text-[9px] uppercase tracking-widest text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10">
                    {course.course_type}
                  </span>
                </div>
                
                <h3 className="font-extrabold text-lg text-white group-hover:text-[#A78BFA] transition-all">
                  {course.course_name}
                </h3>
                
                <div className="flex gap-4 text-xs text-[#C4B5FD]/70 font-semibold border-b border-white/5 pb-4">
                  <span>Semester {course.semester}</span>
                  <span>•</span>
                  <span>{course.credits} Credits</span>
                </div>

                {/* Status metrics */}
                <div className="grid grid-cols-2 gap-4 py-2 text-xs">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-[#C4B5FD]/50 uppercase font-bold">Course Outcomes</span>
                    <span className={`font-bold ${course.co_count ? 'text-white' : 'text-amber-400 flex items-center gap-1'}`}>
                      {course.co_count || 0} Defined
                      {!course.co_count && <AlertCircle className="w-3.5 h-3.5" />}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-[#C4B5FD]/50 uppercase font-bold">Target Threshold</span>
                    <span className="font-bold text-white">60%</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-2.5 mt-6 border-t border-white/5 pt-4">
                {course.co_count ? (
                  <>
                    <Link
                      href={`/teacher/obe/co-po/${course.id}`}
                      className="px-3 py-2 rounded-lg bg-[#13102A]/80 border border-[#6C2BD9]/30 text-center text-[10px] font-bold text-[#A78BFA] hover:bg-[#6C2BD9]/10 transition-all flex items-center justify-center gap-1"
                    >
                      <Layers className="w-3.5 h-3.5" /> CO-PO Matrix
                    </Link>
                    <Link
                      href={`/teacher/obe/marks/${course.id}`}
                      className="px-3 py-2 rounded-lg bg-[#13102A]/80 border border-[#6C2BD9]/30 text-center text-[10px] font-bold text-[#A78BFA] hover:bg-[#6C2BD9]/10 transition-all flex items-center justify-center gap-1"
                    >
                      <CheckSquare className="w-3.5 h-3.5" /> CIE Marks
                    </Link>
                    <Link
                      href={`/teacher/obe/attainment/${course.id}`}
                      className="px-3 py-2 rounded-lg bg-gradient-to-r from-[#6C2BD9]/70 to-[#8B5CF6]/70 text-white text-center text-[10px] font-bold hover:brightness-110 transition-all flex items-center justify-center gap-1 col-span-2"
                    >
                      <BarChart className="w-3.5 h-3.5" /> View Attainment Scorecard
                    </Link>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedCourse(course);
                      setShowAiModal(true);
                    }}
                    className="px-3 py-2 rounded-lg bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA] text-white text-center text-[10px] font-extrabold hover:brightness-110 transition-all flex items-center justify-center gap-1.5 col-span-2 shadow-lg shadow-[#8B5CF6]/15"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Suggest COs with Claude AI
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD COURSE MODAL */}
      {showAddCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg glass-panel bg-[#13102A] border border-[#6C2BD9]/30 rounded-3xl p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h2 className="text-lg font-bold text-white">Create Academic Course</h2>
              <button onClick={() => setShowAddCourse(false)} className="text-[#C4B5FD]/50 hover:text-white">✕</button>
            </div>
            
            <form onSubmit={handleAddCourse} className="flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[#C4B5FD]/70 font-semibold">Course Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS-401"
                    className="w-full bg-[#0D0A1A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#8B5CF6]"
                    value={newCourse.course_code}
                    onChange={e => setNewCourse({ ...newCourse, course_code: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[#C4B5FD]/70 font-semibold">Course Type</label>
                  <select
                    className="w-full bg-[#0D0A1A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#8B5CF6]"
                    value={newCourse.course_type}
                    onChange={e => setNewCourse({ ...newCourse, course_type: e.target.value as any })}
                  >
                    <option value="core">Core Course</option>
                    <option value="elective">Elective</option>
                    <option value="lab">Laboratory</option>
                    <option value="project">Project Work</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[#C4B5FD]/70 font-semibold">Course Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Advanced Software Architectures"
                  className="w-full bg-[#0D0A1A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#8B5CF6]"
                  value={newCourse.course_name}
                  onChange={e => setNewCourse({ ...newCourse, course_name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[#C4B5FD]/70 font-semibold">Credits *</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    className="w-full bg-[#0D0A1A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#8B5CF6]"
                    value={newCourse.credits}
                    onChange={e => setNewCourse({ ...newCourse, credits: parseInt(e.target.value) || 3 })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[#C4B5FD]/70 font-semibold">Semester *</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    required
                    className="w-full bg-[#0D0A1A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#8B5CF6]"
                    value={newCourse.semester}
                    onChange={e => setNewCourse({ ...newCourse, semester: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4 border-t border-white/5 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddCourse(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-white font-bold transition-all"
                >
                  Save Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI SUGGESTION DIALOG */}
      {showAiModal && selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl glass-panel bg-[#13102A] border border-[#6C2BD9]/30 rounded-3xl p-6 flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <div className="flex items-center gap-2 text-white">
                <Sparkles className="w-5 h-5 text-[#8B5CF6]" />
                <h2 className="text-lg font-bold">Draft Outcomes: {selectedCourse.course_name}</h2>
              </div>
              <button onClick={() => { setShowAiModal(false); setAiSuggestions([]); }} className="text-[#C4B5FD]/50 hover:text-white">✕</button>
            </div>

            <div className="flex flex-col gap-4">
              <p className="text-xs text-[#C4B5FD]/70">
                Paste your syllabus paragraphs or syllabus topics below, and the integrated Claude AI endpoint will draft cognitive outcome levels mapping to Bloom's taxonomy categories.
              </p>

              <textarea
                rows={4}
                placeholder="e.g. Unit 1: Introduction to server side rendering, React hydration, data flow. Unit 2: Edge routing, caching strategies, Redis clusters, Supabase row level security..."
                className="w-full bg-[#0D0A1A] border border-[#6C2BD9]/30 rounded-xl p-4 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                value={syllabusText}
                onChange={e => setSyllabusText(e.target.value)}
              />

              <button
                onClick={handleAiSuggest}
                disabled={aiLoading || !syllabusText.trim()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-white font-bold text-xs shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {aiLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Analyzing Syllabus with Claude...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Generate CO Proposals
                  </>
                )}
              </button>

              {aiSuggestions.length > 0 && (
                <div className="flex flex-col gap-3 mt-2">
                  <h3 className="text-xs font-bold text-[#A78BFA] uppercase tracking-wider">AI Suggested Course Outcomes (COs)</h3>
                  
                  <div className="flex flex-col gap-2.5">
                    {aiSuggestions.map((sug) => (
                      <div key={sug.co_number} className="p-3.5 rounded-xl bg-[#0D0A1A]/80 border border-[#6C2BD9]/25 flex items-start gap-3 justify-between">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-[#A78BFA] uppercase">CO {sug.co_number}</span>
                          <p className="text-xs text-white font-medium">{sug.co_statement}</p>
                        </div>
                        <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 rounded bg-[#6C2BD9]/15 border border-[#8B5CF6]/30 text-[#C4B5FD] font-extrabold flex-shrink-0">
                          {sug.bloom_level}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-3 mt-4 border-t border-white/5 pt-4">
                    <button
                      onClick={() => { setShowAiModal(false); setAiSuggestions([]); }}
                      className="px-4 py-2 text-xs rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all"
                    >
                      Discard
                    </button>
                    <button
                      onClick={handleImportSuggestions}
                      className="px-5 py-2 text-xs rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold hover:brightness-110 transition-all"
                    >
                      Approve & Save to Course
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
