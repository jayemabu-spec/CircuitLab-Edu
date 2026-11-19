# CircuitLab-Edu

A interactive 3D electronics laboratory for bachelor's thesis demonstration.

## Features

### 3D Electronics Laboratory
Interactive Three.js/React Three Fiber 3D workspace at `/lab`: draggable/selectable 3D components, terminal-based wiring, animated current flow, LED brightness, experiment loading, simulated NFC scanning, and live simulation results.

### Dashboard
Start page with:
- **Quick stats** (components placed, wires connected, circuit status, NFC scans)
- **6 one-click example circuits** that load into the 3D laboratory:
  1. Basic LED circuit
  2. Single resistor circuit
  3. Two resistors in series
  4. Two resistors in parallel
  5. Mixed series-parallel circuit
  6. Voltage divider
- **Top navigation bar** with all modules (Dashboard, 3D Lab, Designer, Library, Simulator, Transient, NFC, Measurements, Experiments, Settings)
- Shortcuts to continue working in any module

### Circuit Designer
Node-editor canvas for traditional breadboard-style circuit design with terminal-based wiring and simulation.

### Circuit Simulator
Visualize current flow through wires, measure component voltages/currents, and see power dissipation.

### NFC Identification
Simulated NFC reader to identify tagged components and add them to the virtual board.

### Experiments Library
12 guided experiments (LED, series, parallel, mixed, voltage divider, open/short, RC charge/discharge, RL transient, switch control) that open pre-configured 3D boards.

### Transient Analysis
RC/RL time-domain graphs showing voltage/current vs. time with adjustable R/L/C/voltage.

### Measurements
Virtual multimeter for voltage, current, and resistance readings with equivalent resistance calculator.

## Available Scripts

- `npm run dev` - Starts development server at http://localhost:5173
- `npm run build` - Builds for production
- `npm run lint` - Runs oxlint
- `npm run preview` - Preview production build

## Phases of Thesis

1. Project inspection and architecture planning
2. 3D electronics laboratory workspace
3. Component library with 3D geometry
4. Circuit simulation engine (MNA solver with Kirchhoff's laws)
5. Current-flow visualization with animated particles
6. 12 predefined experiments with fully configured 3D boards
7. RC/RL transient simulation with interactive graphs
8. Simulated NFC reader with tag database and hardware abstraction
9. Professional engineering interface with top navigation and resizable panes
10. Quality assurance (TypeScript, build, tests)