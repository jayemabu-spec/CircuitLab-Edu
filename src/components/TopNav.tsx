import { NavLink } from 'react-router-dom'

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
    <nav className="flex items-center h-14 px-4 bg-charcoal-900 border-b border-charcoal-700 flex-shrink-0">
      <span className="font-bold text-xl tracking-tight text-white mr-6">
        CircuitLab<span className="text-[#38bdf8]">Edu</span>
      </span>
      <div className="flex items-center gap-1 overflow-x-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              isActive
                ? 'text-[#38bdf8] font-medium bg-[#38bdf8]/10 px-3 py-2 rounded-md text-sm'
                : 'text-[#94a3b8] hover:text-white hover:bg-[#334155] px-3 py-2 rounded-md text-sm transition-colors'
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}