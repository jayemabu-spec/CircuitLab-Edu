import { create } from 'zustand';
import type { Circuit, Component, Wire } from '../types/circuit';

interface CircuitStoreState {
  circuit: Circuit | null;
  isSimulating: boolean;
  simulationResults: any | null;
  selectedComponentId: string | null;
  setCircuit: (circuit: Circuit) => void;
  updateCircuit: (updater: (c: Circuit) => void) => void;
  addComponent: (component: Component) => void;
  removeComponent: (id: string) => void;
  updateComponent: (id: string, updates: Partial<Component>) => void;
  addWire: (wire: Wire) => void;
  removeWire: (id: string) => void;
  setSelectedComponent: (id: string | null) => void;
  setSimulation: (simulating: boolean) => void;
  setSimulationResults: (results: any | null) => void;
  resetCircuit: () => void;
}

const createEmptyCircuit = (): Circuit => ({
  id: `circuit-${Date.now()}`,
  name: 'Untitled Circuit',
  components: [],
  wires: [],
  nodes: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

export const useCircuitStore = create<CircuitStoreState>((set) => ({
  circuit: createEmptyCircuit(),
  isSimulating: false,
  simulationResults: null,
  selectedComponentId: null,

  setCircuit: (circuit) => set({ circuit }),

  updateCircuit: (updater) =>
    set((state) => {
      if (!state.circuit) return state;
      const c = { ...state.circuit };
      updater(c);
      c.updatedAt = Date.now();
      return { circuit: c };
    }),

  addComponent: (component) =>
    set((state) => {
      if (!state.circuit) return state;
      return {
        circuit: {
          ...state.circuit,
          components: [...state.circuit.components, component],
          updatedAt: Date.now(),
        },
      };
    }),

  removeComponent: (id) =>
    set((state) => {
      if (!state.circuit) return state;
      return {
        circuit: {
          ...state.circuit,
          components: state.circuit.components.filter((c) => c.id !== id),
          wires: state.circuit.wires.filter(
            (w) => w.sourceTerminalId.split('-')[0] !== id && w.targetTerminalId.split('-')[0] !== id
          ),
          updatedAt: Date.now(),
        },
      };
    }),

  updateComponent: (id, updates) =>
    set((state) => {
      if (!state.circuit) return state;
      return {
        circuit: {
          ...state.circuit,
          components: state.circuit.components.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
          updatedAt: Date.now(),
        },
      };
    }),

  addWire: (wire) =>
    set((state) => {
      if (!state.circuit) return state;
      return {
        circuit: {
          ...state.circuit,
          wires: [...state.circuit.wires, wire],
          updatedAt: Date.now(),
        },
      };
    }),

  removeWire: (id) =>
    set((state) => {
      if (!state.circuit) return state;
      return {
        circuit: {
          ...state.circuit,
          wires: state.circuit.wires.filter((w) => w.id !== id),
          updatedAt: Date.now(),
        },
      };
    }),

  setSelectedComponent: (id) => set({ selectedComponentId: id }),

  setSimulation: (isSimulating) => set({ isSimulating }),

  setSimulationResults: (results) => set({ simulationResults: results }),

  resetCircuit: () => set({ circuit: createEmptyCircuit(), simulationResults: null }),
}));
