"use client";

import React, { useState, useEffect } from 'react';
import {
  UserPlus, Upload, FileText, CheckCircle2, XCircle, Clock,
  ChevronDown, Search, Filter, Download, ArrowLeft
} from 'lucide-react';
import { apiGet, apiPost, apiPut } from '../../../../lib/api';
import Link from 'next/link';
import * as XLSX from 'xlsx';

interface Admission {
  id: string;
  applicant_name: string;
  email: string;
  phone: string;
  roll_number: string;
  admission_status: string;
  application_number: string;
  admission_year: number;
  semester: number;
  departments?: { name: string };
  admission_documents?: any[];
  guardian_name: string;
  dob: string;
  gender: string;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  applied: 'bg-blue-500/20 text-blue-400',
  documents_pending: 'bg-amber-500/20 text-amber-400',
  under_review: 'bg-violet-500/20 text-violet-400',
  approved: 'bg-emerald-500/20 text-emerald-400',
  enrolled: 'bg-green-500/20 text-green-400',
  rejected: 'bg-red-500/20 text-red-400',
  waitlisted: 'bg-slate-500/20 text-slate-400',
};

const STATUSES = ['applied', 'documents_pending', 'under_review', 'approved', 'enrolled', 'rejected', 'waitlisted'];

export default function AdminAdmissionsPage() {
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Admission form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    applicant_name: '', email: '', phone: '', department_id: '', semester: '1',
    batch_year: new Date().getFullYear().toString(), guardian_name: '', guardian_phone: '',
    dob: '', gender: '', address: '', category: '', blood_group: '', aadhaar_number: '',
  });
  const [departments, setDepartments] = useState<any[]>([]);

  // CSV import
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      let data = null;
      let error = null;
      try {
        const deptRes = await apiGet('campusCore/users/departments', { 
          institution_id: JSON.parse(localStorage.getItem('iris_user_profile') || '{}').institution_id 
        });
        data = deptRes;
        if (!deptRes.success) {
          error = deptRes.error || 'Failed response';
        }
        setDepartments(deptRes.departments || []);
      } catch (err: any) {
        error = err;
        setDepartments([]);
      }
      console.log('Departments fetched:', data, 'Error:', error);
    };
    load();
  }, []);

  const fetchAdmissions = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      const res = await apiGet('campusCore/admissions/list', params);
      if (res.success) setAdmissions(res.admissions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAdmissions(); }, [statusFilter]);

  const handleCreateAdmission = async () => {
    if (!form.applicant_name) return;
    try {
      const res = await apiPost('campusCore/admissions/new', form);
      if (res.success) {
        setShowForm(false);
        setForm({
          applicant_name: '', email: '', phone: '', department_id: '', semester: '1',
          batch_year: new Date().getFullYear().toString(), guardian_name: '', guardian_phone: '',
          dob: '', gender: '', address: '', category: '', blood_group: '', aadhaar_number: '',
        });
        fetchAdmissions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    const res = await apiPut(`campusCore/admissions/${id}/status`, { status });
    if (res.success) fetchAdmissions();
  };

  const handleCsvImport = async () => {
    if (!csvFile) return;
    const isExcel = csvFile.name.endsWith('.xlsx') || csvFile.name.endsWith('.xls') || csvFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || csvFile.type === 'application/vnd.ms-excel';

    let records: any[] = [];
    if (isExcel) {
      const reader = new FileReader();
      const promise = new Promise<any[]>((resolve, reject) => {
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            if (!firstSheetName) {
              reject(new Error('Excel file is empty'));
              return;
            }
            const worksheet = workbook.Sheets[firstSheetName];
            const rawRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '' });
            if (rawRows.length === 0) {
              reject(new Error('Excel sheet is empty'));
              return;
            }
            const headers = (rawRows[0] || []).map(h => String(h).trim().toLowerCase()).filter(h => h !== '');
            const parsed = rawRows.slice(1).map(row => {
              const obj: any = {};
              headers.forEach((h, index) => {
                obj[h] = row[index] !== undefined ? String(row[index]).trim() : '';
              });
              return obj;
            }).filter(row => Object.values(row).some(v => v !== ''));
            resolve(parsed);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = () => reject(new Error('File reading failed'));
        reader.readAsArrayBuffer(csvFile);
      });
      try {
        records = await promise;
      } catch (err: any) {
        setImportResult({ success: false, error: err.message });
        return;
      }
    } else {
      const text = await csvFile.text();
      const lines = text.split('\n').filter(l => l.trim());
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      records = lines.slice(1).map(line => {
        const values = line.split(',');
        const obj: any = {};
        headers.forEach((h, i) => { obj[h] = values[i]?.trim() || ''; });
        return obj;
      });
    }

    const res = await apiPost('campusCore/admissions/bulk', { students: records });
    setImportResult(res);
    if (res.success) fetchAdmissions();
  };

  const filtered = admissions.filter(a =>
    !searchQuery || a.applicant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.application_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard" className="text-slate-400 hover:text-white">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <UserPlus size={24} className="text-blue-400" />
            Student Admissions
          </h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowCsvImport(true)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 text-sm flex items-center gap-2">
            <Upload size={16} /> CSV/Excel Import
          </button>
          <button onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 text-sm flex items-center gap-2">
            <UserPlus size={16} /> New Admission
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {['applied', 'under_review', 'approved', 'enrolled'].map(s => (
          <div key={s} className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <p className="text-2xl font-bold text-white">
              {admissions.filter(a => a.admission_status === s).length}
            </p>
            <p className="text-xs text-slate-400 capitalize">{s.replace('_', ' ')}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name or application number..."
            className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-3 py-2 text-white text-sm" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">
          <option value="">All Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
      </div>

      {/* Admissions List */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <UserPlus size={40} className="mx-auto mb-3 opacity-50" />
          <p>No admissions found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => (
            <div key={a.id} className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
              <div className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">
                    {a.applicant_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{a.applicant_name}</p>
                    <p className="text-xs text-slate-400">{a.application_number} — {a.departments?.name || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[a.admission_status]}`}>
                    {a.admission_status.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-slate-400">
                    {a.admission_documents?.length || 0} docs
                  </span>
                </div>
              </div>

              {expandedId === a.id && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div><p className="text-xs text-slate-400">Email</p><p className="text-sm text-white">{a.email || '—'}</p></div>
                    <div><p className="text-xs text-slate-400">Phone</p><p className="text-sm text-white">{a.phone || '—'}</p></div>
                    <div><p className="text-xs text-slate-400">Guardian</p><p className="text-sm text-white">{a.guardian_name || '—'}</p></div>
                    <div><p className="text-xs text-slate-400">DOB</p><p className="text-sm text-white">{a.dob || '—'}</p></div>
                  </div>
                  <div className="flex gap-2">
                    {STATUSES.map(s => (
                      <button key={s} onClick={() => handleStatusUpdate(a.id, s)}
                        className={`px-3 py-1 rounded text-xs capitalize ${
                          a.admission_status === s ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}>
                        {s.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New Admission Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-2xl border border-white/10 max-h-[85vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">New Student Admission</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Full Name *', key: 'applicant_name', type: 'text', span: 2 },
                { label: 'Email', key: 'email', type: 'email' },
                { label: 'Phone', key: 'phone', type: 'tel' },
                { label: 'Department', key: 'department_id', type: 'select', options: departments.map(d => ({ value: d.id, label: d.name })) },
                { label: 'Semester', key: 'semester', type: 'select', options: Array.from({length:8},(_,i)=>({value:String(i+1),label:`Sem ${i+1}`})) },
                { label: 'Batch Year', key: 'batch_year', type: 'text' },
                { label: 'Guardian Name', key: 'guardian_name', type: 'text' },
                { label: 'Guardian Phone', key: 'guardian_phone', type: 'tel' },
                { label: 'DOB', key: 'dob', type: 'date' },
                { label: 'Gender', key: 'gender', type: 'select', options: [{value:'Male',label:'Male'},{value:'Female',label:'Female'},{value:'Other',label:'Other'}] },
                { label: 'Category', key: 'category', type: 'select', options: [{value:'General',label:'General'},{value:'OBC',label:'OBC'},{value:'SC',label:'SC'},{value:'ST',label:'ST'},{value:'EWS',label:'EWS'}] },
                { label: 'Blood Group', key: 'blood_group', type: 'select', options: [{value:'A+',label:'A+'},{value:'A-',label:'A-'},{value:'B+',label:'B+'},{value:'B-',label:'B-'},{value:'O+',label:'O+'},{value:'O-',label:'O-'},{value:'AB+',label:'AB+'},{value:'AB-',label:'AB-'}] },
                { label: 'Aadhaar Number', key: 'aadhaar_number', type: 'text' },
              ].map(f => (
                <div key={f.key} className={f.span === 2 ? 'col-span-2' : ''}>
                  <label className="text-sm text-slate-300 mb-1 block">{f.label}</label>
                  {f.type === 'select' ? (
                    <select value={(form as any)[f.key]} onChange={e => setForm({...form, [f.key]: e.target.value})}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">
                      <option value="">Select</option>
                      {f.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : (
                    <input type={f.type} value={(form as any)[f.key]}
                      onChange={e => setForm({...form, [f.key]: e.target.value})}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleCreateAdmission}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 text-sm">Create Admission</button>
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showCsvImport && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-lg border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">CSV/Excel Bulk Import</h3>
            <p className="text-sm text-slate-400 mb-3">
              Upload a CSV or Excel file with columns: name, email, roll_number, department_id, semester, batch_year, dob, gender, phone, guardian_name, guardian_phone
            </p>
            <input type="file" accept=".csv,.xlsx,.xls"
              onChange={e => setCsvFile(e.target.files?.[0] || null)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-violet-600 file:text-white file:text-sm" />
            {importResult && (
              <div className={`mt-3 p-3 rounded text-sm ${importResult.success ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                {importResult.success ? `Imported: ${importResult.imported}, Errors: ${importResult.errors}` : importResult.error}
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <button onClick={handleCsvImport} disabled={!csvFile}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 text-sm disabled:opacity-50">Import</button>
              <button onClick={() => { setShowCsvImport(false); setCsvFile(null); setImportResult(null); }}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
