import { useState } from 'react'
import { X, RotateCcw } from 'lucide-react'
import type { Settings } from '@/hooks/useSettings'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  settings: Settings
  onSave: (partial: Partial<Settings>) => void
  onReset: () => void
}

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSave,
  onReset,
}: SettingsModalProps) {
  const [baseUrl, setBaseUrl] = useState(settings.baseUrl)
  const [pollingInterval, setPollingInterval] = useState(
    String(settings.pollingInterval)
  )
  const [chartHeightCircuit, setChartHeightCircuit] = useState(
    String(settings.chartHeightCircuit)
  )
  const [chartHeightTrends, setChartHeightTrends] = useState(
    String(settings.chartHeightTrends)
  )

  if (!isOpen) return null

  const handleSave = () => {
    const interval = parseInt(pollingInterval, 10)
    const circuitH = parseInt(chartHeightCircuit, 10)
    const trendsH = parseInt(chartHeightTrends, 10)
    onSave({
      baseUrl: baseUrl.trim(),
      pollingInterval: isNaN(interval) || interval < 500 ? 1000 : interval,
      chartHeightCircuit: isNaN(circuitH) || circuitH < 64 ? 128 : circuitH,
      chartHeightTrends: isNaN(trendsH) || trendsH < 64 ? 176 : trendsH,
    })
    onClose()
  }

  const handleReset = () => {
    onReset()
    setBaseUrl('http://80.190.78.17:8080')
    setPollingInterval('1000')
    setChartHeightCircuit('128')
    setChartHeightTrends('176')
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 rounded-xl border border-border bg-card p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">Configuración</h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* API URL */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              URL de la API
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              Dirección del servidor FRM (ej. http://ejemplo:8080 o /)
            </p>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="http://80.190.78.17:8080"
            />
          </div>

          {/* Polling Interval */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Velocidad de consulta (ms)
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              Con qué frecuencia consultar al servidor (mínimo 500ms)
            </p>
            <input
              type="number"
              value={pollingInterval}
              onChange={(e) => setPollingInterval(e.target.value)}
              min={500}
              step={100}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="1000"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restablecer
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="rounded-md px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
