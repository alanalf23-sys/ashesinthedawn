import * as React from 'react';
import { BlownCapCompressor } from '../lib/dsp/blownCapCompressor';
import { useDAW } from '../contexts/DAWContext';
import { getAudioEngine } from '../lib/audioEngine';

export default function BlownCapControl(): JSX.Element {
  const { selectedTrack } = useDAW?.() ?? { selectedTrack: null };
  const audioEngine = typeof getAudioEngine === 'function' ? getAudioEngine() : null;

  const [threshold, setThreshold] = React.useState(-12);
  const [ratioOption, setRatioOption] = React.useState('4');
  const [makeup, setMakeup] = React.useState(0);
  const [attackUs, setAttackUs] = React.useState(20);
  const [releaseMs, setReleaseMs] = React.useState(250);
  const [mix, setMix] = React.useState(100);

  const [fileName, setFileName] = React.useState<string | null>(null);
  const [processing, setProcessing] = React.useState(false);
  const [downloadUrl, setDownloadUrl] = React.useState<string | null>(null);

  const compressorRef = React.useRef<any>(null);

  React.useEffect(() => {
    const srate = audioEngine && typeof (audioEngine as any).getSampleRate === 'function'
      ? (audioEngine as any).getSampleRate()
      : 44100;

    compressorRef.current = new BlownCapCompressor({
      thresholdDb: threshold,
      ratioOption: ratioOption === 'All' ? 'All' : (ratioOption as any),
      makeupDb: makeup,
      attackUs,
      releaseMs,
      mixPercent: mix,
      sampleRate: srate,
    });

    return () => {
      compressorRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (!compressorRef.current) return;
    compressorRef.current.setParams({
      thresholdDb: threshold,
      ratioOption: ratioOption === 'All' ? 'All' : (ratioOption as any),
      makeupDb: makeup,
      attackUs,
      releaseMs,
      mixPercent: mix,
    });
  }, [threshold, ratioOption, makeup, attackUs, releaseMs, mix]);

  // Try to fetch track buffer from audioEngine (if available)
  async function getTrackBuffer(): Promise<AudioBuffer | null> {
    try {
      if (audioEngine && typeof audioEngine.getTrackBuffer === 'function' && selectedTrack) {
        const buf = await (audioEngine as any).getTrackBuffer(selectedTrack.id);
        return buf || null;
      }
    } catch (e) {
      // ignore
    }
    return null;
  }

  async function handleFile(e: any) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setFileName(f.name);
    setDownloadUrl(null);

    const ac = new (window.AudioContext || (window as any).webkitAudioContext)();
    const array = await f.arrayBuffer();
    const audioBuffer = await ac.decodeAudioData(array.slice(0));

    await processAndPrepareDownload(audioBuffer, f.name);
  }

  async function handleProcessTrack() {
    setDownloadUrl(null);
    setProcessing(true);
    try {
      const trackBuf = await getTrackBuffer();
      if (!trackBuf) {
        alert('No track buffer available from audio engine. Load a file instead.');
        setProcessing(false);
        return;
      }
      await processAndPrepareDownload(trackBuf, (selectedTrack && selectedTrack.name) || 'track');
    } catch (err) {
      console.error(err);
      alert('Processing failed - see console');
    } finally {
      setProcessing(false);
    }
  }

  async function processAndPrepareDownload(audioBuffer: AudioBuffer, baseName: string) {
    const ch = audioBuffer.numberOfChannels;
    const len = audioBuffer.length;
    const sr = audioBuffer.sampleRate;

    // get Float32Array copies
    const left = audioBuffer.getChannelData(0).slice(0);
    const right = (ch > 1 ? audioBuffer.getChannelData(1).slice(0) : left.slice(0));

    // Ensure compressor has correct sampleRate
    if (!compressorRef.current) {
      compressorRef.current = new BlownCapCompressor({
        thresholdDb: threshold,
        ratioOption: ratioOption === 'All' ? 'All' : (ratioOption as any),
        makeupDb: makeup,
        attackUs,
        releaseMs,
        mixPercent: mix,
        sampleRate: sr,
      });
    } else {
      compressorRef.current.setParams({ sampleRate: sr });
    }

    // Process in blocks to avoid blocking main thread too long
    const blockSize = 128; // small block for responsive UI
    for (let i = 0; i < len; i += blockSize) {
      const end = Math.min(i + blockSize, len);
      const leftBlock = left.subarray(i, end);
      const rightBlock = right.subarray(i, end);
      // compressor expects entire typed arrays; our processBlock mutates arrays in-place
      // create small copies for block
      const lBlockCopy = new Float32Array(leftBlock.length);
      const rBlockCopy = new Float32Array(rightBlock.length);
      lBlockCopy.set(leftBlock);
      rBlockCopy.set(rightBlock);

      compressorRef.current.processBlock(lBlockCopy, rBlockCopy);

      // write back
      left.set(lBlockCopy, i);
      right.set(rBlockCopy, i);
    }

    // encode to WAV and prepare download
    const wavBlob = encodeWAV(left, right, sr);
    const url = URL.createObjectURL(wavBlob);
    setDownloadUrl(url);
    setFileName(`${baseName.replace(/\.[^/.]+$/, '')}_blowncap.wav`);
  }

  function encodeWAV(left: Float32Array, right: Float32Array, sampleRate: number) {
    const numChannels = 2;
    const length = left.length * numChannels * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);

    /* RIFF identifier */ writeString(view, 0, 'RIFF');
    /* file length */ view.setUint32(4, 36 + left.length * numChannels * 2, true);
    /* RIFF type */ writeString(view, 8, 'WAVE');
    /* format chunk identifier */ writeString(view, 12, 'fmt ');
    /* format chunk length */ view.setUint32(16, 16, true);
    /* sample format (raw) */ view.setUint16(20, 1, true);
    /* channel count */ view.setUint16(22, numChannels, true);
    /* sample rate */ view.setUint32(24, sampleRate, true);
    /* byte rate (sampleRate * blockAlign) */ view.setUint32(28, sampleRate * numChannels * 2, true);
    /* block align (channel count * bytesPerSample) */ view.setUint16(32, numChannels * 2, true);
    /* bits per sample */ view.setUint16(34, 16, true);
    /* data chunk identifier */ writeString(view, 36, 'data');
    /* data chunk length */ view.setUint32(40, left.length * numChannels * 2, true);

    // write PCM samples
    let offset = 44;
    for (let i = 0; i < left.length; i++) {
      // interleave
      const l = Math.max(-1, Math.min(1, left[i]));
      const r = Math.max(-1, Math.min(1, right[i]));
      view.setInt16(offset, l < 0 ? l * 0x8000 : l * 0x7fff, true);
      offset += 2;
      view.setInt16(offset, r < 0 ? r * 0x8000 : r * 0x7fff, true);
      offset += 2;
    }

    return new Blob([view], { type: 'audio/wav' });
  }

  function writeString(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  return (
    <div className="p-4 bg-gray-900 rounded-md border border-gray-700 text-gray-200">
      <h3 className="text-lg font-semibold mb-2">Blown Capacitor Compressor (Preview)</h3>

      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm">Threshold (dB): {threshold}</label>
        <input type="range" min={-60} max={0} step={0.1} value={threshold}
          onChange={e => setThreshold(parseFloat((e.target as HTMLInputElement).value))} />

        <label className="text-sm">Ratio</label>
        <select value={ratioOption} onChange={e => setRatioOption(e.target.value)}>
          <option value="4">4</option>
          <option value="8">8</option>
          <option value="12">12</option>
          <option value="20">20</option>
          <option value="All">All</option>
        </select>

        <label className="text-sm">Makeup (dB): {makeup}</label>
        <input type="range" min={-20} max={20} step={0.1} value={makeup}
          onChange={e => setMakeup(parseFloat((e.target as HTMLInputElement).value))} />

        <label className="text-sm">Attack (µs): {attackUs}</label>
        <input type="range" min={1} max={2000} step={1} value={attackUs}
          onChange={e => setAttackUs(parseFloat((e.target as HTMLInputElement).value))} />

        <label className="text-sm">Release (ms): {releaseMs}</label>
        <input type="range" min={1} max={2000} step={1} value={releaseMs}
          onChange={e => setReleaseMs(parseFloat((e.target as HTMLInputElement).value))} />

        <label className="text-sm">Mix (%): {mix}</label>
        <input type="range" min={0} max={100} step={0.1} value={mix}
          onChange={e => setMix(parseFloat((e.target as HTMLInputElement).value))} />
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2">
          <input type="file" accept="audio/*" onChange={handleFile} />
          <button onClick={handleProcessTrack} className="px-3 py-1 bg-blue-600 rounded text-white" disabled={processing}>
            {processing ? 'Processing...' : 'Process Selected Track (preview)'}
          </button>
        </div>

        {fileName && <div className="text-sm">Prepared: {fileName}</div>}
        {downloadUrl && (
          <a href={downloadUrl} download={fileName || 'processed.wav'} className="text-blue-300 underline">
            Download Processed WAV
          </a>
        )}
      </div>
    </div>
  );
}
