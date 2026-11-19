import { create } from 'zustand';
import type { NFCScanRecord } from '../types/simulation';

interface NFCStoreState {
  scannedComponent: any | null;
  scanHistory: NFCScanRecord[];
  isScanning: boolean;
  setScannedComponent: (component: any | null) => void;
  addScanRecord: (record: NFCScanRecord) => void;
  setScanHistory: (records: NFCScanRecord[]) => void;
  clearHistory: () => void;
  setScanning: (scanning: boolean) => void;
}

export const useNFCStore = create<NFCStoreState>((set) => ({
  scannedComponent: null,
  scanHistory: [],
  isScanning: false,

  setScannedComponent: (component) => set({ scannedComponent: component }),

  addScanRecord: (record) =>
    set((state) => ({ scanHistory: [record, ...state.scanHistory] })),
  setScanHistory: (records) => set({ scanHistory: records }),
  clearHistory: () => set({ scanHistory: [] }),
  setScanning: (isScanning) => set({ isScanning }),
}));
