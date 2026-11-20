import { useRef, useState, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, TransformControls, Grid, Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useCircuitStore } from '../stores/circuitStore';
import { AICircuitBuilder } from '../components/AICircuitBuilder';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { solveCircuit } from '../simulation/engine';
import { LAB_EXPERIMENTS } from '../experiments/lab3dExperiments';
import { virtualScanner, nfcRecordToComponent } from '../nfc/scanner';
import type { Component, Wire } from '../types/circuit';
import { Play, Pause, RotateCcw, Search, Sparkles, Check, X, Trash2, Radio, Info } from 'lucide-react';

const COMPONENT_LIBRARY: { type: string; label: string; defaults: Record<string, any>; category: string }[] = [
  { type: 'resistor', label: 'Resistor 100Ω', defaults: { resistance: 100 }, category: 'Passives' },
  { type: 'resistor', label: 'Resistor 220Ω', defaults: { resistance: 220 }, category: 'Passives' },
  { type: 'resistor', label: 'Resistor 330Ω', defaults: { resistance: 330 }, category: 'Passives' },
  { type: 'resistor', label: 'Resistor 470Ω', defaults: { resistance: 470 }, category: 'Passives' },
  { type: 'resistor', label: 'Resistor 1kΩ', defaults: { resistance: 1000 }, category: 'Passives' },
  { type: 'capacitor', label: 'Capacitor 100µF', defaults: { capacitance: 0.0001 }, category: 'Passives' },
  { type: 'inductor', label: 'Inductor 10mH', defaults: { inductance: 0.01 }, category: 'Passives' },
  { type: 'led', label: 'LED (Red)', defaults: { resistance: 20 }, category: 'Semiconductors' },
  { type: 'bulb', label: 'Incandescent Bulb', defaults: { resistance: 47 }, category: 'Loads' },
  { type: 'switch', label: 'Toggle Switch', defaults: { closed: false }, category: 'Controls' },
  { type: 'voltageSource', label: 'DC Supply 5V', defaults: { voltage: 5 }, category: 'Sources' },
  { type: 'ground', label: 'Earth Ground', defaults: {}, category: 'Sources' },
  { type: 'breadboard', label: 'Breadboard Surface', defaults: {}, category: 'Mounts' },
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

function ComponentGeometry({ comp, power }: { comp: Component; power: number }) {
  const emissiveIntensity = comp.type === 'led' || comp.type === 'bulb' ? Math.min(3, power * 0.5) : 0;
  const color =
    comp.type === 'resistor' ? '#cbd5e1' :
    comp.type === 'capacitor' ? '#22d3ee' :
    comp.type === 'inductor' ? '#38bdf8' :
    comp.type === 'led' ? '#f87171' :
    comp.type === 'bulb' ? '#fbbf24' :
    comp.type === 'switch' ? '#94a3b8' :
    comp.type === 'voltageSource' ? '#38bdf8' :
    comp.type === 'ground' ? '#64748b' :
    comp.type === 'breadboard' ? '#334155' :
    '#64748b';

  switch (comp.type) {
    case 'resistor':
      return (
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.12, 0.12, 1.2, 16]} />
          <meshStandardMaterial color={color} roughness={0.4} />
        </mesh>
      );
    case 'capacitor':
      return (
        <group>
          <mesh position={[-0.15, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.15, 16]} />
            <meshStandardMaterial color={color} roughness={0.3} metalness={0.2} />
          </mesh>
          <mesh position={[0.15, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.15, 16]} />
            <meshStandardMaterial color={color} roughness={0.3} metalness={0.2} />
          </mesh>
        </group>
      );
    case 'inductor':
      return (
        <mesh>
          <torusGeometry args={[0.35, 0.08, 8, 24]} />
          <meshStandardMaterial color={color} roughness={0.3} metalness={0.5} />
        </mesh>
      );
    case 'led':
    case 'bulb':
      return (
        <group>
          <mesh position={[0, 0.25, 0]}>
            <sphereGeometry args={[0.22, 16, 16]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissiveIntensity} roughness={0.2} />
          </mesh>
          <mesh position={[0, -0.15, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.3, 8]} />
            <meshStandardMaterial color="#85858b" metalness={0.6} />
          </mesh>
        </group>
      );
    case 'switch':
      return (
        <group>
          <mesh>
            <boxGeometry args={[0.3, 0.15, 0.3]} />
            <meshStandardMaterial color={color} roughness={0.5} />
          </mesh>
          <mesh position={[0.2, 0.2, 0]} rotation={[0, 0, comp.properties.closed ? 0 : Math.PI / 6]}>
            <boxGeometry args={[0.6, 0.05, 0.05]} />
            <meshStandardMaterial color="#ededed" metalness={0.8} />
          </mesh>
        </group>
      );
    case 'voltageSource':
      return (
        <mesh>
          <cylinderGeometry args={[0.35, 0.35, 0.6, 24]} />
          <meshStandardMaterial color={color} metalness={0.4} roughness={0.3} />
        </mesh>
      );
    case 'ground':
      return (
        <group>
          <mesh position={[0, -0.1, 0]}>
            <boxGeometry args={[0.6, 0.05, 0.6]} />
            <meshStandardMaterial color={color} metalness={0.5} />
          </mesh>
          <mesh position={[0, 0.1, 0]}>
            <boxGeometry args={[0.3, 0.05, 0.3]} />
            <meshStandardMaterial color={color} metalness={0.5} />
          </mesh>
        </group>
      );
    case 'breadboard':
      return (
        <mesh>
          <boxGeometry args={[2.4, 0.12, 1.2]} />
          <meshStandardMaterial color="#232325" roughness={0.7} />
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
      <sphereGeometry args={[0.05, 8, 8]} />
      <meshBasicMaterial color="#38bdf8" />
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
      setNfcHistory((h) => [{ uid: nfcUid, success: false, label: 'Unknown Tag', timestamp: Date.now() }, ...h]);
    }
  }, [nfcUid, addComponent]);

  const selectedComp = selectedId ? components.find((c) => c.id === selectedId) : null;

  const filteredLib = COMPONENT_LIBRARY.filter((l) =>
    l.label.toLowerCase().includes(search.toLowerCase()) || l.type.toLowerCase().includes(search.toLowerCase())
  );

  const speed = simResults?.valid ? Math.min(3, 0.5 + (simResults.totalCurrent || 0) * 2) : 0.5;

  useEffect(() => {
    if (selectedId) {
      selectedGroupRef.current = groupRefs.current[selectedId] ?? null;
    } else {
      selectedGroupRef.current = null;
    }
  }, [selectedId, components.length]);

  return (
    <div className="w-full h-full flex-1 flex flex-col relative min-w-0 overflow-hidden bg-[#141415] text-[#ededed]">
      {/* Workbench Toolbar */}
      <div className="h-11 border-b border-white/[0.08] bg-[#0f0f10] flex items-center justify-between px-4 shrink-0 select-none">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-[#ededed]">3D Virtual Workbench</span>
          <span className="text-[11px] font-mono text-[#85858b] bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">
            {components.length} parts · {wires.length} wires
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAI(true)}
            className="btn-secondary text-xs flex items-center gap-1.5 h-7 px-2.5"
          >
            <Sparkles size={13} className="text-[#38bdf8]" />
            <span>AI Assistant</span>
          </button>

          {isSimulating ? (
            <button
              onClick={() => { setIsSimulating(false); setSimulation(false); }}
              className="btn-secondary text-xs flex items-center gap-1.5 h-7 px-2.5"
            >
              <Pause size={13} />
              <span>Pause</span>
            </button>
          ) : (
            <button
              onClick={runSimulation}
              className="btn-signal text-xs flex items-center gap-1.5 h-7 px-3"
            >
              <Play size={13} fill="currentColor" />
              <span>Run Solver</span>
            </button>
          )}

          <div className="h-4 w-px bg-white/[0.08] mx-1" />

          <button
            onClick={handleResetBoard}
            className="btn-ghost text-xs text-[#85858b] hover:text-[#e5484d] flex items-center gap-1 h-7 px-2"
            title="Reset Board"
          >
            <RotateCcw size={13} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Dock: Parts & Presets */}
        <aside className="w-[280px] bg-[#0f0f10] border-r border-white/[0.08] flex flex-col shrink-0 overflow-hidden select-none">
          <div className="p-3 border-b border-white/[0.08]">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-2.5 text-[#85858b]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search components..."
                className="w-full h-8 pl-8 pr-2.5 rounded bg-[#141415] border border-white/[0.08] text-xs text-[#ededed] placeholder-[#85858b] focus:border-white/[0.2] outline-none transition-colors"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-5">
            {/* Component Palette */}
            <section>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[11px] font-medium text-[#85858b]">Component Palette</h3>
                <span className="text-[10px] text-[#85858b] font-mono">drag & drop</span>
              </div>
              <div className="space-y-1">
                {filteredLib.map((item, idx) => (
                  <div
                    key={idx}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('componentType', item.type)}
                    onClick={() => handleAddComponent(item.type, item.defaults)}
                    className="flex items-center justify-between h-8 px-2.5 rounded bg-[#141415] border border-white/[0.06] hover:bg-[#19191b] hover:border-white/[0.12] active:scale-[0.99] transition-all cursor-grab"
                  >
                    <span className="text-xs text-[#ededed]">{item.label}</span>
                    <span className="text-[10px] font-mono text-[#85858b]">{item.category}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Guided Experiments */}
            <section>
              <h3 className="text-[11px] font-medium text-[#85858b] mb-2">Preset Circuits</h3>
              <div className="space-y-1">
                {LAB_EXPERIMENTS.slice(0, 5).map((exp) => (
                  <button
                    key={exp.id}
                    onClick={() => handleLoadExperiment(exp)}
                    className="w-full text-left px-2.5 py-1.5 rounded bg-[#141415] border border-white/[0.06] hover:bg-[#19191b] hover:border-white/[0.12] transition-colors"
                  >
                    <div className="text-xs text-[#ededed] font-medium leading-tight">{exp.title}</div>
                    <div className="text-[10px] text-[#85858b] truncate mt-0.5">{exp.objective}</div>
                  </button>
                ))}
              </div>
            </section>

            {/* Simulated NFC Interface */}
            <section>
              <div className="flex items-center gap-1.5 mb-2">
                <Radio size={13} className="text-[#85858b]" />
                <h3 className="text-[11px] font-medium text-[#85858b]">NFC Hardware Link</h3>
              </div>
              <div className="space-y-2 bg-[#141415] p-2.5 rounded border border-white/[0.06]">
                <select
                  value={nfcUid}
                  onChange={(e) => setNfcUid(e.target.value)}
                  className="w-full h-7 px-2 rounded bg-[#0f0f10] border border-white/[0.08] text-xs font-mono text-[#ededed] outline-none"
                >
                  {Object.keys((virtualScanner as any).getDatabase()).map((uid) => (
                    <option key={uid} value={uid}>{uid}</option>
                  ))}
                </select>

                <button
                  onClick={handleNFCScan}
                  className="w-full btn-secondary text-xs h-7 flex items-center justify-center gap-1.5"
                >
                  <span>Read Tag to Board</span>
                </button>

                {nfcHistory.length > 0 && (
                  <div className="pt-2 border-t border-white/[0.06] space-y-1 max-h-20 overflow-y-auto">
                    {nfcHistory.map((h: any, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[11px] font-mono text-[#85858b]">
                        {h.success ? (
                          <Check size={11} className="text-[#4cc38a] shrink-0" />
                        ) : (
                          <X size={11} className="text-[#e5484d] shrink-0" />
                        )}
                        <span className="truncate">{h.label || h.uid}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        </aside>

        {/* Center: 3D Interactive Workbench */}
        <div className="flex-1 relative min-w-0 min-h-0 bg-[#0f0f10]">
          <ErrorBoundary>
            <Canvas className="w-full h-full" camera={{ position: [6, 6, 6], fov: 45 }} shadows>
              <ambientLight intensity={0.5} />
              <directionalLight position={[6, 12, 6]} intensity={1.2} castShadow />
              <Grid args={[20, 20]} cellSize={1} cellColor="#19191b" sectionColor="#232325" fadeDistance={30} />
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                <planeGeometry args={[20, 20]} />
                <meshStandardMaterial color="#0f0f10" roughness={0.9} />
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
                    {offsetsFor(comp).map((off, idx) => {
                      const tid = terminalId(comp, idx);
                      const isPending = pendingTerminal === tid;
                      return (
                        <mesh
                          key={tid}
                          position={off}
                          onClick={(e) => { e.stopPropagation(); handleTerminalClick(comp.id, tid); }}
                        >
                          <sphereGeometry args={[0.08, 12, 12]} />
                          <meshStandardMaterial
                            color={isPending ? '#f59e0b' : isSelected ? '#38bdf8' : '#85858b'}
                            emissive={isPending ? '#f59e0b' : isSelected ? '#38bdf8' : '#000000'}
                            emissiveIntensity={isPending ? 0.6 : 0.2}
                          />
                        </mesh>
                      );
                    })}
                    <Html position={[0, 0.55, 0]} center>
                      <div className="font-mono text-[10px] text-[#ededed] bg-[#0f0f10]/80 backdrop-blur-sm px-1.5 py-0.5 rounded border border-white/[0.08] pointer-events-none select-none">
                        {comp.label}
                      </div>
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
                    updateComponent(selectedId, {
                      position: { x: g.position.x, y: g.position.z },
                      rotation: Math.round((g.rotation.y * 180) / Math.PI)
                    });
                  }}
                />
              )}
              <OrbitControls makeDefault />
            </Canvas>
          </ErrorBoundary>

          {/* Pending Wire Indicator */}
          {pendingTerminal && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#19191b]/90 backdrop-blur-md border border-white/[0.12] shadow-lg text-xs font-mono text-[#ededed] select-none">
              <span className="w-2 h-2 rounded-full bg-[#f59e0b] animate-pulse" />
              <span>Lead active from {pendingTerminal} — select destination pin</span>
              <button
                onClick={() => setPendingTerminal(null)}
                className="ml-1 text-[#85858b] hover:text-[#ededed]"
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Right Dock: Inspector & Telemetry */}
        <aside className="w-[280px] bg-[#0f0f10] border-l border-white/[0.08] flex flex-col shrink-0 overflow-y-auto select-none">
          {/* Selected Component Section */}
          <div className="p-3 border-b border-white/[0.08]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[11px] font-medium text-[#85858b]">Component Inspector</h3>
              {selectedComp && (
                <button
                  onClick={() => removeComponent(selectedComp.id)}
                  className="text-[#85858b] hover:text-[#e5484d] transition-colors p-1"
                  title="Remove Component"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>

            {selectedComp ? (
              <div className="space-y-2.5">
                <div className="bg-[#141415] p-2.5 rounded border border-white/[0.06]">
                  <div className="text-xs font-medium text-[#ededed]">{selectedComp.label}</div>
                  <div className="text-[10px] font-mono text-[#85858b] mt-0.5">
                    Type: {selectedComp.type} · Terminals: {offsetsFor(selectedComp).length}
                  </div>
                </div>

                <div className="space-y-2">
                  {Object.entries(selectedComp.properties).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between gap-2">
                      <span className="text-xs text-[#a1a1a6] capitalize">{key}</span>
                      {typeof value === 'boolean' ? (
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => updateComponent(selectedComp.id, {
                            properties: { ...selectedComp.properties, [key]: e.target.checked }
                          })}
                          className="rounded border border-white/[0.1] bg-[#141415] text-[#38bdf8] focus:ring-0"
                        />
                      ) : (
                        <input
                          type="number"
                          value={value as number}
                          onChange={(e) => {
                            const num = parseFloat(e.target.value);
                            updateComponent(selectedComp.id, {
                              properties: { ...selectedComp.properties, [key]: isNaN(num) ? value : num }
                            });
                          }}
                          className="w-24 h-7 px-2 rounded bg-[#141415] border border-white/[0.08] text-xs font-mono text-[#ededed] text-right outline-none focus:border-white/[0.2]"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2.5 rounded bg-[#141415] border border-white/[0.04] text-xs text-[#85858b]">
                <Info size={13} className="shrink-0" />
                <span>Select a part to adjust parameters</span>
              </div>
            )}
          </div>

          {/* Telemetry Readout Section */}
          <div className="p-3 border-b border-white/[0.08]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[11px] font-medium text-[#85858b]">Telemetry Solver</h3>
              {simResults && (
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  simResults.valid ? 'text-[#4cc38a] bg-[#4cc38a]/10' : 'text-[#e5484d] bg-[#e5484d]/10'
                }`}>
                  {simResults.valid ? 'Solved' : 'Open / Error'}
                </span>
              )}
            </div>

            {simResults?.valid ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-1.5 font-mono">
                  <div className="bg-[#141415] p-2 rounded border border-white/[0.06]">
                    <div className="text-[10px] text-[#85858b]">Voltage Drop</div>
                    <div className="text-sm font-semibold text-[#ededed] tabular-nums mt-0.5">
                      {(simResults.totalCurrent * simResults.totalResistance).toFixed(2)} V
                    </div>
                  </div>
                  <div className="bg-[#141415] p-2 rounded border border-white/[0.06]">
                    <div className="text-[10px] text-[#85858b]">Loop Current</div>
                    <div className="text-sm font-semibold text-[#38bdf8] tabular-nums mt-0.5">
                      {(simResults.totalCurrent * 1000).toFixed(1)} mA
                    </div>
                  </div>
                </div>

                <div className="bg-[#141415] p-2 rounded border border-white/[0.06] font-mono">
                  <div className="text-[10px] text-[#85858b]">Equivalent Resistance</div>
                  <div className="text-sm font-semibold text-[#ededed] tabular-nums mt-0.5">
                    {simResults.totalResistance.toFixed(1)} Ω
                  </div>
                </div>

                {components.length > 0 && (
                  <div className="pt-2 border-t border-white/[0.06] space-y-1">
                    <div className="text-[10px] text-[#85858b] font-medium mb-1">Per-component Load</div>
                    {components.map((c) => (
                      <div key={c.id} className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-[#85858b] truncate max-w-[120px]">{c.label}</span>
                        <span className="text-[#ededed] tabular-nums">
                          {(simResults.componentVoltages?.[c.id] ?? 0).toFixed(2)}V
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : simResults && !simResults.valid ? (
              <div className="p-2.5 rounded bg-[#e5484d]/10 border border-[#e5484d]/20 text-xs text-[#e5484d]">
                <div className="font-medium mb-1">Circuit Incomplete</div>
                <div className="text-[11px] text-[#e5484d]/80">
                  Ensure closed loop from source through load to ground.
                </div>
              </div>
            ) : (
              <div className="p-2.5 rounded bg-[#141415] border border-white/[0.04] text-xs text-[#85858b]">
                Click <span className="text-[#ededed]">Run Solver</span> to calculate node voltages and currents.
              </div>
            )}
          </div>

          {/* Connections / Leads List */}
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[11px] font-medium text-[#85858b]">Circuit Leads</h3>
              <span className="text-[10px] font-mono text-[#85858b]">{wires.length} wired</span>
            </div>

            {wires.length > 0 ? (
              <div className="space-y-1">
                <button
                  onClick={() => removeWire(wires[wires.length - 1].id)}
                  className="w-full btn-ghost text-xs text-[#85858b] hover:text-[#e5484d] h-7 justify-start px-2 border border-white/[0.06]"
                >
                  <Trash2 size={12} />
                  <span>Undo Last Lead ({wires[wires.length - 1].id.slice(-4)})</span>
                </button>
              </div>
            ) : (
              <div className="text-[11px] text-[#85858b]">No active wires connected.</div>
            )}
          </div>
        </aside>
      </div>

      {showAI && <AICircuitBuilder onClose={() => setShowAI(false)} />}
    </div>
  );
}
