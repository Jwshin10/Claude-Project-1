import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import './index.css'
import { HomePage } from './pages/HomePage'
import { PlanPage } from './pages/PlanPage'
import { SettingsPage } from './pages/SettingsPage'

// Ask the browser not to evict our IndexedDB data under storage pressure.
// Everything lives on this device, so this matters more than usual.
void navigator.storage?.persist?.()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Hash routing works on any static host without server rewrites. */}
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="plan/:planId" element={<PlanPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </HashRouter>
  </StrictMode>,
)
