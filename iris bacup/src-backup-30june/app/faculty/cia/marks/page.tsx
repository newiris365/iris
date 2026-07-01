"use client";

import React, { useState, useEffect } from 'react';
import { FileText, ArrowLeft } from 'lucide-react';
import { apiGet } from '../../../../lib/api';
import Link from 'next/link';

export default function FacultyCiaMarksPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/faculty/cia" className="text-slate-400 hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileText size={24} className="text-violet-400" />
          CIA Marks Detail
        </h1>
      </div>
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-12 text-center">
        <FileText size={48} className="mx-auto mb-4 text-slate-500" />
        <p className="text-slate-400">Use the main CIA page to select an assessment and enter marks.</p>
        <Link href="/faculty/cia" className="mt-4 inline-block text-violet-400 hover:text-violet-300 underline text-sm">
          Go to CIA Assessments
        </Link>
      </div>
    </div>
  );
}
