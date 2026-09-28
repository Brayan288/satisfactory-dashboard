import { useState, useEffect } from 'react'
import { Factory, Settings, Wifi, WifiOff, RefreshCw, Cpu, MemoryStick, Activity } from 'lucide-react'
import { NavLink } from 'react-router-dom'

interface ServerStats {
  ram_used: number
  ram_total: number
  ram_percent: number
  cpu_load: number
  cpu_cores: number
  cpu_percent: number
}

interface HeaderProps {
  isConnected: boolean
  lastUpdated: number | null
  alertCount: number
  onSettingsClick: () => void
  onRefresh: () => void
}

const navItems = [
  { to: '/power', label: 'Energía' },
  { to: '/generators', label: 'Generadores' },
  { to: '/production', label: 'Producción' },
  { to: '/extractors', label: 'Extractores' },
  { to: '/inventory', label: 'Inventario' },
  { to: '/transport', label: 'Transporte' },
  { to: '/map', label: 'Mapa' },
]

export function Header({
  isConnected,
  lastUpdated,
  alertCount,
  onSettingsClick,
  onRefresh,
}: HeaderProps) {
  const formatTime = (timestamp: number | null) => {
    if (!timestamp) return 'Nunca'
    const date = new Date(timestamp)
    return date.toLocaleTimeString()
  }

  const [serverStats, setServerStats] = useState<ServerStats | null>(null)
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const r = await fetch('/api/stats.json')
        if (r.ok) setServerStats(await r.json())
      } catch {}
    }
    fetchStats()
    const interval = setInterval(fetchStats, 5000)
    return () => clearInterval(interval)
  }, [])

  // Ping: medir latencia al servidor FRM
  const [ping, setPing] = useState<number | null>(null)
  useEffect(() => {
    const measurePing = async () => {
      const baseUrl = localStorage.getItem('frm-base-url') || 'http://80.190.78.17:8080'
      const start = performance.now()
      try {
        await fetch(`${baseUrl}/getSessionInfo`, { cache: 'no-store' })
        setPing(Math.round(performance.now() - start))
      } catch {
        setPing(null)
      }
    }
    measurePing()
    const interval = setInterval(measurePing, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        {/* Left: Logo + Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary/10">
            <Factory className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none text-foreground">
              Panel de Satisfactory
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Monitoreo Remoto Ficsit
            </p>
          </div>
        </div>

        {/* Center: Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right: Status + Controls */}
        <div className="flex items-center gap-3">
          {/* Connection Status */}
          <div className="flex items-center gap-2 rounded-full px-3 py-1.5 bg-secondary text-sm">
            {isConnected ? (
              <>
                <Wifi className="h-3.5 w-3.5 text-success" />
                <span className="hidden sm:inline text-success">Conectado</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5 text-danger" />
                <span className="hidden sm:inline text-danger">Desconectado</span>
              </>
            )}
          </div>

          {/* Last Updated */}
          <span className="hidden lg:inline text-xs text-muted-foreground">
            Actualizado: {formatTime(lastUpdated)}
          </span>

          {/* Server Stats */}
          {(serverStats || ping !== null) && (
            <div className="hidden md:flex items-center gap-2 rounded-full px-3 py-1.5 bg-secondary text-xs">
              {serverStats && (
                <>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Cpu className="h-3 w-3" />
                    <span className={serverStats.cpu_percent > 80 ? 'text-danger' : serverStats.cpu_percent > 50 ? 'text-warning' : 'text-success'}>
                      {serverStats.cpu_percent.toFixed(0)}%
                    </span>
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <MemoryStick className="h-3 w-3" />
                    <span className={serverStats.ram_percent > 80 ? 'text-danger' : serverStats.ram_percent > 50 ? 'text-warning' : 'text-success'}>
                      {serverStats.ram_percent.toFixed(0)}%
                    </span>
                    <span className="text-muted-foreground/60">{serverStats.ram_used}MB</span>
                  </span>
                </>
              )}
              {ping !== null && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Activity className="h-3 w-3" />
                  <span className={ping > 200 ? 'text-danger' : ping > 100 ? 'text-warning' : 'text-success'}>
                    {ping}ms
                  </span>
                </span>
              )}
            </div>
          )}

          {/* Alert Badge */}
          {alertCount > 0 && (
            <div className="flex items-center justify-center h-6 min-w-6 px-1.5 rounded-full bg-danger text-xs font-bold text-white">
              {alertCount}
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            className="flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent transition-colors"
            title="Actualizar datos"
          >
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </button>

          {/* Settings Button */}
          <button
            onClick={onSettingsClick}
            className="flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent transition-colors"
            title="Configuración"
          >
            <Settings className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <nav className="flex md:hidden items-center gap-1 px-4 pb-2 overflow-x-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}
