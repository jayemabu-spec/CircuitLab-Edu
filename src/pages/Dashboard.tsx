import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCircuitStore } from '../stores/circuitStore';
import { useNFCStore } from '../stores/nfcStore';
import { LAB_EXPERIMENTS } from '../experiments/lab3dExperiments';
import { Database, Activity, Power, PlugZap, Battery, Play, FlaskConical, Search, ArrowRight } from 'lucide-react';

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
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium text-[#ededed] tracking-tight">Instrument Dashboard</h1>
          <p className="text-xs text-[#85858b] mt-1">
            Overview of active laboratory workspace and simulation status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn-primary"
            onClick={() => {
              useCircuitStore.getState().resetCircuit();
              navigate('/lab');
            }}
          >
            <Power size={14} />
            <span>New 3D Circuit</span>
          </button>
          <button className="btn-secondary" onClick={() => navigate('/lab')}>
            <Play size={14} fill="currentColor" />
            <span>Open 3D Lab</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.08] border border-white/[0.08] rounded-lg overflow-hidden">
        <Metric label="Components placed" value={componentCount} suffix="elements mounted" />
        <Metric label="Active leads" value={wireCount} suffix="terminals linked" />
        <Metric
          label="Circuit status"
          value={componentCount > 0 ? 'Ready' : 'Empty'}
          suffix={componentCount > 0 ? 'circuit loaded in memory' : 'no active board'}
          tone={componentCount > 0 ? 'success' : 'muted'}
        />
        <Metric label="NFC identifications" value={scanHistory.length} suffix="hardware tags read" />
      </div>

      {/* Example Circuits */}
      <section className="bg-[#19191b] border border-white/[0.08] rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-medium text-[#ededed]">Pre-configured Laboratory Circuits</h2>
            <p className="text-xs text-[#85858b] mt-0.5">
              Select an experiment to load its complete 3D schematic into the virtual laboratory.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {LAB_EXPERIMENTS.slice(0, 6).map((exp) => (
            <button
              key={exp.id}
              onClick={() => loadExample(exp.id)}
              className="bg-[#141415] border border-white/[0.06] rounded-md p-3.5 text-left hover:border-white/[0.14] hover:bg-[#1a1a1c] transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <FlaskConical className="w-3.5 h-3.5 text-[#85858b]" />
                  <span className="font-medium text-[#ededed] text-xs">{exp.title}</span>
                </div>
                <ArrowRight size={12} className="text-[#85858b] group-hover:text-[#ededed] transition-colors" />
              </div>
              <p className="text-[11px] text-[#85858b] leading-relaxed line-clamp-2">{exp.objective}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Quick Start Modules */}
      <section>
        <h2 className="text-sm font-medium text-[#ededed] mb-3">Investigation Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <QuickStartCard
            title="Ohm's Law Analysis"
            description="Verify relationship V = I × R across precise linear resistive networks."
            icon={<PlugZap className="w-4 h-4" />}
            onClick={() => navigate('/experiments')}
          />
          <QuickStartCard
            title="Series Divider"
            description="Measure Kirchhoff's voltage drops across chained impedances."
            icon={<Battery className="w-4 h-4" />}
            onClick={() => navigate('/experiments')}
          />
          <QuickStartCard
            title="Parallel Branching"
            description="Observe current distribution and calculate Norton equivalent resistance."
            icon={<Activity className="w-4 h-4" />}
            onClick={() => navigate('/experiments')}
          />
          <QuickStartCard
            title="RC Transient Analysis"
            description="Plot step-response charge and discharge time-constants in real time."
            icon={<Activity className="w-4 h-4" />}
            onClick={() => navigate('/transient')}
          />
          <QuickStartCard
            title="NFC Component ID"
            description="Emulate real RFID / NFC component tag scanning and registration."
            icon={<Search className="w-4 h-4" />}
            onClick={() => navigate('/nfc')}
          />
          <QuickStartCard
            title="Telemetry Instrumentation"
            description="Virtual multimeter measurements with automatic unit scaling."
            icon={<Database className="w-4 h-4" />}
            onClick={() => navigate('/measurements')}
          />
        </div>
      </section>

      {/* Recent History Table */}
      <section className="bg-[#19191b] border border-white/[0.08] rounded-lg p-5">
        <h2 className="text-sm font-medium text-[#ededed] mb-3">Recent Hardware Scans</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] text-[#85858b]">
                <th className="pb-2.5 font-medium">Timestamp</th>
                <th className="pb-2.5 font-medium">Action</th>
                <th className="pb-2.5 font-medium">Component</th>
                <th className="pb-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {scanHistory.slice(0, 5).map((scan) => (
                <tr key={scan.id} className="hover:bg-white/[0.02]">
                  <td className="py-2.5 text-[#85858b] font-mono text-[11px]">
                    {new Date(scan.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2.5 text-[#ededed]">NFC Identification</td>
                  <td className="py-2.5 text-[#ededed] font-medium">{scan.label ?? 'Unknown tag'}</td>
                  <td className="py-2.5">
                    <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[#a1a1a6]">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          scan.success ? 'bg-[#4cc38a]' : 'bg-[#e5484d]'
                        }`}
                      />
                      {scan.success ? 'Identified' : 'Unknown'}
                    </span>
                  </td>
                </tr>
              ))}
              {scanHistory.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-[#85858b]">
                    No hardware scans recorded. Launch NFC Identification to emulate tag reads.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  suffix,
  tone = 'default',
}: {
  label: string;
  value: number | string;
  suffix: string;
  tone?: 'default' | 'success' | 'muted';
}) {
  const toneClass =
    tone === 'success' ? 'text-[#4cc38a]' : tone === 'muted' ? 'text-[#85858b]' : 'text-[#ededed]';
  return (
    <div className="bg-[#0f0f10] p-4 select-none">
      <div className="text-[11px] font-medium text-[#85858b]">{label}</div>
      <div className={`mt-1 text-2xl font-semibold font-mono tabular-nums tracking-tight ${toneClass}`}>
        {value}
      </div>
      <div className="text-[11px] text-[#85858b] mt-0.5">{suffix}</div>
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
  icon: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-[#19191b] border border-white/[0.08] rounded-md p-4 text-left hover:border-white/[0.16] hover:bg-[#1d1d20] transition-all group cursor-pointer"
    >
      <div className="w-8 h-8 rounded bg-[#141415] border border-white/[0.08] flex items-center justify-center mb-2.5 text-[#85858b] group-hover:text-[#38bdf8] transition-colors">
        {icon}
      </div>
      <h3 className="font-medium text-[#ededed] text-xs mb-1">{title}</h3>
      <p className="text-[11px] text-[#85858b] leading-relaxed">{description}</p>
    </button>
  );
}
