"use client";

import React, { useState, useEffect } from 'react';
import { apiGet, apiPost } from '../../../lib/api';
import { 
  FileText, Upload, CheckCircle, AlertTriangle, Clock, RefreshCw, Eye, ArrowUp, AlertCircle
} from 'lucide-react';

interface DocumentRecord {
  id: string;
  doc_type: string;
  doc_url: string;
  file_name: string;
  file_size_kb: number;
  is_verified: boolean;
  rejection_reason?: string | null;
  uploaded_at: string;
}

const REQUIRED_DOCS = [
  { type: 'photo', label: 'Passport Photo', desc: 'Recent color photo, JPEG format (max 50KB)' },
  { type: 'signature', label: 'Candidate Signature', desc: 'Black ink signature on white paper, JPEG format (max 50KB)' },
  { type: 'marksheet_10th', label: '10th Class Marksheet', desc: 'Scan of original certificate, PDF/PNG (max 2MB)' },
  { type: 'marksheet_12th', label: '12th Class Marksheet', desc: 'Scan of original certificate, PDF/PNG (max 2MB)' },
  { type: 'aadhar_card', label: 'Aadhar Card Scan', desc: 'Front and back compiled scan, PDF/PNG (max 2MB)' }
];

export default function DocumentCenterPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  async function fetchDocuments(silent = false) {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    
    try {
      const res = await apiGet('/admissions/application/my');
      if (res.success) {
        setDocuments(res.documents || []);
      } else {
        throw new Error(res.error);
      }
    } catch {
      // Offline fallback mock data
      const mockDocs: DocumentRecord[] = [
        {
          id: 'doc-1',
          doc_type: 'photo',
          doc_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150',
          file_name: 'khushal_photo.jpg',
          file_size_kb: 45,
          is_verified: true,
          rejection_reason: null,
          uploaded_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'doc-2',
          doc_type: 'signature',
          doc_url: 'https://supabase.co/storage/v1/object/public/documents/signature.png',
          file_name: 'signature_copy.png',
          file_size_kb: 22,
          is_verified: true,
          rejection_reason: null,
          uploaded_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'doc-3',
          doc_type: 'marksheet_10th',
          doc_url: 'https://supabase.co/storage/v1/object/public/documents/marksheet10.pdf',
          file_name: 'marksheet_10th_original.pdf',
          file_size_kb: 1024,
          is_verified: true,
          rejection_reason: null,
          uploaded_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'doc-4',
          doc_type: 'marksheet_12th',
          doc_url: 'https://supabase.co/storage/v1/object/public/documents/marksheet12.pdf',
          file_name: 'marksheet_12th_board.pdf',
          file_size_kb: 1120,
          is_verified: false,
          rejection_reason: 'Scan is blurred. The marks percentage in the Chemistry column is unreadable. Please upload a clear high-resolution scan.',
          uploaded_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      setDocuments(mockDocs);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileUploadMock = async (docType: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    setUploadingDoc(docType);
    setUploadProgress(10);

    // Simulate upload progress animation
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 25;
      });
    }, 150);

    // Prepare mock Supabase storage upload response URL
    const mockStorageUrl = `https://supabase.co/storage/v1/object/public/documents/${docType}_uploaded_${Date.now()}.pdf`;
    
    setTimeout(async () => {
      clearInterval(interval);
      setUploadProgress(100);

      const payload = {
        doc_type: docType,
        doc_url: mockStorageUrl,
        file_name: file.name,
        file_size_kb: Math.round(file.size / 1024)
      };

      try {
        const res = await apiPost('/documents/upload', payload);
        if (res.success) {
          await fetchDocuments(true);
        } else {
          throw new Error(res.error);
        }
      } catch (err: any) {
        console.warn('Backend database post failed. Simulating local insert.');
        // Local simulation fallback
        const mockNewDoc: DocumentRecord = {
          id: `doc-mock-${Date.now()}`,
          doc_type: docType,
          doc_url: mockStorageUrl,
          file_name: file.name,
          file_size_kb: Math.round(file.size / 1024),
          is_verified: false,
          rejection_reason: null,
          uploaded_at: new Date().toISOString()
        };

        setDocuments(prev => {
          // Remove old document of same type
          const filtered = prev.filter(d => d.doc_type !== docType);
          return [...filtered, mockNewDoc];
        });
      } finally {
        setTimeout(() => {
          setUploadingDoc(null);
          setUploadProgress(0);
        }, 300);
      }
    }, 1000);
  };

  const getDocStatus = (docType: string) => {
    const doc = documents.find(d => d.doc_type === docType);
    if (!doc) return { status: 'missing', label: 'Not Uploaded', color: 'text-red-400 bg-red-500/10 border-red-500/20' };
    
    if (doc.is_verified) {
      return { status: 'verified', label: 'Verified', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', docRecord: doc };
    }
    
    if (doc.rejection_reason) {
      return { status: 'rejected', label: 'Rejected', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', docRecord: doc };
    }
    
    return { status: 'pending', label: 'Pending Verification', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', docRecord: doc };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-[#6C2BD9]/30 border-t-[#6C2BD9] animate-spin"></div>
        <p className="text-sm text-[#C4B5FD]/70 font-mono">Loading Document Center...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="flex justify-between items-center border-b border-[#6C2BD9]/20 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#A78BFA]" />
            Document Verification Center
          </h1>
          <p className="text-xs text-[#C4B5FD]/70 mt-1">Upload required certificates. Any files flagged with rejection notes can be re-uploaded here.</p>
        </div>

        <button
          onClick={() => fetchDocuments(true)}
          disabled={refreshing}
          className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-[#C4B5FD] hover:text-white transition-all disabled:opacity-50"
          title="Refresh List"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main Checklist Card */}
      <div className="rounded-3xl border border-white/5 bg-[#13102A]/40 p-6 shadow-xl space-y-6">
        <div className="space-y-4">
          {REQUIRED_DOCS.map((reqDoc) => {
            const { status, label, color, docRecord } = getDocStatus(reqDoc.type);
            const isUploading = uploadingDoc === reqDoc.type;

            return (
              <div 
                key={reqDoc.type}
                className="p-5 rounded-2xl bg-[#0D0A1A]/60 border border-white/5 space-y-4 hover:border-[#6C2BD9]/25 transition-all duration-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">{reqDoc.label}</h4>
                    <p className="text-xs text-[#C4B5FD]/50 max-w-md">{reqDoc.desc}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${color}`}>
                      {label}
                    </span>

                    {/* Action buttons depending on state */}
                    {status === 'verified' && docRecord && (
                      <a 
                        href={docRecord.doc_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-[#C4B5FD] hover:text-white transition-all text-xs flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </a>
                    )}

                    {status === 'pending' && docRecord && (
                      <div className="flex gap-2">
                        <a 
                          href={docRecord.doc_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-[#C4B5FD] hover:text-white transition-all text-xs flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" /> Inspect
                        </a>
                        <label className="p-2 rounded-xl bg-[#6C2BD9]/10 hover:bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 text-[#A78BFA] hover:text-white cursor-pointer transition-all text-xs flex items-center gap-1.5">
                          <Upload className="w-3.5 h-3.5" /> Update
                          <input 
                            type="file" 
                            className="hidden" 
                            accept=".jpg,.jpeg,.png,.pdf" 
                            onChange={(e) => handleFileUploadMock(reqDoc.type, e)}
                          />
                        </label>
                      </div>
                    )}

                    {(status === 'missing' || status === 'rejected') && (
                      <label className="py-2 px-4 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] hover:brightness-110 text-white font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5 shadow-md shadow-[#6C2BD9]/20">
                        <Upload className="w-3.5 h-3.5" /> {status === 'rejected' ? 'Re-upload' : 'Upload File'}
                        <input 
                          type="file" 
                          className="hidden" 
                          accept=".jpg,.jpeg,.png,.pdf" 
                          onChange={(e) => handleFileUploadMock(reqDoc.type, e)}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* File Details if uploaded */}
                {docRecord && (
                  <div className="flex justify-between items-center bg-[#13102A]/40 px-4 py-2 rounded-xl text-[10px] text-[#C4B5FD]/50 border border-white/5">
                    <span>Uploaded Name: <strong className="text-white/80">{docRecord.file_name}</strong></span>
                    <span>File size: <strong className="text-white/80">{docRecord.file_size_kb} KB</strong></span>
                    <span>Uploaded: <strong className="text-white/80">{new Date(docRecord.uploaded_at).toLocaleDateString()}</strong></span>
                  </div>
                )}

                {/* Upload progress state */}
                {isUploading && (
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-[10px] font-mono text-[#A78BFA]">
                      <span>Uploading document sequence...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}

                {/* Rejection Note */}
                {status === 'rejected' && docRecord?.rejection_reason && (
                  <div className="p-3.5 rounded-xl bg-red-500/5 border border-red-500/20 text-xs flex gap-2">
                    <AlertCircle className="w-4.5 h-4.5 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-red-400">Admissions Officer Rejection Note:</span>
                      <p className="text-[#C4B5FD]/80 mt-1 leading-relaxed">{docRecord.rejection_reason}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
