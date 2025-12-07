/**
 * Instrument Processing Guide Tab
 * Professional mixing guidance for specific instruments
 */

import { useState } from 'react';
import { Search, Loader, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import {
  getInstrumentGuide,
  InstrumentGuideResult,
  formatAPIError,
} from '../../services/codetteAdvancedApi';

export default function InstrumentGuide() {
  const [category, setCategory] = useState<
    'vocals' | 'drums' | 'guitars' | 'bass' | 'keys' | 'strings' | 'brass' | 'woodwinds'
  >('vocals');
  const [instrument, setInstrument] = useState('lead');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InstrumentGuideResult | null>(null);
  const [copied, setCopied] = useState(false);

  const categories = [
    { value: 'vocals' as const, label: 'Vocals', instruments: ['lead', 'backing', 'rap', 'choir'] },
    { value: 'drums' as const, label: 'Drums', instruments: ['kick', 'snare', 'hi-hat', 'tom', 'overhead'] },
    { value: 'guitars' as const, label: 'Guitars', instruments: ['electric', 'acoustic', 'bass'] },
    { value: 'bass' as const, label: 'Bass', instruments: ['electric', 'synth', 'upright'] },
    { value: 'keys' as const, label: 'Keys', instruments: ['piano', 'organ', 'synth'] },
    { value: 'strings' as const, label: 'Strings', instruments: ['violin', 'cello', 'ensemble'] },
    { value: 'brass' as const, label: 'Brass', instruments: ['trumpet', 'trombone', 'sax'] },
    { value: 'woodwinds' as const, label: 'Woodwinds', instruments: ['flute', 'clarinet', 'oboe'] },
  ];

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setCopied(false);
    try {
      const data = await getInstrumentGuide(category, instrument);
      setResult(data);
    } catch (err) {
      setError(formatAPIError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result?.formatted_guide) {
      navigator.clipboard.writeText(result.formatted_guide);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const currentCategory = categories.find((c) => c.value === category);

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Select Instrument</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-gray-200 focus:outline-none focus:border-purple-500"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-2">Specific Instrument</label>
            <select
              value={instrument}
              onChange={(e) => setInstrument(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-gray-200 focus:outline-none focus:border-purple-500"
            >
              {currentCategory?.instruments.map((inst) => (
                <option key={inst} value={inst}>
                  {inst.charAt(0).toUpperCase() + inst.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={handleSearch}
          disabled={loading}
          className="mt-4 w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Get Processing Guide
            </>
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">Error: {error}</p>
        </div>
      )}

      {/* Results Display */}
      {result && result.success && result.info && (
        <div className="space-y-4">
          {/* Header */}
          <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 rounded-lg p-4 border border-purple-700/50">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-gray-100">
                {result.category.charAt(0).toUpperCase() + result.category.slice(1)} - {result.instrument.charAt(0).toUpperCase() + result.instrument.slice(1)}
              </h3>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-3 py-1 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded text-xs text-gray-300 transition"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-3 h-3 text-green-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copy Guide
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Frequency Range */}
          {result.info.typical_range_hz && (
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-300 mb-2">Frequency Range</h4>
              <p className="text-2xl font-bold text-purple-400">
                {result.info.typical_range_hz[0]} - {result.info.typical_range_hz[1]} Hz
              </p>
            </div>
          )}

          {/* Target Levels */}
          {result.info.target_levels && (
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-300 mb-2">Target Levels</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Peak Level:</span>
                  <span className="ml-2 text-gray-200 font-medium">
                    {result.info.target_levels.peaks_dbfs}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Average LUFS:</span>
                  <span className="ml-2 text-gray-200 font-medium">
                    {result.info.target_levels.avg_lufs}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Processing Recommendations */}
          {result.info.recommended_processing && (
            <div className="space-y-3">
              {result.info.recommended_processing.eq && (
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-400 mb-2">EQ Recommendations</h4>
                  <ul className="space-y-1 text-sm text-gray-300">
                    {Array.isArray(result.info.recommended_processing.eq) ? (
                      result.info.recommended_processing.eq.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-blue-400 mt-1">•</span>
                          <span>{tip}</span>
                        </li>
                      ))
                    ) : (
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        <span>{result.info.recommended_processing.eq}</span>
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {result.info.recommended_processing.compression && (
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-yellow-400 mb-2">Compression</h4>
                  <ul className="space-y-1 text-sm text-gray-300">
                    {Array.isArray(result.info.recommended_processing.compression) ? (
                      result.info.recommended_processing.compression.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-yellow-400 mt-1">•</span>
                          <span>{tip}</span>
                        </li>
                      ))
                    ) : (
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-400 mt-1">•</span>
                        <span>{result.info.recommended_processing.compression}</span>
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {result.info.recommended_processing.effects && (
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-purple-400 mb-2">Effects</h4>
                  <ul className="space-y-1 text-sm text-gray-300">
                    {Array.isArray(result.info.recommended_processing.effects) ? (
                      result.info.recommended_processing.effects.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-purple-400 mt-1">•</span>
                          <span>{tip}</span>
                        </li>
                      ))
                    ) : (
                      <li className="flex items-start gap-2">
                        <span className="text-purple-400 mt-1">•</span>
                        <span>{result.info.recommended_processing.effects}</span>
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Common Issues */}
          {result.info.common_issues && result.info.common_issues.length > 0 && (
            <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-red-400 mb-2">Common Issues</h4>
              <ul className="space-y-1 text-sm text-red-300">
                {result.info.common_issues.map((issue, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Pro Tips */}
          {result.info.tips && result.info.tips.length > 0 && (
            <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-green-400 mb-2">Pro Tips</h4>
              <ul className="space-y-1 text-sm text-green-300">
                {result.info.tips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">?</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
        <p className="text-xs text-blue-300">
          <span className="font-semibold">Database:</span> Contains professional processing guides
          for 30+ instruments across 8 categories. Guidelines based on industry-standard practices
          and frequency response characteristics.
        </p>
      </div>
    </div>
  );
}
