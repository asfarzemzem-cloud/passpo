import React from 'react';
import { UploadCloud } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  disabled: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, disabled }) => {

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const files = Array.from(event.target.files);
      onFileSelect(files);
      // Reset input value to allow selecting the same file again if needed
      event.target.value = '';
    }
  };

  return (
    <div className="w-full">
      <label 
        htmlFor="file-upload" 
        className={`
          flex flex-col items-center justify-center w-full h-40 sm:h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200
          ${disabled ? 'bg-slate-50 border-slate-200 cursor-not-allowed opacity-60' : 'bg-white border-slate-300 hover:border-blue-500 hover:bg-blue-50/30'}
        `}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
          <div className="bg-blue-50 p-3 rounded-full mb-3">
            <UploadCloud className="w-6 h-6 text-blue-600" />
          </div>
          <p className="mb-1 text-base font-medium text-slate-700">
            Click to upload passports
          </p>
          <p className="text-xs text-slate-500">
            SVG, PNG, JPG or GIF (max 10MB) • Multiple files allowed
          </p>
        </div>
        <input 
          id="file-upload" 
          type="file" 
          className="hidden" 
          accept="image/*"
          multiple
          onChange={handleFileChange}
          disabled={disabled}
        />
      </label>
    </div>
  );
};