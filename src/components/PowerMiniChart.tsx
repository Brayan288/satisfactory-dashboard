import { useMemo, useState, useCallback, useRef } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { HistoryEntry } from '@/hooks/useDashboardData'

interface PowerMiniChartProps {
  circuitId: number
  history: HistoryEntry[]
  height?: number
}

export function PowerMiniChart({ circuitId, history, height: initialHeight = 128 }: PowerMiniChartProps) {
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
    return history
      .filter((entry) => entry.circuits && entry.circuits[circuitId])
      .map((entry) => ({
        time: entry.timestamp,
        production: entry.circuits[circuitId].production,
        consumed: entry.circuits[circuitId].consumed,
      }))
  }, [history, circuitId])

  if (chartData.length < 2) {
    return (
      <div style={{ height }} className="flex items-center justify-center relative">
        <span className="text-xs text-muted-foreground">
          Recopilando datos...
        </span>
        <div
          onMouseDown={handleMouseDown}
          className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-primary/20 rounded-b"
        />
      </div>
    )
  }

  return (
    <div style={{ height }} className="relative">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <XAxis dataKey="time" hide />
          <YAxis hide domain={['dataMin', 'dataMax']} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#12121a',
              border: '1px solid #2e2e3e',
              borderRadius: '6px',
              fontSize: '11px',
            }}
            labelFormatter={(value) => new Date(value as number).toLocaleTimeString()}
            formatter={(value) => [`${Number(value).toFixed(1)} MW`]}
          />
          <Line
            type="monotone"
            dataKey="production"
            stroke="#22c55e"
            strokeWidth={1.5}
            dot={false}
            name="Producción"
          />
          <Line
            type="monotone"
            dataKey="consumed"
            stroke="#f59e0b"
            strokeWidth={1.5}
            dot={false}
            name="Consumo"
          />
        </LineChart>
      </ResponsiveContainer>
      {/* Drag handle */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-primary/20 transition-colors flex items-center justify-center"
      >
        <div className="w-8 h-0.5 rounded bg-muted-foreground/30" />
      </div>
    </div>
  )
}
