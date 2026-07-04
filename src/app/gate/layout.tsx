"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GateLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    router.replace('/security/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0D0A1A] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-red-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Redirecting to Security Portal...</p>
      </div>
    </div>
  );
}
