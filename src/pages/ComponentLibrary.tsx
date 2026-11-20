import React from 'react';
import { Plus, Battery, Lightbulb, Gauge } from 'lucide-react';

const COMPONENTS = [
  { id: 'resistor', label: 'Resistor', icon: <Gauge size={16} />, color: '#38bdf8', defaultValue: 100, unit: 'Ω' },
  { id: 'bulb', label: 'Light Bulb', icon: <Lightbulb size={16} />, color: '#22d3ee', defaultValue: 47, unit: 'Ω' },
  { id: 'switch', label: 'Switch', icon: <Plus size={16} />, color: '#38bdf8', defaultValue: 0, unit: '' },
  { id: 'capacitor', label: 'Capacitor', icon: <Plus size={16} />, color: '#22d3ee', defaultValue: 100, unit: 'μF' },
  { id: 'inductor', label: 'Inductor', icon: <Plus size={16} />, color: '#38bdf8', defaultValue: 10, unit: 'mH' },
  { id: 'voltageSource', label: 'DC Voltage Source', icon: <Battery size={16} />, color: '#22d3ee', defaultValue: 5, unit: 'V' },
  { id: 'ground', label: 'Ground', icon: <Plus size={16} />, color: '#64748b', defaultValue: 0, unit: '' },
  { id: 'voltmeter', label: 'Voltmeter', icon: <Plus size={16} />, color: '#64748b', defaultValue: 0, unit: '' },
  { id: 'ammeter', label: 'Ammeter', icon: <Plus size={16} />, color: '#64748b', defaultValue: 0, unit: '' },
  { id: 'ohmmeter', label: 'Ohmmeter', icon: <Plus size={16} />, color: '#64748b', defaultValue: 0, unit: '' },
];

export function ComponentLibrary() {
  const [filter, setFilter] = React.useState('');

  const filtered = COMPONENTS.filter((c) =>
    c.label.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Component Library</h1>
          <p className="text-[#94a3b8] text-sm mt-1">
            Browse available electrical components and measuring instruments.
          </p>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search components..."
            className="input-field pl-9"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400">
            <Plus size={14} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((comp) => (
          <ComponentCard key={comp.id} comp={comp} />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 panel text-center py-12">
            <p className="text-charcoal-400">No components found matching "{filter}".</p>
          </div>
        )}
      </div>

      <div className="panel">
        <h2 className="text-lg font-semibold text-white mb-4">Component Types</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#0f172a] p-4 rounded-lg border border-[#334155]">
            <h3 className="font-bold text-[#38bdf8] mb-2">Passive Components</h3>
            <ul className="text-sm text-[#cbd5e1] space-y-1">
              <li>• Resistor - limits current flow</li>
              <li>• Light Bulb - resistive load with light output</li>
              <li>• Capacitor - stores electrical energy</li>
              <li>• Inductor - stores magnetic energy</li>
              <li>• Ground - zero-voltage reference</li>
            </ul>
          </div>
          <div className="bg-[#0f172a] p-4 rounded-lg border border-[#334155]">
            <h3 className="font-bold text-[#22d3ee] mb-2">Active & Measurement</h3>
            <ul className="text-sm text-[#cbd5e1] space-y-1">
              <li>• DC Voltage Source - provides voltage</li>
              <li>• Switch - opens/closes circuit</li>
              <li>• Voltmeter - measures voltage</li>
              <li>• Ammeter - measures current</li>
              <li>• Ohmmeter - measures resistance</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComponentCard({ comp }: { comp: typeof COMPONENTS[0] }) {
  const [added, setAdded] = React.useState(false);

  return (
    <div
      className={`panel group cursor-pointer transition-all hover:border-[#38bdf8]/50 ${added ? 'border-[#38bdf8]' : ''}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${comp.color}/20 text-${comp.color === '#38bdf8' ? 'blue-accent' : comp.color === '#22d3ee' ? 'cyan-accent' : 'charcoal-400'}`}>
          {comp.icon}
        </div>
        <button
          onClick={() => setAdded(!added)}
          className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] transition-colors ${
            added ? 'bg-[#38bdf8] text-[#0f172a]' : 'bg-[#0f172a] border border-[#475569] text-[#94a3b8] hover:text-white'
          }`}
          title={added ? 'Added' : 'Add to circuit'}
        >
          {added ? '✓' : '+'}
        </button>
      </div>
      <h3 className="font-bold text-white text-sm">{comp.label}</h3>
      <p className="text-xs text-[#94a3b8] mt-1">
        {comp.defaultValue}{comp.unit}
      </p>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[10px] text-charcoal-400 uppercase">Click to add</span>
        <span className="text-xs font-medium text-[#cbd5e1]">{comp.id}</span>
      </div>
    </div>
  );
}
