import { Zap, AlertTriangle, Battery, BatteryCharging } from 'lucide-react'
import type { PowerCircuit } from '@/types/frm'
import type { HistoryEntry } from '@/hooks/useDashboardData'
import { PowerMiniChart } from './PowerMiniChart'

interface PowerSectionProps {
  circuits: PowerCircuit[]
  history: HistoryEntry[]
  chartHeight?: number
}

export function PowerSection({ circuits, history, chartHeight }: PowerSectionProps) {
  if (circuits.length === 0) {
    return (
      <section>
        <SectionHeader />
        <div className="rounded-lg border border-border bg-card p-6 text-center">
          <p className="text-muted-foreground text-sm">No se detectaron circuitos de energía</p>
        </div>
      </section>
    )
  }

  // Aggregate totals
  const totalProduction = circuits.reduce((sum, c) => sum + c.PowerProduction, 0)
  const totalConsumed = circuits.reduce((sum, c) => sum + c.PowerConsumed, 0)
  const totalCapacity = circuits.reduce((sum, c) => sum + c.PowerCapacity, 0)
  const totalMaxConsumed = circuits.reduce((sum, c) => sum + c.PowerMaxConsumed, 0)
  const anyFuseTriggered = circuits.some((c) => c.FuseTriggered)
  const totalBatteryCapacity = circuits.reduce((sum, c) => sum + c.BatteryCapacity, 0)
  const avgBatteryPercent =
    circuits.length > 0
      ? circuits.reduce((sum, c) => sum + c.BatteryPercent, 0) / circuits.length
      : 0

  return (
    <section>
      <SectionHeader fuseTriggered={anyFuseTriggered} />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <SummaryCard
          label="Producción"
          value={formatMW(totalProduction)}
          icon={<Zap className="h-4 w-4 text-success" />}
        />
        <SummaryCard
          label="Consumo"
          value={formatMW(totalConsumed)}
          icon={<Zap className="h-4 w-4 text-warning" />}
        />
        <SummaryCard
          label="Capacidad"
          value={formatMW(totalCapacity)}
          icon={<Zap className="h-4 w-4 text-blue-400" />}
        />
        <SummaryCard
          label="Batería"
          value={`${avgBatteryPercent.toFixed(0)}%`}
          icon={
            totalBatteryCapacity > 0 ? (
              <BatteryCharging className="h-4 w-4 text-primary" />
            ) : (
              <Battery className="h-4 w-4 text-muted-foreground" />
            )
          }
        />
      </div>

      {/* Circuit Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...circuits].sort((a, b) => a.CircuitGroupID - b.CircuitGroupID).map((circuit) => (
          <CircuitCard key={circuit.CircuitGroupID} circuit={circuit} history={history} chartHeight={chartHeight} />
        ))}
      </div>
    </section>
  )
}

function SectionHeader({ fuseTriggered }: { fuseTriggered?: boolean }) {
  return (
    <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
      <Zap className="h-5 w-5 text-primary" />
      Energía
      {fuseTriggered && (
        <span className="ml-2 flex items-center gap-1 text-xs font-medium text-danger bg-danger/10 rounded-full px-2 py-0.5">
          <AlertTriangle className="h-3 w-3" />
          FUSIBLE ACTIVADO
        </span>
      )}
    </h2>
  )
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-lg font-bold text-foreground">{value}</p>
    </div>
  )
}

function CircuitCard({
  circuit,
  history,
  chartHeight,
}: {
  circuit: PowerCircuit
  history: HistoryEntry[]
  chartHeight?: number
}) {
  const name = `Circuito ${circuit.CircuitGroupID}`

  const usagePercent =
    circuit.PowerCapacity > 0
      ? (circuit.PowerConsumed / circuit.PowerCapacity) * 100
      : 0

  const getUsageColor = (percent: number) => {
    if (percent >= 95 || circuit.FuseTriggered) return 'bg-danger'
    if (percent >= 80) return 'bg-warning'
    return 'bg-success'
  }

  const getUsageTextColor = (percent: number) => {
    if (percent >= 95 || circuit.FuseTriggered) return 'text-danger'
    if (percent >= 80) return 'text-warning'
    return 'text-success'
  }

  return (
    <div
      className={`rounded-lg border bg-card p-4 transition-colors ${
        circuit.FuseTriggered ? 'border-danger/50 bg-danger/5' : 'border-border'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">{name}</span>
        </div>
        {circuit.FuseTriggered && (
          <span className="text-xs font-bold text-danger flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            FUSIBLE
          </span>
        )}
      </div>

      {/* Usage Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">Carga</span>
          <span className={`text-xs font-medium ${getUsageTextColor(usagePercent)}`}>
            {usagePercent.toFixed(1)}%
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${getUsageColor(usagePercent)}`}
            style={{ width: `${Math.min(usagePercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground">Producción</span>
          <p className="font-medium text-foreground">{formatMW(circuit.PowerProduction)}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Consumo</span>
          <p className="font-medium text-foreground">{formatMW(circuit.PowerConsumed)}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Capacidad</span>
          <p className="font-medium text-foreground">{formatMW(circuit.PowerCapacity)}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Consumo Máx</span>
          <p className="font-medium text-foreground">{formatMW(circuit.PowerMaxConsumed)}</p>
        </div>
      </div>

      {/* Battery info (if available) */}
      {circuit.BatteryCapacity > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <BatteryCharging className="h-3 w-3" />
              Batería
            </span>
            <span className="text-xs font-medium text-foreground">
              {circuit.BatteryPercent.toFixed(0)}%
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-400 transition-all duration-500"
              style={{ width: `${circuit.BatteryPercent}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
            <span>Vacía: {circuit.BatteryTimeEmpty}</span>
            <span>Llena: {circuit.BatteryTimeFull}</span>
          </div>
        </div>
      )}

      {/* Mini Trend Chart */}
      <div className="mt-3 pt-3 border-t border-border">
        <PowerMiniChart circuitId={circuit.CircuitGroupID} history={history} height={chartHeight} />
      </div>
    </div>
  )
}

function formatMW(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)} GW`
  }
  if (value >= 1) {
    return `${value.toFixed(1)} MW`
  }
  return `${(value * 1000).toFixed(0)} kW`
}
