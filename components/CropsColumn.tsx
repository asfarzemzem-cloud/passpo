import React, { useEffect, useState } from 'react';
import { PassportEntry, BoundingBox } from '../types';
import { Maximize2, User, Image as ImageIcon, Bug, Eye, EyeOff, Code, Layers } from 'lucide-react';

interface CropsColumnProps {
  entry: PassportEntry | null;
  onImageCropGenerated?: (passportCropUrl: string, faceCropUrl: string) => void;
  isDebugMode?: boolean;
  setIsDebugMode?: (val: boolean) => void;
}

export const CropsColumn: React.FC<CropsColumnProps> = ({
  entry,
  onImageCropGenerated,
  isDebugMode: externalIsDebug,
  setIsDebugMode: externalSetIsDebug,
}) => {
  const [passportCropUrl, setPassportCropUrl] = useState<string | null>(null);
  const [faceCropUrl, setFaceCropUrl] = useState<string | null>(null);
  const [activeModalImg, setActiveModalImg] = useState<string | null>(null);
  const [internalIsDebugMode, setInternalIsDebugMode] = useState<boolean>(false);

  const isDebugMode = externalIsDebug !== undefined ? externalIsDebug : internalIsDebugMode;
  const toggleDebugMode = () => {
    if (externalSetIsDebug) {
      externalSetIsDebug(!isDebugMode);
    } else {
      setInternalIsDebugMode(!isDebugMode);
    }
  };

  useEffect(() => {
    if (!entry || !entry.previewUrl) {
      setPassportCropUrl(null);
      setFaceCropUrl(null);
      return;
    }

    let isMounted = true;

    const cropImage = async () => {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = entry.previewUrl;

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

        if (!isMounted) return;

        const performCrop = (box: BoundingBox) => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return null;

          const xmin = Math.min(box.xmin, box.xmax);
          const xmax = Math.max(box.xmin, box.xmax);
          const ymin = Math.min(box.ymin, box.ymax);
          const ymax = Math.max(box.ymin, box.ymax);

          const x = Math.max(0, (xmin / 1000) * img.width);
          const y = Math.max(0, (ymin / 1000) * img.height);
          const w = Math.min(img.width - x, ((xmax - xmin) / 1000) * img.width);
          const h = Math.min(img.height - y, ((ymax - ymin) / 1000) * img.height);

          if (w < 10 || h < 10) return null;

          canvas.width = Math.round(w);
          canvas.height = Math.round(h);

          ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
          return canvas.toDataURL('image/jpeg', 0.95);
        };

        // 1. Passport Page Crop
        let pCrop: string | null = null;
        const pBox = entry.data?.boundingBox;

        // If bounding box covers nearly full image or is missing/0, use preview directly
        if (!pBox || (pBox.xmin <= 30 && pBox.ymin <= 30 && pBox.xmax >= 970 && pBox.ymax >= 970)) {
          pCrop = entry.previewUrl;
        } else {
          pCrop = performCrop(pBox) || entry.previewUrl;
        }

        // 2. Face Photo Crop
        let fCrop: string | null = null;
        let fBox = entry.data?.faceBoundingBox;

        // Fallback default face position for standard passport layout if missing/invalid
        if (!fBox || (fBox.xmax - fBox.xmin < 30) || (fBox.ymax - fBox.ymin < 30)) {
          fBox = { ymin: 200, xmin: 50, ymax: 700, xmax: 320 };
        }

        fCrop = performCrop(fBox);

        setPassportCropUrl(pCrop);
        setFaceCropUrl(fCrop);

        if (pCrop && fCrop && onImageCropGenerated) {
          onImageCropGenerated(pCrop, fCrop);
        }
      } catch (e) {
        console.error("Cropping failed:", e);
        if (isMounted) {
          setPassportCropUrl(entry.previewUrl);
          setFaceCropUrl(null);
        }
      }
    };

    cropImage();

    return () => {
      isMounted = false;
    };
  }, [entry?.id, entry?.data?.boundingBox, entry?.data?.faceBoundingBox, entry?.previewUrl]);

  if (!entry) {
    return (
      <div className="bg-slate-100/60 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-400">
        <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-xs">Sélectionnez ou téléchargez un passeport</p>
      </div>
    );
  }

  const pBox = entry.data?.boundingBox || { ymin: 0, xmin: 0, ymax: 1000, xmax: 1000 };
  const fBox = entry.data?.faceBoundingBox || { ymin: 204, xmin: 50, ymax: 704, xmax: 313 };

  return (
    <div className="space-y-4 w-full">
      {/* SUBTLE DEBUG TOGGLE HEADER */}
      <div className="flex items-center justify-between mb-1 px-1">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Aperçu & Découpage
        </span>
        <button
          type="button"
          onClick={toggleDebugMode}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border ${
            isDebugMode
              ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
              : 'bg-white text-slate-500 border-slate-200 hover:text-slate-800 hover:bg-slate-50'
          }`}
          title={isDebugMode ? 'Masquer le mode débug' : 'Activer le mode débug'}
        >
          <Bug className={`w-3.5 h-3.5 ${isDebugMode ? 'text-amber-600' : 'text-slate-400'}`} />
          <span>{isDebugMode ? 'Debug ON' : 'Debug'}</span>
        </button>
      </div>

      {/* 1. Photo du visage (TOP) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 overflow-hidden">
        <div className="mb-2.5">
          <h4 className="text-sm font-bold text-slate-800">
            Photo du visage
          </h4>
        </div>

        <div className="flex justify-center py-1">
          <div
            onClick={() => faceCropUrl && setActiveModalImg(faceCropUrl)}
            className={`relative w-44 h-56 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm ${
              faceCropUrl ? 'cursor-zoom-in group' : 'flex items-center justify-center'
            }`}
          >
            {faceCropUrl ? (
              <>
                <img
                  src={faceCropUrl}
                  alt="Visage extrait"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Maximize2 className="w-5 h-5 text-white drop-shadow-md" />
                </div>
              </>
            ) : (
              <div className="text-center p-4 text-slate-400">
                <User className="w-8 h-8 mx-auto mb-1 opacity-40" />
                <span className="text-[11px]">Extraction photo...</span>
              </div>
            )}
          </div>
        </div>

        {/* DEBUG CARD FOR FACE CROP */}
        {isDebugMode && (
          <div className="mt-3 p-3 bg-slate-950 text-slate-200 rounded-xl font-mono text-[11px] border border-slate-800 space-y-1.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-indigo-400 font-bold">
              <span className="flex items-center gap-1">
                <Code className="w-3.5 h-3.5 text-indigo-400" />
                <span>BoundingBox Visage (0-1000)</span>
              </span>
              <span className="bg-indigo-950 text-indigo-300 border border-indigo-800 text-[9px] px-1.5 py-0.5 rounded">
                Portrait AI Box
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-slate-300 bg-slate-900/90 p-2 rounded-lg border border-slate-800">
              <div>ymin: <span className="text-indigo-400 font-bold">{fBox.ymin}</span></div>
              <div>xmin: <span className="text-indigo-400 font-bold">{fBox.xmin}</span></div>
              <div>ymax: <span className="text-indigo-400 font-bold">{fBox.ymax}</span></div>
              <div>xmax: <span className="text-indigo-400 font-bold">{fBox.xmax}</span></div>
            </div>
            <div className="text-[10px] text-slate-400">
              Largeur portrait: {(fBox.xmax - fBox.xmin) / 10}% | Hauteur portrait: {(fBox.ymax - fBox.ymin) / 10}%
            </div>
          </div>
        )}
      </div>

      {/* 2. Passeport recadré (MIDDLE) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 overflow-hidden">
        <div className="mb-2.5">
          <h4 className="text-sm font-bold text-slate-800">
            Passeport recadré
          </h4>
        </div>

        <div className="relative rounded-xl overflow-hidden bg-slate-100 border border-slate-200 cursor-zoom-in group shadow-xs p-1 flex items-center justify-center min-h-[180px]">
          {(passportCropUrl || entry.previewUrl) ? (
            <img
              src={passportCropUrl || entry.previewUrl}
              alt="Passeport recadré"
              className="w-full h-auto max-h-[360px] object-contain rounded-lg transition-transform duration-300 group-hover:scale-[1.01]"
            />
          ) : (
            <div className="w-full h-36 flex items-center justify-center text-slate-400 text-xs">
              Aperçu non disponible
            </div>
          )}
          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
            <Maximize2 className="w-5 h-5 text-white drop-shadow-md" />
          </div>
        </div>

        {/* DEBUG CARD FOR PASSPORT CROP */}
        {isDebugMode && (
          <div className="mt-3 p-3 bg-slate-950 text-slate-200 rounded-xl font-mono text-[11px] border border-slate-800 space-y-1.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-emerald-400 font-bold">
              <span className="flex items-center gap-1">
                <Code className="w-3.5 h-3.5 text-emerald-400" />
                <span>BoundingBox Passeport (0-1000)</span>
              </span>
              <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[9px] px-1.5 py-0.5 rounded">
                Raw AI Output
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-slate-300 bg-slate-900/90 p-2 rounded-lg border border-slate-800">
              <div>ymin: <span className="text-amber-400 font-bold">{pBox.ymin}</span></div>
              <div>xmin: <span className="text-amber-400 font-bold">{pBox.xmin}</span></div>
              <div>ymax: <span className="text-amber-400 font-bold">{pBox.ymax}</span></div>
              <div>xmax: <span className="text-amber-400 font-bold">{pBox.xmax}</span></div>
            </div>
            <div className="text-[10px] text-slate-400">
              Largeur: {(pBox.xmax - pBox.xmin) / 10}% | Hauteur: {(pBox.ymax - pBox.ymin) / 10}%
            </div>
          </div>
        )}
      </div>

      {/* 3. Scan original + OVERLAY DEBUG */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h5 className="text-xs font-bold text-slate-800">Scan original</h5>
          </div>
          {isDebugMode && (
            <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-mono font-semibold border border-amber-200">
              Overlay Bounding Boxes Actif
            </span>
          )}
        </div>

        <div className="relative rounded-xl bg-slate-900 border border-slate-200 overflow-hidden group flex items-center justify-center min-h-[140px]">
          {entry.previewUrl ? (
            <img
              src={entry.previewUrl}
              alt="Scan original"
              className="w-full h-auto max-h-[300px] object-contain rounded-lg"
            />
          ) : (
            <div className="text-slate-400 text-xs p-4">Scan original non disponible</div>
          )}

          {/* VISUAL OVERLAY BOXES IN DEBUG MODE */}
          {isDebugMode && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Passport Bounding Box Overlay */}
              <div
                className="absolute border-2 border-emerald-400 bg-emerald-500/10 transition-all rounded-xs"
                style={{
                  top: `${(pBox.ymin / 1000) * 100}%`,
                  left: `${(pBox.xmin / 1000) * 100}%`,
                  width: `${((pBox.xmax - pBox.xmin) / 1000) * 100}%`,
                  height: `${((pBox.ymax - pBox.ymin) / 1000) * 100}%`,
                }}
              >
                <span className="absolute top-0 left-0 bg-emerald-500 text-slate-950 font-mono font-bold text-[9px] px-1 shadow-sm">
                  Passeport [{pBox.ymin},{pBox.xmin},{pBox.ymax},{pBox.xmax}]
                </span>
              </div>

              {/* Face Bounding Box Overlay */}
              <div
                className="absolute border-2 border-indigo-400 bg-indigo-500/20 transition-all rounded-xs shadow-lg"
                style={{
                  top: `${(fBox.ymin / 1000) * 100}%`,
                  left: `${(fBox.xmin / 1000) * 100}%`,
                  width: `${((fBox.xmax - fBox.xmin) / 1000) * 100}%`,
                  height: `${((fBox.ymax - fBox.ymin) / 1000) * 100}%`,
                }}
              >
                <span className="absolute top-0 left-0 bg-indigo-600 text-white font-mono font-bold text-[9px] px-1 shadow-sm">
                  Visage [{fBox.ymin},{fBox.xmin},{fBox.ymax},{fBox.xmax}]
                </span>
              </div>
            </div>
          )}

          <div
            onClick={() => setActiveModalImg(entry.previewUrl)}
            className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-zoom-in"
          >
            <Maximize2 className="w-5 h-5 text-white drop-shadow-md" />
          </div>
        </div>

        {isDebugMode && (
          <p className="text-[11px] text-slate-500 mt-2">
            Rectangles de détection: Vert = Page passeport | Violet = Portrait du visage.
          </p>
        )}
      </div>

      {/* Image Lightbox Modal */}
      {activeModalImg && (
        <div
          onClick={() => setActiveModalImg(null)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={activeModalImg}
              alt="Agrandissement"
              className="max-w-full max-h-[88vh] rounded-2xl object-contain shadow-2xl"
            />
            <button
              onClick={() => setActiveModalImg(null)}
              className="absolute -top-3 -right-3 bg-white text-slate-800 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow-lg hover:bg-slate-100"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
