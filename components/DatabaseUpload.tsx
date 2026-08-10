import React, { useState } from 'react';
import { Database, FileSpreadsheet, Check, X } from 'lucide-react';
import { parseExcelDatabase } from '../services/excelService';
import { GuestRecord } from '../types';

interface DatabaseUploadProps {
  onDatabaseLoad: (records: GuestRecord[]) => void;
  recordCount: number;
}

export const DatabaseUpload: React.FC<DatabaseUploadProps> = ({ onDatabaseLoad, recordCount }) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setLoading(true);
      setError(null);
      
      try {
        const records = await parseExcelDatabase(file);
        setFileName(file.name);
        onDatabaseLoad(records);
      } catch (err: any) {
        console.error(err);
        setError("Failed to parse Excel file. Please check the format.");
        setFileName(null);
      } finally {
        setLoading(false);
        // Reset input
        event.target.value = '';
      }
    }
  };

  const handleRemove = () => {
    setFileName(null);
    onDatabaseLoad([]);
  };

  return (
    <div className="bg-slate-800 text-white p-5 rounded-2xl shadow-sm border border-slate-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold flex items-center">
          <Database className="w-5 h-5 mr-2 text-blue-400" />
          Reference Database
        </h3>
        {recordCount > 0 && (
          <span className="text-xs font-semibold bg-blue-500/20 text-blue-200 px-2 py-1 rounded-full border border-blue-500/30">
            {recordCount} Records Active
          </span>
        )}
      </div>

      <p className="text-sm text-slate-400 mb-4">
        Upload your Excel file to visualize data (cols A,C,D,H,K,N,P) and auto-verify passports.
      </p>

      {fileName ? (
        <div className="flex items-center justify-between bg-slate-700/50 p-3 rounded-xl border border-slate-600">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="bg-green-500/20 p-1.5 rounded-lg">
              <FileSpreadsheet className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-sm font-medium truncate text-slate-200">{fileName}</span>
          </div>
          <button 
            onClick={handleRemove}
            className="p-1.5 hover:bg-slate-600 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            type="file"
            id="db-upload"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileChange}
            disabled={loading}
            className="hidden"
          />
          <label
            htmlFor="db-upload"
            className={`
              flex items-center justify-center w-full p-3 border border-dashed border-slate-600 rounded-xl bg-slate-700/30 text-sm font-medium transition-all
              ${loading ? 'cursor-wait text-slate-500' : 'cursor-pointer text-slate-300 hover:text-white hover:border-blue-500 hover:bg-slate-700'}
            `}
          >
            {loading ? 'Parsing...' : 'Select Excel File'}
          </label>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-400 mt-2">{error}</p>
      )}
    </div>
  );
};