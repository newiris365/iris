"use client";

import React, { useState, useEffect } from 'react';
import { Users, PlusCircle, Search, Trash2, Edit3, ArrowUpRight, Upload } from 'lucide-react';
import { apiGet, apiPost, apiDelete, apiPut } from '../../../lib/api';

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [instituteType, setInstituteType] = useState('college');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedProfile = localStorage.getItem('iris_user_profile');
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          setInstituteType(parsed.institute_type || 'college');
        } catch (e) {}
      }
    }
  }, []);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    roll_number: '',
    department_id: 'a0000000-0000-0000-0000-000000000001', // SIET CSE Mock Block
    semester: 1,
    batch_year: '2024-2028',
    dob: '2005-01-01',
    gender: 'Male',
    blood_group: 'O+',
    guardian_name: '',
    guardian_phone: '',
    address: '',
    fingerprint_id: ''
  });

  useEffect(() => {
    fetchStudents();
  }, [selectedDept, selectedBatch]);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const res = await apiGet('/core/students', {
        department_id: selectedDept,
        batch: selectedBatch
      });
      if (res.success) {
        setStudents(res.students || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      if (instituteType === 'school') {
        submitData.email = `${formData.roll_number.toLowerCase()}@school.internal`;
      }
      const res = await apiPost('/core/students', submitData);
      if (res.success) {
        setShowAddModal(false);
        fetchStudents();
        alert('Student registered successfully!');
      } else {
        alert(res.error || 'Failed to enroll student.');
      }
    } catch (err) {
      alert('Error connecting to enrollment server.');
    }
  };

  const openEdit = (student: any) => {
    setEditingStudent(student);
    setFormData({
      name: student.name || '',
      email: student.users?.email || '',
      roll_number: student.roll_number || '',
      department_id: student.department_id || 'a0000000-0000-0000-0000-000000000001',
      semester: student.semester || 1,
      batch_year: student.batch_year || '',
      dob: student.dob || '',
      gender: student.gender || '',
      blood_group: student.blood_group || '',
      guardian_name: student.guardian_name || '',
      guardian_phone: student.guardian_phone || '',
      address: student.address || '',
      fingerprint_id: student.fingerprint_id || '',
    });
    setShowAddModal(true);
  };

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    try {
      const submitData = { ...formData };
      const res = await apiPut(`/core/students/${editingStudent.id}`, submitData);
      if (res.success) {
        setShowAddModal(false);
        setEditingStudent(null);
        fetchStudents();
        alert('Student updated successfully!');
      } else {
        alert(res.error || 'Failed to update student.');
      }
    } catch (err) {
      alert('Error connecting to server.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this student and their authentication profile?')) return;
    try {
      const res = await apiDelete(`/core/students/${id}`);
      if (res.success) {
        fetchStudents();
        alert('Student profile removed.');
      }
    } catch (err) {
      alert('Delete operation failed.');
    }
  };

  const handleBulkImportMock = async () => {
    const mockStudents = {
      records: [
        {
          name: 'Rohit Sharma',
          email: 'rohit@siet.edu.in',
          roll_number: 'CSE-2026-90',
          department_id: 'a0000000-0000-0000-0000-000000000001',
          semester: 4,
          batch_year: '2024-2028',
          dob: '2005-04-30',
          gender: 'Male'
        },
        {
          name: 'Pooja Vyas',
          email: 'pooja.vyas@siet.edu.in',
          roll_number: 'CSE-2026-91',
          department_id: 'a0000000-0000-0000-0000-000000000001',
          semester: 4,
          batch_year: '2024-2028',
          dob: '2005-11-12',
          gender: 'Female'
        }
      ]
    };

    try {
      const res = await apiPost('/core/students/import', mockStudents);
      if (res.success) {
        fetchStudents();
        alert(`Successfully imported ${res.count} student profiles in sandbox mode!`);
      }
    } catch (err) {
      alert('Import failed.');
    }
  };

  const filtered = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.roll_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.users?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        
        {/* Header Section */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 flex items-center justify-center text-[#A78BFA]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-heading font-extrabold text-2xl text-white">Student Enrollment Directory</h1>
              <p className="text-xs text-[#C4B5FD]/70 font-light">Manage campus admissions, student profiles, and batch configurations.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <a 
              href="/admin/import/students"
              className="px-4 py-2.5 rounded-xl border border-violet-500/30 bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <Upload className="w-4 h-4" /> Import Students
            </a>
            <button 
              onClick={() => { setEditingStudent(null); setShowAddModal(true); }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] hover:brightness-110 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-[#6C2BD9]/25 transition-all"
            >
              <PlusCircle className="w-4 h-4" /> Enroll Student
            </button>
          </div>
        </div>

        {/* Filters and search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#13102A] p-4 rounded-2xl border border-white/5">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3.5 text-[#C4B5FD]/50" />
            <input 
              type="text" 
              placeholder="Search by name, roll, or email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-[#6C2BD9]/20 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-white/20 outline-none focus:border-[#8B5CF6]"
            />
          </div>

          <select 
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-black/40 border border-[#6C2BD9]/20 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#8B5CF6]"
          >
            <option value="">All Departments</option>
            <option value="a0000000-0000-0000-0000-000000000001">Computer Science (CSE)</option>
          </select>

          <select 
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="bg-black/40 border border-[#6C2BD9]/20 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#8B5CF6]"
          >
            <option value="">All Batches</option>
            <option value="2024-2028">2024-2028</option>
            <option value="2023-2027">2023-2027</option>
          </select>
        </div>

        {/* Student Directory Grid */}
        <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-white/5 text-[#C4B5FD] font-semibold border-b border-white/5">
                  <th className="p-4">Roll Number</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">{instituteType === 'school' ? 'Grade / Standard' : 'Semester'}</th>
                  <th className="p-4">Guardian Details</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[#C4B5FD]">Loading directory logs...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[#C4B5FD]/50">No enrolled students match current query filters.</td>
                  </tr>
                ) : (
                  filtered.map((student) => (
                    <tr key={student.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-mono font-bold text-white">{student.roll_number}</td>
                      <td className="p-4">
                        <div className="font-semibold text-white">{student.name}</div>
                        <div className="text-[10px] text-[#C4B5FD]/70">Batch: {student.batch_year}</div>
                      </td>
                      <td className="p-4 text-[#C4B5FD]/80">{student.users?.email || 'N/A'}</td>
                      <td className="p-4 font-semibold text-white">{instituteType === 'school' ? `Grade ${student.semester}` : `Sem ${student.semester}`}</td>
                      <td className="p-4">
                        <div className="text-[#C4B5FD]">{student.guardian_name || 'N/A'}</div>
                        <div className="text-[10px] text-[#C4B5FD]/50">{student.guardian_phone || ''}</div>
                      </td>
                      <td className="p-4 text-center flex items-center justify-center gap-2">
                        <button 
                          onClick={() => openEdit(student)}
                          className="w-7 h-7 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 flex items-center justify-center transition-colors"
                          title="Edit Student"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(student.id)}
                          className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-colors"
                          title="Expel Student"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Add/Edit Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#13102A] border border-[#6C2BD9]/30 rounded-2xl p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <h3 className="font-heading font-bold text-lg text-white mb-4">{editingStudent ? 'Edit Student' : 'Enroll New Student'}</h3>
            
            <form onSubmit={editingStudent ? handleEditStudent : handleAddStudent} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className={`flex flex-col gap-1 ${instituteType === 'school' ? 'col-span-2' : ''}`}>
                  <label className="text-[#C4B5FD]">Full Name</label>
                  <input 
                    type="text" required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder=""
                    className="bg-black/40 border border-[#6C2BD9]/30 p-2.5 rounded-xl text-white outline-none focus:border-[#8B5CF6]"
                  />
                </div>
                {instituteType !== 'school' && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[#C4B5FD]">Institutional Email</label>
                    <input 
                      type="email" required={instituteType !== 'school'}
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder=""
                      className="bg-black/40 border border-[#6C2BD9]/30 p-2.5 rounded-xl text-white outline-none focus:border-[#8B5CF6]"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[#C4B5FD]">Roll Number</label>
                  <input 
                    type="text" required
                    value={formData.roll_number}
                    onChange={(e) => setFormData({...formData, roll_number: e.target.value})}
                    placeholder="CSE-2026-45"
                    className="bg-black/40 border border-[#6C2BD9]/30 p-2.5 rounded-xl text-white outline-none focus:border-[#8B5CF6]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[#C4B5FD]">Biometric Fingerprint ID (Optional)</label>
                  <input 
                    type="text"
                    value={formData.fingerprint_id}
                    onChange={(e) => setFormData({...formData, fingerprint_id: e.target.value})}
                    placeholder="FP_90829_CSE"
                    className="bg-black/40 border border-[#6C2BD9]/30 p-2.5 rounded-xl text-white outline-none focus:border-[#8B5CF6]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[#C4B5FD]">{instituteType === 'school' ? 'Grade / Standard' : 'Semester'}</label>
                  <input 
                    type="number" required min={1}
                    value={formData.semester}
                    onChange={(e) => setFormData({...formData, semester: Number(e.target.value)})}
                    className="bg-black/40 border border-[#6C2BD9]/30 p-2.5 rounded-xl text-white outline-none focus:border-[#8B5CF6]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[#C4B5FD]">Batch Year</label>
                  <input 
                    type="text" required
                    value={formData.batch_year}
                    onChange={(e) => setFormData({...formData, batch_year: e.target.value})}
                    placeholder="2024-2028"
                    className="bg-black/40 border border-[#6C2BD9]/30 p-2.5 rounded-xl text-white outline-none focus:border-[#8B5CF6]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[#C4B5FD]">Guardian Name</label>
                  <input 
                    type="text" required
                    value={formData.guardian_name}
                    onChange={(e) => setFormData({...formData, guardian_name: e.target.value})}
                    placeholder="S. R. Gehlot"
                    className="bg-black/40 border border-[#6C2BD9]/30 p-2.5 rounded-xl text-white outline-none focus:border-[#8B5CF6]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[#C4B5FD]">Guardian Phone</label>
                  <input 
                    type="text" required
                    value={formData.guardian_phone}
                    onChange={(e) => setFormData({...formData, guardian_phone: e.target.value})}
                    placeholder="+91 99999 88888"
                    className="bg-black/40 border border-[#6C2BD9]/30 p-2.5 rounded-xl text-white outline-none focus:border-[#8B5CF6]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button 
                  type="button"
                  onClick={() => { setShowAddModal(false); setEditingStudent(null); }}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] hover:brightness-110 text-white font-bold"
                >
                  {editingStudent ? 'Update Student' : 'Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
