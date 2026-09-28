import { useState, useCallback } from 'react'

export interface Settings {
  baseUrl: string
  pollingInterval: number // ms
  chartHeightCircuit: number // px
  chartHeightTrends: number // px
}

const STORAGE_KEY = 'frm-dashboard-settings'

const DEFAULT_SETTINGS: Settings = {
  baseUrl: 'http://80.190.78.17:8080',
  pollingInterval: 1000,
  chartHeightCircuit: 128,
  chartHeightTrends: 176,
}

function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return { ...DEFAULT_SETTINGS, ...parsed }
    }
  } catch {
    // ignore parse errors
  }
  return DEFAULT_SETTINGS
}

function saveSettings(settings: Settings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  // Also keep the base URL in sync for the api module
  localStorage.setItem('frm-base-url', settings.baseUrl)
}

export function useSettings() {
  const [settings, setSettingsState] = useState<Settings>(loadSettings)

  const updateSettings = useCallback((partial: Partial<Settings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...partial }
      saveSettings(next)
      return next
    })
  }, [])

  const resetSettings = useCallback(() => {
    saveSettings(DEFAULT_SETTINGS)
    setSettingsState(DEFAULT_SETTINGS)
  }, [])

  return { settings, updateSettings, resetSettings }
}
