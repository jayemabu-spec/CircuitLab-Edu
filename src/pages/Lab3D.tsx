import { useRef, useState, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, TransformControls, Grid, Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useCircuitStore } from '../stores/circuitStore';
import { AICircuitBuilder } from '../components/AICircuitBuilder';
import { solveCircuit } from '../simulation/engine';
import { LAB_EXPERIMENTS } from '../experiments/lab3dExperiments';
import { virtualScanner, nfcRecordToComponent } from '../nfc/scanner';
import type { Component, Wire } from '../types/circuit';
import { Play, Pause, RotateCcw, Search } from 'lucide-react';

const COMPONENT_LIBRARY: { type: string; label: string; defaults: Record<string, any>; color: string }[] = [
  { type: 'resistor', label: 'Resistor 100Ω', defaults: { resistance: 100 }, color: '#38bdf8' },
  { type: 'resistor', label: 'Resistor 220Ω', defaults: { resistance: 220 }, color: '#38bdf8' },
  { type: 'resistor', label: 'Resistor 330Ω', defaults: { resistance: 330 }, color: '#38bdf8' },
  { type: 'resistor', label: 'Resistor 470Ω', defaults: { resistance: 470 }, color: '#38bdf8' },
  { type: 'resistor', label: 'Resistor 1kΩ', defaults: { resistance: 1000 }, color: '#38bdf8' },
  { type: 'capacitor', label: 'Capacitor', defaults: { capacitance: 0.0001 }, color: '#22d3ee' },
  { type: 'inductor', label: 'Inductor', defaults: { inductance: 0.01 }, color: '#38bdf8' },
  { type: 'led', label: 'LED', defaults: { resistance: 20 }, color: '#f87171' },
  { type: 'bulb', label: 'Light Bulb', defaults: { resistance: 47 }, color: '#fbbf24' },
  { type: 'switch', label: 'Switch', defaults: { closed: false }, color: '#94a3b8' },
  { type: 'voltageSource', label: 'DC Source', defaults: { voltage: 5 }, color: '#22d3ee' },
  { type: 'ground', label: 'Ground', defaults: {}, color: '#64748b' },
  { type: 'voltmeter', label: 'Voltmeter', defaults: {}, color: '#64748b' },
  { type: 'ammeter', label: 'Ammeter', defaults: {}, color: '#64748b' },
  { type: 'multimeter', label: 'Multimeter', defaults: {}, color: '#64748b' },
  { type: 'breadboard', label: 'Breadboard', defaults: {}, color: '#a78bfa' },
];

function offsetsFor(comp: Component): [number, number, number][] {
  if (comp.type === 'ground') return [[0, 0, 0.4]];
  return [[-0.7, 0, 0], [0.7, 0, 0]];
}

function terminalWorld(comp: Component, idx: number): THREE.Vector3 {
  const off = offsetsFor(comp)[idx];
  const pos = new THREE.Vector3(comp.position.x, 0, comp.position.y);
  const rot = (comp.rotation || 0) * Math.PI / 180;
  const v = new THREE.Vector3(...off).applyAxisAngle(new THREE.Vector3(0, 1, 0), rot);
  return pos.add(v);
}

function terminalId(comp: Component, idx: number): string {
  return `${comp.id}-${idx === 0 ? 'a' : 'b'}`;
}

function terminalOwner(components: Component[], tid: string): { comp: Component; idx: number } | null {
  for (const c of components) {
    const offs = offsetsFor(c);
    for (let i = 0; i < offs.length; i++) {
      if (terminalId(c, i) === tid) return { comp: c, idx: i };
    }
  }
  return null;
}

// Geometry
function ComponentGeometry({ comp, power }: { comp: Component; power: number }) {
  const emissiveIntensity = comp.type === 'led' || comp.type === 'bulb' ? Math.min(3, power * 0.5) : 0;
  const color =
    comp.type === 'resistor' ? '#cbd5e1' :
    comp.type === 'capacitor' ? '#22d3ee' :
    comp.type === 'inductor' ? '#38bdf8' :
    comp.type === 'led' ? '#f87171' :
    comp.type === 'bulb' ? '#fbbf24' :
    comp.type === 'switch' ? '#94a3b8' :
    comp.type === 'voltageSource' ? '#22d3ee' :
    comp.type === 'ground' ? '#64748b' :
    comp.type === 'breadboard' ? '#a78bfa' :
    '#64748b';
  switch (comp.type) {
    case 'resistor':
      return (
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.12, 0.12, 1.2, 16]} />
          <meshStandardMaterial color={color} />
        </mesh>
      );
    case 'capacitor':
      return (
        <group>
          <mesh position={[-0.15, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.15, 16]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0.15, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.15, 16]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </group>
      );
    case 'inductor':
      return (
        <mesh>
          <torusGeometry args={[0.35, 0.08, 8, 24]} />
          <meshStandardMaterial color={color} />
        </mesh>
      );
    case 'led':
    case 'bulb':
      return (
        <group>
          <mesh position={[0, 0.25, 0]}>
            <sphereGeometry args={[0.22, 16, 16]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissiveIntensity} />
          </mesh>
          <mesh position={[0, -0.15, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.3, 8]} />
            <meshStandardMaterial color="#94a3b8" />
          </mesh>
        </group>
      );
    case 'switch':
      return (
        <group>
          <mesh>
            <boxGeometry args={[0.3, 0.15, 0.3]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0.2, 0.2, 0]} rotation={[0, 0, comp.properties.closed ? 0 : Math.PI / 6]}>
            <boxGeometry args={[0.6, 0.05, 0.05]} />
            <meshStandardMaterial color="#cbd5e1" />
          </mesh>
        </group>
      );
    case 'voltageSource':
      return (
        <mesh>
          <cylinderGeometry args={[0.35, 0.35, 0.6, 24]} />
          <meshStandardMaterial color={color} />
        </mesh>
      );
    case 'ground':
      return (
        <group>
          <mesh position={[0, -0.1, 0]}>
            <boxGeometry args={[0.6, 0.05, 0.6]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0, 0.1, 0]}>
            <boxGeometry args={[0.3, 0.05, 0.3]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </group>
      );
    case 'breadboard':
      return (
        <mesh>
          <boxGeometry args={[2.4, 0.12, 1.2]} />
          <meshStandardMaterial color={color} />
        </mesh>
      );
    default:
      return (
        <mesh>
          <boxGeometry args={[0.5, 0.3, 0.3]} />
          <meshStandardMaterial color={color} />
        </mesh>
      );
  }
}

function WireLine({ wire, components }: { wire: Wire; components: Component[] }) {
  const src = terminalOwner(components, wire.sourceTerminalId);
  const tgt = terminalOwner(components, wire.targetTerminalId);
  if (!src || !tgt) return null;
  const start = terminalWorld(src.comp, src.idx);
  const end = terminalWorld(tgt.comp, tgt.idx);
  return <Line points={[start, end]} color="#38bdf8" lineWidth={2} />;
}

function WireParticles({ wire, components, speed, simulating }: { wire: Wire; components: Component[]; speed: number; simulating: boolean }) {
  const group = useRef<THREE.Group>(null);
  const src = terminalOwner(components, wire.sourceTerminalId);
  const tgt = terminalOwner(components, wire.targetTerminalId);
  if (!src || !tgt) return null;
  const start = terminalWorld(src.comp, src.idx);
  const end = terminalWorld(tgt.comp, tgt.idx);
  const offsets = [0, 0.2, 0.4, 0.6, 0.8];
  if (!simulating) return null;
  return (
    <group ref={group}>
      {offsets.map((t0, i) => (
        <Particle key={i} start={start} end={end} t0={t0} speed={speed} />
      ))}
    </group>
  );
}

function Particle({ start, end, t0, speed }: { start: THREE.Vector3; end: THREE.Vector3; t0: number; speed: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const t = useRef(t0);
  useFrame((_, delta) => {
    if (!ref.current) return;
    t.current = (t.current + delta * speed * 0.5) % 1;
    ref.current.position.lerpVectors(start, end, t.current);
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.06, 8, 8]} />
      <meshBasicMaterial color="#fbbf24" />
    </mesh>
  );
}

function DragDropController({ onDrop }: { onDrop: (type: string, position: { x: number; y: number }) => void }) {
  const { camera, gl } = useThree();
  useEffect(() => {
    const el = gl.domElement;
    const handleDragOver = (e: DragEvent) => { e.preventDefault(); };
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer?.getData('componentType');
      if (!type) return;
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const point = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, point);
      if (point) onDrop(type, { x: point.x, y: point.z });
    };
    el.addEventListener('dragover', handleDragOver);
    el.addEventListener('drop', handleDrop);
    return () => {
      el.removeEventListener('dragover', handleDragOver);
      el.removeEventListener('drop', handleDrop);
    };
  }, [camera, gl, onDrop]);
  return null;
}

export function Lab3D() {
  const circuit = useCircuitStore((s) => s.circuit);
  const setCircuit = useCircuitStore((s) => s.setCircuit);
  const addComponent = useCircuitStore((s) => s.addComponent);
  const removeComponent = useCircuitStore((s) => s.removeComponent);
  const updateComponent = useCircuitStore((s) => s.updateComponent);
  const addWire = useCircuitStore((s) => s.addWire);
  const removeWire = useCircuitStore((s) => s.removeWire);
  const resetCircuit = useCircuitStore((s) => s.resetCircuit);
  const selectedId = useCircuitStore((s) => s.selectedComponentId);
  const setSelectedComponent = useCircuitStore((s) => s.setSelectedComponent);
  const setSimulationResults = useCircuitStore((s) => s.setSimulationResults);
  const setSimulation = useCircuitStore((s) => s.setSimulation);

  const [search, setSearch] = useState('');
  const [pendingTerminal, setPendingTerminal] = useState<string | null>(null);
  const [simResults, setSimResults] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [nfcUid, setNfcUid] = useState('A1B2C3D4');
  const [nfcHistory, setNfcHistory] = useState<any[]>([]);
  const groupRefs = useRef<Record<string, THREE.Group>>({});
  const selectedGroupRef = useRef<THREE.Group | null>(null);

  const components = circuit?.components ?? [];
  const wires = circuit?.wires ?? [];

  const handleAddComponent = useCallback((type: string, defaults: Record<string, any>, position?: { x: number; y: number }) => {
    const id = `comp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const pos = position ?? { x: (components.length % 5) * 1.5 - 3, y: Math.floor(components.length / 5) * 1.5 - 2 };
    const comp: Component = {
      id,
      type: type as any,
      label: `${type}`,
      position: pos,
      rotation: 0,
      properties: { ...defaults },
      terminals: type === 'ground'
        ? [{ id: `${id}-a`, componentId: id, position: 'bottom', nodeId: null }]
        : [
            { id: `${id}-a`, componentId: id, position: 'left', nodeId: null },
            { id: `${id}-b`, componentId: id, position: 'right', nodeId: null },
          ],
    };
    // set label nicer
    const lib = COMPONENT_LIBRARY.find((l) => l.type === type && JSON.stringify(l.defaults) === JSON.stringify(defaults));
    if (lib) comp.label = lib.label;
    addComponent(comp);
  }, [components.length, addComponent]);

  const handleDrop = useCallback((type: string, position: { x: number; y: number }) => {
    const lib = COMPONENT_LIBRARY.find((l) => l.type === type);
    if (!lib) return;
    handleAddComponent(type, lib.defaults, position);
  }, [handleAddComponent]);

  const handleTerminalClick = useCallback((compId: string, tid: string) => {
    setSelectedComponent(compId);
    if (!pendingTerminal) {
      setPendingTerminal(tid);
    } else if (pendingTerminal !== tid) {
      const wire: Wire = { id: `w-${Date.now()}`, sourceTerminalId: pendingTerminal, targetTerminalId: tid, sourceNodeId: '', targetNodeId: '' };
      addWire(wire);
      setPendingTerminal(null);
    } else {
      setPendingTerminal(null);
    }
  }, [pendingTerminal, addWire, setSelectedComponent]);

  const runSimulation = useCallback(() => {
    if (!circuit) return;
    const result = solveCircuit(circuit.components, circuit.wires);
    setSimResults(result);
    setSimulationResults(result);
    setIsSimulating(true);
    setSimulation(true);
  }, [circuit, setSimulationResults, setSimulation]);

  const handleResetBoard = useCallback(() => {
    resetCircuit();
    setSimResults(null);
    setIsSimulating(false);
    setSimulation(false);
    setPendingTerminal(null);
  }, [resetCircuit, setSimulation]);

  const handleLoadExperiment = useCallback((exp: any) => {
    const c = exp.setupCircuit();
    setCircuit(c);
    setSimResults(null);
    setIsSimulating(false);
    setSimulation(false);
  }, [setCircuit, setSimulation]);

  const handleNFCScan = useCallback(async () => {
    const record = await virtualScanner.scanComponent(nfcUid);
    if (record) {
      const comp = nfcRecordToComponent(record, { x: 0, y: 0 });
      addComponent(comp);
      setNfcHistory((h) => [record, ...h]);
    } else {
      setNfcHistory((h) => [{ uid: nfcUid, success: false, label: 'Unknown', timestamp: Date.now() }, ...h]);
    }
  }, [nfcUid, addComponent]);

  const selectedComp = selectedId ? components.find((c) => c.id === selectedId) : null;

  const filteredLib = COMPONENT_LIBRARY.filter((l) =>
    l.label.toLowerCase().includes(search.toLowerCase()) || l.type.toLowerCase().includes(search.toLowerCase())
  );

  const speed = simResults?.valid ? Math.min(3, 0.5 + (simResults.totalCurrent || 0) * 2) : 0.5;

  // TransformControls object ref
  useEffect(() => {
    if (selectedId) {
      selectedGroupRef.current = groupRefs.current[selectedId] ?? null;
    } else {
      selectedGroupRef.current = null;
    }
  }, [selectedId, components.length]);

  return (
    <div className="w-full h-full flex-1 flex flex-col relative min-w-0 overflow-hidden">
      {/* Top bar */}
      <div className="h-12 border-b border-[#334155] bg-[#1e293b] flex items-center justify-between px-4">
        <h2 className="text-lg font-bold text-white">3D Electronics Laboratory</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAI(true)} className="btn-secondary flex items-center gap-2 text-sm">
            AI Build
          </button>
          <button onClick={runSimulation} className="btn-primary flex items-center gap-2 text-sm">
            {isSimulating ? <Pause size={14} /> : <Play size={14} />} {isSimulating ? 'Running' : 'Run'}
          </button>
          <button onClick={() => { setIsSimulating(false); setSimulation(false); }} className="btn-secondary text-sm">
            Pause
          </button>
          <button onClick={handleResetBoard} className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1">
            <RotateCcw size={14} /> Reset Board
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: library + experiments */}
        <aside className="w-72 bg-[#1e293b] border-r border-[#334155] p-3 overflow-y-auto">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search components..."
            className="w-full mb-3 px-3 py-2 rounded bg-[#0f172a] border border-[#475569] text-sm text-white"
          />
          <h3 className="text-xs font-semibold text-[#94a3b8] uppercase mb-2">Components (drag to board)</h3>
          <div className="space-y-1 mb-4">
            {filteredLib.map((l, i) => (
              <div
                key={i}
                draggable
                onDragStart={(e) => e.dataTransfer.setData('componentType', l.type)}
                onClick={() => handleAddComponent(l.type, l.defaults)}
                className="flex items-center gap-2 px-2 py-1.5 rounded bg-[#0f172a] border border-[#475569] text-sm text-white hover:border-[#64748b] cursor-grab"
              >
                <span className="w-3 h-3 rounded" style={{ background: l.color }} />
                {l.label}
              </div>
            ))}
          </div>
          <h3 className="text-xs font-semibold text-[#94a3b8] uppercase mb-2">Experiments</h3>
          <div className="space-y-1 mb-4">
            {LAB_EXPERIMENTS.map((exp) => (
              <button
                key={exp.id}
                onClick={() => handleLoadExperiment(exp)}
                className="w-full text-left px-2 py-1.5 rounded bg-[#0f172a] border border-[#475569] text-xs text-white hover:border-[#64748b]"
              >
                {exp.title}
              </button>
            ))}
          </div>
          <h3 className="text-xs font-semibold text-[#94a3b8] uppercase mb-2">NFC (simulated)</h3>
          <div className="space-y-2">
            <select value={nfcUid} onChange={(e) => setNfcUid(e.target.value)} className="w-full px-2 py-1 rounded bg-[#0f172a] border border-[#475569] text-xs text-white">
              {Object.keys((virtualScanner as any).getDatabase()).map((uid) => (
                <option key={uid} value={uid}>{uid}</option>
              ))}
            </select>
            <button onClick={handleNFCScan} className="w-full btn-secondary text-xs flex items-center justify-center gap-1">
              <Search size={12} /> Simulate NFC Scan
            </button>
            <div className="text-[10px] text-[#94a3b8] max-h-24 overflow-y-auto">
              {nfcHistory.map((h: any, i) => (
                <div key={i}>{h.success ? `✔ ${h.label}` : `✘ ${h.uid}`}</div>
              ))}
            </div>
          </div>
        </aside>

        {/* Center: 3D canvas */}
        <div className="w-full h-full flex-1 relative min-w-0 min-h-0">
          <Canvas className="w-full h-full" camera={{ position: [6, 6, 6], fov: 45 }} shadows>
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
            <Grid args={[20, 20]} cellSize={1} cellColor="#1e293b" sectionColor="#334155" fadeDistance={30} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
              <planeGeometry args={[20, 20]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
            <DragDropController onDrop={handleDrop} />
            {components.map((comp) => {
              const power = simResults?.componentPowers?.[comp.id] ?? 0;
              const isSelected = selectedId === comp.id;
              return (
                <group
                  key={comp.id}
                  ref={(el) => { if (el) groupRefs.current[comp.id] = el; }}
                  position={[comp.position.x, 0, comp.position.y]}
                  rotation={[0, (comp.rotation || 0) * Math.PI / 180, 0]}
                  onClick={(e) => { e.stopPropagation(); setSelectedComponent(comp.id); }}
                >
                  <ComponentGeometry comp={comp} power={power} />
                  {/* terminals */}
                  {offsetsFor(comp).map((off, idx) => {
                    const tid = terminalId(comp, idx);
                    const isPending = pendingTerminal === tid;
                    return (
                      <mesh
                        key={tid}
                        position={off}
                        onClick={(e) => { e.stopPropagation(); handleTerminalClick(comp.id, tid); }}
                      >
                        <sphereGeometry args={[0.09, 12, 12]} />
                        <meshStandardMaterial color={isPending ? '#fbbf24' : isSelected ? '#38bdf8' : '#f8fafc'} emissive={isPending ? '#fbbf24' : '#000000'} />
                      </mesh>
                    );
                  })}
                  <Html position={[0, 0.6, 0]} center>
                    <div className="text-[10px] text-white bg-black/50 px-1 rounded pointer-events-none">{comp.label}</div>
                  </Html>
                </group>
              );
            })}
            {wires.map((wire) => (
              <WireLine key={wire.id} wire={wire} components={components} />
            ))}
            {isSimulating && wires.map((wire) => (
              <WireParticles key={`p-${wire.id}`} wire={wire} components={components} speed={speed} simulating={isSimulating} />
            ))}
            {selectedId && groupRefs.current[selectedId] && (
              <TransformControls
                object={groupRefs.current[selectedId]!}
                mode="translate"
                translationSnap={0.5}
                onMouseUp={() => {
                  const g = groupRefs.current[selectedId!];
                  if (!g || !selectedId) return;
                  updateComponent(selectedId, { position: { x: g.position.x, y: g.position.z }, rotation: Math.round((g.rotation.y * 180) / Math.PI) });
                }}
              />
            )}
            <OrbitControls makeDefault />
          </Canvas>
          {pendingTerminal && (
            <div className="absolute top-2 left-2 bg-yellow-500/20 text-yellow-200 text-xs px-2 py-1 rounded border border-yellow-500/40">
              Connecting from {pendingTerminal} — click another terminal
            </div>
          )}
        </div>

        {/* Right: properties + results */}
        <aside className="w-72 flex-shrink-0 bg-[#1e293b] border-l border-[#334155] p-3 overflow-y-auto">
          <h3 className="text-xs font-semibold text-[#94a3b8] uppercase mb-2">Selected Component</h3>
          {selectedComp ? (
            <div className="space-y-2 mb-4">
              <div className="text-sm text-white font-bold">{selectedComp.label}</div>
              <div className="text-xs text-[#94a3b8]">Type: {selectedComp.type} | Terminals: {offsetsFor(selectedComp).length}</div>
              {Object.entries(selectedComp.properties).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-[#94a3b8]">{key}</span>
                  {typeof value === 'boolean' ? (
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => updateComponent(selectedComp.id, { properties: { ...selectedComp.properties, [key]: e.target.checked } })}
                    />
                  ) : (
                    <input
                      type="number"
                      value={value as number}
                      onChange={(e) => {
                        const num = parseFloat(e.target.value);
                        updateComponent(selectedComp.id, { properties: { ...selectedComp.properties, [key]: isNaN(num) ? value : num } });
                      }}
                      className="w-24 px-2 py-1 rounded bg-[#0f172a] border border-[#475569] text-xs text-white"
                    />
                  )}
                </div>
              ))}
              <button onClick={() => removeComponent(selectedComp.id)} className="text-xs text-red-400 hover:text-red-300">Delete component</button>
            </div>
          ) : (
            <div className="text-xs text-[#94a3b8] mb-4">Click a component to edit properties.</div>
          )}

          <h3 className="text-xs font-semibold text-[#94a3b8] uppercase mb-2">Simulation Results</h3>
          {simResults ? (
            <div className="space-y-2 text-xs">
              <div className={`px-2 py-1 rounded ${simResults.valid ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                {simResults.valid ? 'Valid Circuit' : 'Invalid Circuit'}
              </div>
              {!simResults.valid && (
                <ul className="text-red-200 list-disc list-inside">
                  {simResults.errors.map((e: string, i: number) => <li key={i}>{e}</li>)}
                </ul>
              )}
              {simResults.valid && (
                <>
                  <div className="bg-[#0f172a] p-2 rounded">
                    <div className="text-[#94a3b8]">Total Resistance</div>
                    <div className="text-[#38bdf8] font-bold">{simResults.totalResistance.toFixed(2)} Ω</div>
                  </div>
                  <div className="bg-[#0f172a] p-2 rounded">
                    <div className="text-[#94a3b8]">Total Current</div>
                    <div className="text-[#38bdf8] font-bold">{simResults.totalCurrent.toFixed(4)} A</div>
                  </div>
                  <div className="bg-[#0f172a] p-2 rounded">
                    <div className="text-[#94a3b8]">Total Voltage</div>
                    <div className="text-[#38bdf8] font-bold">{(simResults.totalCurrent * simResults.totalResistance).toFixed(3)} V</div>
                  </div>
                  <div className="mt-2">
                    <div className="text-[#94a3b8] font-bold mb-1">Component values</div>
                    {components.map((c) => (
                      <div key={c.id} className="flex justify-between">
                        <span className="text-[#94a3b8] truncate">{c.label}</span>
                        <span className="text-white">{(simResults.componentVoltages?.[c.id] ?? 0).toFixed(3)}V {(simResults.componentPowers?.[c.id] ?? 0).toFixed(3)}W</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-xs text-[#94a3b8]">Run simulation to see results.</div>
          )}

          <div className="mt-4">
            <h3 className="text-xs font-semibold text-[#94a3b8] uppercase mb-2">Wires</h3>
            <div className="text-xs text-[#94a3b8]">{wires.length} connections</div>
            <button onClick={() => { if (wires.length) removeWire(wires[wires.length-1].id); }} className="text-xs text-red-400 hover:text-red-300 mt-1">Remove last wire</button>
          </div>
        </aside>
      </div>
      {showAI && <AICircuitBuilder onClose={() => setShowAI(false)} />}
    </div>
  );
}
