'use client';
import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, FileSpreadsheet, AlertCircle, CheckCircle2, 
  Download, Trash2, Loader2, ArrowLeft 
} from 'lucide-react';
import Link from 'next/link';
import { importAttendanceRecords } from '@/lib/api';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface ImportRow {
  student_roll: string;
  subject: string;
  date: string;
  status: string;
  method?: string;
  time_slot?: string;
}

interface ImportError {
  row: number;
  error: string;
}

const REQUIRED_COLUMNS = ['student_roll', 'subject', 'date', 'status'];
const VALID_STATUSES = ['present', 'absent', 'late', 'excused'];
const SAMPLE_CSV = `student_roll,subject,date,status,method,time_slot
CS23B1024,Mathematics,2026-06-01,present,manual,09:00-10:00
CS23B1024,Physics,2026-06-01,absent,manual,10:00-11:00
CS23B1025,Mathematics,2026-06-01,late,manual,09:00-10:00
CS23B1025,Physics,2026-06-01,present,manual,10:00-11:00`;

export default function AttendanceImportPage() {
  const [data, setData] = useState<ImportRow[]>([]);
  const [errors, setErrors] = useState<{ row: number; error: string }[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [importResult, setImportResult] = useState<{ imported: number; errors: number; error_details: ImportError[] } | null>(null);
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState('');
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawData, setRawData] = useState<any[]>([]);
  const [step, setStep] = useState<'upload' | 'map' | 'preview' | 'result'>('upload');
  const fileRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    setFileName(file.name);
    setErrors([]);
    setImportResult(null);

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.type === 'application/vnd.ms-excel';

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          if (!firstSheetName) {
            setErrors([{ row: 0, error: 'Excel file is empty (no sheets found)' }]);
            return;
          }
          const worksheet = workbook.Sheets[firstSheetName];
          const rawRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '' });
          
          if (rawRows.length === 0) {
            setErrors([{ row: 0, error: 'Excel sheet is empty' }]);
            return;
          }

          const headers = (rawRows[0] || []).map(h => String(h).trim()).filter(h => h !== '');
          const dataRows = rawRows.slice(1).map(row => {
            const obj: Record<string, any> = {};
            headers.forEach((h, index) => {
              obj[h] = row[index] !== undefined ? String(row[index]).trim() : '';
            });
            return obj;
          }).filter(row => Object.values(row).some(v => v !== ''));

          setRawHeaders(headers);
          setRawData(dataRows);

          // Auto-detect column mapping
          const mapping: Record<string, string> = {};
          REQUIRED_COLUMNS.forEach(req => {
            const match = headers.find(h => 
              h.toLowerCase().trim() === req.toLowerCase() ||
              h.toLowerCase().trim().replace(/[\s-]/g, '_') === req
            );
            if (match) mapping[req] = match;
          });
          setColumnMapping(mapping);
          setStep('map');
        } catch (err: any) {
          setErrors([{ row: 0, error: `Excel Parse Error: ${err.message}` }]);
        }
      };
      reader.onerror = () => {
        setErrors([{ row: 0, error: 'File reading failed' }]);
      };
      reader.readAsArrayBuffer(file);
    } else {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const headers = (results.meta.fields || []).map(h => h.trim());
          const rows = results.data as any[];
          setRawHeaders(headers);
          setRawData(rows);

          // Auto-detect column mapping
          const mapping: Record<string, string> = {};
          REQUIRED_COLUMNS.forEach(req => {
            const match = headers.find(h => 
              h.toLowerCase().trim() === req.toLowerCase() ||
              h.toLowerCase().trim().replace(/[\s-]/g, '_') === req
            );
            if (match) mapping[req] = match;
          });
          setColumnMapping(mapping);
          setStep('map');
        },
        error: (err) => {
          setErrors([{ row: 0, error: `CSV Parse Error: ${err.message}` }]);
        }
      });
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const mappedData = rawData.map((row) => {
    const mapped: ImportRow = {
      student_roll: row[columnMapping.student_roll] || '',
      subject: row[columnMapping.subject] || '',
      date: row[columnMapping.date] || '',
      status: row[columnMapping.status] || '',
      method: columnMapping.method ? row[columnMapping.method] : undefined,
      time_slot: columnMapping.time_slot ? row[columnMapping.time_slot] : undefined,
    };
    return mapped;
  });

  const validationErrors: { row: number; error: string }[] = [];
  mappedData.forEach((row, i) => {
    if (!row.student_roll) validationErrors.push({ row: i + 1, error: 'Missing student_roll' });
    if (!row.subject) validationErrors.push({ row: i + 1, error: 'Missing subject' });
    if (!row.date) validationErrors.push({ row: i + 1, error: 'Missing date' });
    if (!row.status || !VALID_STATUSES.includes(row.status.toLowerCase())) {
      validationErrors.push({ row: i + 1, error: `Invalid status: "${row.status}" (must be: ${VALID_STATUSES.join(', ')})` });
    }
  });

  const handleImport = async () => {
    setImporting(true);
    try {
      const result = await importAttendanceRecords(mappedData);
      if (result.success) {
        setImportResult(result as any);
        setStep('result');
      } else {
        setErrors([{ row: 0, error: result.error || 'Import failed' }]);
      }
    } catch (err: any) {
      setErrors([{ row: 0, error: err.message || 'Import failed' }]);
    } finally {
      setImporting(false);
    }
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attendance_import_sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setData([]);
    setErrors([]);
    setImportResult(null);
    setFileName('');
    setRawHeaders([]);
    setRawData([]);
    setColumnMapping({});
    setStep('upload');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#111641] to-[#0a0e27] p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/attendance" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Import Attendance Records</h1>
            <p className="text-sm text-gray-400 mt-1">Upload historical attendance data from CSV or Excel files</p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-3 mb-8">
          {(['upload', 'map', 'preview', 'result'] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-colors ${
                step === s ? 'bg-violet-600 text-white' : 
                (['upload', 'map', 'preview', 'result'].indexOf(step) > i ? 'bg-green-600/20 text-green-400' : 'bg-white/5 text-gray-500')
              }`}>
                {(['upload', 'map', 'preview', 'result'].indexOf(step) > i) ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-sm hidden sm:block ${step === s ? 'text-white' : 'text-gray-500'}`}>
                {s === 'upload' ? 'Upload' : s === 'map' ? 'Map Columns' : s === 'preview' ? 'Preview' : 'Result'}
              </span>
              {i < 3 && <div className="w-8 h-px bg-white/10" />}
            </div>
          ))}
        </div>

        {/* STEP 1: Upload */}
        {step === 'upload' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] p-8"
          >
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-white/10 rounded-2xl p-12 text-center hover:border-violet-500/30 transition-colors cursor-pointer"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-lg text-white font-medium mb-2">Drop your CSV or Excel file here</p>
              <p className="text-sm text-gray-400 mb-4">or click to browse</p>
              <p className="text-xs text-gray-500">Supports .csv, .xls, .xlsx files with headers</p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.tsv,.txt,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button onClick={downloadSample} className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors">
                <Download className="w-4 h-4" />
                Download sample CSV
              </button>
              <div className="text-xs text-gray-500">
                Required columns: {REQUIRED_COLUMNS.join(', ')}
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 2: Column Mapping */}
        {step === 'map' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] p-8"
          >
            <h2 className="text-lg font-bold text-white mb-6">Map Spreadsheet Columns</h2>
            <p className="text-sm text-gray-400 mb-6">
              Map your spreadsheet columns to the required fields. Auto-detected mappings are shown below.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {REQUIRED_COLUMNS.map(req => (
                <div key={req} className="flex items-center gap-3">
                  <label className="w-32 text-sm text-gray-300 font-medium">{req.replace(/_/g, ' ')}:</label>
                  <select
                    value={columnMapping[req] || ''}
                    onChange={(e) => setColumnMapping(prev => ({ ...prev, [req]: e.target.value }))}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-violet-500/50 focus:outline-none"
                  >
                    <option value="">-- Not mapped --</option>
                    {rawHeaders.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
              <div className="flex items-center gap-3">
                <label className="w-32 text-sm text-gray-300 font-medium">method (opt):</label>
                <select
                  value={columnMapping.method || ''}
                  onChange={(e) => setColumnMapping(prev => ({ ...prev, method: e.target.value || undefined }))}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-violet-500/50 focus:outline-none"
                >
                  <option value="">-- Not mapped --</option>
                  {rawHeaders.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <label className="w-32 text-sm text-gray-300 font-medium">time_slot (opt):</label>
                <select
                  value={columnMapping.time_slot || ''}
                  onChange={(e) => setColumnMapping(prev => ({ ...prev, time_slot: e.target.value || undefined }))}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-violet-500/50 focus:outline-none"
                >
                  <option value="">-- Not mapped --</option>
                  {rawHeaders.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            </div>

            {validationErrors.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 text-red-400 text-sm font-medium mb-2">
                  <AlertCircle className="w-4 h-4" />
                  {validationErrors.length} validation error(s) found
                </div>
                <div className="max-h-32 overflow-y-auto text-xs text-red-300/80 space-y-1">
                  {validationErrors.slice(0, 10).map((e, i) => (
                    <div key={i}>Row {e.row}: {e.error}</div>
                  ))}
                  {validationErrors.length > 10 && <div>...and {validationErrors.length - 10} more</div>}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <button onClick={() => setStep('upload')} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                Back
              </button>
              <button
                onClick={() => setStep('preview')}
                disabled={!columnMapping.student_roll || !columnMapping.subject || !columnMapping.date || !columnMapping.status}
                className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
              >
                Preview Data ({rawData.length} rows)
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: Preview */}
        {step === 'preview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] p-8"
          >
            <h2 className="text-lg font-bold text-white mb-2">Preview Import Data</h2>
            <p className="text-sm text-gray-400 mb-6">
              Review {mappedData.length} rows before importing. Rows with errors are highlighted.
            </p>

            <div className="overflow-x-auto rounded-xl border border-white/[0.06] mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white/[0.03]">
                    <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">#</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">Roll Number</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">Subject</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">Date</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">Status</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {mappedData.slice(0, 100).map((row, i) => {
                    const rowErrors = validationErrors.filter(e => e.row === i + 1);
                    const hasError = rowErrors.length > 0;
                    return (
                      <tr key={i} className={hasError ? 'bg-red-500/5' : 'hover:bg-white/[0.02]'}>
                        <td className="px-4 py-2.5 text-gray-500 text-xs">{i + 1}</td>
                        <td className="px-4 py-2.5 text-white text-xs font-mono">{row.student_roll}</td>
                        <td className="px-4 py-2.5 text-gray-300 text-xs">{row.subject}</td>
                        <td className="px-4 py-2.5 text-gray-300 text-xs">{row.date}</td>
                        <td className="px-4 py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            row.status === 'present' ? 'bg-green-500/10 text-green-400' :
                            row.status === 'absent' ? 'bg-red-500/10 text-red-400' :
                            row.status === 'late' ? 'bg-yellow-500/10 text-yellow-400' :
                            'bg-blue-500/10 text-blue-400'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-gray-400 text-xs">{row.method || 'manual'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {mappedData.length > 100 && (
                <div className="px-4 py-3 text-xs text-gray-500 border-t border-white/[0.04]">
                  Showing 100 of {mappedData.length} rows
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <button onClick={() => setStep('map')} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                Back
              </button>
              <button
                onClick={handleImport}
                disabled={importing || validationErrors.length > 0}
                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
              >
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {importing ? 'Importing...' : `Import ${mappedData.length} Records`}
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 4: Result */}
        {step === 'result' && importResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] p-8"
          >
            <div className="text-center mb-8">
              <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Import Complete</h2>
              <p className="text-gray-400">Your attendance data has been imported successfully.</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-green-400">{importResult.imported}</div>
                <div className="text-sm text-green-300/80 mt-1">Records Imported</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-gray-300">{importResult.errors}</div>
                <div className="text-sm text-gray-400 mt-1">Errors Skipped</div>
              </div>
            </div>

            {importResult.error_details && importResult.error_details.length > 0 && (
              <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 mb-8">
                <h3 className="text-sm font-medium text-red-400 mb-3">Error Details</h3>
                <div className="max-h-40 overflow-y-auto text-xs text-red-300/80 space-y-1">
                  {importResult.error_details.map((e, i) => (
                    <div key={i}>Row {e.row}: {e.error}</div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-4">
              <button onClick={reset} className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-xl transition-colors">
                Import More
              </button>
              <Link href="/admin/attendance" className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors">
                Back to Attendance
              </Link>
            </div>
          </motion.div>
        )}

        {/* Errors */}
        {errors.length > 0 && step !== 'result' && (
          <div className="mt-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 text-red-400 text-sm font-medium mb-2">
              <AlertCircle className="w-4 h-4" />
              Import Errors
            </div>
            <div className="text-xs text-red-300/80 space-y-1">
              {errors.map((e, i) => (
                <div key={i}>Row {e.row}: {e.error}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
