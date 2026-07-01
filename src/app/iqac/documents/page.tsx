"use client";

import React, { useState, useEffect } from 'react';
import { FileText, Download, Trash, RefreshCw } from 'lucide-react';

interface SsrDocument {
  id: string;
  criterion: string;
  document_name: string;
  document_url: string;
  academic_year: string;
  uploaded_by: string;
  created_at: string;
}

export default function IqacDocumentsVault() {
  const [documents, setDocuments] = useState<SsrDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('iris_jwt_token')}`
  });

  const loadDocuments = async () => {
    setLoading(true);
    try {
      // Mock documents database matching the user uploads
      setDocuments([]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this evidence file from the SSR document catalog?')) {
      setDocuments(prev => prev.filter(d => d.id !== id));
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-2 w-full flex flex-col gap-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[#6C2BD9]/30 bg-gradient-to-r from-[#13102A] to-[#1E193C] p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] text-[#A78BFA] font-bold uppercase tracking-widest font-mono">Evidence Archives</span>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">SSR Documents Vault</h1>
          <p className="text-xs text-[#C4B5FD]/70">
            Browse and download qualitative files and quantitative certificates uploaded across all metrics.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <RefreshCw className="w-8 h-8 text-[#8B5CF6] animate-spin mx-auto mb-4" />
          <p className="text-xs text-[#C4B5FD]">Opening vault cabinet...</p>
        </div>
      ) : (
        <div className="glass-panel border border-[#6C2BD9]/20 rounded-2xl overflow-hidden bg-[#13102A]/40">
          <div className="p-6 border-b border-white/5">
            <h3 className="font-extrabold text-sm text-white">Accreditation Evidence Files Catalog</h3>
          </div>
          
          {documents.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#C4B5FD]/50">No documents found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[#C4B5FD] text-[10px] uppercase font-bold tracking-wider">
                    <th className="py-4 px-6">Document Name</th>
                    <th className="py-4 px-6">Criteria Category</th>
                    <th className="py-4 px-6">Academic Year</th>
                    <th className="py-4 px-6">Uploaded By</th>
                    <th className="py-4 px-6">Upload Timestamp</th>
                    <th className="py-4 px-6 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map(doc => (
                    <tr key={doc.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors text-xs text-white">
                      <td className="py-4 px-6 flex items-center gap-2.5 font-bold">
                        <FileText className="w-4 h-4 text-[#8B5CF6] flex-shrink-0" />
                        <span className="truncate max-w-[240px]" title={doc.document_name}>{doc.document_name}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-[10px] font-bold text-[#A78BFA] px-2.5 py-0.5 rounded bg-[#6C2BD9]/15 border border-[#8B5CF6]/30">
                          {doc.criterion}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-[#C4B5FD]/80">{doc.academic_year}</td>
                      <td className="py-4 px-6 text-[#C4B5FD] font-semibold">{doc.uploaded_by}</td>
                      <td className="py-4 px-6 text-[10px] text-[#C4B5FD]/50 font-mono">
                        {new Date(doc.created_at).toLocaleString()}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => alert('Downloading evidence archive file...')}
                            className="p-1.5 rounded bg-[#6C2BD9]/20 hover:bg-[#6C2BD9]/40 border border-[#6C2BD9]/30 text-[#A78BFA] transition-all"
                            title="Download File"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 transition-all"
                            title="Delete File"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
