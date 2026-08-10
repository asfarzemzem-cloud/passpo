import React, { useState } from 'react';
import { PassportData, SavedClient } from '../types';
import { UserPlus, RefreshCw, X, Check, Search, UserCheck, ShieldAlert } from 'lucide-react';

interface SaveClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  passportData: PassportData;
  croppedFaceUrl?: string;
  croppedPassportUrl?: string;
  existingClients: SavedClient[];
  onSaveNewClient: () => void;
  onUpdateExistingClient: (targetClientId: string) => void;
}

export const SaveClientModal: React.FC<SaveClientModalProps> = ({
  isOpen,
  onClose,
  passportData,
  croppedFaceUrl,
  croppedPassportUrl,
  existingClients,
  onSaveNewClient,
  onUpdateExistingClient,
}) => {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  // Find automatic match by passport number or CIN or name
  const autoMatch = existingClients.find(
    (c) =>
      (passportData.passportNumber &&
        c.passportNumber.toLowerCase().trim() === passportData.passportNumber.toLowerCase().trim()) ||
      (passportData.personalNumber &&
        c.cinNumber?.toLowerCase().trim() === passportData.personalNumber.toLowerCase().trim()) ||
      (passportData.surnameLatin &&
        c.fullNameLatin.toLowerCase().includes(passportData.surnameLatin.toLowerCase()))
  );

  const filteredClients = existingClients.filter(
    (c) =>
      c.fullNameLatin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.fullNameArabic.includes(searchTerm) ||
      c.passportNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.cinNumber && c.cinNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleConfirmNew = () => {
    onSaveNewClient();
    onClose();
  };

  const handleConfirmUpdate = (idToUpdate: string) => {
    onUpdateExistingClient(idToUpdate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200/90 max-w-xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/30 text-blue-400 rounded-xl border border-blue-500/30">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Enregistrer le client</h3>
              <p className="text-xs text-slate-400">
                {passportData.surnameLatin} {passportData.givenNamesLatin} · N° {passportData.passportNumber || 'Inconnu'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          <p className="text-xs text-slate-600 font-medium">
            Choisissez la méthode d'enregistrement pour ce passeport :
          </p>

          {/* Option 1: First time registration */}
          <div
            onClick={handleConfirmNew}
            className="group cursor-pointer bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-400/80 rounded-2xl p-4 transition-all shadow-2xs flex items-center justify-between"
          >
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-blue-600 text-white rounded-xl shadow-xs group-hover:scale-105 transition-transform">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-900">
                  Ajouter nouveau client
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  S'il s'agit d'un nouveau client : crée la fiche avec toutes les données extraites, la photo du visage et la copie du passeport.
                </p>
              </div>
            </div>

            <span className="text-xs font-bold text-blue-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shrink-0 ml-2 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              Ajouter
            </span>
          </div>

          {/* Option 2: Find match & update existing */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-amber-500 text-slate-950 rounded-xl shadow-xs">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Trouver correspondance d'un client
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Si le client était déjà enregistré sans son passeport : recherche la correspondance par Nom/Prénom et associe les données du passeport.
                </p>
              </div>
            </div>

            {/* Auto Match Notification if found */}
            {autoMatch && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold text-emerald-950">Correspondance suggérée : </span>
                    <span className="text-emerald-800 font-semibold">{autoMatch.fullNameLatin}</span> (N° {autoMatch.passportNumber})
                  </div>
                </div>
                <button
                  onClick={() => handleConfirmUpdate(autoMatch.id)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shadow-2xs shrink-0"
                >
                  Mettre à jour
                </button>
              </div>
            )}

            {/* Search list of existing clients */}
            {existingClients.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un client existant (Nom, N° Passeport, CIN)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-amber-500"
                  />
                </div>

                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {filteredClients.map((client) => (
                    <div
                      key={client.id}
                      onClick={() => setSelectedClientId(client.id)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                        selectedClientId === client.id
                          ? 'border-amber-500 bg-amber-50/80 font-semibold text-amber-950'
                          : 'border-slate-200 bg-white hover:bg-slate-100/60 text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-900">{client.fullNameLatin} ({client.fullNameArabic})</div>
                        <div className="text-[11px] text-slate-500 font-mono">Passeport: {client.passportNumber} · CIN: {client.cinNumber || 'N/A'}</div>
                      </div>

                      {selectedClientId === client.id ? (
                        <span className="text-emerald-600 bg-emerald-100 p-1 rounded-full">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Sélectionner</span>
                      )}
                    </div>
                  ))}
                </div>

                {selectedClientId && (
                  <button
                    onClick={() => handleConfirmUpdate(selectedClientId)}
                    className="w-full mt-2 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Confirmer la mise à jour de ce client</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100/80 p-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};
