import { useMemo } from 'react'
import type { DashboardData } from '@/lib/api'

export type AlertSeverity = 'error' | 'warning'

export interface Alert {
  id: string
  severity: AlertSeverity
  title: string
  description: string
  timestamp: number
}

/**
 * Generates alerts based on current dashboard data.
 * Alerts are recalculated on each data update.
 */
export function useAlerts(data: DashboardData | null): Alert[] {
  return useMemo(() => {
    if (!data) return []

    const alerts: Alert[] = []
    const now = Date.now()

    // 1. Fuse triggered on any power circuit
    for (const circuit of data.power) {
      if (circuit.FuseTriggered) {
        alerts.push({
          id: `fuse-${circuit.CircuitGroupID}`,
          severity: 'error',
          title: 'Fusible Activado',
          description: `El circuito ${circuit.CircuitGroupID} ha saltado el fusible. Sin energía.`,
          timestamp: now,
        })
      }
    }

    // 2. Power overload (>90% capacity)
    for (const circuit of data.power) {
      if (circuit.PowerCapacity > 0 && !circuit.FuseTriggered) {
        const usage = (circuit.PowerConsumed / circuit.PowerCapacity) * 100
        if (usage >= 90) {
          alerts.push({
            id: `power-overload-${circuit.CircuitGroupID}`,
            severity: 'warning',
            title: 'Riesgo de Sobrecarga',
            description: `Circuito ${circuit.CircuitGroupID} al ${usage.toFixed(0)}% de capacidad (${circuit.PowerConsumed.toFixed(1)}/${circuit.PowerCapacity.toFixed(1)} MW).`,
            timestamp: now,
          })
        }
      }
    }

    // 3. Low battery (<20%)
    for (const circuit of data.power) {
      if (circuit.BatteryCapacity > 0 && circuit.BatteryPercent < 20) {
        alerts.push({
          id: `battery-low-${circuit.CircuitGroupID}`,
          severity: 'warning',
          title: 'Batería Baja',
          description: `Batería del circuito ${circuit.CircuitGroupID} al ${circuit.BatteryPercent.toFixed(0)}%. Tiempo hasta vacía: ${circuit.BatteryTimeEmpty}.`,
          timestamp: now,
        })
      }
    }

    // 4. Machines stopped (not paused, configured but not producing = starved)
    const stoppedMachines = data.factory.filter(
      (f) => f.IsConfigured && !f.IsPaused && !f.IsProducing
    )
    if (stoppedMachines.length > 0) {
      // Group by recipe to avoid alert spam
      const byRecipe = new Map<string, number>()
      for (const m of stoppedMachines) {
        const key = m.Recipe || 'Unknown'
        byRecipe.set(key, (byRecipe.get(key) || 0) + 1)
      }

      for (const [recipe, count] of byRecipe.entries()) {
        alerts.push({
          id: `machines-idle-${recipe}`,
          severity: 'warning',
          title: 'Máquinas Inactivas',
          description: `${count} máquina${count > 1 ? 's' : ''} produciendo "${recipe}" detenida${count > 1 ? 's' : ''} (¿faltan ingredientes?).`,
          timestamp: now,
        })
      }
    }

    // 5. Low efficiency factories (<50% and configured + producing)
    const lowEfficiency = data.factory.filter((f) => {
      if (!f.IsConfigured || f.IsPaused) return false
      const prod = f.production[0]
      if (!prod || prod.MaxProd === 0) return false
      return prod.ProdPercent < 50 && prod.ProdPercent > 0
    })
    if (lowEfficiency.length > 5) {
      alerts.push({
        id: 'low-efficiency-many',
        severity: 'warning',
        title: 'Baja Eficiencia',
        description: `${lowEfficiency.length} máquinas funcionando por debajo del 50% de eficiencia.`,
        timestamp: now,
      })
    }

    // 6. Extractors stopped (not paused)
    const stoppedExtractors = data.extractors.filter(
      (e) => e.IsConfigured && !e.IsPaused && !e.IsProducing
    )
    if (stoppedExtractors.length > 0) {
      alerts.push({
        id: 'extractors-stopped',
        severity: 'warning',
        title: 'Extractores Detenidos',
        description: `${stoppedExtractors.length} extractor${stoppedExtractors.length > 1 ? 'es' : ''} dejó de producir.`,
        timestamp: now,
      })
    }

    // Sort: errors first, then warnings
    alerts.sort((a, b) => {
      if (a.severity === 'error' && b.severity !== 'error') return -1
      if (a.severity !== 'error' && b.severity === 'error') return 1
      return 0
    })

    return alerts
  }, [data])
}
