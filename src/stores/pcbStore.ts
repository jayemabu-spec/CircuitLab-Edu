import { create } from 'zustand';
import type { PCBData, PCBFootprint, PCBPad } from '../types/pcb';

interface PCBStoreState {
  pcb: PCBData | null;
  setPCB: (pcb: PCBData) => void;
  updateFootprint: (id: string, updates: Partial<PCBFootprint>) => void;
  resetPCB: () => void;
}

function defaultPads(type: string, id: string): PCBPad[] {
  if (type === 'ground') {
    return [{ id: `${id}-p0`, x: 0, y: 0, width: 2, height: 2, layer: 'top' }];
  }
  return [
    { id: `${id}-p0`, x: -3, y: 0, width: 2, height: 2, layer: 'top' },
    { id: `${id}-p1`, x: 3, y: 0, width: 2, height: 2, layer: 'top' },
  ];
}

export function buildPCBFromCircuit(components: { id: string; type: string; label: string }[]): PCBData {
  const footprints: PCBFootprint[] = components.map((c, i) => ({
    id: `fp-${c.id}`,
    componentId: c.id,
    name: `${c.type}_${c.label}`.slice(0, 24),
    x: 10 + (i % 5) * 18,
    y: 10 + Math.floor(i / 5) * 18,
    rotation: 0,
    layer: 'top',
    pads: defaultPads(c.type, `fp-${c.id}`),
  }));
  return {
    footprints,
    tracks: [],
    boardWidth: 100,
    boardHeight: 80,
  };
}

export const usePCBStore = create<PCBStoreState>((set) => ({
  pcb: null,
  setPCB: (pcb) => set({ pcb }),
  updateFootprint: (id, updates) =>
    set((state) => {
      if (!state.pcb) return state;
      return {
        pcb: {
          ...state.pcb,
          footprints: state.pcb.footprints.map((f) => (f.id === id ? { ...f, ...updates } : f)),
        },
      };
    }),
  resetPCB: () => set({ pcb: null }),
}));
