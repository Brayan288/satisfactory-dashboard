import { useMemo, useState, useRef, useCallback } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { TrendingUp, HelpCircle } from 'lucide-react'
import type { HistoryEntry } from '@/hooks/useDashboardData'

interface EfficiencyChartProps {
  history: HistoryEntry[]
  height?: number
}

export function EfficiencyChart({ history, height: initialHeight = 260 }: EfficiencyChartProps) {
  const [height, setHeight] = useState(initialHeight)
  const isDragging = useRef(false)
  const startY = useRef(0)
  const startHeight = useRef(0)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true
    startY.current = e.clientY
    startHeight.current = height
    e.preventDefault()

    const handleMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current) return
      const delta = ev.clientY - startY.current
      setHeight(Math.max(64, Math.min(500, startHeight.current + delta)))
    }

    const handleMouseUp = () => {
      isDragging.current = false
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [height])
  const chartData = useMemo(() => {
    return history.map((entry) => {
      const powerUsage = entry.power.capacity > 0
        ? (entry.power.consumed / entry.power.capacity) * 100
        : 0

      return {
        time: entry.timestamp,
        factoryEfficiency: entry.factoryEfficiency,
        powerUsage,
        extractorEfficiency: entry.extractorEfficiency,
      }
    })
  }, [history])

  if (chartData.length < 3) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            Tendencias de Fábrica (5 min)
          </h3>
        </div>
        <div className="h-40 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Recopilando datos para tendencias... ({chartData.length}/3 puntos)
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">
          Tendencias de Fábrica
        </h3>
        <div className="relative group">
          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
          <div className="absolute left-0 top-6 z-50 hidden group-hover:block w-72 p-3 rounded-lg border border-border bg-card shadow-xl text-xs text-muted-foreground leading-relaxed">
            <p className="mb-1.5"><strong className="text-foreground">Efic. Fábrica</strong> — Promedio de eficiencia de todas las máquinas de producción.</p>
            <p className="mb-1.5"><strong className="text-foreground">Uso Energía</strong> — Porcentaje de la capacidad eléctrica total consumida.</p>
            <p><strong className="text-foreground">Efic. Extractores</strong> — Promedio de eficiencia de todos los miners/extractores.</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
            Efic. Fábrica
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#f59e0b]" />
            Uso Energía
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#818cf8]" />
            Efic. Extractores
          </span>
        </div>
      </div>
      <div style={{ height }} className="relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 5, right: 5, bottom: 5, left: 0 }}
          >
            <defs>
              <linearGradient id="gradFactory" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradPower" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradExtractor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2e2e3e" />
            <XAxis
              dataKey="time"
              tickFormatter={(val) => new Date(val).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' })}
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              axisLine={{ stroke: '#2e2e3e' }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              axisLine={{ stroke: '#2e2e3e' }}
              tickLine={false}
              tickFormatter={(val) => `${val}%`}
              width={40}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#12121a',
                border: '1px solid #2e2e3e',
                borderRadius: '8px',
                fontSize: '11px',
              }}
              labelFormatter={(value) =>
                new Date(value as number).toLocaleTimeString()
              }
              formatter={(value, name) => {
                const labels: Record<string, string> = {
                  factoryEfficiency: 'Efic. Fábrica',
                  powerUsage: 'Uso Energía',
                  extractorEfficiency: 'Efic. Extractores',
                }
                return [`${Number(value).toFixed(1)}%`, labels[String(name)] || String(name)]
              }}
            />
            <Area
              type="monotone"
              dataKey="factoryEfficiency"
              stroke="#22c55e"
              strokeWidth={2}
              fill="url(#gradFactory)"
              dot={false}
              animationDuration={300}
            />
            <Area
              type="monotone"
              dataKey="powerUsage"
              stroke="#f59e0b"
              strokeWidth={2}
              fill="url(#gradPower)"
              dot={false}
              animationDuration={300}
            />
            <Area
              type="monotone"
              dataKey="extractorEfficiency"
              stroke="#818cf8"
              strokeWidth={2}
              fill="url(#gradExtractor)"
              dot={false}
              animationDuration={300}
            />
          </AreaChart>
        </ResponsiveContainer>
        {/* Drag handle */}
        <div
          onMouseDown={handleMouseDown}
          className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-primary/20 transition-colors flex items-center justify-center"
        >
          <div className="w-8 h-0.5 rounded bg-muted-foreground/30" />
        </div>
      </div>
    </div>
  )
}
