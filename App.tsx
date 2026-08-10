import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { RuleComplianceBanner } from './components/RuleComplianceBanner';
import { SidebarUploadAndQueue } from './components/SidebarUploadAndQueue';
import { CropsColumn } from './components/CropsColumn';
import { PassportFormView } from './components/PassportFormView';
import { SaveClientModal } from './components/SaveClientModal';
import { SavedClientsTable } from './components/SavedClientsTable';
import { PassportEntry, ExtractionStatus, PassportData, SavedClient } from './types';
import { processPassportImage, getDemoPassportData } from './services/geminiService';
import { Play } from 'lucide-react';

// Sample Moroccan passport image canvas placeholder generator for demo
const createSamplePassportDataUrl = (title: string, nameAr: string, nameEn: string): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 540;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background - Green/Gold Moroccan Passport style
  ctx.fillStyle = '#fdfbf7';
  ctx.fillRect(0, 0, 800, 540);

  // Border & Pattern
  ctx.strokeStyle = '#c2a649';
  ctx.lineWidth = 6;
  ctx.strokeRect(15, 15, 770, 510);

  // Header
  ctx.fillStyle = '#1e3a8a';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('ROYAUME DU MAROC · KINGDOM OF MOROCCO', 40, 55);

  ctx.fillStyle = '#065f46';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('المملكة المغربية', 750, 55);

  ctx.textAlign = 'left';
  // Passport Title
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('PASSEPORT · PASSPORT · جواز سفر', 40, 90);

  // Face Photo Placeholder
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(40, 110, 210, 270);
  ctx.strokeStyle = '#cbd5e1';
  ctx.strokeRect(40, 110, 210, 270);

  // Draw face silhouette
  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.arc(145, 210, 50, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(145, 330, 80, 0, Math.PI, true);
  ctx.fill();

  // Fields Text
  ctx.fillStyle = '#475569';
  ctx.font = '12px sans-serif';
  ctx.fillText('Nom / Surname', 270, 130);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(nameEn.split(' ')[0] || 'EL ARCHI', 270, 155);

  ctx.fillStyle = '#065f46';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(nameAr.split(' ')[0] || 'العرشي', 600, 155);

  ctx.fillStyle = '#475569';
  ctx.font = '12px sans-serif';
  ctx.fillText('Prénom / Given Names', 270, 190);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(nameEn.split(' ')[1] || 'FATNA', 270, 215);

  ctx.fillStyle = '#065f46';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(nameAr.split(' ')[1] || 'فاطمة', 600, 215);

  ctx.fillStyle = '#475569';
  ctx.font = '12px sans-serif';
  ctx.fillText('Nationalité / Nationality', 270, 250);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('MAROCAINE / MAR', 270, 270);

  ctx.fillStyle = '#475569';
  ctx.font = '12px sans-serif';
  ctx.fillText('Date de naissance / Date of birth', 460, 250);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('01/01/1949', 460, 270);

  // MRZ Lines Box
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(40, 410, 720, 100);

  ctx.fillStyle = '#38bdf8';
  ctx.font = '18px monospace';
  ctx.fillText('P<MAREL<ARCHI<<FATNA<<<<<<<<<<<<<<<<<<<<<<<<<', 60, 445);
  ctx.fillText('CJ67478506MAR4901015F2801245TA50<<<<<<<<<<<<80', 60, 485);

  return canvas.toDataURL('image/jpeg', 0.9);
};

const createInitialEntries = (): PassportEntry[] => {
  const imgData1 = createSamplePassportDataUrl('CJ6747850', 'العرشي فاطمة', 'EL ARCHI FATNA');
  const imgData2 = createSamplePassportDataUrl('IMG_2043', 'بن علي احمد', 'BENALI AHMED');
  const imgData3 = createSamplePassportDataUrl('IMG_2044', 'العلمي مريم', 'EL ALAMI MARYAM');

  const dummyFile = new File([''], 'passport.jpg', { type: 'image/jpeg' });

  return [
    {
      id: 'entry-1',
      file: dummyFile,
      fileName: 'CJ6747850 - Copie.jpg',
      fileSize: 1840000,
      previewUrl: imgData1,
      status: ExtractionStatus.SUCCESS,
      data: getDemoPassportData('EL ARCHI'),
    },
    {
      id: 'entry-2',
      file: dummyFile,
      fileName: 'QU2648724.jpg',
      fileSize: 2100000,
      previewUrl: imgData2,
      status: ExtractionStatus.SUCCESS,
      data: {
        ...getDemoPassportData('BENALI'),
        surnameArabic: 'بن علي',
        givenNamesArabic: 'احمد',
        surnameLatin: 'BENALI',
        givenNamesLatin: 'AHMED',
        passportNumber: 'G8492019',
        personalNumber: 'AB123456',
        sex: 'M',
        dateOfBirth: '14 / 08 / 1982',
        dateOfExpiry: '15 / 03 / 2027',
        validityMonths: 7,
        isValidRule: false,
        dateOfBirthUncertain: false,
      },
    },
    {
      id: 'entry-3',
      file: dummyFile,
      fileName: 'RQ4717125.jpg',
      fileSize: 1950000,
      previewUrl: imgData3,
      status: ExtractionStatus.ERROR,
      error: 'Qualité d’image insuffisante, flou détecté sur la bande MRZ.',
    },
    {
      id: 'entry-4',
      file: dummyFile,
      fileName: 'IMG_2051.jpg',
      fileSize: 2400000,
      previewUrl: imgData1,
      status: ExtractionStatus.IDLE,
    },
    {
      id: 'entry-5',
      file: dummyFile,
      fileName: 'SB1047163.jpg',
      fileSize: 1620000,
      previewUrl: imgData1,
      status: ExtractionStatus.SUCCESS,
      data: {
        ...getDemoPassportData('ALAMI'),
        surnameArabic: 'العلمي',
        givenNamesArabic: 'يوسف',
        surnameLatin: 'ALAMI',
        givenNamesLatin: 'YOUSSEF',
        passportNumber: 'SB1047163',
        personalNumber: 'CD987654',
        sex: 'M',
        dateOfBirth: '20 / 05 / 1990',
        dateOfExpiry: '10 / 12 / 2026',
        validityMonths: 4,
        isValidRule: false,
        dateOfBirthUncertain: false,
      },
    },
  ];
};

const createInitialSavedClients = (): SavedClient[] => [
  {
    id: 'client-1',
    registeredAt: '2026-08-09 14:30',
    registrationType: 'new',
    passportNumber: 'CJ6747850',
    cinNumber: 'TA50123',
    fullNameArabic: 'العرشي فاطمة',
    fullNameLatin: 'EL ARCHI FATNA',
    nationality: 'MAROCAINE / MAR',
    dateOfBirth: '01/01/1949',
    dateOfExpiry: '24/01/2028',
    validityMonths: 22,
    passportData: getDemoPassportData('EL ARCHI'),
  },
  {
    id: 'client-2',
    registeredAt: '2026-08-08 10:15',
    registrationType: 'matched',
    passportNumber: 'SB1047163',
    cinNumber: 'CD987654',
    fullNameArabic: 'العلمي يوسف',
    fullNameLatin: 'ALAMI YOUSSEF',
    nationality: 'MAROCAINE / MAR',
    dateOfBirth: '20/05/1990',
    dateOfExpiry: '10/12/2026',
    validityMonths: 4,
    passportData: {
      ...getDemoPassportData('ALAMI'),
      surnameArabic: 'العلمي',
      givenNamesArabic: 'يوسف',
      surnameLatin: 'ALAMI',
      givenNamesLatin: 'YOUSSEF',
      passportNumber: 'SB1047163',
      personalNumber: 'CD987654',
      dateOfExpiry: '10/12/2026',
      validityMonths: 4,
    },
  },
];

const App: React.FC = () => {
  const [entries, setEntries] = useState<PassportEntry[]>([]);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [savedClients, setSavedClients] = useState<SavedClient[]>(createInitialSavedClients());
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isDebugMode, setIsDebugMode] = useState<boolean>(false);

  useEffect(() => {
    const initial = createInitialEntries();
    setEntries(initial);
    if (initial.length > 0) {
      setSelectedEntryId(initial[0].id);
    }
  }, []);

  const activeEntry = entries.find((e) => e.id === selectedEntryId) || null;

  const handleFilesAdded = async (files: File[]) => {
    const newEntries: PassportEntry[] = files.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      return {
        id: crypto.randomUUID(),
        file,
        fileName: file.name,
        fileSize: file.size,
        previewUrl,
        status: ExtractionStatus.IDLE,
      };
    });

    setEntries((prev) => [...prev, ...newEntries]);

    // Select the first new file without auto-processing
    if (newEntries.length > 0) {
      setSelectedEntryId(newEntries[0].id);
    }
  };

  const processSingleEntry = async (entry: PassportEntry) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === entry.id
          ? { ...e, status: ExtractionStatus.PROCESSING, error: undefined }
          : e
      )
    );

    try {
      if (!entry.file || entry.file.size === 0) {
        throw new Error("Image inexploitable ou fichier vide. Veuillez charger un document lisible.");
      }

      const base64Data = await convertFileToBase64(entry.file);
      const data = await processPassportImage(base64Data, entry.file.type || 'image/jpeg');

      setEntries((prev) =>
        prev.map((e) =>
          e.id === entry.id ? { ...e, status: ExtractionStatus.SUCCESS, data } : e
        )
      );
    } catch (err: any) {
      setEntries((prev) =>
        prev.map((e) =>
          e.id === entry.id
            ? {
                ...e,
                status: ExtractionStatus.ERROR,
                error: err.message || "Document inexploitable ou flou. Réessayez avec une photo plus nette.",
              }
            : e
        )
      );
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleProcessPending = async () => {
    setIsProcessingBatch(true);
    const pending = entries.filter(
      (e) => e.status === ExtractionStatus.IDLE || e.status === ExtractionStatus.ERROR
    );

    for (const entry of pending) {
      await processSingleEntry(entry);
    }

    setIsProcessingBatch(false);
  };

  const handleRemoveEntry = (id: string) => {
    setEntries((prev) => {
      const filtered = prev.filter((e) => e.id !== id);
      if (selectedEntryId === id) {
        setSelectedEntryId(filtered[0]?.id || null);
      }
      return filtered;
    });
  };

  const handleLoadDemoSample = () => {
    const sampleImg = createSamplePassportDataUrl('EXEMPLE', 'العرشي فاطمة', 'EL ARCHI FATNA');
    const dummyFile = new File([''], 'Passeport_Exemple.jpg', { type: 'image/jpeg' });
    const newEntry: PassportEntry = {
      id: crypto.randomUUID(),
      file: dummyFile,
      fileName: 'Passeport_Exemple_Maroc.jpg',
      fileSize: 1850000,
      previewUrl: sampleImg,
      status: ExtractionStatus.SUCCESS,
      data: getDemoPassportData('EL ARCHI'),
    };

    setEntries((prev) => [newEntry, ...prev]);
    setSelectedEntryId(newEntry.id);
  };

  const handleUpdateData = (updatedData: PassportData) => {
    if (!selectedEntryId) return;
    setEntries((prev) =>
      prev.map((e) => (e.id === selectedEntryId ? { ...e, data: updatedData } : e))
    );
  };

  const handleSaveToClient = () => {
    if (!activeEntry?.data) return;
    setIsSaveModalOpen(true);
  };

  const handleConfirmSaveNewClient = () => {
    if (!activeEntry?.data) return;
    const data = activeEntry.data;
    const nowStr = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }) + ' ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    const newRecord: SavedClient = {
      id: crypto.randomUUID(),
      registeredAt: nowStr,
      registrationType: 'new',
      passportNumber: data.passportNumber || 'N/A',
      cinNumber: data.personalNumber || '',
      fullNameArabic: `${data.surnameArabic || ''} ${data.givenNamesArabic || ''}`.trim() || 'N/A',
      fullNameLatin: `${data.surnameLatin || ''} ${data.givenNamesLatin || ''}`.trim() || 'N/A',
      nationality: data.nationality || 'MAROCAINE / MAR',
      dateOfBirth: data.dateOfBirth || '',
      dateOfExpiry: data.dateOfExpiry || '',
      validityMonths: data.validityMonths ?? 0,
      passportData: data,
      croppedFaceUrl: activeEntry.croppedFaceUrl,
      croppedPassportUrl: activeEntry.croppedPassportUrl,
    };

    setSavedClients((prev) => [newRecord, ...prev]);
    if (selectedEntryId) {
      setEntries((prev) =>
        prev.map((e) => (e.id === selectedEntryId ? { ...e, isSavedToClient: true } : e))
      );
    }
  };

  const handleConfirmUpdateExistingClient = (targetClientId: string) => {
    if (!activeEntry?.data) return;
    const data = activeEntry.data;
    const nowStr = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }) + ' ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    setSavedClients((prev) =>
      prev.map((c) => {
        if (c.id === targetClientId) {
          return {
            ...c,
            registeredAt: nowStr,
            registrationType: 'matched',
            passportNumber: data.passportNumber || c.passportNumber,
            cinNumber: data.personalNumber || c.cinNumber,
            fullNameArabic: `${data.surnameArabic || ''} ${data.givenNamesArabic || ''}`.trim() || c.fullNameArabic,
            fullNameLatin: `${data.surnameLatin || ''} ${data.givenNamesLatin || ''}`.trim() || c.fullNameLatin,
            dateOfExpiry: data.dateOfExpiry || c.dateOfExpiry,
            validityMonths: data.validityMonths ?? c.validityMonths,
            passportData: data,
            croppedFaceUrl: activeEntry.croppedFaceUrl || c.croppedFaceUrl,
            croppedPassportUrl: activeEntry.croppedPassportUrl || c.croppedPassportUrl,
          };
        }
        return c;
      })
    );

    if (selectedEntryId) {
      setEntries((prev) =>
        prev.map((e) => (e.id === selectedEntryId ? { ...e, isSavedToClient: true } : e))
      );
    }
  };

  const handleSelectSavedClient = (client: SavedClient) => {
    // Check if an entry with this passport already exists
    const existingEntry = entries.find(
      (e) => e.data?.passportNumber === client.passportNumber
    );

    if (existingEntry) {
      setSelectedEntryId(existingEntry.id);
    } else {
      // Create temporary entry to display client data in the form
      const dummyFile = new File([''], `${client.passportNumber}.jpg`, { type: 'image/jpeg' });
      const newEntry: PassportEntry = {
        id: crypto.randomUUID(),
        file: dummyFile,
        fileName: `Client_${client.fullNameLatin.replace(/\s+/g, '_')}.jpg`,
        fileSize: 1500000,
        previewUrl: client.croppedPassportUrl || '',
        status: ExtractionStatus.SUCCESS,
        data: client.passportData,
        croppedFaceUrl: client.croppedFaceUrl,
        croppedPassportUrl: client.croppedPassportUrl,
        isSavedToClient: true,
      };
      setEntries((prev) => [newEntry, ...prev]);
      setSelectedEntryId(newEntry.id);
    }

    // Smooth scroll up to top form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteSavedClient = (clientId: string) => {
    setSavedClients((prev) => prev.filter((c) => c.id !== clientId));
  };

  const handleNextInList = () => {

    if (!selectedEntryId) return;
    const idx = entries.findIndex((e) => e.id === selectedEntryId);
    if (idx >= 0 && idx < entries.length - 1) {
      setSelectedEntryId(entries[idx + 1].id);
    }
  };

  const currentIdx = entries.findIndex((e) => e.id === selectedEntryId);
  const hasNext = currentIdx >= 0 && currentIdx < entries.length - 1;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans pb-16">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Top Rule Compliance Status Banner */}
        {activeEntry?.data && (
          <RuleComplianceBanner
            isValid={activeEntry.data.isValidRule}
            validityMonths={activeEntry.data.validityMonths}
            expiryDate={activeEntry.data.dateOfExpiry}
            ruleDescription="validité 6 mois après le départ"
          />
        )}

        {/* Main 3-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Sidebar: Upload & File Queue (3/12) */}
          <div className="lg:col-span-3">
            <SidebarUploadAndQueue
              entries={entries}
              selectedEntryId={selectedEntryId}
              onSelectEntry={(id) => setSelectedEntryId(id)}
              onFilesAdded={handleFilesAdded}
              onRemoveEntry={handleRemoveEntry}
              onProcessPending={handleProcessPending}
              onProcessSingleEntry={processSingleEntry}
              isProcessingBatch={isProcessingBatch}
              onLoadDemoSample={handleLoadDemoSample}
              savedClients={savedClients}
              onSelectSavedClient={handleSelectSavedClient}
            />
          </div>

          {/* Center Column: Passport Crop, Face Crop, Original Scan (4/12) */}
          <div className="lg:col-span-4">
            <CropsColumn
              entry={activeEntry}
              onImageCropGenerated={(pCrop, fCrop) => {
                setEntries((prev) =>
                  prev.map((e) =>
                    e.id === activeEntry?.id
                      ? { ...e, croppedPassportUrl: pCrop, croppedFaceUrl: fCrop }
                      : e
                  )
                );
              }}
              isDebugMode={isDebugMode}
              setIsDebugMode={setIsDebugMode}
            />
          </div>

          {/* Right Column: Extracted Fields Form & Contract Output (5/12) */}
          <div className="lg:col-span-5">
            {activeEntry?.data ? (
              <PassportFormView
                data={activeEntry.data}
                onUpdateData={handleUpdateData}
                onSaveToClient={handleSaveToClient}
                onNextInList={handleNextInList}
                isSaved={activeEntry.isSavedToClient}
                hasNext={hasNext}
                isDebugMode={isDebugMode}
              />
            ) : activeEntry?.status === ExtractionStatus.IDLE ? (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
                  <Play className="w-6 h-6 fill-blue-600 ml-0.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Passeport prêt pour l'extraction</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    L'image est chargée. Cliquez sur le bouton Play pour démarrer la lecture et l'extraction automatique des données.
                  </p>
                </div>
                <button
                  onClick={() => activeEntry && processSingleEntry(activeEntry)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Lancer l'extraction (Play)</span>
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-12 text-center text-slate-500">
                <p className="text-sm font-medium">
                  {activeEntry?.status === ExtractionStatus.PROCESSING
                    ? 'Extraction des données par IA en cours...'
                    : activeEntry?.status === ExtractionStatus.ERROR
                    ? "Erreur lors de la lecture du passeport. Veuillez ré-essayer avec le bouton Play."
                    : 'Sélectionnez un passeport pour afficher les données extraites.'}
                </p>
                {activeEntry?.status === ExtractionStatus.ERROR && (
                  <button
                    onClick={() => activeEntry && processSingleEntry(activeEntry)}
                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all inline-flex items-center gap-2"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Réessayer (Play)</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Registered Clients Directory Table (Positioned at bottom) */}
        <div className="mt-8">
          <SavedClientsTable
            clients={savedClients}
            onSelectClient={handleSelectSavedClient}
            onDeleteClient={handleDeleteSavedClient}
          />
        </div>
      </main>

      {/* Save Client Modal Options */}
      {activeEntry?.data && (
        <SaveClientModal
          isOpen={isSaveModalOpen}
          onClose={() => setIsSaveModalOpen(false)}
          passportData={activeEntry.data}
          croppedFaceUrl={activeEntry.croppedFaceUrl}
          croppedPassportUrl={activeEntry.croppedPassportUrl}
          existingClients={savedClients}
          onSaveNewClient={handleConfirmSaveNewClient}
          onUpdateExistingClient={handleConfirmUpdateExistingClient}
        />
      )}
    </div>
  );
};


export default App;
