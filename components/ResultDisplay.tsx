import React, { useState } from 'react';
import { PassportData } from '../types';
import { User, Calendar, Globe, Hash, FileText, CheckCircle, Type as TypeIcon, Maximize2, X } from 'lucide-react';

interface ResultDisplayProps {
  data: PassportData;
  compact?: boolean;
  faceUrl?: string | null;
}

const Field: React.FC<{ label: string; value: string; icon?: React.ReactNode, highlight?: boolean }> = ({ label, value, icon, highlight }) => (
  <div className={`p-3 rounded-lg border ${highlight ? 'bg-blue-50 border-blue-100' : 'bg-white border-slate-100'} flex flex-col`}>
    <div className="flex items-center space-x-2 mb-1">
      {icon && <span className="text-slate-400">{icon}</span>}
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
    </div>
    <span className={`text-sm md:text-base font-medium truncate ${highlight ? 'text-blue-900' : 'text-slate-900'} min-h-[1.5rem]`}>
      {value || '—'}
    </span>
  </div>
);

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ data, faceUrl }) => {
  const [showFullFace, setShowFullFace] = useState(false);

  return (
    <>
      <div className="bg-white rounded-xl overflow-hidden animate-fade-in-up">
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 flex items-center">
            <FileText className="w-4 h-4 mr-2 text-blue-600" />
            Extracted Data
          </h2>
          <div className="flex items-center text-green-600 text-xs font-medium">
            <CheckCircle className="w-3.5 h-3.5 mr-1" />
            Verified
          </div>
        </div>
        
        <div className="p-4">
          <div className="flex flex-col md:flex-row gap-6">
            {faceUrl && (
              <div className="flex-shrink-0 flex flex-col items-center">
                 <div 
                   className="w-32 h-40 rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-slate-100 mb-2 relative group cursor-zoom-in"
                   onDoubleClick={() => setShowFullFace(true)}
                 >
                   <img src={faceUrl} alt="Passport Holder" className="w-full h-full object-cover" />
                   <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10">
                    <Maximize2 className="w-5 h-5 text-white drop-shadow-sm" />
                   </div>
                 </div>
                 <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Photo</span>
              </div>
            )}
            
            <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Field 
                  label="Passport Number" 
                  value={data.passportNumber} 
                  icon={<Hash className="w-3.5 h-3.5" />}
                  highlight
                />
              </div>
              
              <Field 
                label="Surname" 
                value={data.surname} 
                icon={<User className="w-3.5 h-3.5" />}
              />
              <Field 
                label="Given Names" 
                value={data.givenNames} 
                icon={<User className="w-3.5 h-3.5" />}
              />

              {/* Arabic Fields */}
              {(data.surnameArabic || data.givenNamesArabic) && (
                <>
                  <Field 
                    label="Surname (Arabic)" 
                    value={data.surnameArabic || '—'} 
                    icon={<TypeIcon className="w-3.5 h-3.5" />}
                  />
                  <Field 
                    label="Given Names (Arabic)" 
                    value={data.givenNamesArabic || '—'} 
                    icon={<TypeIcon className="w-3.5 h-3.5" />}
                  />
                </>
              )}
              
              <Field 
                label="Nationality" 
                value={data.nationality} 
                icon={<Globe className="w-3.5 h-3.5" />}
              />
              <Field 
                label="Sex" 
                value={data.sex} 
                icon={<User className="w-3.5 h-3.5" />}
              />
              
              <Field 
                label="Date of Birth" 
                value={data.dateOfBirth} 
                icon={<Calendar className="w-3.5 h-3.5" />}
              />
               <Field 
                label="Date of Expiry" 
                value={data.dateOfExpiry} 
                icon={<Calendar className="w-3.5 h-3.5" />}
              />

              <div className="sm:col-span-2">
                <Field 
                  label="Issuing Authority" 
                  value={data.issuingAuthority} 
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
             <details className="group">
               <summary className="flex cursor-pointer items-center text-xs font-medium text-slate-500 hover:text-slate-700 select-none">
                 <span>View Raw JSON</span>
                 <svg className="ml-2 h-3.5 w-3.5 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                 </svg>
               </summary>
               <pre className="mt-2 p-3 bg-slate-900 rounded-lg overflow-x-auto text-[10px] text-blue-100 font-mono leading-relaxed">
                 {JSON.stringify(data, null, 2)}
               </pre>
             </details>
          </div>
        </div>
      </div>

      {/* Full Screen Modal for Face */}
      {showFullFace && faceUrl && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowFullFace(false)}
        >
          <button 
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            onClick={() => setShowFullFace(false)}
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={faceUrl} 
            alt="Full Screen Face" 
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};