import React from 'react';
import { useCircuitStore } from '../stores/circuitStore';
import { solveCircuit } from '../simulation/engine';

import { Gauge } from 'lucide-react';

export function Measurements() {
  const circuit = useCircuitStore((s) => s.circuit);

  const [measurementType, setMeasurementType] = React.useState<'voltage' | 'current' | 'resistance'>('voltage');
  const [nodeA, setNodeA] = React.useState('');
  const [nodeB, setNodeB] = React.useState('');
  const [componentId, setComponentId] = React.useState('');

  const simResults = circuit
    ? solveCircuit(circuit.components, circuit.wires)
    : null;

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Measurements</h1>
          <p className="text-[#94a3b8] text-sm mt-1">
            Virtual multimeter for voltage, current, and resistance measurements.
          </p>
        </div>
      </div>

      {/* Instrument selector */}
      <div className="panel p-6">
        <div className="flex flex-col md:flex-row gap-4 items-start">
          <div className="flex items-center gap-3">
            <Gauge size={20} className="text-[#38bdf8]" />
            <h3 className="font-bold text-white">Multimeter</h3>
          </div>
          <div className="flex gap-2 ml-auto">
            {['voltage', 'current', 'resistance'].map((t) => (
              <button
                key={t}
                onClick={() => setMeasurementType(t as 'voltage' | 'current' | 'resistance')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  measurementType === t
                    ? 'bg-[#38bdf8] text-[#0f172a]'
                    : 'bg-[#0f172a] border border-[#475569] text-[#cbd5e1] hover:text-white'
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* LCD Display */}
        <div className="mt-6 flex items-center justify-center">
          <div className="w-full max-w-md bg-[#0a0a0a] border-2 border-[#333] rounded-lg p-6 shadow-[0_0_30px_rgba(0,255,0,0.1)]">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] text-green-400 font-mono">CIRCUITLAB</span>
              <span className="text-[10px] text-green-400 font-mono">MULTIMETER</span>
            </div>
            <div className="flex items-end gap-1">
              <span className="text-4xl font-bold text-green-400 font-mono leading-none">
                {simResults && simResults.valid
                  ? measurementType === 'voltage'
                    ? '0.000'
                    : measurementType === 'current'
                    ? '0.0000'
                    : '0.000'
                  : '----'}
              </span>
              <span className="text-xs text-green-400 font-mono mb-1">
                {measurementType === 'voltage' ? 'V' : measurementType === 'current' ? 'A' : 'Ω'}
              </span>
            </div>
            <div className="mt-4 flex justify-between text-[10px] text-green-400 font-mono">
              <span>DC</span>
              <span>{measurementType}</span>
            </div>
          </div>
        </div>

        {/* Measurement inputs */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-[#94a3b8] uppercase">Function</label>
            <span className="text-sm text-white capitalize">{measurementType}</span>
          </div>
          {measurementType === 'voltage' && (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-[#94a3b8] uppercase">Node A (+)</label>
                <input
                  type="text"
                  placeholder="Node ID"
                  value={nodeA}
                  onChange={(e) => setNodeA(e.target.value)}
                  className="input-field"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-[#94a3b8] uppercase">Node B (-)</label>
                <input
                  type="text"
                  placeholder="Node ID"
                  value={nodeB}
                  onChange={(e) => setNodeB(e.target.value)}
                  className="input-field"
                />
              </div>
            </>
          )}
          {measurementType === 'current' && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[#94a3b8] uppercase">Component</label>
              <select
                value={componentId}
                onChange={(e) => setComponentId(e.target.value)}
                className="input-field"
              >
                <option value="">Select component</option>
                {circuit?.components.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label} ({c.type})
                  </option>
                ))}
              </select>
            </div>
          )}
          {measurementType === 'resistance' && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[#94a3b8] uppercase">Network</label>
              <span className="text-sm text-[#cbd5e1]">Passive network</span>
            </div>
          )}
        </div>

        {/* Reading result */}
        {simResults && simResults.valid && (
          <div className="mt-6 panel">
            <h4 className="text-xs font-semibold text-[#94a3b8] uppercase mb-3">Measurement Result</h4>
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-[#0f172a] p-4 rounded border border-[#475569] text-center">
                <div className="text-xs text-[#94a3b8] uppercase">Reading</div>
                <div className="text-3xl font-bold text-green-400 font-mono">
                  {getReading(simResults, measurementType, nodeA, nodeB, componentId).toFixed(4)}
                </div>
                <div className="text-xs text-green-400 mt-1">
                  {measurementType === 'voltage' ? 'V' : measurementType === 'current' ? 'A' : 'Ω'}
                </div>
              </div>
              <div className="flex-1 bg-[#0f172a] p-4 rounded border border-[#475569] text-center">
                <div className="text-xs text-[#94a3b8] uppercase">Status</div>
                <div className="text-xs text-green-400 font-medium">Valid reading</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Equivalent resistance calculator */}
      <div className="panel">
        <h3 className="font-semibold text-white mb-4">Equivalent Resistance Calculator</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-xs font-semibold text-[#94a3b8] uppercase mb-3">Series Resistance</h4>
            <div className="space-y-2">
              {['R1', 'R2', 'R3'].map((label) => (
                <div key={label} className="flex gap-2">
                  <span className="w-8 text-xs text-[#94a3b8] text-right">{label}</span>
                  <input
                    type="number"
                    className="flex-1 input-field"
                    placeholder="Ω"
                  />
                </div>
              ))}
              <div className="pt-3 flex items-center gap-2">
                <span className="text-xs font-bold text-white">R_total =</span>
                <span className="text-xs text-[#38bdf8] font-mono">Sum of all resistors</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-[#94a3b8] uppercase mb-3">Parallel Resistance</h4>
            <div className="space-y-2">
              {['R1', 'R2', 'R3'].map((label) => (
                <div key={label} className="flex gap-2">
                  <span className="w-8 text-xs text-[#94a3b8] text-right">{label}</span>
                  <input
                    type="number"
                    className="flex-1 input-field"
                    placeholder="Ω"
                  />
                </div>
              ))}
              <div className="pt-3 flex items-center gap-2">
                <span className="text-xs font-bold text-white">R_total =</span>
                <span className="text-xs text-[#22d3ee] font-mono">1 / Σ(1/R)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Component reference */}
      {circuit && circuit.components.length > 0 && (
        <div className="panel">
          <h3 className="font-semibold text-white mb-4">Circuit Components</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#334155] text-[#94a3b8]">
                  <th className="pb-3 text-left font-medium">ID</th>
                  <th className="pb-3 text-left font-medium">Type</th>
                  <th className="pb-3 text-left font-medium">Label</th>
                  <th className="pb-3 text-left font-medium">Value</th>
                </tr>
              </thead>
              <tbody>
                {circuit.components.map((c) => (
                  <tr key={c.id} className="border-b border-charcoal-800">
                    <td className="py-2 text-[#cbd5e1] text-xs font-mono">{c.id}</td>
                    <td className="py-2 text-white capitalize">{c.type}</td>
                    <td className="py-2 text-[#cbd5e1]">{c.label}</td>
                    <td className="py-2 text-[#94a3b8] text-xs">
                      {c.properties.resistance != null ? c.properties.resistance + ' Ω' : ''}
                      {c.properties.voltage != null ? c.properties.voltage + ' V' : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function getReading(
  simResults: any,
  type: 'voltage' | 'current' | 'resistance',
  nodeA: string,
  nodeB: string,
  componentId: string
): number {
  if (type === 'voltage') {
    const va = simResults.nodeVoltages[nodeA] ?? 0;
    const vb = simResults.nodeVoltages[nodeB] ?? 0;
    return Math.abs(va - vb);
  }
  if (type === 'current' && componentId) {
    const v = simResults.componentVoltages[componentId] ?? 0;
    return v > 0 ? v / 1000 : 0; // approximate
  }
  if (type === 'resistance') {
    return simResults.totalResistance;
  }
  return 0;
}
