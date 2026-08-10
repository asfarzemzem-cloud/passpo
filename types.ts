export interface BoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export type FieldSource = 'auto' | 'manuel' | 'incertain';

export interface PassportData {
  // Names
  surnameArabic: string;
  givenNamesArabic: string;
  surnameLatin: string;
  givenNamesLatin: string;

  // MRZ Data
  passportNumber: string;
  personalNumber: string; // CIN or personal ID
  nationality: string;
  sex: string;
  dateOfBirth: string;
  dateOfBirthUncertain?: boolean;
  dateOfExpiry: string;
  rawMrz?: string;

  // Visual Part & Locations
  placeOfBirth: string;
  placeOfBirthArabic?: string;
  dateOfIssuance: string;
  issuingAuthority: string;
  issuingAuthorityArabic?: string;
  address?: string;
  addressArabic?: string;

  // Rule Compliance
  isValidRule: boolean;
  validityMonths: number;
  ruleMessage: string;

  // Confidence & Dual Validation
  confidenceScores?: Record<string, number>;
  mrzChecksumValid?: boolean;
  mrzMatchVerified?: boolean;
  overallMatchScore?: number;

  // Confidence & Source tracking
  fieldSources?: Record<string, FieldSource>;

  // Bounding boxes for auto crops
  boundingBox?: BoundingBox;
  faceBoundingBox?: BoundingBox;
}

export enum ExtractionStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface PassportEntry {
  id: string;
  file: File;
  fileName: string;
  fileSize: number;
  previewUrl: string;
  status: ExtractionStatus;
  data?: PassportData;
  error?: string;
  croppedPassportUrl?: string;
  croppedFaceUrl?: string;
  isSavedToClient?: boolean;
}

export interface SavedClient {
  id: string;
  registeredAt: string;
  registrationType: 'new' | 'matched';
  passportNumber: string;
  cinNumber?: string;
  fullNameArabic: string;
  fullNameLatin: string;
  nationality: string;
  dateOfBirth: string;
  dateOfExpiry: string;
  validityMonths: number;
  passportData: PassportData;
  croppedFaceUrl?: string;
  croppedPassportUrl?: string;
}

