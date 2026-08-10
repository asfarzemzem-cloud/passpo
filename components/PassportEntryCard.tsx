import React, { useState, useEffect } from 'react';
import { PassportEntry, ExtractionStatus, BoundingBox } from '../types';
import { ResultDisplay } from './ResultDisplay';
import { Trash2, CheckCircle, AlertCircle, Loader2, ChevronDown, ChevronUp, Database, MapPin, Briefcase, Crop, UserSquare, Maximize2, X, Printer } from 'lucide-react';
import { BadgePreview } from './BadgePreview';

interface PassportEntryCardProps {
  entry: PassportEntry;
  onRemove: (id: string) => void;
}

export const PassportEntryCard: React.FC<PassportEntryCardProps> = ({ entry, onRemove }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
  const [faceImageUrl, setFaceImageUrl] = useState<string | null>(null);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [showBadgePreview, setShowBadgePreview] = useState(false);

  // Auto-expand on success
  useEffect(() => {
    if (entry.status === ExtractionStatus.SUCCESS) {
      setIsExpanded(true);
    }
  }, [entry.status]);

  // Handle cropping when bounding box is available
  useEffect(() => {
    if (entry.status === ExtractionStatus.SUCCESS && entry.previewUrl) {
      const cropImages = async () => {
        try {
          const img = new Image();
          img.src = entry.previewUrl;
          await new Promise((resolve) => { img.onload = resolve; });

          const cropBox = (box: BoundingBox, padding = 0) => {
             const canvas = document.createElement('canvas');
             const ctx = canvas.getContext('2d');
             if (!ctx) return null;

             // Calculate coordinates with padding
             // Ensure we don't go outside image bounds (0 and img dimensions)
             const x = Math.max(0, (box.xmin / 1000) * img.width - padding);
             const y = Math.max(0, (box.ymin / 1000) * img.height - padding);
             
             // Calculate width/height including padding, but clamp to image right/bottom edges
             const maxW = img.width - x;
             const maxH = img.height - y;
             
             const rawW = ((box.xmax - box.xmin) / 1000) * img.width + (padding * 2);
             const rawH = ((box.ymax - box.ymin) / 1000) * img.height + (padding * 2);
             
             const w = Math.min(maxW, rawW);
             const h = Math.min(maxH, rawH);

             canvas.width = w;
             canvas.height = h;
             ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
             return canvas.toDataURL('image/jpeg', 0.95);
          };

          // 1. Crop Main Passport Page (Tight crop)
          if (entry.data?.boundingBox) {
            const url = cropBox(entry.data.boundingBox, 0);
            if (url) setCroppedImageUrl(url);
          }

          // 2. Crop Face (Strict crop, no padding)
          if (entry.data?.faceBoundingBox) {
             const url = cropBox(entry.data.faceBoundingBox, 0);
             if (url) setFaceImageUrl(url);
          }

        } catch (e) {
          console.error("Cropping failed", e);
        }
      };
      cropImages();
    }
  }, [entry.status, entry.data, entry.previewUrl]);

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300 group hover:shadow-md">
        <div className="p-4 flex items-center gap-4">
          {/* Thumbnail - Show Cropped if available, else original */}
          <div 
            className="relative w-16 h-16 sm:w-24 sm:h-24 flex-shrink-0 bg-slate-100 rounded-lg overflow-hidden border border-slate-100 cursor-zoom-in group/image"
            onDoubleClick={() => setFullScreenImage(croppedImageUrl || entry.previewUrl)}
          >
            <img 
              src={croppedImageUrl || entry.previewUrl} 
              alt="Passport" 
              className={`w-full h-full object-cover transition-opacity duration-500 ${croppedImageUrl ? 'opacity-100' : 'opacity-100'}`}
            />
            
            {/* Hover overlay hint */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity bg-black/10">
              <Maximize2 className="w-5 h-5 text-white drop-shadow-sm" />
            </div>
            
            {entry.status === ExtractionStatus.PROCESSING && (
              <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
            )}
            {entry.status === ExtractionStatus.SUCCESS && (
              <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center pointer-events-none">
                <div className="bg-white rounded-full p-0.5 shadow-sm">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
            )}
             {entry.status === ExtractionStatus.ERROR && (
              <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center pointer-events-none">
                 <div className="bg-white rounded-full p-0.5 shadow-sm">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                 </div>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-grow min-w-0 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-1">
               <h3 className="text-sm font-semibold text-slate-900 truncate pr-2">
                {entry.file.name}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-2">
              {(entry.file.size / 1024 / 1024).toFixed(2)} MB
            </p>
            
            <div className="flex flex-wrap items-center gap-2">
               {entry.status === ExtractionStatus.IDLE && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">Pending</span>
               )}
               {entry.status === ExtractionStatus.PROCESSING && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full animate-pulse border border-blue-100">Processing</span>
               )}
               {entry.status === ExtractionStatus.SUCCESS && (
                  <>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">Extracted</span>
                    {croppedImageUrl && (
                      <span className="flex items-center text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                        <Crop className="w-3 h-3 mr-1" />
                        Auto-Cropped
                      </span>
                    )}
                    {faceImageUrl && (
                      <span className="flex items-center text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                         <UserSquare className="w-3 h-3 mr-1" />
                         Photo
                      </span>
                    )}
                  </>
               )}
               {entry.status === ExtractionStatus.ERROR && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">Failed</span>
               )}

               {/* Match Badge */}
               {entry.status === ExtractionStatus.SUCCESS && entry.databaseMatch && (
                 <span className="flex items-center text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                   <Database className="w-3 h-3 mr-1" />
                   Match Found
                 </span>
               )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {entry.status === ExtractionStatus.SUCCESS && (
              <>
                 <button
                   onClick={() => setShowBadgePreview(true)}
                   className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                   title="Print Badge"
                 >
                    <Printer className="w-5 h-5" />
                 </button>
                 <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </>
            )}
            <button 
              onClick={() => onRemove(entry.id)}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Remove"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && entry.data && (
          <div className="px-4 pb-4 bg-slate-50/50 border-t border-slate-100 pt-4">
             {entry.databaseMatch && (
               <div className="mb-4 bg-purple-50 border border-purple-200 rounded-lg p-3">
                 <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wide mb-3 flex items-center">
                   <Database className="w-3.5 h-3.5 mr-1.5" />
                   Matched Database Record
                 </h4>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                   <div className="flex flex-col">
                      <span className="text-purple-400 text-xs font-medium">Guest Name</span>
                      <span className="text-purple-900 font-semibold">{entry.databaseMatch.firstName} {entry.databaseMatch.lastName}</span>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-purple-400 text-xs font-medium">Hotel & Room</span>
                      <span className="text-purple-900 flex items-center">
                         <MapPin className="w-3 h-3 mr-1 text-purple-500" />
                         {entry.databaseMatch.hotel} {entry.databaseMatch.room && `— Room ${entry.databaseMatch.room}`}
                      </span>
                   </div>
                   {entry.databaseMatch.manager && (
                     <div className="flex flex-col sm:col-span-2">
                        <span className="text-purple-400 text-xs font-medium">Manager</span>
                        <span className="text-purple-900 flex items-center">
                           <Briefcase className="w-3 h-3 mr-1 text-purple-500" />
                           {entry.databaseMatch.manager}
                        </span>
                     </div>
                   )}
                 </div>
               </div>
             )}
             <ResultDisplay data={entry.data} compact={true} faceUrl={faceImageUrl} />
          </div>
        )}

        {/* Error Message */}
        {entry.status === ExtractionStatus.ERROR && entry.error && (
          <div className="px-4 pb-4">
             <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100">
               {entry.error}
             </div>
          </div>
        )}
      </div>

      {/* Full Screen Modal */}
      {fullScreenImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setFullScreenImage(null)}
        >
          <button 
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            onClick={() => setFullScreenImage(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={fullScreenImage} 
            alt="Full Screen" 
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Badge Preview Modal */}
      {showBadgePreview && (
        <BadgePreview 
          entry={entry} 
          faceUrl={faceImageUrl} 
          onClose={() => setShowBadgePreview(false)} 
        />
      )}
    </>
  );
};