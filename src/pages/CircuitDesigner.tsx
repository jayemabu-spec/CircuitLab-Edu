import React, { useState, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
} from 'reactflow';
import type { Connection } from 'reactflow';
import 'reactflow/dist/style.css';
import { useCircuitStore } from '../stores/circuitStore';
import { Trash2, RotateCcw, Play, Pause, StopCircle, Settings } from 'lucide-react';
import { solveCircuit } from '../simulation/engine';
import type { Component, Wire } from '../types/circuit';
import { saveCircuits, loadCircuits } from '../utils/storage';

// ---- Component configuration ----
interface ComponentConfig {
  type: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  defaultProps: Record<string, number | string | boolean>;
}

const COMPONENT_CONFIGS: Record<string, ComponentConfig> = {
  resistor: {
    type: 'resistor',
    label: 'Resistor',
    icon: <ResistorIcon />,
    color: '#38bdf8',
    defaultProps: { resistance: 100 },
  },
  bulb: {
    type: 'bulb',
    label: 'Bulb',
    icon: <BulbIcon />,
    color: '#22d3ee',
    defaultProps: { resistance: 47 },
  },
  switch: {
    type: 'switch',
    label: 'Switch',
    icon: <SwitchIcon />,
    color: '#38bdf8',
    defaultProps: { closed: false },
  },
  capacitor: {
    type: 'capacitor',
    label: 'Capacitor',
    icon: <CapacitorIcon />,
    color: '#22d3ee',
    defaultProps: { capacitance: 0.0001 },
  },
  inductor: {
    type: 'inductor',
    label: 'Inductor',
    icon: <InductorIcon />,
    color: '#38bdf8',
    defaultProps: { inductance: 0.01 },
  },
  voltageSource: {
    type: 'voltageSource',
    label: 'DC Source',
    icon: <VoltageSourceIcon />,
    color: '#22d3ee',
    defaultProps: { voltage: 5, polarity: '+' },
  },
  ground: {
    type: 'ground',
    label: 'Ground',
    icon: <GroundIcon />,
    color: '#64748b',
    defaultProps: {},
  },
  voltmeter: {
    type: 'voltmeter',
    label: 'Voltmeter',
    icon: <VoltmeterIcon />,
    color: '#64748b',
    defaultProps: {},
  },
  ammeter: {
    type: 'ammeter',
    label: 'Ammeter',
    icon: <AmmeterIcon />,
    color: '#64748b',
    defaultProps: {},
  },
  ohmmeter: {
    type: 'ohmmeter',
    label: 'Ohmmeter',
    icon: <OhmmeterIcon />,
    color: '#64748b',
    defaultProps: {},
  },
};

// ---- Simple icons ----
function ResistorIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12h5l4 4 4-4 4 4 4-4h5" />
    </svg>
  );
}
function BulbIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 7v3M12 17v3M9 21h6" strokeLinecap="round" />
    </svg>
  );
}
function SwitchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12h5l5 5M9 12h10" strokeLinecap="round" />
    </svg>
  );
}
function CapacitorIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 4h1v16H8zM15 4h1v16h-1z" />
    </svg>
  );
}
function InductorIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12s3 4 6 0 6-4 12 0" strokeLinecap="round" />
    </svg>
  );
}
function VoltageSourceIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v8M4 12h16" />
    </svg>
  );
}
function GroundIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 4v16M4 20h16M7 23h10M9 18h6M11 14h2" strokeLinecap="round" />
    </svg>
  );
}
function VoltmeterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="7" />
      <path d="M9 12h6" strokeLinecap="round" />
    </svg>
  );
}
function AmmeterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="7" />
      <path d="M12 17V7" strokeLinecap="round" />
    </svg>
  );
}
function OhmmeterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="7" />
      <path d="M12 17V7M9 12h6" strokeLinecap="round" />
    </svg>
  );
}

// ---- Custom Node: Electrical Component ----
type ComponentNodeData = {
  type: string;
  label: string;
  config: ComponentConfig;
  properties: Record<string, number | string | boolean>;
  selected: boolean;
};

function ComponentNode({
  data,
  selected,
  onSelect,
  onUpdate,
  onDelete,
}: {
  data: ComponentNodeData;
  selected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<ComponentNodeData>) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const config = data.config;

  return (
    <div
      className={`w-24 h-14 rounded-lg border-2 ${
        selected ? 'border-[#38bdf8] shadow-[0_0_10px_rgba(56,189,248,0.4)]' : 'border-[#475569]'
      } bg-[#1e293b] flex flex-col items-center justify-center cursor-pointer transition-all hover:border-[#64748b]`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <div className="flex items-center justify-center w-full h-8 text-[10px] font-bold text-[#cbd5e1] mb-0.5 uppercase tracking-tighter">
        {data.label}
      </div>
      <div
        className="w-full h-4 flex items-center justify-center"
        style={{ color: config.color }}
      >
        {config.icon}
      </div>
      {selected && (
        <div className="absolute -top-2 -right-2 flex gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setEditing(true); }}
            className="w-6 h-6 rounded bg-[#0f172a] border border-[#475569] text-[#cbd5e1] hover:text-white flex items-center justify-center text-xs"
            title="Edit properties"
          >
            <Settings size={10} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="w-6 h-6 rounded bg-red-900/50 border border-red-500 text-red-400 hover:bg-red-500 flex items-center justify-center text-xs"
            title="Delete"
          >
            <Trash2 size={10} />
          </button>
        </div>
      )}
      {editing && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-32 bg-[#1e293b] border border-[#475569] rounded p-2 z-10 shadow-lg">
          {Object.entries(data.properties).map(([key, value]) => (
            <div key={key} className="flex justify-between items-center mb-1">
              <span className="text-[10px] text-[#94a3b8]">{key}</span>
              <input
                type="number"
                value={typeof value === 'number' ? value : ''}
                className="w-12 h-5 bg-[#0f172a] border border-[#475569] rounded text-[10px] text-white px-1"
                onChange={(e) => {
                  const num = parseFloat(e.target.value);
                  onUpdate({
                    properties: { ...data.properties, [key]: isNaN(num) ? value : num },
                  });
                }}
              />
            </div>
          ))}
          <button
            onClick={() => setEditing(false)}
            className="w-full mt-2 text-[10px] text-[#38bdf8] hover:text-[#38bdf8]/90"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}

// ---- Custom Edge: Wire ----
function WireEdge({ id, sourceX, sourceY, targetX, targetY, style, className }: any) {
  return (
    <path
      id={id}
      className={className}
      style={{
        stroke: '#38bdf8',
        strokeWidth: 2,
        fill: 'none',
        strokeDasharray: '4,2',
        ...style,
      }}
      d={`M${sourceX} ${sourceY} Q${(sourceX + targetX) / 2} ${(sourceY + targetY) / 2} ${targetX} ${targetY}`}
    />
  );
}

export function CircuitDesigner() {
  const [nodeId, setNodeId] = useState(0);
  const [edgeId, setEdgeId] = useState(0);
  const [simulating] = useState(false);
  const [simResults, setSimResults] = useState<any>(null);

  const circuit = useCircuitStore((s) => s.circuit);
  const setCircuit = useCircuitStore((s) => s.setCircuit);
  const addComponent = useCircuitStore((s) => s.addComponent);
  const removeComponent = useCircuitStore((s) => s.removeComponent);
  const removeWire = useCircuitStore((s) => s.removeWire);
  const setSimulationResults = useCircuitStore((s) => s.setSimulationResults);
  const setSimulation = useCircuitStore((s) => s.setSimulation);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Sync store with React Flow state
  React.useEffect(() => {
    if (circuit && circuit.components.length > 0) {
      const rfNodes = circuit.components.map((comp) => ({
        id: comp.id,
        type: 'component',
        position: comp.position,
        data: {
          type: comp.type,
          label: comp.label,
          config: COMPONENT_CONFIGS[comp.type] ?? COMPONENT_CONFIGS.resistor,
          properties: comp.properties,
          selected: false,
        },
      }));
      const rfEdges = circuit.wires.map((wire) => ({
        id: wire.id,
        source: wire.sourceTerminalId.split('-')[0],
        target: wire.targetTerminalId.split('-')[0],
        animated: true,
      }));
      setNodes(rfNodes);
      setEdges(rfEdges);
    }
  }, [circuit, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      const nextEdgeId = edgeId + 1;
      setEdgeId(nextEdgeId);
      setEdges((eds) => addEdge({ ...params, animated: true, id: `e-${nextEdgeId}` }, eds));
    },
    [edgeId, setEdgeId, setEdges]
  );

  const onAddComponent = useCallback((type: string) => {
    const config = COMPONENT_CONFIGS[type];
    const nextNodeId = nodeId + 1;
    const id = `comp-${nextNodeId}`;
    const newNode = {
      id,
      type: 'component',
      position: { x: 200 + (nextNodeId % 5) * 120, y: 150 + Math.floor(nextNodeId / 5) * 100 },
      data: {
        type,
        label: config.label,
        config,
        properties: { ...config.defaultProps },
        selected: false,
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setNodeId(nextNodeId);

    // Also add to store
    const comp: Component = {
      id,
      type: type as any,
      label: config.label,
      position: newNode.position,
      rotation: 0,
      properties: { ...config.defaultProps },
      terminals: [
        { id: `${id}-a`, componentId: id, position: 'left', nodeId: null },
        { id: `${id}-b`, componentId: id, position: 'right', nodeId: null },
      ],
    };
    addComponent(comp);
  }, [nodeId, setNodeId, setNodes, addComponent]);

  const onDeleteNodes = useCallback((nodeIdsToDelete: string[]) => {
    setNodes((nds) => nds.filter((n) => !nodeIdsToDelete.includes(n.id)));
    setEdges((eds) =>
      eds.filter((e) => !nodeIdsToDelete.includes(e.source) && !nodeIdsToDelete.includes(e.target))
    );
    nodeIdsToDelete.forEach((id) => removeComponent(id));
  }, [setNodes, setEdges, removeComponent]);

  const onDeleteEdges = useCallback((edgeIdsToDelete: string[]) => {
    setEdges((eds) => eds.filter((e) => !edgeIdsToDelete.includes(e.id)));
    edgeIdsToDelete.forEach((id) => removeWire(id));
  }, [setEdges, removeWire]);

  const runSimulation = useCallback(() => {
    const comps: Component[] = nodes.map((n) => {
      const d = n.data as ComponentNodeData;
      const isGround = d.type === 'ground';
      return {
        id: n.id,
        type: d.type as any,
        label: d.label,
        position: n.position,
        rotation: 0,
        properties: d.properties,
        terminals: isGround
          ? [{ id: `${n.id}-a`, componentId: n.id, position: 'bottom', nodeId: null }]
          : [
              { id: `${n.id}-a`, componentId: n.id, position: 'left', nodeId: null },
              { id: `${n.id}-b`, componentId: n.id, position: 'right', nodeId: null },
            ],
      };
    });
    const wires: Wire[] = edges.map((e) => {
      const targetNode = nodes.find((n) => n.id === e.target);
      const targetIsGround = targetNode?.data?.type === 'ground';
      return {
        id: e.id,
        sourceTerminalId: `${e.source}-a`,
        targetTerminalId: `${e.target}-${targetIsGround ? 'a' : 'b'}`,
        sourceNodeId: '',
        targetNodeId: '',
      };
    });
    const result = solveCircuit(comps, wires);
    setSimResults(result);
    setSimulationResults(result);
    setSimulation(true);
  }, [nodes, edges, setSimResults, setSimulationResults, setSimulation]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="h-12 border-b border-[#334155] bg-[#1e293b] flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-white">Circuit Designer</h2>
          <div className="h-6 w-px bg-[#475569] mx-2" />
          <button
            onClick={runSimulation}
            disabled={simulating}
            className="btn-primary flex items-center gap-2"
          >
            {simulating ? (
              <>
                <Pause size={16} /> Simulating
              </>
            ) : (
              <>
                <Play size={16} /> Simulate
              </>
            )}
          </button>
          <button
            onClick={() => setSimResults(null)}
            className="btn-secondary"
          >
            <StopCircle size={16} /> Clear Results
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const circuits = loadCircuits();
              if (circuits.length === 0) {
                alert('No saved circuits found.');
                return;
              }
              const latest = circuits[circuits.length - 1];
              setCircuit(latest);
              alert(`Loaded circuit "${latest.name}".`);
            }}
            className="text-[#94a3b8] hover:text-white text-sm"
            title="Load"
          >
            <LoadIcon size={16} />
          </button>
          <button
            onClick={() => {
              const comps: Component[] = nodes.map((n) => {
                const d = n.data as ComponentNodeData;
                const isGround = d.type === 'ground';
                return {
                  id: n.id,
                  type: d.type as any,
                  label: d.label,
                  position: n.position,
                  rotation: 0,
                  properties: d.properties,
                  nfcUid: (d.properties as any).nfcUid,
                  terminals: isGround
                    ? [{ id: `${n.id}-a`, componentId: n.id, position: 'bottom', nodeId: null }]
                    : [
                        { id: `${n.id}-a`, componentId: n.id, position: 'left', nodeId: null },
                        { id: `${n.id}-b`, componentId: n.id, position: 'right', nodeId: null },
                      ],
                };
              });
              saveCircuits([
                {
                  id: circuit?.id ?? `circuit-${Date.now()}`,
                  name: circuit?.name ?? 'Untitled',
                  components: comps,
                  wires: edges,
                  createdAt: circuit?.createdAt ?? Date.now(),
                  updatedAt: Date.now(),
                },
              ]);
              alert('Circuit saved to localStorage.');
            }}
            className="text-[#94a3b8] hover:text-white text-sm"
            title="Save"
          >
            <SaveIcon size={16} />
          </button>
          <button
            onClick={() => {
              setNodes([]);
              setEdges([]);
              setSimResults(null);
              setSimulation(false);
            }}
            className="text-red-400 hover:text-red-300 text-sm"
            title="Reset workspace"
          >
            <RotateCcw size={16} /> Reset
          </button>
        </div>
      </div>

      {/* Component palette */}
      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 bg-[#1e293b] border-r border-[#334155] p-4 overflow-y-auto">
          <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider text-[#94a3b8]">
            Components
          </h3>
          <div className="space-y-2">
            {Object.entries(COMPONENT_CONFIGS).map(([key, config]) => (
              <button
                key={key}
                onClick={() => onAddComponent(key)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-[#0f172a] border border-[#475569] text-left text-sm text-white hover:bg-[#334155] hover:border-[#64748b] transition-colors"
              >
                <div className={`w-6 h-6 rounded flex items-center justify-center ${config.color}`}>
                  {config.icon}
                </div>
                <span>{config.label}</span>
              </button>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-[#334155]">
            <h3 className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-2">Tips</h3>
            <ul className="text-xs text-[#94a3b8] space-y-1">
              <li>• Drag components onto canvas</li>
              <li>• Click a terminal to start a wire</li>
              <li>• Click another terminal to connect</li>
              <li>• Select a component to edit values</li>
              <li>• Ground is required for simulation</li>
            </ul>
          </div>
        </aside>

        {/* Canvas */}
        <div className="flex-1 relative min-h-[500px]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodesDelete={(ns) => onDeleteNodes(ns.map((n) => n.id))}
            onEdgesDelete={(es) => onDeleteEdges(es.map((e) => e.id))}
            nodeTypes={{ component: ComponentNode as any }}
            edgeTypes={{ wire: WireEdge as any }}
            defaultEdgeOptions={{ type: 'wire' }}
            fitView
            panOnScroll
            onInit={() => {}}
          >
            <Controls />
            <MiniMap />
            <Background
              gap={16}
              size={1}
              color="#1e293b"
            />
          </ReactFlow>
        </div>
      </div>

      {/* Simulation results panel */}
      {simResults && (
        <div className="h-64 bg-[#1e293b] border-t border-[#334155] p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-white">Simulation Results</h3>
            <span className={`text-xs font-medium px-2 py-1 rounded ${
              simResults.valid ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'
            }`}>
              {simResults.valid ? 'Valid Circuit' : 'Invalid Circuit'}
            </span>
          </div>
          {!simResults.valid && (
            <div className="bg-red-500/10 border border-red-500/30 rounded p-3 mb-3">
              <h4 className="text-sm font-bold text-red-400 mb-1">Errors:</h4>
              <ul className="text-xs text-red-200 list-disc list-inside space-y-1">
                {simResults.errors.map((e: string, i: number) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}
          {simResults.valid && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="bg-[#0f172a] p-3 rounded border border-[#334155]">
                  <div className="text-[#94a3b8] text-[10px] uppercase">Total Resistance</div>
                  <div className="text-xl font-bold text-[#38bdf8]">
                    {simResults.totalResistance.toFixed(2)} Ω
                  </div>
                </div>
                <div className="bg-[#0f172a] p-3 rounded border border-[#334155]">
                  <div className="text-[#94a3b8] text-[10px] uppercase">Total Current</div>
                  <div className="text-xl font-bold text-[#38bdf8]">
                    {simResults.totalCurrent.toFixed(4)} A
                  </div>
                </div>
                <div className="bg-[#0f172a] p-3 rounded border border-[#334155]">
                  <div className="text-[#94a3b8] text-[10px] uppercase">Power</div>
                  <div className="text-xl font-bold text-[#22d3ee]">
                    {(simResults.totalResistance * simResults.totalCurrent ** 2).toFixed(2)} W
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <h4 className="text-[10px] font-bold text-[#94a3b8] uppercase mb-1">Component Voltages</h4>
                <div className="space-y-1">
                  {Object.entries(simResults.componentVoltages).map(([cid, v]) => (
                    <div key={cid} className="flex justify-between text-[11px]">
                      <span className="text-[#94a3b8]">{cid}</span>
                      <span className="text-white">{Number(v).toFixed(3)} V</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function LoadIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 17v-2m3 2v4M3 17h3M21 7h-3M4 7h3m12 0v-2m-3 2v-4M21 17h-3M4 7v4M4 17v4M12 7v10M7 12h10" />
    </svg>
  );
}
function SaveIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}
