import React from 'react';
import { FlaskConical, Play, Battery, RefreshCw, PlugZap, Activity } from 'lucide-react';
import { rcTimeConstant, rlTimeConstant } from '../simulation/engine';

const EXPERIMENTS = [
  {
    id: 'ohms-law',
    title: "Ohm's Law",
    category: 'ohms-law',
    objective: 'Verify the relationship V = I × R by measuring voltage, current, and resistance.',
    icon: <PlugZap size={16} className="text-[#38bdf8]" />,
    setup: 'Connect a DC voltage source, resistor, and ammeter in series. Place a voltmeter across the resistor.',
    expected: 'Current should equal voltage divided by resistance (I = V/R).',
  },
  {
    id: 'series',
    title: 'Series Circuit',
    category: 'series',
    objective: 'Build resistors in series and verify that total resistance equals the sum of individual resistances.',
    icon: <Battery size={16} className="text-[#22d3ee]" />,
    setup: 'Connect two or more resistors end-to-end. The same current flows through all components.',
    expected: 'R_total = R1 + R2 + R3; voltage divides across each resistor.',
  },
  {
    id: 'parallel',
    title: 'Parallel Circuit',
    category: 'parallel',
    objective: 'Build resistors in parallel and verify current division and equivalent resistance.',
    icon: <Activity size={16} className="text-[#38bdf8]" />,
    setup: 'Connect resistors side-by-side between the same two nodes. Voltage is the same across all.',
    expected: '1/R_total = 1/R1 + 1/R2 + 1/R3; total current divides among branches.',
  },
  {
    id: 'mixed',
    title: 'Mixed Circuit',
    category: 'mixed',
    objective: 'Analyze a combination of series and parallel resistors using nodal analysis.',
    icon: <PlugZap size={16} className="text-[#22d3ee]" />,
    setup: 'Create a circuit with both series and parallel resistor combinations.',
    expected: 'Use nodal analysis to solve for all node voltages and branch currents.',
  },
  {
    id: 'voltage-divider',
    title: 'Voltage Divider',
    category: 'divider',
    objective: 'Use two resistors in series to divide a voltage into a smaller output.',
    icon: <Activity size={16} className="text-[#38bdf8]" />,
    setup: 'Connect two resistors in series across a voltage source. Measure voltage across R2.',
    expected: 'V_out = V_in × R2 / (R1 + R2).',
  },
  {
    id: 'current-divider',
    title: 'Current Divider',
    category: 'divider',
    objective: 'Observe how current splits between parallel branches.',
    icon: <Battery size={16} className="text-[#22d3ee]" />,
    setup: 'Connect two resistors in parallel fed by a current source.',
    expected: 'I2 = I_total × R1 / (R1 + R2).',
  },
  {
    id: 'rc-charge',
    title: 'RC Charging',
    category: 'rc',
    objective: 'Observe the exponential charging curve of a capacitor.',
    icon: <Activity size={16} className="text-[#38bdf8]" />,
    setup: 'Connect a resistor and capacitor in series with a DC source. Measure capacitor voltage over time.',
    expected: 'V(t) = V_source × (1 − e^(−t/τ)), where τ = R × C.',
  },
  {
    id: 'rc-discharge',
    title: 'RC Discharging',
    category: 'rc',
    objective: 'Observe the exponential discharging curve of a capacitor.',
    icon: <Activity size={16} className="text-[#22d3ee]" />,
    setup: 'Charge a capacitor, then disconnect the source and let it discharge through a resistor.',
    expected: 'V(t) = V_initial × e^(−t/τ).',
  },
  {
    id: 'rl-rise',
    title: 'RL Current Rise',
    category: 'rl',
    objective: 'Observe current rise in an inductor when voltage is applied.',
    icon: <Activity size={16} className="text-[#38bdf8]" />,
    setup: 'Connect a resistor and inductor in series with a DC source.',
    expected: 'I(t) = (V/R) × (1 − e^(−t/τ)), where τ = L/R.',
  },
  {
    id: 'rl-decay',
    title: 'RL Current Decay',
    category: 'rl',
    objective: 'Observe current decay in an inductor when voltage is removed.',
    icon: <Activity size={16} className="text-[#22d3ee]" />,
    setup: 'Allow current to flow through an inductor, then open the circuit.',
    expected: 'I(t) = I_initial × e^(−t/τ).',
  },
];

export function Experiments() {
  const [activeId, setActiveId] = React.useState<string | null>(null);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Experiments</h1>
          <p className="text-[#94a3b8] text-sm mt-1">
            Guided electrical engineering experiments for hands-on learning.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Experiment list */}
        <div className="lg:col-span-4">
          <div className="panel h-full">
            <h3 className="font-semibold text-white mb-4">Available Experiments</h3>
            <div className="space-y-2">
              {EXPERIMENTS.map((exp) => (
                <button
                  key={exp.id}
                  onClick={() => setActiveId(exp.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                    activeId === exp.id
                      ? 'bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/30'
                      : 'bg-[#0f172a] border border-[#475569] text-[#cbd5e1] hover:text-white hover:border-[#64748b]'
                  }`}
                >
                  {exp.icon}
                  <span className="text-sm font-medium">{exp.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Experiment detail */}
        <div className="lg:col-span-8">
          {activeId ? (
            <ExperimentDetail experiment={EXPERIMENTS.find((e) => e.id === activeId)!} />
          ) : (
            <div className="panel flex flex-col items-center justify-center py-20 text-center">
              <FlaskConical size={48} className="text-charcoal-600 mb-4" />
              <h3 className="text-white font-semibold mb-2">Select an experiment</h3>
              <p className="text-[#94a3b8] text-sm">Choose an experiment from the list to begin.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ExperimentDetail({ experiment }: { experiment: typeof EXPERIMENTS[0] }) {
  const [values, setValues] = React.useState({ r: 100, v: 5, c: 0.001, l: 0.5 });

  const isRC = experiment.category === 'rc';
  const isRL = experiment.category === 'rl';

  return (
    <div className="panel h-full flex flex-col">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">{experiment.title}</h2>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            experiment.category === 'rc' ? 'bg-[#38bdf8]/10 text-[#38bdf8]' :
            experiment.category === 'rl' ? 'bg-[#22d3ee]/10 text-[#22d3ee]' :
            'bg-[#334155] text-[#cbd5e1]'
          }`}>
            {experiment.category.replace('-', ' ').toUpperCase()}
          </span>
        </div>
        <button
          onClick={() => setValues({ r: 100, v: 5, c: 0.001, l: 0.5 })}
          className="text-xs text-[#94a3b8] hover:text-white flex items-center gap-1"
        >
          <RefreshCw size={14} /> Reset
        </button>
      </div>

      <div className="space-y-6">
        {/* Objective */}
        <div className="bg-[#0f172a] p-4 rounded border border-[#334155]">
          <h4 className="text-xs font-bold text-[#38bdf8] uppercase mb-2">Learning Objective</h4>
          <p className="text-sm text-[#cbd5e1]">{experiment.objective}</p>
        </div>

        {/* Setup */}
        <div className="bg-[#0f172a] p-4 rounded border border-[#334155]">
          <h4 className="text-xs font-bold text-[#38bdf8] uppercase mb-2">Circuit Setup</h4>
          <p className="text-sm text-[#cbd5e1] mb-2">{experiment.setup}</p>
          <div className="flex items-center justify-between pt-3 border-t border-[#334155]">
            <span className="text-xs text-[#94a3b8]">Components</span>
            <span className="text-xs text-white font-mono">Source, R, C/L, Meters</span>
          </div>
        </div>

        {/* Expected results */}
        <div className="bg-[#0f172a] p-4 rounded border border-[#334155]">
          <h4 className="text-xs font-bold text-[#38bdf8] uppercase mb-2">Expected Calculations</h4>
          <p className="text-sm text-[#cbd5e1]">{experiment.expected}</p>
        </div>

        {/* Interactive values */}
        <div className="bg-[#0f172a] p-4 rounded border border-[#334155]">
          <h4 className="text-xs font-bold text-[#38bdf8] uppercase mb-3">Adjust Values</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-[#94a3b8] uppercase">Resistance (Ω)</label>
              <input
                type="number"
                value={values.r}
                onChange={(e) => setValues({ ...values, r: parseFloat(e.target.value) || 0 })}
                className="input-field"
              />
            </div>
            {isRC && (
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-[#94a3b8] uppercase">Capacitance (F)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={values.c}
                  onChange={(e) => setValues({ ...values, c: parseFloat(e.target.value) || 0 })}
                  className="input-field"
                />
              </div>
            )}
            {isRL && (
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-[#94a3b8] uppercase">Inductance (H)</label>
                <input
                  type="number"
                  step="0.001"
                  value={values.l}
                  onChange={(e) => setValues({ ...values, l: parseFloat(e.target.value) || 0 })}
                  className="input-field"
                />
              </div>
            )}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <span className="text-[10px] font-bold text-[#94a3b8] uppercase">Time Constant:</span>
            <span className="text-sm font-mono text-[#38bdf8]">
              {isRC ? rcTimeConstant(values.r, values.c).toFixed(4) : rlTimeConstant(values.r, values.l).toFixed(4)} s
            </span>
          </div>
        </div>

        {/* Simulation link */}
        <div className="bg-[#0f172a] p-4 rounded border border-[#334155]">
          <h4 className="text-xs font-bold text-[#38bdf8] uppercase mb-3">Run Simulation</h4>
          <p className="text-xs text-[#94a3b8] mb-3">
            Build this circuit in the Circuit Designer and run the simulation to verify your calculations.
          </p>
          <button className="btn-secondary text-xs px-4 py-2">
            <Play size={14} className="mr-2" /> Open Circuit Designer
          </button>
        </div>
      </div>
    </div>
  );
}
