import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Header } from '@/components/Header'
import { SettingsModal } from '@/components/SettingsModal'
import { useSettings } from '@/hooks/useSettings'
import { DashboardProvider, useDashboard } from '@/hooks/useDashboardContext'
import { PowerPage } from '@/pages/PowerPage'
import { ProductionPage } from '@/pages/ProductionPage'
import { ExtractorsPage } from '@/pages/ExtractorsPage'
import { InventoryPage } from '@/pages/InventoryPage'
import { GeneratorsPage } from '@/pages/GeneratorsPage'
import { TransportPage } from '@/pages/TransportPage'
import { MapPage } from '@/pages/MapPage'

function AppContent() {
  const { settings, updateSettings, resetSettings } = useSettings()
  const { isConnected, lastUpdated, refresh } = useDashboard()
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header
        isConnected={isConnected}
        lastUpdated={lastUpdated}
        alertCount={0}
        onSettingsClick={() => setSettingsOpen(true)}
        onRefresh={refresh}
      />

      <main className="p-4 md:p-6 max-w-[1600px] mx-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/power" replace />} />
          <Route path="/power" element={<PowerPage />} />
          <Route path="/production" element={<ProductionPage />} />
          <Route path="/extractors" element={<ExtractorsPage />} />
          <Route path="/generators" element={<GeneratorsPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/transport" element={<TransportPage />} />
          <Route path="/map" element={<MapPage />} />
        </Routes>
      </main>

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSave={updateSettings}
        onReset={resetSettings}
      />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <DashboardProvider>
        <AppContent />
      </DashboardProvider>
    </BrowserRouter>
  )
}

export default App
