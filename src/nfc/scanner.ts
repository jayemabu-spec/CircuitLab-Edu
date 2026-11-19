import type { NFCComponentRecord, NFCScanRecord } from '../types/simulation';
import type { Component } from '../types/circuit';

// Sample NFC tag database - simulates physical NFC tags on educational components
export const NFC_TAG_DATABASE: Record<string, NFCComponentRecord> = {
  'A1B2C3D4': {
    uid: 'A1B2C3D4',
    type: 'resistor',
    label: 'Resistor 100Ω',
    properties: { resistance: 100, type: 'resistor' },
  },
  'E5F6A7B8': {
    uid: 'E5F6A7B8',
    type: 'resistor',
    label: 'Resistor 220Ω',
    properties: { resistance: 220, type: 'resistor' },
  },
  '9C0D1E2F': {
    uid: '9C0D1E2F',
    type: 'resistor',
    label: 'Resistor 1kΩ',
    properties: { resistance: 1000, type: 'resistor' },
  },
  '3A4B5C6D': {
    uid: '3A4B5C6D',
    type: 'capacitor',
    label: 'Capacitor 100μF',
    properties: { capacitance: 0.0001, type: 'capacitor' }, // 100 microfarads
  },
  '7E8F9A0B': {
    uid: '7E8F9A0B',
    type: 'inductor',
    label: 'Inductor 10mH',
    properties: { inductance: 0.01, type: 'inductor' }, // 10 millihenries
  },
  'C1D2E3F4': {
    uid: 'C1D2E3F4',
    type: 'bulb',
    label: 'Light Bulb',
    properties: { resistance: 47, type: 'bulb' },
  },
  '5A6B7C8D': {
    uid: '5A6B7C8D',
    type: 'switch',
    label: 'Switch',
    properties: { closed: false, type: 'switch' },
  },
};

export interface VirtualNFCScannerOptions {
  simulatedDelay?: number;
  failureRate?: number; // 0 to 1
}

/**
 * Virtual NFC scanner - simulates reading NFC tags from physical components.
 * In production, this would be replaced by a hardware NFC reader adapter.
 */
export class VirtualNFCScanner {
  private delay: number;
  private failureRate: number;
  private scanHistory: NFCScanRecord[] = [];

  constructor(options: VirtualNFCScannerOptions = {}) {
    this.delay = options.simulatedDelay ?? 800;
    this.failureRate = options.failureRate ?? 0;
  }

  async scan(uid: string): Promise<NFCScanRecord> {
    await new Promise((resolve) => setTimeout(resolve, this.delay));

    const record: NFCScanRecord = {
      id: `scan-${Date.now()}`,
      uid,
      componentType: null,
      label: null,
      timestamp: Date.now(),
      success: false,
    };

    // Simulate read failure
    if (Math.random() < this.failureRate) {
      this.scanHistory.push(record);
      return record;
    }

    const tag = NFC_TAG_DATABASE[uid];
    if (tag) {
      record.componentType = tag.type;
      record.label = tag.label;
      record.success = true;
    } else {
      record.componentType = null;
      record.label = 'Unknown';
      record.success = false;
    }

    this.scanHistory.push(record);
    return record;
  }

  /**
   * Scan a UID and return the component record if found.
   */
  async scanComponent(uid: string): Promise<NFCComponentRecord | null> {
    const result = await this.scan(uid);
    if (!result.success) return null;
    return NFC_TAG_DATABASE[uid] ?? null;
  }

  getHistory(): NFCScanRecord[] {
    return [...this.scanHistory].reverse();
  }

  clearHistory(): void {
    this.scanHistory = [];
  }

  getDatabase(): Record<string, NFCComponentRecord> {
    return { ...NFC_TAG_DATABASE };
  }

  isKnownUID(uid: string): boolean {
    return uid in NFC_TAG_DATABASE;
  }
}

/**
 * Convert an NFC component record into a CircuitLab Component.
 */
export function nfcRecordToComponent(
  record: NFCComponentRecord,
  position: { x: number; y: number }
): Component {
  const id = `comp-${record.uid}-${Date.now()}`;
  return {
    id,
    type: record.type,
    label: record.label,
    position,
    rotation: 0,
    properties: { ...record.properties, nfcUid: record.uid },
    nfcUid: record.uid,
    terminals: [
      { id: `${id}-a`, componentId: id, position: 'left', nodeId: null },
      { id: `${id}-b`, componentId: id, position: 'right', nodeId: null },
    ],
  };
}

export const virtualScanner = new VirtualNFCScanner();
