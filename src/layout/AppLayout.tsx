import { Outlet, useLocation } from 'react-router-dom'
import { TopNav } from '../components/TopNav'

const FULL_BLEED_ROUTES = ['/lab', '/designer', '/pcb', '/simulator', '/transient']

function AppLayout() {
  const { pathname } = useLocation()
  const isFullBleed = FULL_BLEED_ROUTES.some((route) => pathname.startsWith(route))

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#141415] text-[#ededed]">
      <TopNav />

      <main className="flex-1 min-w-0 flex flex-col relative overflow-hidden">
        {isFullBleed ? (
          <div className="flex-1 min-w-0 flex flex-col relative overflow-hidden">
            <Outlet />
          </div>
        ) : (
          <div className="flex-1 min-w-0 flex flex-col relative overflow-auto">
            <div className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
              <Outlet />
            </div>
            <footer className="border-t border-white/[0.06] py-3 text-center text-xs text-[#85858b] shrink-0">
              CircuitLab Edu · Interactive Electronics Laboratory
            </footer>
          </div>
        )}
      </main>
    </div>
  )
}

export default AppLayout
