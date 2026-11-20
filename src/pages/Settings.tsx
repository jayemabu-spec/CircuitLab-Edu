import React from 'react';
import { Save, AlertTriangle, Battery, Wifi, ShieldAlert } from 'lucide-react';
import { loadCircuits, saveCircuits, loadNFCHistory, saveNFCHistory, loadInventory, saveInventory } from '../utils/storage';

export function Settings() {
  const [circuits, setCircuits] = React.useState<any[]>([]);
  const [nfcHistory, setNFCHistory] = React.useState<any[]>([]);
  const [inventory, setInventory] = React.useState<any[]>([]);

  React.useEffect(() => {
    setCircuits(loadCircuits());
    setNFCHistory(loadNFCHistory());
    setInventory(loadInventory());
  }, []);

  const handleExport = () => {
    const data = {
      circuits,
      nfcHistory,
      inventory,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'circuitlab-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.circuits) {
          saveCircuits(data.circuits);
          setCircuits(data.circuits);
        }
        if (data.nfcHistory) {
          saveNFCHistory(data.nfcHistory);
          setNFCHistory(data.nfcHistory);
        }
        if (data.inventory) {
          saveInventory(data.inventory);
          setInventory(data.inventory);
        }
        alert('Data imported successfully.');
      } catch (err) {
        alert('Invalid backup file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>
          <p className="text-[#94a3b8] text-sm mt-1">Application configuration and data management.</p>
        </div>
      </div>

      {/* Theme */}
      <div className="panel">
        <h3 className="font-semibold text-white mb-4">Appearance</h3>
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-charcoal-400">Theme</span>
            <span className="text-sm text-charcoal-300">Dark charcoal (engineering style)</span>
          </div>
          <span className="badge">Dark only</span>
        </div>
      </div>

      {/* Data management */}
      <div className="panel">
        <h3 className="font-semibold text-white mb-4">Data Management</h3>
        <p className="text-sm text-[#94a3b8] mb-4">
          All data is stored locally in your browser using localStorage. No data is sent to any server.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#334155] border border-[#334155] rounded-lg overflow-hidden mb-6">
          <div className="bg-charcoal-800 p-4">
            <div className="text-xs text-charcoal-400">Saved circuits</div>
            <div className="mt-1 text-xl font-semibold text-white tabular-nums">{circuits.length}</div>
            <p className="text-xs text-charcoal-400">In localStorage</p>
          </div>
          <div className="bg-charcoal-800 p-4">
            <div className="text-xs text-charcoal-400">NFC scans</div>
            <div className="mt-1 text-xl font-semibold text-white tabular-nums">{nfcHistory.length}</div>
            <p className="text-xs text-charcoal-400">Scan history</p>
          </div>
          <div className="bg-charcoal-800 p-4">
            <div className="text-xs text-charcoal-400">Inventory items</div>
            <div className="mt-1 text-xl font-semibold text-white tabular-nums">{inventory.length}</div>
            <p className="text-xs text-charcoal-400">Component inventory</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button onClick={handleExport} className="btn-secondary">
            <Save size={16} /> Export JSON
          </button>
          <div className="flex items-center gap-2">
            <label htmlFor="import-backup" className="text-sm text-charcoal-300">Import backup</label>
            <input
              id="import-backup"
              type="file"
              accept=".json"
              onChange={handleImport}
              className="text-xs text-charcoal-300 file:mr-2 file:rounded-md file:border-0 file:bg-[#334155] file:px-3 file:py-1.5 file:text-xs file:text-white hover:file:bg-[#475569]"
            />
          </div>
          <button
            onClick={() => {
              if (confirm('Clear all saved data? This cannot be undone.')) {
                localStorage.clear();
                setCircuits([]);
                setNFCHistory([]);
                setInventory([]);
                alert('All data cleared.');
              }
            }}
            className="sm:ml-auto inline-flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 px-2 py-1"
          >
            <AlertTriangle size={14} /> Clear all data
          </button>
        </div>
      </div>

      {/* Hardware info */}
      <div className="panel bg-[#1e293b]/50">
        <h3 className="font-semibold text-white mb-4">Hardware Integration</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-[#0f172a] border border-[#475569] flex items-center justify-center text-xs">
              <Battery size={14} />
            </div>
            <div>
              <div className="text-sm text-white font-medium">Microcontroller Interface</div>
              <p className="text-xs text-[#94a3b8]">ESP32 / STM32 support via Web Serial / Web Bluetooth (planned)</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-[#0f172a] border border-[#475569] flex items-center justify-center text-xs">
              <Wifi size={14} />
            </div>
            <div>
              <div className="text-sm text-white font-medium">NFC Reader</div>
              <p className="text-xs text-[#94a3b8]">Virtual scanner active. Hardware adapter interface ready.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-[#0f172a] border border-[#475569] flex items-center justify-center text-xs">
              <ShieldAlert size={14} />
            </div>
            <div>
              <div className="text-sm text-white font-medium">No Physical Hardware Connected</div>
              <p className="text-xs text-[#94a3b8]">All components are simulated. No real hardware is accessed.</p>
            </div>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="panel">
        <h3 className="font-semibold text-white mb-4">About CircuitLab Edu</h3>
        <div className="space-y-2 text-sm text-[#cbd5e1]">
          <p><span className="text-white font-medium">Version:</span> 1.0.0</p>
          <p><span className="text-white font-medium">Purpose:</span> Bachelor's thesis - Educational circuit simulation platform</p>
          <p><span className="text-white font-medium">Stack:</span> React, TypeScript, Vite, Tailwind CSS, React Flow, Recharts, Zustand</p>
          <p><span className="text-white font-medium">License:</span> Educational use</p>
        </div>
      </div>
    </div>
  );
}
