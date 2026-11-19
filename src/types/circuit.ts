export type ComponentType =
  | 'resistor'
  | 'bulb'
  | 'led'
  | 'switch'
  | 'capacitor'
  | 'inductor'
  | 'voltageSource'
  | 'ground'
  | 'voltmeter'
  | 'ammeter'
  | 'ohmmeter'
  | 'multimeter'
  | 'breadboard';

export interface Terminal {
  id: string;
  componentId: string;
  position: 'left' | 'right' | 'top' | 'bottom';
  nodeId: string | null;
}

export interface Component {
  id: string;
  type: ComponentType;
  label: string;
  position: { x: number; y: number };
  rotation: number; // degrees
  properties: Record<string, number | string | boolean>;
  nfcUid?: string;
  terminals: Terminal[];
}

export interface Wire {
  id: string;
  sourceTerminalId: string;
  targetTerminalId: string;
  sourceNodeId: string;
  targetNodeId: string;
}

export interface CircuitNode {
  id: string;
  label: string;
  voltage: number;
}

export interface Circuit {
  id: string;
  name: string;
  components: Component[];
  wires: Wire[];
  nodes: CircuitNode[];
  createdAt: number;
  updatedAt: number;
}

export interface SimulationResult {
  valid: boolean;
  errors: string[];
  nodeVoltages: Record<string, number>;
  branchCurrents: Record<string, number>; // terminalId -> current
  componentVoltages: Record<string, number>; // componentId -> voltage drop
  componentPowers: Record<string, number>; // componentId -> power
  totalResistance: number;
  totalCurrent: number;
  shortCircuit: boolean;
  openCircuit: boolean;
  floatingNodes: string[];
}
