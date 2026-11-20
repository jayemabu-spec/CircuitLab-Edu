import { Outlet } from 'react-router-dom'
import { TopNav } from '../components/TopNav'

function AppLayout() {
  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#0f172a] text-white">
      <TopNav />

      <main className="flex-1 min-w-0 flex flex-col relative overflow-hidden">
        <div className="flex-1 min-w-0 flex flex-col relative overflow-auto px-6 py-6">
          <Outlet />
        </div>
      </main>

      <footer className="border-t border-[#334155] py-2 text-center text-xs text-[#94a3b8]">
        CircuitLab Edu · Interactive Electronics Laboratory
      </footer>
    </div>
  )
}

export default AppLayout
