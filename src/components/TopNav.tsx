import { NavLink } from 'react-router-dom'
import { Cpu } from 'lucide-react'

const navItems = [
  { path: '/', label: 'Dashboard' },
  { path: '/lab', label: '3D Lab' },
  { path: '/designer', label: 'Designer' },
  { path: '/library', label: 'Library' },
  { path: '/simulator', label: 'Simulator' },
  { path: '/transient', label: 'Transient' },
  { path: '/nfc', label: 'NFC' },
  { path: '/measurements', label: 'Measurements' },
  { path: '/experiments', label: 'Experiments' },
  { path: '/pcb', label: 'PCB' },
  { path: '/settings', label: 'Settings' },
]

export function TopNav() {
  return (
    <header className="flex items-center justify-between h-12 px-4 bg-[#0f0f10] border-b border-white/[0.08] shrink-0 select-none">
      <div className="flex items-center gap-6">
        <NavLink to="/" className="flex items-center gap-2 group">
          <div className="w-6 h-6 rounded flex items-center justify-center bg-white/[0.06] border border-white/[0.08] text-[#38bdf8] group-hover:border-white/[0.16] transition-colors">
            <Cpu size={14} strokeWidth={1.75} />
          </div>
          <span className="text-sm font-medium tracking-tight text-[#ededed]">
            CircuitLab
          </span>
          <span className="text-[10px] font-mono tracking-wider uppercase text-[#85858b] bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">
            Edu
          </span>
        </NavLink>

        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-[#232325] text-[#ededed] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                    : 'text-[#85858b] hover:text-[#ededed] hover:bg-white/[0.04]'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3 text-xs text-[#85858b]">
        <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] text-[#85858b] bg-white/[0.02] px-2 py-1 rounded border border-white/[0.06]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4cc38a]" />
          <span>v1.0 Ready</span>
        </div>
      </div>
    </header>
  )
}
