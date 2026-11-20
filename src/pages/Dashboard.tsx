import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCircuitStore } from '../stores/circuitStore';
import { useNFCStore } from '../stores/nfcStore';
import { LAB_EXPERIMENTS } from '../experiments/lab3dExperiments';
import { Database, Activity, Power, PlugZap, Battery, Play, FlaskConical, Search } from 'lucide-react';

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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-sm text-charcoal-400 mt-1">
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
            <Power size={18} />
            New 3D Circuit
          </button>
          <button className="btn-secondary" onClick={() => navigate('/lab')}>
            <Play size={18} />
            Open 3D Lab
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-charcoal-700 border border-charcoal-700 rounded-lg overflow-hidden">
        <Metric label="Components placed" value={componentCount} suffix="in the circuit" />
        <Metric label="Wires connected" value={wireCount} suffix="terminals linked" />
        <Metric
          label="Circuit status"
          value={componentCount > 0 ? 'Active' : 'Empty'}
          suffix={componentCount > 0 ? 'ready to simulate' : 'no circuit loaded'}
          tone={componentCount > 0 ? 'success' : 'muted'}
        />
        <Metric label="NFC scans" value={scanHistory.length} suffix="tags identified" />
      </div>

      <section className="panel">
        <h2 className="text-base font-semibold text-white mb-1">Example circuits</h2>
        <p className="text-sm text-charcoal-400 mb-4">
          Click a circuit to load it into the 3D laboratory. All components and connections are pre-built.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {LAB_EXPERIMENTS.slice(0, 6).map((exp) => (
            <button
              key={exp.id}
              onClick={() => loadExample(exp.id)}
              className="bg-charcoal-900 border border-charcoal-700 rounded-lg p-4 text-left hover:border-charcoal-500 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-2">
                <FlaskConical className="w-4 h-4 text-charcoal-400" />
                <span className="font-medium text-white text-sm">{exp.title}</span>
              </div>
              <p className="text-xs text-charcoal-400">{exp.objective}</p>
              <div className="mt-2 text-xs text-charcoal-400 flex items-center gap-1 group-hover:text-white transition-colors">
                <Play size={12} /> Load &amp; test
              </div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold text-white mb-3">Quick start</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <QuickStartCard
            title="Ohm's Law Experiment"
            description="Verify V = I × R with a simple resistor circuit."
            icon={<PlugZap className="w-5 h-5" />}
            onClick={() => navigate('/experiments')}
          />
          <QuickStartCard
            title="Series Circuit"
            description="Build resistors in series and measure voltage drops."
            icon={<Battery className="w-5 h-5" />}
            onClick={() => navigate('/experiments')}
          />
          <QuickStartCard
            title="Parallel Circuit"
            description="Build resistors in parallel and observe current division."
            icon={<Activity className="w-5 h-5" />}
            onClick={() => navigate('/experiments')}
          />
          <QuickStartCard
            title="RC Transient"
            description="Observe capacitor charging and discharging curves."
            icon={<Activity className="w-5 h-5" />}
            onClick={() => navigate('/transient')}
          />
          <QuickStartCard
            title="NFC Identification"
            description="Scan virtual NFC tags to identify components."
            icon={<Search className="w-5 h-5" />}
            onClick={() => navigate('/nfc')}
          />
          <QuickStartCard
            title="Virtual Instruments"
            description="Use voltmeter, ammeter, and ohmmeter."
            icon={<Database className="w-5 h-5" />}
            onClick={() => navigate('/measurements')}
          />
        </div>
      </section>

      <section className="panel">
        <h2 className="text-base font-semibold text-white mb-4">Recent activity</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-charcoal-700 text-charcoal-400">
                <th className="pb-3 font-medium">Time</th>
                <th className="pb-3 font-medium">Action</th>
                <th className="pb-3 font-medium">Component</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {scanHistory.slice(0, 5).map((scan) => (
                <tr key={scan.id} className="border-b border-charcoal-700 last:border-0">
                  <td className="py-3 text-charcoal-300">
                    {new Date(scan.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-3 text-white">NFC Scan</td>
                  <td className="py-3 text-white">{scan.label ?? 'Unknown tag'}</td>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-1.5 text-xs text-charcoal-300">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          scan.success ? 'bg-success' : 'bg-destructive'
                        }`}
                      />
                      {scan.success ? 'Identified' : 'Unknown'}
                    </span>
                  </td>
                </tr>
              ))}
              {scanHistory.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-charcoal-400">
                    No recent scans. Visit NFC Identification to scan tags.
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
    tone === 'success' ? 'text-success' : tone === 'muted' ? 'text-charcoal-400' : 'text-white';
  return (
    <div className="bg-charcoal-800 px-5 py-4">
      <div className="text-xs font-medium text-charcoal-400">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${toneClass}`}>{value}</div>
      <div className="text-xs text-charcoal-400">{suffix}</div>
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
      className="panel p-5 text-left cursor-pointer hover:border-charcoal-500 transition-colors group"
    >
      <div className="w-9 h-9 rounded-md bg-charcoal-900 border border-charcoal-700 flex items-center justify-center mb-3 text-charcoal-400 group-hover:text-white transition-colors">
        {icon}
      </div>
      <h3 className="font-medium text-white mb-1">{title}</h3>
      <p className="text-xs text-charcoal-400">{description}</p>
    </button>
  );
}
