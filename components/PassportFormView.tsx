import React, { useState, useEffect } from 'react';
import { PassportData, FieldSource } from '../types';
import { Calendar, Save, ArrowRight, Check, HelpCircle, FileCheck, Lock, Unlock, ShieldAlert, UserPlus, ShieldCheck, Eye } from 'lucide-react';

interface PassportFormViewProps {
  data: PassportData;
  onUpdateData: (updated: PassportData) => void;
  onSaveToClient: () => void;
  onNextInList: () => void;
  isSaved?: boolean;
  hasNext?: boolean;
  isDebugMode?: boolean;
}

export const PassportFormView: React.FC<PassportFormViewProps> = ({
  data,
  onUpdateData,
  onSaveToClient,
  onNextInList,
  isSaved = false,
  hasNext = true,
  isDebugMode = false,
}) => {
  const [formData, setFormData] = useState<PassportData>(data);
  const [fieldSources, setFieldSources] = useState<Record<string, FieldSource>>(
    data.fieldSources || {}
  );
  const [isLocked, setIsLocked] = useState<boolean>(true);

  useEffect(() => {
    setFormData(data);
    setFieldSources(data.fieldSources || {});
    // Auto-unlock form if extraction had warnings or missing key data
    const hasWarnings = !!data.extractionWarning || (!data.passportNumber && !data.surnameLatin) || data.mrzChecksumValid === false;
    if (hasWarnings) {
      setIsLocked(false);
    }
  }, [data]);

  const handleChange = (field: keyof PassportData, val: any) => {
    if (isLocked) return;
    const updated = { ...formData, [field]: val };
    const updatedSources = { ...fieldSources, [field]: 'manuel' as FieldSource };
    setFormData(updated);
    setFieldSources(updatedSources);
    onUpdateData({ ...updated, fieldSources: updatedSources });
  };

  const getFieldScore = (field: keyof PassportData, source: FieldSource | string): number | null => {
    if (formData.confidenceScores && typeof formData.confidenceScores[field as string] === 'number') {
      return formData.confidenceScores[field as string];
    }
    if (source === 'manuel') return 100;
    return null;
  };

  const renderFieldInput = ({
    label,
    field,
    value,
    direction = 'ltr',
    isDate = false,
    badge,
    colSpan = 'col-span-1',
  }: {
    label: string;
    field: keyof PassportData;
    value: string;
    direction?: 'ltr' | 'rtl';
    isDate?: boolean;
    badge?: 'auto' | 'manuel' | 'incertain' | string;
    colSpan?: string;
  }) => {
    const source = fieldSources[field as string] || badge || 'auto';
    const score = getFieldScore(field, source);
    const isMissing = !value || value.trim() === '';

    return (
      <div className={`${colSpan} flex flex-col`}>
        <div className="flex items-center justify-between mb-1 gap-1 flex-wrap">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 flex-wrap">
            <span>{label}</span>
            {score !== null && (
              <span
                className={`text-[10px] font-mono font-extrabold px-1.5 py-0.2 rounded-md border shadow-2xs ${
                  score >= 95
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : score >= 85
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
                title={`Niveau de confiance: ${score}%`}
              >
                {score}%
              </span>
            )}
            {isMissing && (
              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded-md">
                Non lu / Absent
              </span>
            )}
          </label>

          {source === 'incertain' ? (
            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.2 rounded-md flex items-center gap-0.5 shadow-xs">
              <HelpCircle className="w-2.5 h-2.5 text-amber-600" />
              ? Incertain
            </span>
          ) : source === 'manuel' ? (
            <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded font-mono">
              manuel
            </span>
          ) : (
            <span className="text-[10px] text-slate-400 font-mono">
              auto
            </span>
          )}
        </div>

        <div className="relative flex items-center">
          <input
            type="text"
            dir={direction}
            value={value || ''}
            placeholder={isMissing ? 'Non extrait (à remplir)' : ''}
            readOnly={isLocked}
            disabled={isLocked}
            onChange={(e) => handleChange(field, e.target.value)}
            className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all outline-none border ${
              isMissing
                ? 'bg-rose-50/40 border-rose-300 text-rose-950 placeholder-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-400'
                : isLocked
                ? 'bg-slate-100/80 border-slate-200 text-slate-700 cursor-not-allowed select-none'
                : source === 'incertain'
                ? 'bg-amber-50/70 border-amber-300 text-amber-950 focus:bg-white focus:ring-2 focus:ring-amber-400'
                : source === 'manuel'
                ? 'bg-blue-50/50 border-blue-300 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-400'
                : 'bg-white border-slate-200 text-slate-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-200'
            }`}
          />
          {isDate && (
            <div className="absolute right-3 text-slate-400 pointer-events-none">
              <Calendar className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-5 w-full">
      {/* HEADER & LOCK BAR */}
      <div className="bg-slate-900 text-white p-3.5 px-4 -mx-5 -mt-5 rounded-t-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-white tracking-tight">Données du passeport</h2>
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
            isLocked ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-amber-500 text-slate-950 font-extrabold'
          }`}>
            {isLocked ? 'Verrouillé' : 'Modifiable'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsLocked(!isLocked)}
          className={`px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold shadow-xs ${
            isLocked
              ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
              : 'bg-amber-400 text-slate-950 border-amber-300 hover:bg-amber-300'
          }`}
          title={isLocked ? 'Débloquer pour modifier' : 'Verrouiller les données'}
        >
          {isLocked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5 text-slate-950" />}
          <span>{isLocked ? 'Débloquer pour éditer' : 'Verrouiller'}</span>
        </button>
      </div>

      {/* TOP PRIMARY ACTION BUTTONS BAR */}
      <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3 flex flex-col sm:flex-row items-center gap-2.5">
        <button
          onClick={onSaveToClient}
          className={`flex-1 w-full py-2.5 px-4 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 shadow-xs ${
            isSaved
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
          }`}
        >
          {isSaved ? (
            <>
              <Check className="w-4 h-4" />
              <span>Client Enregistré dans la Base</span>
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4 fill-slate-950" />
              <span>Enregistrer client (Nouveau / Correspondance)</span>
            </>
          )}
        </button>

        <button
          onClick={onNextInList}
          disabled={!hasNext}
          className="w-full sm:w-auto py-2.5 px-3.5 rounded-xl font-bold text-xs bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 shrink-0"
        >
          <span>Suivant</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* PROMINENT WARNING BANNER FOR FLOU / EXTRACTION PARTIELLE */}
      {(formData.extractionWarning || (!formData.passportNumber && !formData.surnameLatin) || formData.mrzChecksumValid === false) && (
        <div className="bg-amber-50 border-2 border-amber-400 text-amber-950 p-4 rounded-2xl flex items-start gap-3 shadow-xs animate-in fade-in duration-200">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1.5 flex-1">
            <div className="font-extrabold text-amber-900 text-sm flex items-center justify-between gap-2 flex-wrap">
              <span>{formData.extractionWarning || "⚠️ Contrôle MRZ incertain ou image partiellement floue — Veuillez vérifier les données ci-dessous."}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 border border-amber-300 uppercase">
                Formulaire Déverrouillé
              </span>
            </div>
            <p className="text-amber-800 leading-relaxed font-medium">
              Les informations lues ont été renseignées ci-dessous. Le formulaire est <strong className="font-bold underline text-amber-950">déverrouillé</strong> : vous pouvez compléter ou corriger les champs directement avant de cliquer sur <span className="font-bold text-amber-950">« Enregistrer client »</span>.
            </p>
          </div>
        </div>
      )}

      {/* DOUBLE VERIFICATION STATUS CARD (PASS 1: IA/OCR VISION + PASS 2: MRZ ICAO 9303 SANS FAILLE) - VISIBLE ONLY IN DEBUG MODE */}
      {isDebugMode && (
        <div className="bg-slate-900 text-white rounded-2xl p-3.5 border border-slate-800 space-y-2.5 shadow-xs animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-xl">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                  <span>Double Vérification d'Extraction (2 Passes)</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.2 rounded-full font-mono font-bold">
                    Sans Faille
                  </span>
                </h4>
                <p className="text-[10px] text-slate-400">
                  Contrôle croisé : Zone Visuelle (IA Vision) & Zone Optique MRZ (Norme ICAO 9303)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-slate-800/90 border border-slate-700/80 px-2.5 py-1 rounded-xl shrink-0">
              <span className="text-[10px] text-slate-400">Correspondance :</span>
              <span className="text-xs font-mono font-extrabold text-emerald-400">
                {typeof formData.overallMatchScore === 'number' ? `${formData.overallMatchScore}%` : 'N/A'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {/* Passe 1: IA / Vision OCR */}
            <div className="bg-slate-800/80 border border-slate-700/70 p-2 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Eye className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <div className="truncate">
                  <div className="text-[11px] font-bold text-slate-200">1. IA & Vision OCR</div>
                  <div className="text-[10px] text-slate-400 truncate">Zone Visuelle & Arabe</div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-blue-300 bg-blue-950/90 border border-blue-800 px-2 py-0.5 rounded-lg shrink-0">
                Extraction Effectuée
              </span>
            </div>

            {/* Passe 2: MRZ & Checksum ICAO 9303 */}
            <div className="bg-slate-800/80 border border-slate-700/70 p-2 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <FileCheck className={`w-3.5 h-3.5 shrink-0 ${formData.mrzChecksumValid ? 'text-emerald-400' : 'text-rose-400'}`} />
                <div className="truncate">
                  <div className="text-[11px] font-bold text-slate-200">2. Contrôle MRZ ICAO</div>
                  <div className="text-[10px] text-slate-400 truncate">Checksum ICAO 9303</div>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0 border ${
                formData.mrzChecksumValid
                  ? 'text-emerald-300 bg-emerald-950/90 border-emerald-800'
                  : 'text-rose-300 bg-rose-950/90 border-rose-800'
              }`}>
                {formData.mrzChecksumValid ? 'MRZ Valide (ICAO 9303)' : 'MRZ Invalide / Flou'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 1: NOM */}
      <section>
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Nom
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {renderFieldInput({
            label: 'Nom de famille (arabe)',
            field: 'surnameArabic',
            value: formData.surnameArabic,
            direction: 'rtl',
          })}

          {renderFieldInput({
            label: 'Prénoms (arabe)',
            field: 'givenNamesArabic',
            value: formData.givenNamesArabic,
            direction: 'rtl',
          })}

          {renderFieldInput({
            label: 'Nom de famille (latin)',
            field: 'surnameLatin',
            value: formData.surnameLatin,
          })}

          {renderFieldInput({
            label: 'Prénoms (latin)',
            field: 'givenNamesLatin',
            value: formData.givenNamesLatin,
          })}
        </div>
      </section>

      {/* SECTION 2: DONNÉES MRZ & CARTE NATIONALE */}
      <section>
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Données MRZ & Carte Nationale (CIN)
          </h3>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {renderFieldInput({
              label: 'N° de passeport',
              field: 'passportNumber',
              value: formData.passportNumber,
            })}

            {renderFieldInput({
              label: 'N° Carte Nationale (CIN)',
              field: 'personalNumber',
              value: formData.personalNumber,
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {renderFieldInput({
              label: 'Nationalité',
              field: 'nationality',
              value: formData.nationality,
            })}

            {renderFieldInput({
              label: 'Sexe',
              field: 'sex',
              value: formData.sex,
            })}

            {renderFieldInput({
              label: 'Date de naissance',
              field: 'dateOfBirth',
              value: formData.dateOfBirth,
              isDate: true,
              badge: formData.dateOfBirthUncertain ? 'incertain' : 'auto',
            })}
          </div>

          {/* Bande MRZ Brute (Raw MRZ) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Bande MRZ Brute (Lignes de contrôle)
            </label>
            <textarea
              readOnly={isLocked}
              disabled={isLocked}
              rows={2}
              value={formData.rawMrz || ''}
              onChange={(e) => handleChange('rawMrz', e.target.value)}
              className={`w-full px-3.5 py-2 rounded-xl text-xs font-mono transition-all outline-none border tracking-widest ${
                isLocked
                  ? 'bg-slate-100/80 border-slate-200 text-slate-700 cursor-not-allowed select-none'
                  : 'bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-400'
              }`}
            />
          </div>
        </div>
      </section>

      {/* SECTION 3: PARTIE VISUELLE, DATES ET VILLES EN ARABE */}
      <section>
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Partie visuelle & Lieux / Villes
          </h3>
        </div>

        <div className="space-y-4">
          {/* DATES CÔTE À CÔTE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            {renderFieldInput({
              label: 'Date de délivrance',
              field: 'dateOfIssuance',
              value: formData.dateOfIssuance,
              isDate: true,
            })}

            {renderFieldInput({
              label: "Date d'expiration",
              field: 'dateOfExpiry',
              value: formData.dateOfExpiry,
              isDate: true,
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {renderFieldInput({
              label: 'Lieu de naissance (latin)',
              field: 'placeOfBirth',
              value: formData.placeOfBirth,
            })}

            {renderFieldInput({
              label: 'Ville de naissance (arabe)',
              field: 'placeOfBirthArabic',
              value: formData.placeOfBirthArabic,
              direction: 'rtl',
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {renderFieldInput({
              label: 'Autorité / Province (latin)',
              field: 'issuingAuthority',
              value: formData.issuingAuthority,
            })}

            {renderFieldInput({
              label: "Ville / Province d'émission (arabe)",
              field: 'issuingAuthorityArabic',
              value: formData.issuingAuthorityArabic,
              direction: 'rtl',
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {renderFieldInput({
              label: 'Adresse / Lieu (latin)',
              field: 'address',
              value: formData.address,
            })}

            {renderFieldInput({
              label: 'Ville principale (arabe)',
              field: 'addressArabic',
              value: formData.addressArabic,
              direction: 'rtl',
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
