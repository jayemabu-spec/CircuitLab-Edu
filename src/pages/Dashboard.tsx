import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCircuitStore } from '../stores/circuitStore';
import { useNFCStore } from '../stores/nfcStore';
import { LAB_EXPERIMENTS } from '../experiments/lab3dExperiments';
import { Database, Activity, Power, PlugZap, Battery, AlertCircle, Play, FlaskConical, Search } from 'lucide-react';

export function Dashboard() {
  const navigate = useNavigate();
  const circuit = useCircuitStore((s) => s.circuit);
  const setCircuit = useCircuitStore((s) => s.setCircuit);
  const scanHistory = useNFCStore((s) => s.scanHistory);

  const componentCount = circuit?.components.length ?? 0;
  const wireCount = circuit?.wires.length ?? 0;

  const loadExample = (id: string) => {
    const exp = LAB_EXPERIMENTS.find((e) => e.id === id);
    if (!exp) return;
    setCircuit(exp.setupCircuit());
    navigate('/lab');
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-[#94a3b8] text-sm mt-1">
            Monitor and design your circuits. Virtual lab for electrical engineering education.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            className="btn-primary"
            onClick={() => {
              useCircuitStore.getState().resetCircuit();
              navigate('/lab');
            }}
          >
            <Power size={18} className="mr-2" />
            New 3D Circuit
          </button>
          <button className="btn-secondary" onClick={() => navigate('/lab')}>
            <Play size={18} className="mr-2" />
            Open 3D Lab
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Activity className="w-6 h-6" />}
          label="Components Placed"
          value={componentCount}
          suffix="components"
          color="blue-accent"
        />
        <StatCard
          icon={<PlugZap className="w-6 h-6" />}
          label="Wires Connected"
          value={wireCount}
          suffix="connections"
          color="cyan-accent"
        />
        <StatCard
          icon={<Battery className="w-6 h-6" />}
          label="Circuit Status"
          value={componentCount > 0 ? 'Active' : 'Empty'}
          suffix={componentCount > 0 ? 'ready' : 'no circuit'}
          color={componentCount > 0 ? 'cyan-accent' : 'charcoal-500'}
        />
        <StatCard
          icon={<AlertCircle className="w-6 h-6" />}
          label="NFC Scans"
          value={scanHistory.length}
          suffix="scanned"
          color="blue-accent"
        />
      </div>

      <div className="panel border-charcoal-500/30 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Example Circuits</h2>
          <button
            onClick={() => navigate('/lab')}
            className="text-xs text-charcoal-500 hover:text-[#38bdf8] transition-colors"
          >
            Skip
          </button>
        </div>
        <p className="text-sm text-charcoal-500 mb-4">Click a circuit to load it into the 3D laboratory. All components and connections are pre-built.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {LAB_EXPERIMENTS.slice(0, 6).map((exp) => (
            <button
              key={exp.id}
              onClick={() => loadExample(exp.id)}
              className="bg-charcoal-900 border-charcoal-700 rounded-lg p-4 text-left hover:border-[#38bdf8]/50 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-2">
                <FlaskConical className="w-4 h-4 text-[#38bdf8]" />
                <span className="font-semibold text-white text-sm">{exp.title}</span>
              </div>
              <p className="text-xs text-charcoal-400">{exp.objective}</p>
              <div className="mt-2 text-charcoal-600 flex items-center gap-1">
                <Play size={12} className="hover:text-[#38bdf8] transition-colors" /> Load & test
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <QuickStartCard
          title="Ohm's Law Experiment"
          description="Verify V = I × R with a simple resistor circuit."
          icon={<PlugZap className="w-5 h-5 text-[#38bdf8]" />}
        />
        <QuickStartCard
          title="Series Circuit"
          description="Build resistors in series and measure voltage drops."
          icon={<Battery className="w-5 h-5 text-[#22d3ee]" />}
        />
        <QuickStartCard
          title="Parallel Circuit"
          description="Build resistors in parallel and observe current division."
          icon={<Activity className="w-5 h-5 text-[#38bdf8]" />}
        />
        <QuickStartCard
          title="RC Transient"
          description="Observe capacitor charging and discharging curves."
          icon={<Activity className="w-5 h-5 text-[#22d3ee]" />}
        />
        <QuickStartCard
          title="NFC Identification"
          description="Scan virtual NFC tags to identify components."
          icon={<Search className="w-5 h-5 text-[#38bdf8]" />}
        />
        <QuickStartCard
          title="Virtual Instruments"
          description="Use voltmeter, ammeter, and ohmmeter."
          icon={<Database className="w-5 h-5 text-[#22d3ee]" />}
        />
      </div>

      <div className="panel">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#334155] text-[#94a3b8]">
                <th className="pb-3 font-medium">Time</th>
                <th className="pb-3 font-medium">Action</th>
                <th className="pb-3 font-medium">Component</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {scanHistory.slice(0, 5).map((scan) => (
                <tr key={scan.id} className="border-b border-charcoal-800">
                  <td className="py-3 text-[#cbd5e1]">
                    {new Date(scan.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-3 text-white">NFC Scan</td>
                  <td className="py-3 text-white">{scan.label ?? 'Unknown tag'}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      scan.success ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'
                    }`}>
                      {scan.success ? 'Identified' : 'Unknown'}
                    </span>
                  </td>
                </tr>
              ))}
              {scanHistory.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-[#64748b]">
                    No recent scans. Visit NFC Identification to scan tags.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  suffix,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  suffix: string;
  color: string;
}) {
  return (
    <div className="panel">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-[#94a3b8] uppercase tracking-wider">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}-500/20 text-${color}`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <p className="text-xs text-[#64748b] mt-1">{suffix}</p>
    </div>
  );
}

function QuickStartCard({
  title,
  description,
  icon,
  onClick,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <div onClick={onClick} className="panel cursor-pointer hover:border-[#38bdf8]/50 transition-colors group">
      <div className="w-10 h-10 rounded-lg bg-[#0f172a] flex items-center justify-center mb-3 group-hover:bg-[#38bdf8]/20 transition-colors">
        {icon}
      </div>
      <h3 className="font-semibold text-white mb-1">{title}</h3>
      <p className="text-xs text-[#94a3b8]">{description}</p>
    </div>
  );
}
