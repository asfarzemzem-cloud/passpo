import { GoogleGenAI, Type } from "@google/genai";
import { PassportData, FieldSource } from "../types";

// =========================================================
// ICAO 9303 MRZ CHECKSUM CALCULATION (Deterministic arithmetic)
// =========================================================
export function calculateIcaoCheckDigit(data: string): number {
  const weights = [7, 3, 1];
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data[i].toUpperCase();
    let val = 0;
    if (char >= '0' && char <= '9') {
      val = parseInt(char, 10);
    } else if (char >= 'A' && char <= 'Z') {
      val = char.charCodeAt(0) - 55; // A=10, B=11 ... Z=35
    } else {
      val = 0; // '<' or filler
    }
    sum += val * weights[i % 3];
  }
  return sum % 10;
}

export interface MrzValidationResult {
  isValid: boolean;
  passportNumberValid: boolean;
  dateOfBirthValid: boolean;
  dateOfExpiryValid: boolean;
  personalNumberValid: boolean;
  compositeValid: boolean;
}

export function validateIcaoTd3Mrz(mrzRaw?: string): MrzValidationResult {
  if (!mrzRaw) {
    return {
      isValid: false,
      passportNumberValid: false,
      dateOfBirthValid: false,
      dateOfExpiryValid: false,
      personalNumberValid: false,
      compositeValid: false,
    };
  }

  const lines = mrzRaw
    .split('\n')
    .map((l) => l.trim().replace(/\r/g, ''))
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return {
      isValid: false,
      passportNumberValid: false,
      dateOfBirthValid: false,
      dateOfExpiryValid: false,
      personalNumberValid: false,
      compositeValid: false,
    };
  }

  const line2 = lines[1];
  if (line2.length < 44) {
    return {
      isValid: false,
      passportNumberValid: false,
      dateOfBirthValid: false,
      dateOfExpiryValid: false,
      personalNumberValid: false,
      compositeValid: false,
    };
  }

  // Slices according to ICAO 9303 TD3 (2 lines of 44 chars)
  const passNum = line2.substring(0, 9);
  const passNumCheckStr = line2[9];
  const passNumValid = passNumCheckStr !== '<' && parseInt(passNumCheckStr, 10) === calculateIcaoCheckDigit(passNum);

  const dobStr = line2.substring(13, 19);
  const dobCheckStr = line2[19];
  const dobValid = dobCheckStr !== '<' && parseInt(dobCheckStr, 10) === calculateIcaoCheckDigit(dobStr);

  const expiryStr = line2.substring(21, 27);
  const expiryCheckStr = line2[27];
  const expiryValid = expiryCheckStr !== '<' && parseInt(expiryCheckStr, 10) === calculateIcaoCheckDigit(expiryStr);

  const personalNumStr = line2.substring(28, 42);
  const personalNumCheckStr = line2[42];
  let personalNumValid = true;
  if (personalNumCheckStr !== '<' && /^[0-9]$/.test(personalNumCheckStr)) {
    personalNumValid = parseInt(personalNumCheckStr, 10) === calculateIcaoCheckDigit(personalNumStr);
  }

  const compositeStr = passNum + passNumCheckStr + dobStr + dobCheckStr + expiryStr + expiryCheckStr + personalNumStr + personalNumCheckStr;
  const compositeCheckStr = line2[43];
  let compositeValid = false;
  if (compositeCheckStr && /^[0-9]$/.test(compositeCheckStr)) {
    compositeValid = parseInt(compositeCheckStr, 10) === calculateIcaoCheckDigit(compositeStr);
  }

  const allValid = passNumValid && dobValid && expiryValid && compositeValid;

  return {
    isValid: allValid,
    passportNumberValid: passNumValid,
    dateOfBirthValid: dobValid,
    dateOfExpiryValid: expiryValid,
    personalNumberValid,
    compositeValid,
  };
}

export const processPassportImage = async (base64Image: string, mimeType: string): Promise<PassportData> => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Clé API Gemini non configurée. Impossible de traiter le passeport.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Analyze this passport or national ID image and extract ALL information with MAXIMUM best-effort tolerance.

    MANDATORY extraction guidelines:
    1. NEVER REJECT THE IMAGE OR REFUSE EXTRACTION. Even if the image is blurry, low-resolution, partially covered, or edited (e.g. if names, MRZ, or photo are blurred):
       - Extract ALL visible or partially visible fields without exception.
       - If some fields (like surname, given names, or MRZ) are blurred or obscured, STILL extract all other readable fields (Passport Number, CIN, Dates of Birth/Issuance/Expiry, Nationality, Sex, Places, Issuing Authority).
       - For blurry or partially visible text, provide your best OCR guess/approximation.
    2. ARABIC & LATIN NAMES:
       - Extract Arabic script text for surname ('surnameArabic') and given names ('givenNamesArabic').
       - Extract Latin family name ('surnameLatin') and given names ('givenNamesLatin').
    3. LOCATIONS & AUTHORITIES:
       - Place of birth in Latin ('placeOfBirth') and Arabic city name only ('placeOfBirthArabic').
       - Issuing authority in Latin ('issuingAuthority') and Arabic province/city name ('issuingAuthorityArabic').
       - Address or principal city in Latin ('address') and Arabic city name ('addressArabic').
    4. NUMBERS & DATES:
       - Passport Number ('passportNumber')
       - Personal Number / CIN ('personalNumber')
       - Nationality code e.g. MAR ('nationality')
       - Sex M or F ('sex')
       - Date of birth DD/MM/YYYY ('dateOfBirth')
       - Date of expiry DD/MM/YYYY ('dateOfExpiry')
       - Date of issuance DD/MM/YYYY ('dateOfIssuance')
       - Raw MRZ lines if visible ('rawMrz')
    5. CROPPING BOXES (0 to 1000):
       - 'boundingBox': Box enclosing passport page.
       - 'faceBoundingBox': Box enclosing photo portrait.
    6. If any field or date is blurry or uncertain, extract your best guess and set 'dateOfBirthUncertain' or field sources accordingly.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isUnreadableDocument: { type: Type.BOOLEAN, description: "True si l'image est floue ou inexploitable" },
            surnameArabic: { type: Type.STRING },
            givenNamesArabic: { type: Type.STRING },
            surnameLatin: { type: Type.STRING },
            givenNamesLatin: { type: Type.STRING },
            passportNumber: { type: Type.STRING },
            personalNumber: { type: Type.STRING },
            nationality: { type: Type.STRING },
            sex: { type: Type.STRING },
            dateOfBirth: { type: Type.STRING },
            dateOfBirthUncertain: { type: Type.BOOLEAN },
            dateOfExpiry: { type: Type.STRING },
            placeOfBirth: { type: Type.STRING },
            placeOfBirthArabic: { type: Type.STRING },
            dateOfIssuance: { type: Type.STRING },
            issuingAuthority: { type: Type.STRING },
            issuingAuthorityArabic: { type: Type.STRING },
            address: { type: Type.STRING },
            addressArabic: { type: Type.STRING },
            rawMrz: { type: Type.STRING },
            boundingBox: {
              type: Type.OBJECT,
              properties: {
                ymin: { type: Type.INTEGER },
                xmin: { type: Type.INTEGER },
                ymax: { type: Type.INTEGER },
                xmax: { type: Type.INTEGER },
              },
            },
            faceBoundingBox: {
              type: Type.OBJECT,
              properties: {
                ymin: { type: Type.INTEGER },
                xmin: { type: Type.INTEGER },
                ymax: { type: Type.INTEGER },
                xmax: { type: Type.INTEGER },
              },
            },
          },
        },
      },
    });

    if (!response.text) {
      return formatAndValidatePassportData({ isUnreadableDocument: true });
    }

    const parsed = JSON.parse(response.text);
    return formatAndValidatePassportData(parsed);
  } catch (err: any) {
    console.warn("Gemini extraction soft failure:", err);
    return formatAndValidatePassportData({ isUnreadableDocument: true });
  }
};

export function computeDeterministicConfidenceScores(
  data: Partial<PassportData>,
  mrzCheck: MrzValidationResult,
  isDobUncertain?: boolean
): { confidenceScores: Record<string, number>; overallMatchScore: number } {
  const scores: Record<string, number> = {};

  const isValidDateStr = (str?: string) => {
    if (!str) return false;
    return /^\d{1,2}\s*[\/\.-]\s*\d{1,2}\s*[\/\.-]\s*\d{2,4}$/.test(str.trim());
  };

  const isArabicScript = (str?: string) => {
    if (!str) return false;
    return /^[\u0600-\u06FF\s\.\,\-]+$/.test(str.trim());
  };

  const parseDateToTimestamp = (str?: string): number | null => {
    if (!str) return null;
    const parts = str.split(/[\/\.-]/).map((p) => parseInt(p.trim(), 10));
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      let year = parts[2];
      if (year < 100) year += year > 50 ? 1900 : 2000;
      return new Date(year, parts[1] - 1, parts[0]).getTime();
    }
    return null;
  };

  // 1. Passport Number (MRZ checksum + format check)
  if (data.passportNumber) {
    if (mrzCheck.passportNumberValid) {
      scores.passportNumber = 100;
    } else if (/^[A-Z0-9]{6,12}$/i.test(data.passportNumber)) {
      scores.passportNumber = 75;
    } else {
      scores.passportNumber = 50;
    }
  }

  // 2. Date of Birth
  if (data.dateOfBirth) {
    if (mrzCheck.dateOfBirthValid && isValidDateStr(data.dateOfBirth)) {
      scores.dateOfBirth = isDobUncertain ? 80 : 100;
    } else if (isValidDateStr(data.dateOfBirth)) {
      scores.dateOfBirth = isDobUncertain ? 65 : 85;
    } else {
      scores.dateOfBirth = 40;
    }
  }

  // 3. Date of Expiry
  if (data.dateOfExpiry) {
    if (mrzCheck.dateOfExpiryValid && isValidDateStr(data.dateOfExpiry)) {
      scores.dateOfExpiry = 100;
    } else if (isValidDateStr(data.dateOfExpiry)) {
      scores.dateOfExpiry = 80;
    } else {
      scores.dateOfExpiry = 40;
    }
  }

  // 4. Personal Number (CIN)
  if (data.personalNumber) {
    if (mrzCheck.personalNumberValid) {
      scores.personalNumber = 100;
    } else if (/^[A-Z0-9]{4,15}$/i.test(data.personalNumber)) {
      scores.personalNumber = 90;
    } else {
      scores.personalNumber = 60;
    }
  }

  // 5. Nationality
  if (data.nationality) {
    if (/^[A-Z]{3}$/i.test(data.nationality)) {
      scores.nationality = 100;
    } else {
      scores.nationality = 70;
    }
  }

  // 6. Sex
  if (data.sex) {
    if (/^[MFX]$/i.test(data.sex.trim())) {
      scores.sex = 100;
    } else {
      scores.sex = 60;
    }
  }

  // 7. Latin Names
  if (data.surnameLatin) {
    scores.surnameLatin = /^[A-Z\s\-']{2,}$/i.test(data.surnameLatin) ? 96 : 75;
  }
  if (data.givenNamesLatin) {
    scores.givenNamesLatin = /^[A-Z\s\-']{2,}$/i.test(data.givenNamesLatin) ? 96 : 75;
  }

  // 8. Arabic Names (Visual Inspection Area - Unicode Arabic verification)
  if (data.surnameArabic) {
    scores.surnameArabic = isArabicScript(data.surnameArabic) ? 96 : 70;
  }
  if (data.givenNamesArabic) {
    scores.givenNamesArabic = isArabicScript(data.givenNamesArabic) ? 96 : 70;
  }

  // 9. Date of Issuance (Visual Inspection Area - Format + Chronological Sanity)
  if (data.dateOfIssuance) {
    const validFmt = isValidDateStr(data.dateOfIssuance);
    const issueTime = parseDateToTimestamp(data.dateOfIssuance);
    const expiryTime = parseDateToTimestamp(data.dateOfExpiry);

    if (validFmt && issueTime && expiryTime && issueTime < expiryTime) {
      scores.dateOfIssuance = 98;
    } else if (validFmt) {
      scores.dateOfIssuance = 85;
    } else {
      scores.dateOfIssuance = 50;
    }
  }

  // 10. Places & Authorities (Visual Inspection Area)
  if (data.placeOfBirth) {
    scores.placeOfBirth = data.placeOfBirth.length >= 3 ? 95 : 70;
  }
  if (data.placeOfBirthArabic) {
    scores.placeOfBirthArabic = isArabicScript(data.placeOfBirthArabic) ? 95 : 70;
  }

  if (data.issuingAuthority) {
    scores.issuingAuthority = data.issuingAuthority.length >= 3 ? 95 : 70;
  }
  if (data.issuingAuthorityArabic) {
    scores.issuingAuthorityArabic = isArabicScript(data.issuingAuthorityArabic) ? 95 : 70;
  }

  if (data.address) {
    scores.address = data.address.length >= 3 ? 95 : 70;
  }
  if (data.addressArabic) {
    scores.addressArabic = isArabicScript(data.addressArabic) ? 95 : 70;
  }

  const scoreValues = Object.values(scores);
  if (scoreValues.length === 0) {
    return { confidenceScores: {}, overallMatchScore: 0 };
  }

  const sum = scoreValues.reduce((acc, curr) => acc + curr, 0);
  let overall = Math.round(sum / scoreValues.length);

  if (mrzCheck.isValid) {
    overall = Math.max(overall, 98);
  }

  return {
    confidenceScores: scores,
    overallMatchScore: overall,
  };
}

const formatAndValidatePassportData = (parsed: any): PassportData => {
  // STRICT RULE: No hardcoded fallbacks like "EL ARCHI", "CJ6747850", etc.
  // Missing or unread fields are empty strings.
  const surnameLatin = (parsed.surnameLatin || "").trim();
  const givenNamesLatin = (parsed.givenNamesLatin || "").trim();
  const passportNumber = (parsed.passportNumber || "").trim();
  const dateOfExpiry = (parsed.dateOfExpiry || "").trim();
  const rawMrz = (parsed.rawMrz || "").trim();

  const isUnreadable = !!parsed.isUnreadableDocument || (!passportNumber && !surnameLatin && !rawMrz);

  // REAL ICAO 9303 MRZ Checksum calculation
  const mrzCheck = validateIcaoTd3Mrz(rawMrz);

  // REAL Deterministic confidence score calculation
  const { confidenceScores, overallMatchScore } = computeDeterministicConfidenceScores(parsed, mrzCheck, parsed.dateOfBirthUncertain);

  // Field Sources (strictly tracking source)
  const fieldSources: Record<string, FieldSource> = {
    surnameArabic: parsed.surnameArabic ? 'auto' : 'incertain',
    givenNamesArabic: parsed.givenNamesArabic ? 'auto' : 'incertain',
    surnameLatin: parsed.surnameLatin ? 'auto' : 'incertain',
    givenNamesLatin: parsed.givenNamesLatin ? 'auto' : 'incertain',
    passportNumber: parsed.passportNumber ? 'auto' : 'incertain',
    personalNumber: parsed.personalNumber ? 'auto' : 'incertain',
    nationality: parsed.nationality ? 'auto' : 'incertain',
    sex: parsed.sex ? 'auto' : 'incertain',
    dateOfBirth: parsed.dateOfBirthUncertain ? 'incertain' : (parsed.dateOfBirth ? 'auto' : 'incertain'),
    dateOfExpiry: parsed.dateOfExpiry ? 'auto' : 'incertain',
    placeOfBirth: parsed.placeOfBirth ? 'auto' : 'incertain',
    dateOfIssuance: parsed.dateOfIssuance ? 'auto' : 'incertain',
    issuingAuthority: parsed.issuingAuthority ? 'auto' : 'incertain',
  };

  const warningMessage = (isUnreadable || !mrzCheck.isValid || !passportNumber || !surnameLatin || parsed.dateOfBirthUncertain)
    ? "⚠️ Contrôle MRZ incertain ou image partiellement floue — Veuillez vérifier les données ci-dessous."
    : "";

  return {
    surnameArabic: parsed.surnameArabic || "",
    givenNamesArabic: parsed.givenNamesArabic || "",
    surnameLatin: surnameLatin,
    givenNamesLatin: givenNamesLatin,
    passportNumber: passportNumber,
    personalNumber: parsed.personalNumber || "",
    nationality: parsed.nationality || "",
    sex: parsed.sex || "",
    dateOfBirth: parsed.dateOfBirth || "",
    dateOfBirthUncertain: !!parsed.dateOfBirthUncertain,
    dateOfExpiry: dateOfExpiry,
    rawMrz: rawMrz,
    placeOfBirth: parsed.placeOfBirth || "",
    placeOfBirthArabic: parsed.placeOfBirthArabic || "",
    dateOfIssuance: parsed.dateOfIssuance || "",
    issuingAuthority: parsed.issuingAuthority || "",
    issuingAuthorityArabic: parsed.issuingAuthorityArabic || "",
    address: parsed.address || "",
    addressArabic: parsed.addressArabic || "",
    isValidRule: true,
    validityMonths: 0,
    ruleMessage: warningMessage,
    extractionWarning: warningMessage || undefined,
    confidenceScores,
    mrzChecksumValid: mrzCheck.isValid,
    mrzMatchVerified: mrzCheck.isValid,
    overallMatchScore,
    fieldSources,
    boundingBox: parsed.boundingBox,
    faceBoundingBox: parsed.faceBoundingBox,
  };
};

export const getDemoPassportData = (overrideName?: string): PassportData => {
  const demoMrz = "P<MAREL<ARCHI<<FATNA<<<<<<<<<<<<<<<<<<<<<<<<<\nCJ67478506MAR4901015F2801245TA50<<<<<<<<<<<<80";
  return {
    surnameArabic: "العرشي",
    givenNamesArabic: "فاطمة",
    surnameLatin: overrideName ? overrideName.toUpperCase() : "EL ARCHI",
    givenNamesLatin: "FATNA",
    passportNumber: "CJ6747850",
    personalNumber: "TA50",
    nationality: "MAR",
    sex: "F",
    dateOfBirth: "01 / 01 / 1949",
    dateOfBirthUncertain: false,
    dateOfExpiry: "24 / 01 / 2028",
    rawMrz: demoMrz,
    placeOfBirth: "KHOURIBGA / MAROC",
    placeOfBirthArabic: "خريبكة",
    dateOfIssuance: "24 / 01 / 2023",
    issuingAuthority: "PROVINCE DE BENSLIMANE",
    issuingAuthorityArabic: "بنسليمان",
    address: "CASABLANCA / MAROC",
    addressArabic: "الدار البيضاء",
    isValidRule: true,
    validityMonths: 22,
    ruleMessage: "Expire le 24/01/2028",
    mrzChecksumValid: true,
    mrzMatchVerified: true,
    overallMatchScore: 100,
    fieldSources: {
      surnameArabic: 'auto',
      givenNamesArabic: 'auto',
      surnameLatin: 'auto',
      givenNamesLatin: 'auto',
      passportNumber: 'auto',
      personalNumber: 'auto',
      nationality: 'auto',
      sex: 'auto',
      dateOfBirth: 'auto',
      dateOfExpiry: 'auto',
      placeOfBirth: 'auto',
      dateOfIssuance: 'auto',
      issuingAuthority: 'auto',
    },
    boundingBox: { ymin: 0, xmin: 0, ymax: 1000, xmax: 1000 },
    faceBoundingBox: { ymin: 204, xmin: 50, ymax: 704, xmax: 313 },
  };
};
