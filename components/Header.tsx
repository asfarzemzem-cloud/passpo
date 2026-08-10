import React from 'react';
import { ScanFace, ShieldCheck, FileCheck2 } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-slate-200/90 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="bg-slate-900 text-white p-2 rounded-xl shadow-xs">
            <ScanFace className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-sm font-bold text-slate-800">System Scanner OCR</span>
        </div>

        <div className="flex items-center space-x-2.5">
          <div className="hidden sm:flex items-center space-x-1.5 text-xs text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/80">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-semibold text-[11px]">Serveur API Sécurisé</span>
          </div>

          <div className="flex items-center space-x-1.5 text-[11px] text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 font-medium">
            <FileCheck2 className="w-3.5 h-3.5 text-slate-500" />
            <span>MRZ ICAO 9303</span>
          </div>
        </div>
      </div>
    </header>
  );
};

