export interface PCBPad {
  id: string;
  x: number; // relative to footprint center
  y: number;
  width: number;
  height: number;
  layer: 'top' | 'bottom';
}

export interface PCBFootprint {
  id: string; // instance ID
  componentId: string; // references the schematic/3D component ID
  name: string; // e.g., "0805_Resistor"
  x: number; // board coordinates (mm)
  y: number;
  rotation: number; // in degrees
  layer: 'top' | 'bottom';
  pads: PCBPad[];
}

export interface PCBTrack {
  id: string;
  points: number[]; // [x1, y1, x2, y2, ...]
  width: number;
  layer: 'top' | 'bottom';
  netId?: string;
}

export interface PCBData {
  footprints: PCBFootprint[];
  tracks: PCBTrack[];
  boardWidth: number; // in mm (e.g., 100)
  boardHeight: number; // in mm (e.g., 80)
}
