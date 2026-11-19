import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { rcTimeConstant, rcChargingVoltage, rcdischargingVoltage, rlTimeConstant, rlCurrentRise, rlCurrentDecay } from '../simulation/engine';
import { RefreshCw } from 'lucide-react';

type TransientType = 'RC' | 'RL';
type TransientMode = 'charge' | 'discharge' | 'rise' | 'decay';

function generateData(
  type: TransientType,
  mode: TransientMode,
  r: number,
  c: number,
  l: number,
  v: number,
  tMax: number
) {
  const tau = type === 'RC' ? rcTimeConstant(r, c) : rlTimeConstant(r, l);
  const points: Array<{ t: number; value: number }> = [];
  const steps = 200;
  for (let i = 0; i <= steps; i++) {
    const t = (tMax * i) / steps;
    let value = 0;
    if (type === 'RC' && mode === 'charge') value = rcChargingVoltage(t, v, r, c);
    if (type === 'RC' && mode === 'discharge') value = rcdischargingVoltage(t, v, r, c);
    if (type === 'RL' && mode === 'rise') value = rlCurrentRise(t, v, r, l);
    if (type === 'RL' && mode === 'decay') value = rlCurrentDecay(t, v, r, l);
    points.push({ t, value });
  }
  return { points, tau };
}

export function TransientAnalysis() {
  const [type, setType] = React.useState<TransientType>('RC');
  const [mode, setMode] = React.useState<TransientMode>('charge');
  const [r, setR] = React.useState(1000);
  const [c, setC] = React.useState(0.001);
  const [l, setL] = React.useState(0.5);
  const [v, setV] = React.useState(10);
  const [tMax, setTMax] = React.useState(5);

  const { points, tau } = generateData(type, mode, r, c, l, v, tMax);
  const finalValue = points[points.length - 1]?.value ?? 0;

  const isRC = type === 'RC';
  const isCharge = mode === 'charge' || mode === 'rise';

  const xLabel = 'Time (s)';
  const yLabel = isRC ? 'Voltage (V)' : 'Current (A)';

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Transient Analysis</h1>
          <p className="text-[#94a3b8] text-sm mt-1">
            Analyze RC and RL circuit transient responses with interactive graphs.
          </p>
        </div>
        <button
          onClick={() => {
            setR(1000); setC(0.001); setL(0.5); setV(10); setTMax(5);
          }}
          className="btn-secondary"
        >
          <RefreshCw size={16} /> Reset Values
        </button>
      </div>

      {/* Controls */}
      <div className="panel grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-[#94a3b8] uppercase">Circuit Type</label>
          <div className="flex gap-2">
            <button
              onClick={() => setType('RC')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${type === 'RC' ? 'bg-[#38bdf8] text-[#0f172a]' : 'bg-[#0f172a] border border-[#475569] text-[#cbd5e1] hover:text-white'}`}
            >
              RC
            </button>
            <button
              onClick={() => setType('RL')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${type === 'RL' ? 'bg-[#22d3ee] text-[#0f172a]' : 'bg-[#0f172a] border border-[#475569] text-[#cbd5e1] hover:text-white'}`}
            >
              RL
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-[#94a3b8] uppercase">Mode</label>
          <div className="flex gap-2">
            {isRC ? (
              <>
                <button
                  onClick={() => setMode('charge')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'charge' ? 'bg-[#38bdf8] text-[#0f172a]' : 'bg-[#0f172a] border border-[#475569] text-[#cbd5e1] hover:text-white'}`}
                >
                  Charge
                </button>
                <button
                  onClick={() => setMode('discharge')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'discharge' ? 'bg-[#22d3ee] text-[#0f172a]' : 'bg-[#0f172a] border border-[#475569] text-[#cbd5e1] hover:text-white'}`}
                >
                  Discharge
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setMode('rise')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'rise' ? 'bg-[#38bdf8] text-[#0f172a]' : 'bg-[#0f172a] border border-[#475569] text-[#cbd5e1] hover:text-white'}`}
                >
                  Rise
                </button>
                <button
                  onClick={() => setMode('decay')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'decay' ? 'bg-[#22d3ee] text-[#0f172a]' : 'bg-[#0f172a] border border-[#475569] text-[#cbd5e1] hover:text-white'}`}
                >
                  Decay
                </button>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-[#94a3b8] uppercase">
            {isRC ? 'Resistance (Ω)' : 'Resistance (Ω)'}
          </label>
          <input
            type="number"
            value={r}
            onChange={(e) => setR(parseFloat(e.target.value) || 0)}
            className="input-field"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-[#94a3b8] uppercase">
            {isRC ? 'Capacitance (F)' : 'Inductance (H)'}
          </label>
          <input
            type="number"
            step="0.001"
            value={isRC ? c : l}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 0;
              if (isRC) setC(val); else setL(val);
            }}
            className="input-field"
          />
        </div>
      </div>

      <div className="panel grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-[#94a3b8] uppercase">Source (V)</label>
          <input
            type="number"
            value={v}
            onChange={(e) => setV(parseFloat(e.target.value) || 0)}
            className="input-field"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-[#94a3b8] uppercase">Max Time (s)</label>
          <input
            type="number"
            value={tMax}
            onChange={(e) => setTMax(parseFloat(e.target.value) || 1)}
            className="input-field"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-[#94a3b8] uppercase">Time Constant (τ)</label>
          <div className="bg-[#0f172a] p-2 rounded border border-[#475569] text-lg font-bold text-[#38bdf8]">
            {tau.toFixed(4)} s
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-[#94a3b8] uppercase">Final Value</label>
          <div className="bg-[#0f172a] p-2 rounded border border-[#475569] text-lg font-bold text-[#22d3ee]">
            {finalValue.toFixed(4)} {isRC ? 'V' : 'A'}
          </div>
        </div>
      </div>

      {/* Graph */}
      <div className="panel h-[500px]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">{isRC ? 'RC' : 'RL'} {isCharge ? 'Charging / Rise' : 'Discharging / Decay'}</h3>
          <span className="text-xs text-[#94a3b8]">τ = {tau.toFixed(3)} s</span>
        </div>
        <div className="h-[420px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="t" label={{ value: xLabel, position: 'bottom', offset: 0 }} stroke="#94a3b8" fontSize={11} />
              <YAxis label={{ value: yLabel, position: 'left', angle: -90, offset: 0 }} stroke="#94a3b8" fontSize={11} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <ReferenceLine x={tau} stroke="#38bdf8" strokeDasharray="4 2" label={{ value: 'τ', position: 'top' }} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#38bdf8"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3, fill: '#38bdf8' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Info */}
      <div className="panel">
        <h3 className="font-semibold text-white mb-3">Formulas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-[#cbd5e1]">
          <div className="bg-[#0f172a] p-3 rounded border border-[#334155]">
            <div className="text-xs text-[#38bdf8] font-mono mb-1">
              {isRC ? 'τ = R × C' : 'τ = L / R'}
            </div>
            <div className="text-xs text-white">
              {isRC
                ? 'V(t) = V₀ × (1 − e^(−t/τ))  (charging)'
                : 'I(t) = (V/R) × (1 − e^(−t/τ))  (rise)'}
            </div>
          </div>
          <div className="bg-[#0f172a] p-3 rounded border border-[#334155]">
            <div className="text-xs text-[#22d3ee] font-mono mb-1">
              {isRC ? 'V(t) = V₀ × e^(−t/τ)' : 'I(t) = I₀ × e^(−t/τ)'}
            </div>
            <div className="text-xs text-white">
              {isRC ? '(discharging)' : '(decay)'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
