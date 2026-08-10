import React, { useState } from 'react';
import { GuestRecord } from '../types';
import { Search, MapPin, User, Briefcase, Hash } from 'lucide-react';

interface DatabaseViewerProps {
  records: GuestRecord[];
}

export const DatabaseViewer: React.FC<DatabaseViewerProps> = ({ records }) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!records || records.length === 0) return null;

  const filteredRecords = records.filter(r => {
    const term = searchTerm.toLowerCase();
    return (
      r.firstName.toLowerCase().includes(term) ||
      r.lastName.toLowerCase().includes(term) ||
      r.passportNumber.toLowerCase().includes(term) ||
      r.hotel.toLowerCase().includes(term)
    );
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-8">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <h3 className="text-lg font-bold text-slate-800">Database List</h3>
           <p className="text-sm text-slate-500">Visualizing {filteredRecords.length} records</p>
        </div>
        
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search database..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      <div className="overflow-x-auto max-h-[500px]">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 font-semibold"># (A)</th>
              <th className="px-6 py-3 font-semibold">Full Name (C & D)</th>
              <th className="px-6 py-3 font-semibold">Passport (H)</th>
              <th className="px-6 py-3 font-semibold">Hotel Info (K & N)</th>
              <th className="px-6 py-3 font-semibold">Manager (P)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRecords.map((record) => (
              <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-3 font-mono text-slate-500">{record.number}</td>
                <td className="px-6 py-3 font-medium text-slate-900">
                   <div className="flex items-center">
                     <User className="w-3.5 h-3.5 text-slate-400 mr-2" />
                     {record.firstName} {record.lastName}
                   </div>
                </td>
                <td className="px-6 py-3">
                  <div className="flex items-center text-blue-700 bg-blue-50 w-fit px-2 py-0.5 rounded text-xs font-mono">
                     <Hash className="w-3 h-3 mr-1" />
                     {record.passportNumber}
                  </div>
                </td>
                <td className="px-6 py-3">
                  <div className="flex flex-col">
                    <span className="flex items-center text-slate-800">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      {record.hotel}
                    </span>
                    {record.room && (
                      <span className="text-xs text-slate-500 ml-4.5">Room: {record.room}</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-3">
                  <div className="flex items-center text-slate-600">
                     <Briefcase className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                     {record.manager}
                  </div>
                </td>
              </tr>
            ))}
            {filteredRecords.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  No records found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};