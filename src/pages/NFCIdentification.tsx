import React from 'react';
import { useNFCStore } from '../stores/nfcStore';
import { virtualScanner } from '../nfc/scanner';
import { Search, Scan, Trash2, CheckCircle, Wifi } from 'lucide-react';
import { RealNFCScanner } from '../components/RealNFCScanner';

const SAMPLE_TAGS: [string, string][] = [
  ['A1B2C3D4', 'Resistor 100Ω'],
  ['E5F6A7B8', 'Resistor 220Ω'],
  ['9C0D1E2F', 'Resistor 1kΩ'],
  ['3A4B5C6D', 'Capacitor 100μF'],
  ['7E8F9A0B', 'Inductor 10mH'],
  ['C1D2E3F4', 'Light Bulb'],
  ['5A6B7C8D', 'Switch'],
];

export function NFCIdentification() {

  const scanHistory = useNFCStore((s) => s.scanHistory);
  const isScanning = useNFCStore((s) => s.isScanning);
  const setScannedComponent = useNFCStore((s) => s.setScannedComponent);
  const addScanRecord = useNFCStore((s) => s.addScanRecord);
  const setScanning = useNFCStore((s) => s.setScanning);
  const clearHistory = useNFCStore((s) => s.clearHistory);

  const [uidInput, setUidInput] = React.useState('');
  const [scanResult, setScanResult] = React.useState<any>(null);

  const handleScan = React.useCallback(async () => {
    setScanning(true);
    const result = await virtualScanner.scan(uidInput || 'A1B2C3D4');
    addScanRecord(result);
    if (result.success) {
      const record = virtualScanner.getDatabase()[result.uid];
      setScanResult(record);
      setScannedComponent(record);
    } else {
      setScanResult(null);
      setScannedComponent(null);
    }
    setScanning(false);
  }, [uidInput, setScanning, addScanRecord, setScanResult, setScannedComponent]);

  const handleRandomScan = React.useCallback(async () => {
    setScanning(true);
    const uids = Object.keys(virtualScanner.getDatabase());
    const uid = uids[Math.floor(Math.random() * uids.length)];
    const record = await virtualScanner.scanComponent(uid);
    if (record) {
      const scan: any = {
        id: `scan-${Date.now()}`,
        uid,
        componentType: record.type,
        label: record.label,
        timestamp: Date.now(),
        success: true,
      };
      addScanRecord(scan);
      setScanResult(record);
      setScannedComponent(record);
    }
    setScanning(false);
  }, [setScanning, addScanRecord, setScanResult, setScannedComponent]);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <RealNFCScanner />
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">NFC Identification</h1>
          <p className="text-[#94a3b8] text-sm mt-1">
            Simulate NFC tag scanning to identify components automatically.
            <br />
            <span className="text-xs text-charcoal-400 mt-1 block">Virtual scanner - no physical hardware connected.</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRandomScan}
            disabled={isScanning}
            className="btn-primary flex items-center gap-2"
          >
            <Scan size={16} />
            {isScanning ? 'Scanning...' : 'Random Scan'}
          </button>
          <button onClick={clearHistory} className="btn-secondary text-xs px-3">
            <Trash2 size={14} /> Clear History
          </button>
        </div>
      </div>

      {/* Scanner panel */}
      <div className="panel p-6">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#0f172a] border border-[#475569] flex items-center justify-center">
                <Wifi size={24} className="text-[#38bdf8]" />
              </div>
              <div>
                <h3 className="font-bold text-white">Virtual NFC Scanner</h3>
                <p className="text-xs text-[#94a3b8]">Tap a component to read its NFC tag</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter tag UID (e.g. A1B2C3D4)"
                  value={uidInput}
                  onChange={(e) => setUidInput(e.target.value)}
                  className="flex-1 input-field"
                />
                <button
                  onClick={handleScan}
                  disabled={isScanning}
                  className="btn-secondary px-4"
                >
                  <Search size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SAMPLE_TAGS.map(([uid, label]) => (
                  <button
                    key={uid}
                    onClick={() => {
                      setUidInput(uid);
                      handleScan();
                    }}
                    className="w-full flex items-center justify-between gap-3 py-2 px-3 rounded-lg bg-[#0f172a] border border-[#475569] text-left text-sm text-[#cbd5e1] hover:text-white hover:border-charcoal-400 transition-colors group"
                  >
                    <span className="font-mono text-xs text-[#38bdf8] group-hover:text-[#38bdf8]/80">{uid}</span>
                    <span className="text-xs text-charcoal-400">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Result card */}
          <div className="w-72">
            <div className={`p-6 rounded-2xl border text-center ${scanResult ? 'bg-[#38bdf8]/10 border-[#38bdf8]/30' : 'bg-[#0f172a] border-[#334155]'}`}>
              {isScanning ? (
                <div className="flex flex-col items-center justify-center h-48">
                  <div className="w-10 h-10 rounded-full border-4 border-[#38bdf8] border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-xs text-[#38bdf8] font-medium animate-pulse">Scanning NFC tag...</p>
                </div>
              ) : scanResult ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-[#38bdf8]/20 border border-[#38bdf8]/50 flex items-center justify-center text-[#38bdf8] mx-auto mb-4">
                    <CheckCircle size={24} />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-1">{scanResult.label}</h3>
                  <p className="text-xs text-[#38bdf8] font-mono mb-1">{scanResult.uid}</p>
                  <p className="text-xs text-[#94a3b8] mb-4 capitalize">{scanResult.type}</p>
                  <div className="space-y-1 text-xs text-[#cbd5e1]">
                    {Object.entries(scanResult.properties).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span>{key}</span>
                        <span className="text-white">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      setScanResult(null);
                      setScannedComponent(null);
                    }}
                    className="mt-4 w-full py-2 px-4 rounded-lg text-xs font-medium text-[#94a3b8] hover:text-white transition-colors"
                  >
                    Clear
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-charcoal-400">
                  <Search size={32} className="mb-3 opacity-50" />
                  <p className="text-xs">No component scanned</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Scan history */}
      <div className="panel">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">Scan History</h3>
          <span className="text-xs text-[#94a3b8]">{scanHistory.length} scans</span>
        </div>
        {scanHistory.length === 0 ? (
          <div className="text-center py-8 text-charcoal-400 text-sm">
            No scans yet. Use the virtual scanner to identify components.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#334155] text-[#94a3b8]">
                  <th className="pb-3 text-left font-medium">Time</th>
                  <th className="pb-3 text-left font-medium">UID</th>
                  <th className="pb-3 text-left font-medium">Component</th>
                  <th className="pb-3 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {scanHistory.map((record) => (
                  <tr key={record.id} className="border-b border-charcoal-800">
                    <td className="py-3 text-[#cbd5e1] font-mono text-xs">
                      {new Date(record.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 text-white font-mono text-xs">{record.uid}</td>
                    <td className="py-3 text-[#cbd5e1] text-xs capitalize">
                      {record.label ?? 'Unknown'}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        record.success ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'
                      }`}>
                        {record.success ? 'Identified' : 'Unknown'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Hardware info */}
      <div className="panel bg-[#1e293b]/50">
        <h3 className="font-semibold text-white mb-3">Hardware Integration</h3>
        <p className="text-sm text-[#94a3b8] mb-3">
          The virtual scanner simulates NFC tag reading. In production, replace
          <code className="text-[#38bdf8]">VirtualNFCScanner</code> with a hardware adapter
          using Web Serial or Web Bluetooth to communicate with an actual NFC reader.
        </p>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-xs text-green-400">Virtual mode active</span>
        </div>
      </div>
    </div>
  );
}
