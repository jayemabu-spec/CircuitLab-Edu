import React from 'react';
import { useCircuitStore } from '../stores/circuitStore';
import { solveCircuit } from '../simulation/engine';
import {
  Play,
  Pause,
  StopCircle,
  RefreshCw,
  Battery,
  Zap,
  Flashlight,
  Gauge,
  CheckCircle,
} from 'lucide-react';

export function CircuitSimulator() {
  const circuit = useCircuitStore((s) => s.circuit);
  const simResults = useCircuitStore((s) => s.simulationResults);
  const isSimulating = useCircuitStore((s) => s.isSimulating);
  const setSimulation = useCircuitStore((s) => s.setSimulation);

  const [animating, setAnimating] = React.useState(false);

  const runSim = React.useCallback(() => {
    if (!circuit) return;
    const comps = circuit.components.map((c) => c);
    const wires = circuit.wires.map((w) => w);
    solveCircuit(comps, wires);
    setSimulation(true);
    setAnimating(true);
  }, [circuit, setSimulation]);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Circuit Simulator</h1>
          <p className="text-[#94a3b8] text-sm mt-1">
            Run electrical simulations and visualize current flow.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={runSim}
            disabled={!circuit || circuit.components.length === 0}
            className="btn-primary flex items-center gap-2"
          >
            {isSimulating ? <Pause size={16} /> : <Play size={16} />}
            <span>{isSimulating ? 'Pause Simulation' : 'Run Simulation'}</span>
          </button>
          <button onClick={() => setSimulation(false)} className="btn-secondary">
            <StopCircle size={16} /> Reset
          </button>
        </div>
      </div>

      {circuit && circuit.components.length === 0 && (
        <div className="panel flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-[#1e293b] flex items-center justify-center mb-4 border border-[#475569]">
            <Battery size={32} className="text-charcoal-400" />
          </div>
          <h3 className="text-white font-semibold mb-2">No circuit designed yet</h3>
          <p className="text-[#94a3b8] text-sm mb-6">
            Go to Circuit Designer to build a circuit, then simulate it here.
          </p>
          <button onClick={runSim} className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed" disabled>
            <RefreshCw size={16} /> Run Simulation
          </button>
        </div>
      )}

      {circuit && circuit.components.length > 0 && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Circuit preview (simplified) */}
            <div className="lg:col-span-2 panel">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">Circuit Visualization</h3>
                <span className={`text-xs font-medium px-2 py-1 rounded ${
                  animating ? 'bg-green-500/10 text-green-400 animate-pulse border border-green-500/30' : 'bg-[#334155] text-[#94a3b8] border border-[#475569]'
                }`}>
                  {animating ? 'Current Flowing' : 'Idle'}
                </span>
              </div>
              <div className="h-80 bg-[#0f172a] rounded-xl border border-[#334155] flex items-center justify-center relative overflow-hidden">
                {/* Simple circuit diagram representation */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="flex flex-col items-center gap-8">
                    {/* Source */}
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-[#38bdf8]/20 border border-[#38bdf8]/50 flex items-center justify-center text-[#38bdf8]">
                        <Battery size={20} />
                      </div>
                      <div className="text-[10px] text-[#94a3b8] mt-1">DC Source</div>
                    </div>
                    <div className="w-1 h-16 bg-[#475569]" />
                    {/* Components */}
                    <div className="flex items-center gap-6">
                      {circuit.components.map((c, i) => (
                        <div key={c.id} className="flex flex-col items-center">
                          <div
                            className={`w-14 h-8 rounded border flex items-center justify-center text-[10px] font-bold ${
                              animating ? 'bg-[#38bdf8]/20 border-[#38bdf8]/50 animate-pulse' : 'bg-[#0f172a] border-[#475569]'
                            }`}
                          >
                            {c.type === 'resistor' ? 'R' : c.type === 'bulb' ? 'L' : c.type[0].toUpperCase()}
                          </div>
                          <div className="text-[10px] text-[#94a3b8] mt-1">{c.label}</div>
                          {i < circuit.components.length - 1 && (
                            <div className="w-8 h-1 bg-[#475569]" />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="w-1 h-16 bg-[#475569]" />
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-[#334155] border border-[#475569] flex items-center justify-center text-[#94a3b8]">
                        <Flashlight size={20} />
                      </div>
                      <div className="text-[10px] text-[#94a3b8] mt-1">Ground</div>
                    </div>
                  </div>
                </div>
                {/* Current flow animation */}
                {animating && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <div className="w-full h-1 bg-[#38bdf8]/30 rounded-full overflow-hidden relative">
                      <div className="h-full bg-[#38bdf8] animate-[sweep_2s_linear_infinite] w-1/3" />
                    </div>
                    <div className="mt-4 text-[10px] text-[#38bdf8] font-mono">I → {simResults?.totalCurrent?.toFixed(3) ?? 0} A</div>
                  </div>
                )}
              </div>
            </div>

            {/* Results */}
            <div className="lg:col-span-1">
              <div className="space-y-4">
                <StatusCard
                  title="Simulation Status"
                  value={simResults?.valid ? 'Valid' : 'Invalid'}
                  status={simResults?.valid ? 'ok' : 'error'}
                  icon={<CheckCircle size={16} className={simResults?.valid ? 'text-green-400' : 'text-red-400'} />}
                />
                {simResults && simResults.valid && (
                  <>
                    <MetricCard title="Total Resistance" value={simResults.totalResistance.toFixed(2)} unit="Ω" icon={<Gauge size={16} className="text-[#38bdf8]" />} />
                    <MetricCard title="Total Current" value={simResults.totalCurrent.toFixed(4)} unit="A" icon={<Zap size={16} className="text-[#22d3ee]" />} />
                    <MetricCard title="Power" value={(simResults.totalResistance * simResults.totalCurrent ** 2).toFixed(2)} unit="W" icon={<Flashlight size={16} className="text-yellow-400" />} />
                  </>
                )}
                {simResults && !simResults.valid && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <h4 className="text-sm font-bold text-red-400 mb-2">Circuit Errors</h4>
                    <ul className="text-xs text-red-200 list-disc list-inside space-y-1">
                      {simResults.errors.map((e: string, i: number) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {simResults && simResults.floatingNodes && simResults.floatingNodes.length > 0 && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <h4 className="text-sm font-bold text-yellow-400 mb-2">Floating Nodes</h4>
                    <ul className="text-xs text-yellow-200 list-disc list-inside space-y-1">
                      {simResults.floatingNodes.map((n: string, i: number) => (
                        <li key={i}>Node {n}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Component details */}
          {simResults && simResults.valid && (
            <div className="panel">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">Component Details</h3>
                <span className="text-xs text-[#94a3b8]">Voltage, current, and power per component</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#334155] text-[#94a3b8]">
                      <th className="pb-3 text-left font-medium">Component</th>
                      <th className="pb-3 text-left font-medium">Type</th>
                      <th className="pb-3 text-left font-medium">Voltage (V)</th>
                      <th className="pb-3 text-left font-medium">Current (A)</th>
                      <th className="pb-3 text-left font-medium">Power (W)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {circuit.components.map((c) => {
                      const v = simResults.componentVoltages[c.id] ?? 0;
                      const p = simResults.componentPowers[c.id] ?? 0;
                      const r = Number(c.properties.resistance ?? 0);
                      const i = r > 0 ? v / r : 0;
                      return (
                        <tr key={c.id} className="border-b border-charcoal-800">
                          <td className="py-3 text-white">{c.label}</td>
                          <td className="py-3 text-[#cbd5e1] capitalize">{c.type}</td>
                          <td className="py-3 text-[#38bdf8]">{v.toFixed(3)}</td>
                          <td className="py-3 text-[#22d3ee]">{i.toFixed(4)}</td>
                          <td className="py-3 text-yellow-400">{p.toFixed(4)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatusCard({
  title,
  value,
  status,
  icon,
}: {
  title: string;
  value: string;
  status: 'ok' | 'error';
  icon: React.ReactNode;
}) {
  return (
    <div className="panel">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-[#94a3b8] uppercase">{title}</span>
        {icon}
      </div>
      <div className={`text-lg font-bold ${status === 'ok' ? 'text-green-400' : 'text-red-400'}`}>
        {value}
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  unit,
  icon,
}: {
  title: string;
  value: string;
  unit: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="panel">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-[#94a3b8] uppercase">{title}</span>
        {icon}
      </div>
      <div className="text-xl font-bold text-white">{value}</div>
      <span className="text-xs text-charcoal-400">{unit}</span>
    </div>
  );
}
