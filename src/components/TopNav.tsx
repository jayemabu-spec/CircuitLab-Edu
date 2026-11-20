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
    <nav className="flex items-stretch h-14 px-4 bg-charcoal-900 border-b border-charcoal-700 flex-shrink-0">
      <span className="flex items-center font-bold text-xl tracking-tight text-white mr-6 shrink-0">
        CircuitLab<span className="text-[#38bdf8]">Edu</span>
      </span>
      <div className="flex items-stretch gap-1 h-full overflow-x-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-3 text-sm border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-[#38bdf8] text-white font-medium'
                  : 'border-transparent text-[#94a3b8] hover:text-white'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
