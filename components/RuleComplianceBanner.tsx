import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface RuleComplianceBannerProps {
  isValid?: boolean;
  validityMonths?: number;
  expiryDate?: string;
  ruleDescription?: string;
}

const getMonthsRemaining = (monthsProp?: number, dateStr?: string): number => {
  if (typeof monthsProp === 'number' && monthsProp > 0) {
    return monthsProp;
  }
  if (!dateStr) return 0;

  try {
    const cleanStr = dateStr.trim().replace(/\s+/g, '');
    let expDate: Date | null = null;
    if (cleanStr.includes('/')) {
      const parts = cleanStr.split('/');
      if (parts.length === 3) {
        expDate = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
      }
    } else if (cleanStr.includes('-')) {
      const parts = cleanStr.split('-');
      if (parts.length === 3) {
        expDate = parts[0].length === 4
          ? new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10))
          : new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
      }
    }

    if (expDate && !isNaN(expDate.getTime())) {
      const now = new Date();
      const diffMs = expDate.getTime() - now.getTime();
      const diffMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.4375));
      return diffMonths < 0 ? 0 : diffMonths;
    }
  } catch (e) {
    // fallback
  }
  return monthsProp || 0;
};

export const RuleComplianceBanner: React.FC<RuleComplianceBannerProps> = ({
  validityMonths,
  expiryDate = '',
  ruleDescription = 'validité 6 mois après le départ',
}) => {
  const months = getMonthsRemaining(validityMonths, expiryDate);

  // Case 1: More than 9 months remaining -> Fully valid & compliant, NO message shown!
  if (months > 9) {
    return null;
  }

  // Case 2: Between 6 and 9 months remaining (<= 9 and > 6) -> YELLOW WARNING BANNER
  if (months > 6 && months <= 9) {
    return (
      <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4 mb-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
        <div className="flex items-start gap-3">
          <div className="p-2 text-amber-800 bg-amber-100 rounded-xl flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-amber-950 tracking-tight">
                Attention : Validité limitée ({months} mois restant)
              </h3>
              <span className="bg-amber-200/80 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                Avertissement (Moins de 9 mois)
              </span>
            </div>
            <p className="text-xs text-amber-900 font-medium mt-1">
              Il ne reste que <span className="font-bold">{months} mois</span> de validité sur ce passeport (Expiration : {expiryDate || 'non spécifiée'}). Un renouvellement est conseillé prochainement.
            </p>
          </div>
        </div>

        <div className="text-xs text-amber-800 font-medium sm:text-right flex items-center sm:block gap-1 pt-2 sm:pt-0 border-t sm:border-t-0 border-amber-200/60 shrink-0">
          <span className="text-[10px] uppercase tracking-wider text-amber-600 font-bold block">Seuil de vigilance</span>
          <span>Moins de 9 mois de validité</span>
        </div>
      </div>
    );
  }

  // Case 3: 6 months or less remaining (<= 6 months, or expired) -> RED ERROR BANNER
  return (
    <div className="bg-rose-50 border border-rose-200/90 rounded-2xl p-4 mb-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
      <div className="flex items-start gap-3">
        <div className="p-2 text-rose-700 bg-rose-100 rounded-xl flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-rose-600" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-rose-950 tracking-tight">
              Alerte : Passeport non conforme (≤ 6 mois de validité)
            </h3>
            <span className="bg-rose-200/80 text-rose-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
              Non Valide
            </span>
          </div>
          <p className="text-xs text-rose-900 font-medium mt-1">
            {months <= 0
              ? `Le passeport est expiré (Expiration : ${expiryDate}). Il ne respecte pas la règle de voyage.`
              : `Le passeport n'a que ${months} mois de validité restante (Expiration : ${expiryDate}). La règle de 6 mois minimum n'est pas respectée.`}
          </p>
        </div>
      </div>

      <div className="text-xs text-rose-700 font-medium sm:text-right flex items-center sm:block gap-1 pt-2 sm:pt-0 border-t sm:border-t-0 border-rose-200/60 shrink-0">
        <span className="text-[10px] uppercase tracking-wider text-rose-500 font-bold block">Contrainte</span>
        <span>{ruleDescription}</span>
      </div>
    </div>
  );
};


