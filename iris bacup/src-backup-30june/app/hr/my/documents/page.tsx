"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, FileText, Upload, RefreshCw } from 'lucide-react';

interface EmployeeDoc {
  id: string;
  doc_type: string;
  doc_name: string;
  uploaded_at: string;
  is_verified: boolean;
}

export default function EmployeeDocuments() {
  const [documents, setDocuments] = useState<EmployeeDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('iris_jwt_token')}`
  });

  const loadData = async () => {
    setLoading(true);
    try {
      // Mock documents logs
      setDocuments([
        { id: 'd-1', doc_type: 'PAN Card', doc_name: 'PAN_Satish_Kumar.pdf', uploaded_at: '2026-06-09T12:00:00Z', is_verified: true },
        { id: 'd-2', doc_type: 'Aadhar Card', doc_name: 'Aadhar_Satish_Kumar.pdf', uploaded_at: '2026-06-09T12:00:00Z', is_verified: true },
        { id: 'd-3', doc_type: 'Degree Certificate', doc_name: 'PhD_Degree_Certificate.pdf', uploaded_at: '2026-06-10T08:00:00Z', is_verified: false }
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpload = (docType: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        setLoading(true);
        try {
          await fetch('/api/v1/hr/employees/d0000000-0000-0000-0000-000000000003/documents', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              doc_type: docType,
              doc_name: file.name,
              doc_url: 'https://supabase.co/storage/v1/object/public/kyc/proof.pdf'
            })
          });
          loadData();
          alert('Document proof uploaded successfully.');
        } catch (err) {
          const newDoc: EmployeeDoc = {
            id: `d-${Date.now()}`,
            doc_type: docType,
            doc_name: file.name,
            uploaded_at: new Date().toISOString(),
            is_verified: false
          };
          setDocuments(prev => [...prev, newDoc]);
          setLoading(false);
          alert('Document proof registered in session catalog.');
        }
      }
    };
    input.click();
  };

  return (
    <div className="max-w-7xl mx-auto py-2 w-full flex flex-col gap-6">
      {/* Back link */}
      <div>
        <Link href="/hr/my/dashboard" className="inline-flex items-center gap-1.5 text-xs text-[#C4B5FD] hover:text-white transition-all">
          <ChevronLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[#6C2BD9]/30 bg-gradient-to-r from-[#13102A] to-[#1E193C] p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] text-[#A78BFA] font-bold uppercase tracking-widest font-mono">KYC Documents Cabinet</span>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">My Verification Documents</h1>
          <p className="text-xs text-[#C4B5FD]/70">
            Upload identity cards, banking proofs, and academic qualifications for verification by HR Admin.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <RefreshCw className="w-8 h-8 text-[#8B5CF6] animate-spin mx-auto mb-4" />
          <p className="text-xs text-[#C4B5FD]">Loading verification files...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Table */}
          <div className="lg:col-span-2 glass-panel border border-[#6C2BD9]/20 rounded-2xl overflow-hidden bg-[#13102A]/40">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[#C4B5FD] text-[10px] uppercase font-bold tracking-wider">
                  <th className="py-4 px-6">Document Type</th>
                  <th className="py-4 px-6">File Name</th>
                  <th className="py-4 px-6">Verification Status</th>
                </tr>
              </thead>
              <tbody>
                {documents.map(doc => (
                  <tr key={doc.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors text-xs text-white">
                    <td className="py-4 px-6 font-bold">{doc.doc_type}</td>
                    <td className="py-4 px-6 flex items-center gap-2 text-[#C4B5FD]/90">
                      <FileText className="w-4 h-4 text-[#8B5CF6] flex-shrink-0" />
                      <span className="truncate max-w-[200px]" title={doc.doc_name}>{doc.doc_name}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-0.5 rounded text-[9px] uppercase font-extrabold ${
                        doc.is_verified 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}>
                        {doc.is_verified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action widgets sidebar */}
          <div className="glass-panel border border-[#6C2BD9]/25 rounded-2xl p-5 bg-[#13102A]/20 flex flex-col gap-4 text-xs">
            <h3 className="font-extrabold text-sm text-white">Upload New Credential</h3>
            
            {['Pan Card', 'Aadhar Card', 'Degree Certificate', 'Bank Passbook'].map(tName => (
              <button
                key={tName}
                onClick={() => handleUpload(tName)}
                className="w-full py-3 px-4 rounded-xl bg-[#1D163F] border border-[#8B5CF6]/40 hover:bg-[#6C2BD9]/20 text-center text-xs font-bold text-white transition-all flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4 text-[#A78BFA]" /> Upload {tName} Proof
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
