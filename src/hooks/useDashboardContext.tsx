import { createContext, useContext, type ReactNode } from 'react'
import { useDashboardData } from '@/hooks/useDashboardData'
import { useSettings } from '@/hooks/useSettings'
import type { DashboardData } from '@/lib/api'
import type { HistoryEntry } from '@/hooks/useDashboardData'

interface DashboardContextValue {
  data: DashboardData | null
  history: HistoryEntry[]
  loading: boolean
  isConnected: boolean
  lastUpdated: number | null
  refresh: () => void
}

const DashboardContext = createContext<DashboardContextValue | null>(null)

export function DashboardProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings()
  const { data, history, loading, isConnected, lastUpdated, refresh } =
    useDashboardData(settings.baseUrl, settings.pollingInterval)

  return (
    <DashboardContext.Provider
      value={{ data, history, loading, isConnected, lastUpdated, refresh }}
    >
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext)
  if (!ctx) {
    throw new Error('useDashboard must be used within a DashboardProvider')
  }
  return ctx
}
