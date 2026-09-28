import { useState, useEffect, useRef, useCallback } from 'react'
import { fetchAllDashboardData, type DashboardData } from '@/lib/api'

export interface HistoryEntry {
  timestamp: number
  power: { production: number; consumed: number; capacity: number }
  circuits: Record<number, { production: number; consumed: number }>
  factoryEfficiency: number
  extractorEfficiency: number
}

export interface DashboardState {
  data: DashboardData | null
  history: HistoryEntry[]
  loading: boolean
  error: string | null
  lastUpdated: number | null
  isConnected: boolean
}

/**
 * Main dashboard data hook.
 * Polls all FRM endpoints at the configured interval and maintains
 * a circular buffer of history entries (last 5 minutes).
 *
 * Important: If an endpoint temporarily returns empty data but previously
 * had data, we keep the previous values to avoid UI flickering.
 */
export function useDashboardData(baseUrl: string, pollingInterval: number) {
  const [state, setState] = useState<DashboardState>({
    data: null,
    history: [],
    loading: true,
    error: null,
    lastUpdated: null,
    isConnected: false,
  })

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isMountedRef = useRef(true)

  // Calculate max history entries: keep last 60 entries max (1 per polling interval)
  const maxHistoryEntries = 60

  const fetchData = useCallback(async () => {
    try {
      const data = await fetchAllDashboardData(baseUrl)
      const now = Date.now()

      if (!isMountedRef.current) return

      setState((prev) => {
        // Merge: keep previous data for any endpoint that returned empty
        // but only if we previously had data for it (avoids flicker)
        const mergedData: DashboardData = {
          factory:
            data.factory.length > 0
              ? data.factory
              : (prev.data?.factory ?? []),
          power:
            data.power.length > 0
              ? data.power
              : (prev.data?.power ?? []),
          storage:
            data.storage.length > 0
              ? data.storage
              : (prev.data?.storage ?? []),
          extractors:
            data.extractors.length > 0
              ? data.extractors
              : (prev.data?.extractors ?? []),
          generators:
            data.generators.length > 0
              ? data.generators
              : (prev.data?.generators ?? []),
        }

        // Add to history buffer (circular) — only if we have real data
        const hasAnyData =
          mergedData.factory.length > 0 ||
          mergedData.power.length > 0 ||
          mergedData.storage.length > 0 ||
          mergedData.extractors.length > 0 ||
          mergedData.generators.length > 0

        let history = prev.history
        if (hasAnyData) {
          // Only store aggregated metrics in history (not full data) to avoid memory leaks
          const totalPower = mergedData.power.reduce((s, c) => s + c.PowerProduction, 0)
          const totalConsumed = mergedData.power.reduce((s, c) => s + c.PowerConsumed, 0)
          const totalCapacity = mergedData.power.reduce((s, c) => s + c.PowerCapacity, 0)

          // Historial por circuito individual
          const circuits: Record<number, { production: number; consumed: number }> = {}
          for (const c of mergedData.power) {
            circuits[c.CircuitGroupID] = {
              production: c.PowerProduction,
              consumed: c.PowerConsumed,
            }
          }

          const factoryCount = mergedData.factory.length
          const factoryEfficiency = factoryCount > 0
            ? mergedData.factory.reduce((s, f) => s + (f.Productivity ?? 0), 0) / factoryCount
            : 0

          const extractorCount = mergedData.extractors.length
          const extractorEfficiency = extractorCount > 0
            ? mergedData.extractors.reduce((s, e) => {
                const prod = e.production?.[0]
                return s + (prod ? prod.ProdPercent : 0)
              }, 0) / extractorCount
            : 0

          const newEntry: HistoryEntry = {
            timestamp: now,
            power: { production: totalPower, consumed: totalConsumed, capacity: totalCapacity },
            circuits,
            factoryEfficiency,
            extractorEfficiency,
          }
          history = [...prev.history, newEntry]

          // Trim to max size
          if (history.length > maxHistoryEntries) {
            history.splice(0, history.length - maxHistoryEntries)
          }
        }

        return {
          data: mergedData,
          history,
          loading: false,
          error: null,
          lastUpdated: now,
          isConnected: true,
        }
      })
    } catch (err) {
      if (!isMountedRef.current) return

      // On error, keep previous data but mark as disconnected
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Connection failed',
        isConnected: false,
      }))
    }
  }, [baseUrl, maxHistoryEntries])

  // Start/stop polling
  useEffect(() => {
    isMountedRef.current = true

    // Fetch immediately
    fetchData()

    // Set up interval
    intervalRef.current = setInterval(fetchData, pollingInterval)

    return () => {
      isMountedRef.current = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [fetchData, pollingInterval])

  // Manual refresh
  const refresh = useCallback(() => {
    fetchData()
  }, [fetchData])

  return {
    ...state,
    refresh,
  }
}
