import { describe, it, expect } from 'vitest';
import {
  solveCircuit,
  seriesResistance,
  parallelResistance,
  voltageDivider,
  currentDivider,
  powerFromVI,
  powerFromVR,
  powerFromIR,
  rcTimeConstant,
  rcChargingVoltage,
  rcdischargingVoltage,
  rlTimeConstant,
  rlCurrentRise,
  rlCurrentDecay,
} from './engine';
import type { Component, Wire } from '../types/circuit';

function resistor(id: string, r: number, x = 0, y = 0): Component {
  return {
    id,
    type: 'resistor',
    label: `R${id}`,
    position: { x, y },
    rotation: 0,
    properties: { resistance: r },
    terminals: [
      { id: `${id}-a`, componentId: id, position: 'left', nodeId: null },
      { id: `${id}-b`, componentId: id, position: 'right', nodeId: null },
    ],
  };
}

function voltageSource(id: string, v: number, x = 0, y = 0): Component {
  return {
    id,
    type: 'voltageSource',
    label: `V${id}`,
    position: { x, y },
    rotation: 0,
    properties: { voltage: v, polarity: '+' },
    terminals: [
      { id: `${id}-a`, componentId: id, position: 'top', nodeId: null },
      { id: `${id}-b`, componentId: id, position: 'bottom', nodeId: null },
    ],
  };
}

function ground(id: string, x = 0, y = 0): Component {
  return {
    id,
    type: 'ground',
    label: 'GND',
    position: { x, y },
    rotation: 0,
    properties: {},
    terminals: [
      { id: `${id}-a`, componentId: id, position: 'bottom', nodeId: null },
    ],
  };
}

function wire(sourceTerminalId: string, targetTerminalId: string): Wire {
  return {
    id: `w-${sourceTerminalId}-${targetTerminalId}`,
    sourceTerminalId,
    targetTerminalId,
    sourceNodeId: '',
    targetNodeId: '',
  };
}

describe('seriesResistance', () => {
  it('sums resistors in series', () => {
    expect(seriesResistance([100, 200, 300])).toBe(600);
    expect(seriesResistance([1000])).toBe(1000);
    expect(seriesResistance([])).toBe(0);
  });
});

describe('parallelResistance', () => {
  it('calculates parallel resistance', () => {
    // Two 100 ohm in parallel = 50
    expect(parallelResistance([100, 100])).toBeCloseTo(50, 10);
    // 100 and 200 in parallel = 66.66...
    expect(parallelResistance([100, 200])).toBeCloseTo(66.6667, 4);
    expect(parallelResistance([])).toBe(0);
  });
});

describe('voltageDivider', () => {
  it('divides voltage correctly', () => {
    // 10V, R1=100, R2=100 -> 5V
    expect(voltageDivider(10, 100, 100)).toBeCloseTo(5, 10);
    // 12V, R1=200, R2=100 -> 4V
    expect(voltageDivider(12, 200, 100)).toBeCloseTo(4, 10);
  });
});

describe('currentDivider', () => {
  it('divides current correctly', () => {
    // 1A total, R1=100, R2=100 -> 0.5A through R2
    expect(currentDivider(1, 100, 100)).toBeCloseTo(0.5, 10);
  });
});

describe('power calculations', () => {
  it('calculates power from V and I', () => {
    expect(powerFromVI(5, 2)).toBe(10);
  });
  it('calculates power from V and R', () => {
    expect(powerFromVR(10, 100)).toBeCloseTo(1, 10);
  });
  it('calculates power from I and R', () => {
    expect(powerFromIR(0.5, 100)).toBeCloseTo(25, 10);
  });
});

describe('RC transient', () => {
  it('calculates time constant', () => {
    expect(rcTimeConstant(1000, 0.001)).toBeCloseTo(1, 10); // 1k * 1000uF = 1s
  });
  it('charging voltage approaches source', () => {
    // At t = tau, V = Vs * (1 - 1/e) ≈ 0.632 * Vs
    expect(rcChargingVoltage(1, 10, 1000, 0.001)).toBeCloseTo(10 * (1 - 1 / Math.E), 4);
    // At t = 0, V = 0
    expect(rcChargingVoltage(0, 10, 1000, 0.001)).toBeCloseTo(0, 10);
  });
  it('discharging voltage decays', () => {
    // At t = tau, V = V0 * 1/e ≈ 0.368 * V0
    expect(rcdischargingVoltage(1, 10, 1000, 0.001)).toBeCloseTo(10 / Math.E, 4);
    // At t = 0, V = V0
    expect(rcdischargingVoltage(0, 10, 1000, 0.001)).toBeCloseTo(10, 10);
  });
});

describe('RL transient', () => {
  it('calculates time constant', () => {
    expect(rlTimeConstant(100, 0.5)).toBeCloseTo(0.005, 10); // 0.5/100 = 0.005s
  });
  it('current rise approaches V/R', () => {
    // At t = tau, I = (V/R)*(1-1/e)
    expect(rlCurrentRise(0.005, 10, 100, 0.5)).toBeCloseTo((10 / 100) * (1 - 1 / Math.E), 4);
    // At t = 0, I = 0
    expect(rlCurrentRise(0, 10, 100, 0.5)).toBeCloseTo(0, 10);
  });
  it('current decay', () => {
    // At t = tau, I = I0 * 1/e
    expect(rlCurrentDecay(0.005, 0.1, 100, 0.5)).toBeCloseTo(0.1 / Math.E, 4);
    // At t = 0, I = I0
    expect(rlCurrentDecay(0, 0.1, 100, 0.5)).toBeCloseTo(0.1, 10);
  });
});

describe('solveCircuit - simple circuits', () => {
  it('solves a single resistor circuit', () => {
    const vs = voltageSource('v1', 10);
    const r1 = resistor('r1', 100);
    const gnd = ground('g1');
    const wires = [
      wire('v1-a', 'r1-a'),
      wire('r1-b', 'g1-a'),
      wire('g1-a', 'v1-b'),
    ];
    const result = solveCircuit([vs, r1, gnd], wires);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    // I = V/R = 10/100 = 0.1A
    expect(result.totalCurrent).toBeCloseTo(0.1, 4);
    expect(result.totalResistance).toBeCloseTo(100, 4);
  });

  it('solves series resistors', () => {
    const vs = voltageSource('v1', 12);
    const r1 = resistor('r1', 100);
    const r2 = resistor('r2', 200);
    const gnd = ground('g1');
    const wires = [
      wire('v1-a', 'r1-a'),
      wire('r1-b', 'r2-a'),
      wire('r2-b', 'g1-a'),
      wire('g1-a', 'v1-b'),
    ];
    const result = solveCircuit([vs, r1, r2, gnd], wires);
    expect(result.valid).toBe(true);
    expect(result.totalResistance).toBeCloseTo(300, 4);
    expect(result.totalCurrent).toBeCloseTo(12 / 300, 4); // 0.04A
  });

  it('detects missing voltage source', () => {
    const r1 = resistor('r1', 100);
    const gnd = ground('g1');
    const wires = [wire('r1-a', 'g1-a')];
    const result = solveCircuit([r1, gnd], wires);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('detects missing ground', () => {
    const vs = voltageSource('v1', 10);
    const r1 = resistor('r1', 100);
    const wires = [wire('v1-a', 'r1-a')];
    const result = solveCircuit([vs, r1], wires);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('ground'))).toBe(true);
  });

  it('detects short circuit on voltage source', () => {
    const vs = voltageSource('v1', 10);
    const gnd = ground('g1');
    // Short both terminals of voltage source to ground
    const wires = [
      wire('v1-a', 'g1-a'),
      wire('v1-b', 'g1-a'),
    ];
    const result = solveCircuit([vs, gnd], wires);
    expect(result.valid).toBe(false);
    expect(result.shortCircuit).toBe(true);
  });
});

describe('solveCircuit - parallel resistors', () => {
  it('calculates parallel equivalent resistance', () => {
    const vs = voltageSource('v1', 10);
    const r1 = resistor('r1', 100);
    const r2 = resistor('r2', 100);
    const gnd = ground('g1');
    // Both resistors connected between same two nodes
    const wires = [
      wire('v1-a', 'r1-a'),
      wire('v1-a', 'r2-a'),
      wire('r1-b', 'g1-a'),
      wire('r2-b', 'g1-a'),
      wire('g1-a', 'v1-b'),
    ];
    const result = solveCircuit([vs, r1, r2, gnd], wires);
    expect(result.valid).toBe(true);
    // Two 100 ohm in parallel = 50 ohm
    expect(result.totalResistance).toBeCloseTo(50, 4);
    expect(result.totalCurrent).toBeCloseTo(10 / 50, 4); // 0.2A
  });
});
