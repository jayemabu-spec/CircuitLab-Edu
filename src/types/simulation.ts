import type { ComponentType, Circuit } from './circuit';
export type { ComponentType };

export interface TransientAnalysis {
  id: string;
  type: 'RC' | 'RL';
  mode: 'charge' | 'discharge' | 'rise' | 'decay';
  resistance: number;
  capacitance?: number;
  inductance?: number;
  voltageSource: number;
  timeConstant: number;
  dataPoints: Array<{ t: number; value: number }>;
}

export interface Measurement {
  id: string;
  type: 'voltage' | 'current' | 'resistance';
  value: number;
  unit: string;
  nodeA?: string;
  nodeB?: string;
  componentId?: string;
  timestamp: number;
}

export interface NFCComponentRecord {
  uid: string;
  type: ComponentType;
  label: string;
  properties: Record<string, number | string | boolean>;
}

export interface NFCScanRecord {
  id: string;
  uid: string;
  componentType: ComponentType | null;
  label: string | null;
  timestamp: number;
  success: boolean;
}

export interface HardwareAdapter {
  name: string;
  connected: boolean;
  scanNFC: () => Promise<NFCComponentRecord | null>;
  readDisplay: () => Promise<string>;
  writeDisplay: (text: string) => Promise<void>;
  setLEDs: (pattern: number[]) => Promise<void>;
}

export interface Experiment {
  id: string;
  title: string;
  objective: string;
  category: 'ohms-law' | 'series' | 'parallel' | 'mixed' | 'divider' | 'rc' | 'rl';
  components: Array<{ type: ComponentType; value: number; quantity: number }>;
  circuitJson: string;
  instructions: string[];
  expectedResults: Record<string, number>;
  setupCircuit: () => Circuit;
}
