import { read, utils } from 'xlsx';
import { GuestRecord } from '../types';

export const parseExcelDatabase = async (file: File): Promise<GuestRecord[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error("Failed to read file"));
          return;
        }
        
        const workbook = read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0]; 
        const sheet = workbook.Sheets[sheetName];
        
        // Use header: "A" to generate object keys based on column letters (A, B, C...)
        const rawData = utils.sheet_to_json<any>(sheet, { header: "A" });
        
        // Map specific columns as requested
        const records: GuestRecord[] = rawData.map((row, index) => ({
          id: `row-${index}`,
          rowNumber: index + 1,
          number: row["A"] ? String(row["A"]) : "",
          firstName: row["C"] ? String(row["C"]) : "",
          lastName: row["D"] ? String(row["D"]) : "",
          passportNumber: row["H"] ? String(row["H"]) : "",
          hotel: row["K"] ? String(row["K"]) : "",
          room: row["N"] ? String(row["N"]) : "",
          manager: row["P"] ? String(row["P"]) : "",
        }));

        // Filter out rows that are completely empty or look like headers (optional, but good for cleanup)
        // We'll keep rows that have at least a passport number or a name
        const validRecords = records.filter(r => 
          r.passportNumber || (r.firstName && r.lastName)
        );

        resolve(validRecords);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Tries to find a record in the database that matches the passport number.
 * Looks specifically in Column H (passportNumber).
 */
export const findMatchInDatabase = (
  passportNumber: string, 
  database: GuestRecord[]
): GuestRecord | undefined => {
  if (!passportNumber) return undefined;
  
  const normalizedPassportNum = passportNumber.replace(/[\s-]+/g, '').toUpperCase();

  return database.find(record => {
    if (!record.passportNumber) return false;
    const dbNum = record.passportNumber.replace(/[\s-]+/g, '').toUpperCase();
    return dbNum === normalizedPassportNum;
  });
};