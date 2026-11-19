import type { Circuit, Component, Wire } from '../types/circuit';

function comp(id: string, type: any, label: string, props: Record<string, any>, position: { x: number; y: number }): Component {
  const terminals =
    type === 'ground'
      ? [{ id: `${id}-a`, componentId: id, position: 'bottom' as const, nodeId: null }]
      : [
          { id: `${id}-a`, componentId: id, position: 'left' as const, nodeId: null },
          { id: `${id}-b`, componentId: id, position: 'right' as const, nodeId: null },
        ];
  return { id, type, label, position, rotation: 0, properties: props, terminals };
}

function w(id: string, s: string, t: string): Wire {
  return { id, sourceTerminalId: s, targetTerminalId: t, sourceNodeId: '', targetNodeId: '' };
}

export interface LabExperiment {
  id: string;
  title: string;
  objective: string;
  setupCircuit: () => Circuit;
}

function baseCircuit(name: string, components: Component[], wires: Wire[]): Circuit {
  return {
    id: `exp-${name}-${Date.now()}`,
    name,
    components,
    wires,
    nodes: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export const LAB_EXPERIMENTS: LabExperiment[] = [
  {
    id: 'led-basic',
    title: 'Basic LED circuit',
    objective: 'Demonstrate a simple LED circuit with current limiting resistor.',
    setupCircuit: () => {
      const vs = comp('vs1', 'voltageSource', 'DC Source 5V', { voltage: 5 }, { x: -3, y: 0 });
      const r = comp('r1', 'resistor', 'Resistor 220Ω', { resistance: 220 }, { x: -1, y: 0 });
      const led = comp('led1', 'led', 'LED', { resistance: 20 }, { x: 1, y: 0 });
      const gnd = comp('gnd1', 'ground', 'Ground', {}, { x: 3, y: 0 });
      const wires = [
        w('w1', 'vs1-a', 'r1-a'),
        w('w2', 'r1-b', 'led1-a'),
        w('w3', 'led1-b', 'gnd1-a'),
        w('w4', 'gnd1-a', 'vs1-b'),
      ];
      return baseCircuit('Basic LED', [vs, r, led, gnd], wires);
    },
  },
  {
    id: 'single-resistor',
    title: 'Single resistor circuit',
    objective: 'Verify Ohm’s law with one resistor.',
    setupCircuit: () => {
      const vs = comp('vs1', 'voltageSource', 'DC Source 5V', { voltage: 5 }, { x: -2, y: 0 });
      const r = comp('r1', 'resistor', 'Resistor 100Ω', { resistance: 100 }, { x: 0, y: 0 });
      const gnd = comp('gnd1', 'ground', 'Ground', {}, { x: 2, y: 0 });
      const wires = [w('w1', 'vs1-a', 'r1-a'), w('w2', 'r1-b', 'gnd1-a'), w('w3', 'gnd1-a', 'vs1-b')];
      return baseCircuit('Single Resistor', [vs, r, gnd], wires);
    },
  },
  {
    id: 'series-two',
    title: 'Two resistors in series',
    objective: 'Total resistance equals sum of individual resistances.',
    setupCircuit: () => {
      const vs = comp('vs1', 'voltageSource', 'DC Source 12V', { voltage: 12 }, { x: -3, y: 0 });
      const r1 = comp('r1', 'resistor', 'Resistor 100Ω', { resistance: 100 }, { x: -1, y: 0 });
      const r2 = comp('r2', 'resistor', 'Resistor 200Ω', { resistance: 200 }, { x: 1, y: 0 });
      const gnd = comp('gnd1', 'ground', 'Ground', {}, { x: 3, y: 0 });
      const wires = [
        w('w1', 'vs1-a', 'r1-a'),
        w('w2', 'r1-b', 'r2-a'),
        w('w3', 'r2-b', 'gnd1-a'),
        w('w4', 'gnd1-a', 'vs1-b'),
      ];
      return baseCircuit('Series Two', [vs, r1, r2, gnd], wires);
    },
  },
  {
    id: 'parallel-two',
    title: 'Two resistors in parallel',
    objective: 'Equivalent resistance of parallel resistors.',
    setupCircuit: () => {
      const vs = comp('vs1', 'voltageSource', 'DC Source 10V', { voltage: 10 }, { x: -3, y: 0 });
      const r1 = comp('r1', 'resistor', 'Resistor 100Ω', { resistance: 100 }, { x: 0, y: -1.5 });
      const r2 = comp('r2', 'resistor', 'Resistor 100Ω', { resistance: 100 }, { x: 0, y: 1.5 });
      const gnd = comp('gnd1', 'ground', 'Ground', {}, { x: 3, y: 0 });
      const wires = [
        w('w1', 'vs1-a', 'r1-a'),
        w('w2', 'vs1-a', 'r2-a'),
        w('w3', 'r1-b', 'gnd1-a'),
        w('w4', 'r2-b', 'gnd1-a'),
        w('w5', 'gnd1-a', 'vs1-b'),
      ];
      return baseCircuit('Parallel Two', [vs, r1, r2, gnd], wires);
    },
  },
  {
    id: 'mixed',
    title: 'Mixed series-parallel circuit',
    objective: 'Analyze combined series and parallel resistors.',
    setupCircuit: () => {
      const vs = comp('vs1', 'voltageSource', 'DC Source 12V', { voltage: 12 }, { x: -4, y: 0 });
      const r1 = comp('r1', 'resistor', 'Resistor 100Ω', { resistance: 100 }, { x: -2, y: 0 });
      const r2 = comp('r2', 'resistor', 'Resistor 200Ω', { resistance: 200 }, { x: 0, y: -1.5 });
      const r3 = comp('r3', 'resistor', 'Resistor 200Ω', { resistance: 200 }, { x: 0, y: 1.5 });
      const gnd = comp('gnd1', 'ground', 'Ground', {}, { x: 2, y: 0 });
      const wires = [
        w('w1', 'vs1-a', 'r1-a'),
        w('w2', 'r1-b', 'r2-a'),
        w('w3', 'r1-b', 'r3-a'),
        w('w4', 'r2-b', 'gnd1-a'),
        w('w5', 'r3-b', 'gnd1-a'),
        w('w6', 'gnd1-a', 'vs1-b'),
      ];
      return baseCircuit('Mixed', [vs, r1, r2, r3, gnd], wires);
    },
  },
  {
    id: 'voltage-divider',
    title: 'Voltage divider',
    objective: 'Divide voltage using two series resistors.',
    setupCircuit: () => {
      const vs = comp('vs1', 'voltageSource', 'DC Source 10V', { voltage: 10 }, { x: -3, y: 0 });
      const r1 = comp('r1', 'resistor', 'Resistor 100Ω', { resistance: 100 }, { x: -1, y: 0 });
      const r2 = comp('r2', 'resistor', 'Resistor 100Ω', { resistance: 100 }, { x: 1, y: 0 });
      const gnd = comp('gnd1', 'ground', 'Ground', {}, { x: 3, y: 0 });
      const wires = [
        w('w1', 'vs1-a', 'r1-a'),
        w('w2', 'r1-b', 'r2-a'),
        w('w3', 'r2-b', 'gnd1-a'),
        w('w4', 'gnd1-a', 'vs1-b'),
      ];
      return baseCircuit('Voltage Divider', [vs, r1, r2, gnd], wires);
    },
  },
  {
    id: 'open-circuit',
    title: 'Open circuit demonstration',
    objective: 'Show that an incomplete path prevents current flow.',
    setupCircuit: () => {
      const vs = comp('vs1', 'voltageSource', 'DC Source 5V', { voltage: 5 }, { x: -2, y: 0 });
      const r = comp('r1', 'resistor', 'Resistor 100Ω', { resistance: 100 }, { x: 0, y: 0 });
      const gnd = comp('gnd1', 'ground', 'Ground', {}, { x: 2, y: 0 });
      const wires = [w('w1', 'vs1-a', 'r1-a'), w('w2', 'gnd1-a', 'vs1-b')];
      return baseCircuit('Open Circuit', [vs, r, gnd], wires);
    },
  },
  {
    id: 'short-circuit',
    title: 'Short circuit demonstration',
    objective: 'Show excessive current when terminals are shorted.',
    setupCircuit: () => {
      const vs = comp('vs1', 'voltageSource', 'DC Source 5V', { voltage: 5 }, { x: -1, y: 0 });
      const gnd = comp('gnd1', 'ground', 'Ground', {}, { x: 1, y: 0 });
      const wires = [w('w1', 'vs1-a', 'gnd1-a'), w('w2', 'vs1-b', 'gnd1-a')];
      return baseCircuit('Short Circuit', [vs, gnd], wires);
    },
  },
  {
    id: 'rc-charge',
    title: 'RC capacitor charging',
    objective: 'Observe capacitor charging through a resistor.',
    setupCircuit: () => {
      const vs = comp('vs1', 'voltageSource', 'DC Source 5V', { voltage: 5 }, { x: -3, y: 0 });
      const r = comp('r1', 'resistor', 'Resistor 1kΩ', { resistance: 1000 }, { x: -1, y: 0 });
      const c = comp('c1', 'capacitor', 'Capacitor 100µF', { capacitance: 0.0001 }, { x: 1, y: 0 });
      const gnd = comp('gnd1', 'ground', 'Ground', {}, { x: 3, y: 0 });
      const wires = [
        w('w1', 'vs1-a', 'r1-a'),
        w('w2', 'r1-b', 'c1-a'),
        w('w3', 'c1-b', 'gnd1-a'),
        w('w4', 'gnd1-a', 'vs1-b'),
      ];
      return baseCircuit('RC Charging', [vs, r, c, gnd], wires);
    },
  },
  {
    id: 'rc-discharge',
    title: 'RC capacitor discharging',
    objective: 'Observe capacitor discharging through a resistor.',
    setupCircuit: () => {
      const vs = comp('vs1', 'voltageSource', 'DC Source 5V', { voltage: 5 }, { x: -3, y: 0 });
      const r = comp('r1', 'resistor', 'Resistor 1kΩ', { resistance: 1000 }, { x: -1, y: 0 });
      const c = comp('c1', 'capacitor', 'Capacitor 100µF', { capacitance: 0.0001 }, { x: 1, y: 0 });
      const gnd = comp('gnd1', 'ground', 'Ground', {}, { x: 3, y: 0 });
      const wires = [
        w('w1', 'vs1-a', 'r1-a'),
        w('w2', 'r1-b', 'c1-a'),
        w('w3', 'c1-b', 'gnd1-a'),
        w('w4', 'gnd1-a', 'vs1-b'),
      ];
      return baseCircuit('RC Discharging', [vs, r, c, gnd], wires);
    },
  },
  {
    id: 'rl-transient',
    title: 'RL transient response',
    objective: 'Observe inductor current growth and decay.',
    setupCircuit: () => {
      const vs = comp('vs1', 'voltageSource', 'DC Source 5V', { voltage: 5 }, { x: -3, y: 0 });
      const r = comp('r1', 'resistor', 'Resistor 100Ω', { resistance: 100 }, { x: -1, y: 0 });
      const l = comp('l1', 'inductor', 'Inductor 10mH', { inductance: 0.01 }, { x: 1, y: 0 });
      const gnd = comp('gnd1', 'ground', 'Ground', {}, { x: 3, y: 0 });
      const wires = [
        w('w1', 'vs1-a', 'r1-a'),
        w('w2', 'r1-b', 'l1-a'),
        w('w3', 'l1-b', 'gnd1-a'),
        w('w4', 'gnd1-a', 'vs1-b'),
      ];
      return baseCircuit('RL Transient', [vs, r, l, gnd], wires);
    },
  },
  {
    id: 'switch-light',
    title: 'Switch-controlled lighting circuit',
    objective: 'Control a lamp using a switch.',
    setupCircuit: () => {
      const vs = comp('vs1', 'voltageSource', 'DC Source 5V', { voltage: 5 }, { x: -3, y: 0 });
      const sw = comp('sw1', 'switch', 'Switch', { closed: false }, { x: -1, y: 0 });
      const bulb = comp('bulb1', 'bulb', 'Bulb', { resistance: 47 }, { x: 1, y: 0 });
      const gnd = comp('gnd1', 'ground', 'Ground', {}, { x: 3, y: 0 });
      const wires = [
        w('w1', 'vs1-a', 'sw1-a'),
        w('w2', 'sw1-b', 'bulb1-a'),
        w('w3', 'bulb1-b', 'gnd1-a'),
        w('w4', 'gnd1-a', 'vs1-b'),
      ];
      return baseCircuit('Switch Light', [vs, sw, bulb, gnd], wires);
    },
  },
];
