import { AlertTriangle, XCircle, Bell, BellOff } from 'lucide-react'
import type { Alert } from '@/hooks/useAlerts'
import { useState } from 'react'

interface AlertsPanelProps {
  alerts: Alert[]
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const visibleAlerts = alerts.filter((a) => !dismissed.has(a.id))
  const errorCount = visibleAlerts.filter((a) => a.severity === 'error').length
  const warningCount = visibleAlerts.filter((a) => a.severity === 'warning').length

  const dismissAlert = (id: string) => {
    setDismissed((prev) => new Set([...prev, id]))
  }

  const dismissAll = () => {
    setDismissed(new Set(alerts.map((a) => a.id)))
  }

  if (alerts.length === 0) {
    return (
      <section>
        <SectionHeader errorCount={0} warningCount={0} />
        <div className="rounded-lg border border-border bg-card p-6 text-center">
          <Bell className="h-8 w-8 mx-auto text-success mb-2 opacity-50" />
          <p className="text-muted-foreground text-sm">
            Todos los sistemas operativos. Sin alertas.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <SectionHeader errorCount={errorCount} warningCount={warningCount} />
        {visibleAlerts.length > 0 && (
          <button
            onClick={dismissAll}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <BellOff className="h-3.5 w-3.5" />
            Descartar todas
          </button>
        )}
      </div>

      {visibleAlerts.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <p className="text-muted-foreground text-sm">
            Todas las alertas descartadas. {alerts.length} alerta{alerts.length > 1 ? 's' : ''} aún activa{alerts.length > 1 ? 's' : ''}.
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {visibleAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onDismiss={() => dismissAlert(alert.id)}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function SectionHeader({
  errorCount,
  warningCount,
}: {
  errorCount: number
  warningCount: number
}) {
  return (
    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
      <AlertTriangle className="h-5 w-5 text-danger" />
      Alertas
      {errorCount > 0 && (
        <span className="flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-danger text-[10px] font-bold text-white">
          {errorCount}
        </span>
      )}
      {warningCount > 0 && (
        <span className="flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-warning text-[10px] font-bold text-primary-foreground">
          {warningCount}
        </span>
      )}
    </h2>
  )
}

function AlertCard({
  alert,
  onDismiss,
}: {
  alert: Alert
  onDismiss: () => void
}) {
  const isError = alert.severity === 'error'

  return (
    <div
      className={`rounded-lg border p-3 transition-colors ${
        isError
          ? 'border-danger/40 bg-danger/5'
          : 'border-warning/40 bg-warning/5'
      }`}
    >
      <div className="flex items-start gap-2">
        <div className="mt-0.5">
          {isError ? (
            <XCircle className="h-4 w-4 text-danger" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-warning" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`text-sm font-medium ${
                isError ? 'text-danger' : 'text-warning'
              }`}
            >
              {alert.title}
            </span>
            <button
              onClick={onDismiss}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
              title="Descartar"
            >
              <BellOff className="h-3 w-3" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {alert.description}
          </p>
        </div>
      </div>
    </div>
  )
}
