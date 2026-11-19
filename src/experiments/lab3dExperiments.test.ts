import { describe, it, expect } from 'vitest';
import { LAB_EXPERIMENTS } from './lab3dExperiments';
import { solveCircuit } from '../simulation/engine';

describe('3D lab experiments', () => {
  it('loads and solves every experiment', () => {
    for (const exp of LAB_EXPERIMENTS) {
      const circuit = exp.setupCircuit();
      const result = solveCircuit(circuit.components, circuit.wires);
      // Basic structural checks
      expect(circuit.components.length).toBeGreaterThan(0);
      expect(circuit.wires.length).toBeGreaterThan(0);
      // Most experiments should be valid except open/short demonstrations
      if (exp.id === 'short-circuit') {
        expect(result.valid).toBe(false);
      } else {
        expect(result.valid).toBe(true);
      }
    }
  });
});