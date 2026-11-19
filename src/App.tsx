import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import AppLayout from './layout/AppLayout'
import { Dashboard } from './pages/Dashboard'
import { Lab3D } from './pages/Lab3D'
import { CircuitDesigner } from './pages/CircuitDesigner'
import { ComponentLibrary } from './pages/ComponentLibrary'
import { CircuitSimulator } from './pages/CircuitSimulator'
import { TransientAnalysis } from './pages/TransientAnalysis'
import { Measurements } from './pages/Measurements'
import { NFCIdentification } from './pages/NFCIdentification'
import { Experiments } from './pages/Experiments'
import { Settings } from './pages/Settings'
import { PCBDesigner } from './pages/PCBDesigner'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/lab" element={<Lab3D />} />
          <Route path="/designer" element={<CircuitDesigner />} />
          <Route path="/library" element={<ComponentLibrary />} />
          <Route path="/simulator" element={<CircuitSimulator />} />
          <Route path="/transient" element={<TransientAnalysis />} />
          <Route path="/measurements" element={<Measurements />} />
          <Route path="/nfc" element={<NFCIdentification />} />
          <Route path="/experiments" element={<Experiments />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/pcb" element={<PCBDesigner />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)