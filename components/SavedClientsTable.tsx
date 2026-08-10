import React, { useState } from 'react';
import { SavedClient } from '../types';
import { Users, Search, Trash2, ExternalLink, Calendar, CheckCircle2, AlertTriangle, UserCheck, UserPlus, RefreshCw } from 'lucide-react';

interface SavedClientsTableProps {
  clients: SavedClient[];
  onSelectClient: (client: SavedClient) => void;
  onDeleteClient: (clientId: string) => void;
}

export const SavedClientsTable: React.FC<SavedClientsTableProps> = ({
  clients,
  onSelectClient,
  onDeleteClient,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = clients.filter(
    (c) =>
      c.fullNameLatin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.fullNameArabic.includes(searchTerm) ||
      c.passportNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.cinNumber && c.cinNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden animate-in fade-in duration-300 mb-6">
      {/* Table Header / Title */}
      <div className="p-4 px-5 border-b border-slate-100 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-sm">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                Base de Données — Clients Enregistrés
              </h2>
              <span className="text-xs font-bold text-amber-300 bg-amber-950/90 border border-amber-800/80 px-2.5 py-0.5 rounded-full">
                {clients.length} {clients.length > 1 ? 'clients enregistrés' : 'client enregistré'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Consultez et chargez les fiches clients enregistrées avec leur photo et leur passeport
            </p>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher nom, prénom, passeport, CIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
          />
        </div>
      </div>

      {/* Table Body */}
      {filteredClients.length === 0 ? (
        <div className="p-8 text-center text-slate-500">
          <Users className="w-9 h-9 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-700">Aucun client trouvé dans la base</p>
          <p className="text-xs text-slate-400 mt-1">
            {searchTerm ? 'Aucun résultat ne correspond à votre recherche.' : 'Utilisez le bouton "Enregistrer client" pour ajouter vos clients.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px] sticky top-0 z-10 shadow-2xs">
              <tr>
                <th className="py-3 px-4">Photo Visage</th>
                <th className="py-3 px-4">Nom & Prénom (Français / Arabe)</th>
                <th className="py-3 px-4">N° Passeport & CIN</th>
                <th className="py-3 px-4">Expiration & Règle Validité</th>
                <th className="py-3 px-4">Mode Enregistrement</th>
                <th className="py-3 px-4">Date d'Ajout</th>
                <th className="py-3 px-4 text-right">Action Fiche</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredClients.map((client) => {
                const months = client.validityMonths;
                const isCompliant = months > 9;
                const isWarning = months > 6 && months <= 9;

                return (
                  <tr key={client.id} className="hover:bg-blue-50/40 transition-colors group">
                    {/* Face Photo */}
                    <td className="py-2.5 px-4">
                      {client.croppedFaceUrl ? (
                        <img
                          src={client.croppedFaceUrl}
                          alt={client.fullNameLatin}
                          className="w-11 h-11 rounded-xl object-cover border-2 border-slate-200 shadow-2xs group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs border border-slate-200">
                          {client.fullNameLatin.charAt(0) || 'C'}
                        </div>
                      )}
                    </td>

                    {/* Name */}
                    <td className="py-2.5 px-4">
                      <div className="font-bold text-slate-900 text-sm tracking-tight">{client.fullNameLatin}</div>
                      <div className="text-xs text-emerald-800 font-bold dir-rtl mt-0.5" dir="rtl">
                        {client.fullNameArabic}
                      </div>
                    </td>

                    {/* Passport & CIN */}
                    <td className="py-2.5 px-4">
                      <div className="font-mono font-extrabold text-blue-900">{client.passportNumber}</div>
                      {client.cinNumber && (
                        <div className="text-[11px] text-slate-500 font-mono">
                          CIN: <span className="font-semibold text-slate-700">{client.cinNumber}</span>
                        </div>
                      )}
                    </td>

                    {/* Expiry & Status */}
                    <td className="py-2.5 px-4">
                      <div className="font-medium text-slate-900">{client.dateOfExpiry || 'Inconnue'}</div>
                      {isCompliant ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full mt-0.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Conforme ({months} mois)
                        </span>
                      ) : isWarning ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full mt-0.5">
                          <AlertTriangle className="w-3 h-3 text-amber-600" /> Vigilance ({months} mois)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-900 bg-rose-100 px-2 py-0.5 rounded-full mt-0.5">
                          <AlertTriangle className="w-3 h-3 text-rose-600" /> Non Valide (≤6 mois)
                        </span>
                      )}
                    </td>

                    {/* Registration Type */}
                    <td className="py-2.5 px-4">
                      {client.registrationType === 'matched' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-900 bg-amber-50 border border-amber-200/90 px-2 py-0.5 rounded-lg">
                          <RefreshCw className="w-3 h-3 text-amber-600" />
                          Correspondance liée
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-900 bg-blue-50 border border-blue-200/90 px-2 py-0.5 rounded-lg">
                          <UserPlus className="w-3 h-3 text-blue-600" />
                          Nouveau client
                        </span>
                      )}
                    </td>

                    {/* Registration Date */}
                    <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">
                      {client.registeredAt}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectClient(client)}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-extrabold transition-all inline-flex items-center gap-1.5 shadow-2xs"
                          title="Afficher et charger la fiche client dans le formulaire"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-slate-950" />
                          <span>Voir Fiche</span>
                        </button>

                        <button
                          onClick={() => onDeleteClient(client.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                          title="Supprimer ce client"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
