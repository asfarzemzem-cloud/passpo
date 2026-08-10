import React, { useState, useEffect } from 'react';
import { PassportEntry } from '../types';
import { X, Printer, Phone, MapPin, User, Hash } from 'lucide-react';

interface BadgePreviewProps {
  entry: PassportEntry;
  faceUrl: string | null;
  onClose: () => void;
}

export const BadgePreview: React.FC<BadgePreviewProps> = ({ entry, faceUrl, onClose }) => {
  // Merge data from Database match (priority) or Passport extraction
  const firstName = entry.databaseMatch?.firstName || entry.data?.givenNames || '';
  const lastName = entry.databaseMatch?.lastName || entry.data?.surname || '';
  const fullName = `${firstName} ${lastName}`;
  const passportNumber = entry.databaseMatch?.passportNumber || entry.data?.passportNumber || '';
  
  // Accommodation from DB
  const accommodation = entry.databaseMatch?.hotel || '';
  const room = entry.databaseMatch?.room ? ` - Room ${entry.databaseMatch.room}` : '';
  const fullAccommodation = accommodation + room;

  // Phone is not in current data model, so we make it editable state
  const [phoneNumber, setPhoneNumber] = useState('+212');
  
  // We can use the Manager field for the last "Passport No/Manager" slot if needed, 
  // or duplicate passport number as per the template in the image which had "Passport No" twice.
  // However, the example image had a phone-like number at the bottom (00966...).
  // Let's use the Manager name/contact if available, or blank.
  const managerInfo = entry.databaseMatch?.manager || '';

  // Helper to get 2-letter country code for flag
  const getCountryCode = (nationality: string | undefined) => {
    if (!nationality) return 'ma'; // Default to Morocco as per example
    const nat = nationality.toLowerCase();
    if (nat.includes('moroc') || nat === 'mar') return 'ma';
    if (nat.includes('franc') || nat === 'fra') return 'fr';
    if (nat.includes('saudi') || nat === 'sau') return 'sa';
    if (nat.includes('unit') || nat === 'usa' || nat === 'uk' || nat === 'gbr') return 'us'; // simplified
    return 'ma'; // fallback
  };

  const countryCode = getCountryCode(entry.data?.nationality);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm overflow-y-auto p-4 print:p-0 print:bg-white print:static print:block">
      
      {/* Controls - Hidden on print */}
      <div className="fixed top-4 right-4 flex gap-2 print:hidden z-[210]">
        <button 
          onClick={handlePrint}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center shadow-lg transition-colors"
        >
          <Printer className="w-4 h-4 mr-2" />
          Print A4
        </button>
        <button 
          onClick={onClose}
          className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* A4 Container */}
      {/* Tailwind 'print:' modifiers help control print styling */}
      <div className="
        bg-white text-slate-900 shadow-2xl overflow-hidden relative mx-auto
        w-[210mm] h-[297mm] 
        print:w-[210mm] print:h-[297mm] print:shadow-none print:m-0 print:absolute print:top-0 print:left-0
        flex
      ">
        
        {/* Left Sidebar - Green */}
        <div className="w-[45mm] h-full bg-[#006837] relative flex items-center justify-center print:bg-[#006837] print-color-exact">
          <div className="h-full flex items-center justify-center">
             <h1 className="
               text-[#D4AF37] font-bold tracking-widest whitespace-nowrap
               transform -rotate-90 text-[3.5rem] leading-none
               drop-shadow-sm
             " style={{ fontFamily: 'serif' }}>
               ZEM ZEM ASFAR
             </h1>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col relative bg-white">
          
          {/* Header Graphic */}
          <div className="relative h-40 w-full overflow-hidden">
             {/* Gold Curve Simulation */}
             <div className="absolute top-0 right-0 w-[120%] h-[120%] bg-gradient-to-b from-[#bfa15f] to-[#D4AF37] rounded-bl-[100%] translate-x-10 -translate-y-[60%] z-0 border-b-4 border-white shadow-sm"></div>
             
             {/* Header Content */}
             <div className="relative z-10 flex flex-col items-center pt-8 pr-8">
               {/* Logo Placeholder - Teapot/Lamp */}
               <div className="mb-2">
                 <svg width="60" height="50" viewBox="0 0 24 24" fill="none" stroke="#006837" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 16V9a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v7" />
                    <path d="M2 12h20" />
                    <path d="M12 2v3" />
                    <path d="M16 16v3a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-3" />
                 </svg>
               </div>
               <h2 className="text-3xl font-bold text-[#006837] uppercase tracking-wide">ZEM ZEM ASFAR</h2>
             </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 px-12 py-8">
            
            {/* Top Row: Photo and Flag */}
            <div className="flex justify-between items-start mb-12">
               {/* Photo Frame */}
               <div className="relative">
                 <div className="w-[35mm] h-[45mm] bg-slate-200 rounded-2xl overflow-hidden border-4 border-[#006837]/20 shadow-lg">
                   {faceUrl ? (
                     <img src={faceUrl} alt="Face" className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-slate-400">
                       <User className="w-12 h-12" />
                     </div>
                   )}
                 </div>
               </div>

               {/* Flag */}
               <div className="mt-4">
                  <img 
                    src={`https://flagcdn.com/w160/${countryCode}.png`} 
                    alt="Flag" 
                    className="w-24 shadow-md border border-slate-100"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
               </div>
            </div>

            {/* Data Fields */}
            {/* Using a grid layout to match the specific alignment in the example */}
            <div className="space-y-6 text-right" dir="rtl">
              
              {/* Name */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                 <span className="text-xl font-bold text-slate-600 w-40">الاسم الكامل :</span>
                 <span className="text-2xl font-bold text-slate-900 flex-1 text-left font-mono">{fullName}</span>
              </div>

              {/* Passport */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                 <span className="text-xl font-bold text-slate-600 w-40">رقم الجواز :</span>
                 <span className="text-2xl font-bold text-slate-900 flex-1 text-left font-mono">{passportNumber}</span>
              </div>

              {/* Makkah Residence */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                 <span className="text-xl font-bold text-slate-600 w-40">سكن مكة :</span>
                 <span className="text-2xl font-bold text-slate-900 flex-1 text-left">{fullAccommodation || '—'}</span>
              </div>

              {/* Phone - Editable */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                 <span className="text-xl font-bold text-slate-600 w-40">الهاتف :</span>
                 <div className="flex-1 text-left">
                   <input 
                     type="text" 
                     value={phoneNumber}
                     onChange={(e) => setPhoneNumber(e.target.value)}
                     className="text-2xl font-bold text-slate-900 font-mono bg-transparent border-none focus:ring-0 p-0 w-full placeholder:text-slate-300"
                     placeholder="+212..."
                   />
                 </div>
              </div>

              {/* Extra Field (Manager/Visa/etc) - Labeled Passport No in template but clearly different in example */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                 <span className="text-xl font-bold text-slate-600 w-40">رقم المشرف :</span>
                 <span className="text-2xl font-bold text-slate-900 flex-1 text-left font-mono">{managerInfo || '—'}</span>
              </div>

            </div>

          </div>

          {/* Footer */}
          <div className="mb-10 px-8 text-center">
            <p className="text-[10px] text-slate-500 max-w-md mx-auto leading-relaxed">
              Siège Social : Casablanca Av. des FAR – Tour des Habous – Pavillon B 4ème étage
              <br />
              Tel : 05 22 31 65 39 / 05 22 31 65 16 - Fax : 05 22 31 57 13
              <br />
              E-mail : b.zemzemasfar@hotmail.com
            </p>
          </div>

        </div>
      </div>
      
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
};
