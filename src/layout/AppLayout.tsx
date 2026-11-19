import { useState, useRef, useEffect } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { TopNav } from '../components/TopNav'

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

function AppLayout() {
  const [paneWidth, setPaneWidth] = useState(300)
  const [isResizing, setIsResizing] = useState(false)
  const sRef = useRef<HTMLDivElement>(null)
  const spRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef(0)
  const startWidthRef = useRef(300)
  const location = useLocation()

  // LocalStorage read with NaN fallback
  useEffect(() => {
    const stored = localStorage.getItem('cl_pw')
    if (stored) {
      const parsed = parseInt(stored, 10)
      setPaneWidth(isNaN(parsed) ? 300 : parsed)
    }
  }, [])

  // LocalStorage write
  useEffect(() => {
    localStorage.setItem('cl_pw', paneWidth.toString())
  }, [paneWidth])

  // Drag-to-resize listeners
  useEffect(() => {
    if (!isResizing) return
    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = startWidthRef.current + (e.clientX - startXRef.current)
      const clamped = Math.min(600, Math.max(200, newWidth))
      setPaneWidth(clamped)
    }
    const handleMouseUp = () => {
      setIsResizing(false)
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  const handleDividerMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true)
    startXRef.current = e.clientX
    startWidthRef.current = paneWidth
  }

  const sidebarStyle: React.CSSProperties = { width: `${paneWidth}px` }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#0f172a] text-white">
      <TopNav />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <aside
          ref={sRef}
          className="bg-[#1e293b] border-r border-[#334155] transition-all duration-300 shrink-0 flex-shrink-0 overflow-y-auto"
          style={sidebarStyle}
        >
          <nav className="h-full p-4 space-y-1">
            {navItems.map((it) => (
              <NavLink
                key={it.path}
                to={it.path}
                className={
                  location.pathname === it.path
                    ? 'bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/30 rounded-lg px-3 py-2 text-sm font-medium block'
                    : 'text-[#94a3b8] hover:text-white hover:bg-[#334155] rounded-lg px-3 py-2 text-sm block'
                }
              >
                {it.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <div
          ref={spRef}
          onMouseDown={handleDividerMouseDown}
          className="w-1 cursor-col-resize bg-[#334155] hover:bg-[#38bdf8] flex-shrink-0"
          style={{ userSelect: isResizing ? 'none' : 'auto' }}
        />

        <main className="flex-1 min-w-0 flex flex-col relative overflow-hidden">
          <div className="flex-1 min-w-0 flex flex-col relative overflow-auto px-6 pt-6">
            <Outlet />
          </div>
        </main>
      </div>

      <div className="border-t border-[#334155] py-2 text-center text-xs text-[#94a3b8]">
        CircuitLab Edu · Interactive Electronics Laboratory
      </div>
    </div>
  )
}

export default AppLayout