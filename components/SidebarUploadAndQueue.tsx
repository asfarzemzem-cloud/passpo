import React, { useRef, useState } from 'react';
import { PassportEntry, ExtractionStatus, SavedClient } from '../types';
import { FolderOpen, Play, Trash2, CheckCircle2, AlertCircle, Clock, Upload, ScanFace, Camera, Users, UserPlus, RefreshCw, ChevronRight } from 'lucide-react';
import { CameraScannerModal } from './CameraScannerModal';

interface SidebarUploadAndQueueProps {
  entries: PassportEntry[];
  selectedEntryId: string | null;
  onSelectEntry: (id: string) => void;
  onFilesAdded: (files: File[]) => void;
  onRemoveEntry: (id: string) => void;
  onProcessPending: () => void;
  onProcessSingleEntry?: (entry: PassportEntry) => void;
  isProcessingBatch: boolean;
  onLoadDemoSample: () => void;
  savedClients?: SavedClient[];
  onSelectSavedClient?: (client: SavedClient) => void;
}

export const SidebarUploadAndQueue: React.FC<SidebarUploadAndQueueProps> = ({
  entries,
  selectedEntryId,
  onSelectEntry,
  onFilesAdded,
  onRemoveEntry,
  onProcessPending,
  onProcessSingleEntry,
  isProcessingBatch,
  onLoadDemoSample,
  savedClients = [],
  onSelectSavedClient,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

  const pendingCount = entries.filter(
    (e) => e.status === ExtractionStatus.IDLE || e.status === ExtractionStatus.ERROR
  ).length;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesAdded(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const handleCameraCapture = (capturedFile: File) => {
    onFilesAdded([capturedFile]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesAdded(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div className="space-y-4 w-full">
      {/* Clients Enregistrés & Correspondances (Sidebar Top Card) */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-md border border-slate-800 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500 text-slate-950 rounded-xl font-bold shadow-2xs">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white tracking-tight">
                Clients Enregistrés
              </h2>
              <p className="text-[10px] text-slate-400">
                Abonnés & Correspondances
              </p>
            </div>
          </div>

          <span className="text-[10px] font-bold text-amber-300 bg-amber-950/90 border border-amber-800 px-2 py-0.5 rounded-full">
            {savedClients.length} {savedClients.length > 1 ? 'clients' : 'client'}
          </span>
        </div>

        {/* Compact List of Saved/Matched Clients */}
        {savedClients.length === 0 ? (
          <div className="p-3 text-center bg-slate-800/60 rounded-xl border border-slate-800/80">
            <p className="text-[11px] text-slate-400">Aucun client dans la base.</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Scannez un passeport et cliquez sur "Enregistrer client".</p>
          </div>
        ) : (
          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-0.5">
            {savedClients.map((client) => (
              <div
                key={client.id}
                onClick={() => onSelectSavedClient && onSelectSavedClient(client)}
                className="group cursor-pointer p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 hover:border-amber-500/80 transition-all flex items-center justify-between gap-2"
                title="Cliquer pour charger la fiche de ce client"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {client.croppedFaceUrl ? (
                    <img
                      src={client.croppedFaceUrl}
                      alt={client.fullNameLatin}
                      className="w-8 h-8 rounded-lg object-cover border border-slate-700 shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                      {client.fullNameLatin.charAt(0)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-100 truncate group-hover:text-amber-300 transition-colors">
                      {client.fullNameLatin}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">
                      {client.passportNumber} · <span className="text-emerald-400 dir-rtl" dir="rtl">{client.fullNameArabic}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0">
                  {client.registrationType === 'matched' ? (
                    <span className="text-[9px] font-bold text-amber-300 bg-amber-950/80 border border-amber-800 px-1.5 py-0.2 rounded">
                      Lien
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-blue-300 bg-blue-950/80 border border-blue-800 px-1.5 py-0.2 rounded">
                      Nouveau
                    </span>
                  )}
                  <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all mt-1" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Subtle Upload & Scanner Control Bar */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`bg-white rounded-xl p-2 border transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-200'
            : 'border-slate-200/90 shadow-2xs'
        }`}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCameraModalOpen(true)}
            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2.5 px-3 rounded-lg transition-all border border-slate-800 flex items-center justify-center gap-1.5 shadow-2xs"
            title="Ouvrir le scanner en direct par caméra"
          >
            <Camera className="w-3.5 h-3.5 text-amber-400" />
            <span>Scanner</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-semibold py-2.5 px-3 rounded-lg transition-all border border-slate-200 flex items-center justify-center gap-1.5"
            title="Importer des fichiers images"
          >
            <FolderOpen className="w-3.5 h-3.5 text-slate-600" />
            <span>Fichiers</span>
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Live Camera Scanner Modal */}
      <CameraScannerModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={handleCameraCapture}
      />

      {/* Queue Section */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              File de traitement
            </span>
            <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2 py-0.5 rounded-full">
              {entries.length}
            </span>
          </div>

          {pendingCount > 0 && (
            <button
              onClick={onProcessPending}
              disabled={isProcessingBatch}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 border border-slate-200 disabled:opacity-50"
            >
              <Play className="w-3 h-3 text-blue-600 fill-blue-600" />
              Traiter en attente ({pendingCount})
            </button>
          )}
        </div>

        {/* Queue Items */}
        <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
          {entries.map((entry) => {
            const isSelected = entry.id === selectedEntryId;
            return (
              <div
                key={entry.id}
                onClick={() => onSelectEntry(entry.id)}
                className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50/70 border-blue-300 ring-1 ring-blue-200 shadow-sm'
                    : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-100/80'
                }`}
              >
                {/* Thumbnail */}
                <div className="w-11 h-11 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0 border border-slate-300/60 flex items-center justify-center">
                  {(entry.croppedPassportUrl || entry.previewUrl) ? (
                    <img
                      src={entry.croppedPassportUrl || entry.previewUrl}
                      alt={entry.fileName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400">Scan</span>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-grow min-w-0">
                  <div className="text-xs font-semibold text-slate-800 truncate mb-0.5">
                    {entry.fileName}
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-1">
                    {entry.status === ExtractionStatus.SUCCESS && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                        Lu <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      </span>
                    )}

                    {entry.status === ExtractionStatus.PROCESSING && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md animate-pulse">
                        En cours...
                      </span>
                    )}

                    {entry.status === ExtractionStatus.ERROR && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                        Erreur — réessayer
                      </span>
                    )}

                    {entry.status === ExtractionStatus.IDLE && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-slate-200/70 px-2 py-0.5 rounded-md">
                        En attente
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions: Play button + Delete button */}
                <div className="flex items-center gap-1 shrink-0">
                  {onProcessSingleEntry && entry.status !== ExtractionStatus.PROCESSING && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onProcessSingleEntry(entry);
                      }}
                      className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-2xs flex items-center justify-center"
                      title="Lancer l'extraction IA (Play)"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                    </button>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveEntry(entry.id);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {entries.length === 0 && (
            <div className="text-center py-8 text-xs text-slate-400">
              Aucun passeport dans la file d'attente
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
