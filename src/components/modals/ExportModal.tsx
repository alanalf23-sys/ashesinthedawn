import { useState } from 'react';
import { X } from 'lucide-react';
import { useDAW } from '../../contexts/DAWContext';

export default function ExportModal() {
  const { showExportModal, closeExportModal, exportAudio } = useDAW();
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Export Audio</h2>
          <button
            onClick={closeExportModal}
            className="text-gray-400 hover:text-white transition"
            disabled={isExporting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Audio Format */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Format
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              disabled={isExporting}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
            >
              <option value="wav">WAV (Uncompressed)</option>
              <option value="mp3">MP3 (Compressed)</option>
              <option value="flac">FLAC (Lossless)</option>
              <option value="aac">AAC</option>
              <option value="ogg">OGG Vorbis</option>
            </select>
          </div>

          {/* Quality */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Quality
            </label>
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
              disabled={isExporting}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
            >
              <option value="low">Low (96 kbps)</option>
              <option value="medium">Medium (192 kbps)</option>
              <option value="high">High (320 kbps)</option>
              <option value="lossless">Lossless</option>
            </select>
          </div>

          {/* Export Range */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Export Range
            </label>
            <div className="flex gap-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="range"
                  defaultChecked
                  className="mr-2"
                  disabled={isExporting}
                />
                <span className="text-sm text-gray-300">All</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="range"
                  className="mr-2"
                  disabled={isExporting}
                />
                <span className="text-sm text-gray-300">Selection</span>
              </label>
            </div>
          </div>

          {/* Metadata */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Include Metadata
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                defaultChecked
                className="mr-2"
                disabled={isExporting}
              />
              <span className="text-sm text-gray-300">Add ID3 tags</span>
            </label>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={closeExportModal}
            disabled={isExporting}
            className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition font-medium disabled:opacity-50"
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  );
}
