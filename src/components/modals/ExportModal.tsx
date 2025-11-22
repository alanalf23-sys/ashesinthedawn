import { useState } from 'react';
import { useDAW } from '../../contexts/DAWContext';
import { ModalHeader, ModalFooter, FormField, LoadingSpinner, InfoBox } from './ModalUtils';

export default function ExportModal() {
  const { showExportModal, closeExportModal, exportAudio, tracks } = useDAW();
  const [format, setFormat] = useState('wav');
  const [quality, setQuality] = useState('high');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportAudio(format, quality);
      closeExportModal();
    } finally {
      setIsExporting(false);
    }
  };

  if (!showExportModal) return null;

  const formatDescriptions: Record<string, string> = {
    wav: 'Uncompressed audio - Best quality but large file size',
    mp3: 'Compressed format - Compatible with most devices',
    flac: 'Lossless compression - High quality with smaller files',
    aac: 'Advanced audio format - Better quality than MP3 at same bitrate',
    ogg: 'Open format - Excellent quality, good compression',
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-md flex flex-col max-h-screen overflow-hidden">
        <ModalHeader title="Export Audio" onClose={closeExportModal} subtitle={`${tracks.length} track(s) will be exported`} />

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {isExporting && <LoadingSpinner text="Exporting audio..." />}

          {!isExporting && (
            <>
              <FormField label="Audio Format" required>
                <div className="space-y-2">
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    disabled={isExporting}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  >
                    <option value="wav">WAV (Uncompressed)</option>
                    <option value="mp3">MP3 (Compressed)</option>
                    <option value="flac">FLAC (Lossless)</option>
                    <option value="aac">AAC</option>
                    <option value="ogg">OGG Vorbis</option>
                  </select>
                  <p className="text-xs text-gray-500">{formatDescriptions[format]}</p>
                </div>
              </FormField>

              <FormField label="Quality" required>
                <div className="space-y-2">
                  <select
                    value={quality}
                    onChange={(e) => setQuality(e.target.value)}
                    disabled={isExporting}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  >
                    <option value="low">Low (96 kbps) - Fast, smaller file</option>
                    <option value="medium">Medium (192 kbps) - Balanced</option>
                    <option value="high">High (320 kbps) - Best quality</option>
                    <option value="lossless">Lossless - Maximum quality</option>
                  </select>
                </div>
              </FormField>

              <InfoBox>
                <strong>💡 Tip:</strong> Use WAV or FLAC for archival, MP3 for sharing.
              </InfoBox>
            </>
          )}
        </div>

        {!isExporting && (
          <ModalFooter
            onCancel={closeExportModal}
            onConfirm={handleExport}
            cancelText="Cancel"
            confirmText="Export Audio"
            isLoading={isExporting}
            confirmVariant="green"
          />
        )}
      </div>
    </div>
  );
}
