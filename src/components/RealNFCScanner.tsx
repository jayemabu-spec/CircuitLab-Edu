import { useState } from 'react';

// Web NFC API type shims (not in standard lib types)
declare global {
  interface NDEFRecord {
    recordType: string;
    mediaType?: string;
    data?: ArrayBuffer;
    encoding?: string;
    lang?: string;
  }
  interface NDEFMessage {
    records: NDEFRecord[];
  }
  interface NDEFReadingEvent extends Event {
    serialNumber: string;
    message: NDEFMessage;
  }
  interface NDEFReader extends EventTarget {
    scan(options?: any): Promise<void>;
    write(message: any, options?: any): Promise<void>;
    onreading: ((event: NDEFReadingEvent) => void) | null;
    onreadingerror: ((event: Event) => void) | null;
  }
  interface Window {
    NDEFReader?: new () => NDEFReader;
  }
}

interface RealNFCScannerProps {
  onFallback?: () => void;
}

export function RealNFCScanner({ onFallback }: RealNFCScannerProps) {
  const supported = typeof window !== 'undefined' && 'NDEFReader' in window;
  const [scanning, setScanning] = useState(false);
  const [serial, setSerial] = useState<string | null>(null);
  const [records, setRecords] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    const NDEFReaderCtor = window.NDEFReader;
    if (!supported || !NDEFReaderCtor) return;
    setError(null);
    setSerial(null);
    setRecords([]);
    setScanning(true);
    try {
      const ndef = new NDEFReaderCtor();
      await ndef.scan();
      ndef.onreading = (event: NDEFReadingEvent) => {
        setSerial(event.serialNumber || 'Unknown');
        const texts: string[] = [];
        for (const record of event.message?.records || []) {
          try {
            if (record.recordType === 'text') {
              const decoder = new TextDecoder(record.encoding || 'utf-8');
              texts.push(decoder.decode(record.data));
            } else {
              texts.push(`[${record.recordType}]`);
            }
          } catch {
            texts.push('[unreadable record]');
          }
        }
        setRecords(texts);
        setScanning(false);
      };
      ndef.onreadingerror = () => {
        setError('Failed to read NFC tag. Try again.');
        setScanning(false);
      };
    } catch (e: any) {
      setError(e?.message || 'NFC scan failed.');
      setScanning(false);
    }
  };

  if (!supported) {
    return (
      <div className="panel space-y-3">
        <p className="text-sm text-[#94a3b8]">
          Hardware NFC not supported. Please use Chrome on an Android device over HTTPS, or use the simulation mode.
        </p>
        {onFallback && (
          <button onClick={onFallback} className="btn-secondary text-sm">
            Use Simulation Mode
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="panel space-y-3">
      <h3 className="text-sm font-semibold text-white">Real NFC Scanner (Web NFC)</h3>
      <button onClick={handleScan} disabled={scanning} className="btn-primary text-sm flex items-center gap-2">
        {scanning && <span className="inline-block w-4 h-4 border-2 border-[#0f172a] border-t-transparent rounded-full animate-spin" />}
        {scanning ? 'Scanning…' : 'Scan NFC Tag'}
      </button>
      {error && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded p-2">{error}</div>}
      {serial && (
        <div className="text-xs text-[#94a3b8] space-y-1">
          <div><span className="text-white font-medium">Serial:</span> {serial}</div>
          {records.length > 0 && (
            <div><span className="text-white font-medium">Records:</span> {records.join(', ')}</div>
          )}
        </div>
      )}
      {onFallback && (
        <button onClick={onFallback} className="text-xs text-[#94a3b8] hover:text-white underline">
          Use simulation mode instead
        </button>
      )}
    </div>
  );
}