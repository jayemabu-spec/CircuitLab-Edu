
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CircuitBoard,
  Box,
  Package,
  Play,
  Activity,
  Search,
  BarChart3,
  FlaskConical,
  Settings,
  Menu,
  ChevronLeft,
} from 'lucide-react';
import { CircuitLabLogo } from './Logo';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/lab', label: '3D Electronics Lab', icon: Box },
  { path: '/designer', label: 'Circuit Designer', icon: CircuitBoard },
  { path: '/library', label: 'Component Library', icon: Package },
  { path: '/simulator', label: 'Circuit Simulator', icon: Play },
  { path: '/transient', label: 'Transient Analysis', icon: Activity },
  { path: '/nfc', label: 'NFC Identification', icon: Search },
  { path: '/measurements', label: 'Measurements', icon: BarChart3 },
  { path: '/experiments', label: 'Experiments', icon: FlaskConical },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const location = useLocation();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-20 transition-all duration-300 ${
        collapsed
          ? 'w-16 md:w-16'
          : 'w-64 md:w-64'
      } bg-[#1e293b] border-r border-[#334155]`}
    >
      <div className="flex items-center justify-between h-12 px-4 bg-[#1e293b] border-b border-[#334155]">
        {collapsed ? (
          <button onClick={onToggle} className="text-[#38bdf8] hover:text-[#38bdf8]/90">
            <Menu size={20} />
          </button>
        ) : (
          <>
            <CircuitLabLogo className="mr-2" />
            <span className="font-bold text-xl tracking-tight text-white">CircuitLab<span className="text-[#38bdf8]">Edu</span></span>
            <button onClick={onToggle} className="ml-auto text-[#64748b] hover:text-white">
              <ChevronLeft size={20} />
            </button>
          </>
        )}
      </div>

      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/30'
                  : 'text-[#94a3b8] hover:text-white hover:bg-[#334155]'
              }`}
            >
              <Icon size={18} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-4 border-t border-[#334155]">
        <button
          onClick={onToggle}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#94a3b8] hover:text-white hover:bg-[#334155] transition-colors"
        >
          <Settings size={18} />
          <span className={collapsed ? 'hidden' : 'block'}>Settings</span>
        </button>
      </div>
    </aside>
  );
}
