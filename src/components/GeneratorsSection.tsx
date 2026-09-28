import { useState, useMemo } from 'react'
import { Zap, Play, Pause, AlertCircle, Search, ArrowUpDown } from 'lucide-react'
import type { Generator } from '@/types/frm'
import { t } from '@/lib/translations'
import { formatClock, getClockTextColor } from '@/lib/utils'

/** Velocidad de reloj del generador: relación capacidad actual vs por defecto. */
function getGeneratorClock(g: Generator): number {
  const base = g.DefaultProductionCapacity || g.BaseProd || 0
  if (base <= 0) return 100
  return (g.ProductionCapacity / base) * 100
}

function getCircuitName(groupId: number): string {
  return groupId >= 0 ? `Circuito ${groupId}` : 'Sin conexión'
}

interface GeneratorsSectionProps {
  generators: Generator[]
}

type SortField = 'Name' | 'BaseProd' | 'Clock' | 'Load' | 'Fuel' | 'Power' | 'Circuit' | 'Status'
type SortDir = 'asc' | 'desc'
type StatusFilter = 'all' | 'fullspeed' | 'partial' | 'stopped'

export function GeneratorsSection({ generators }: GeneratorsSectionProps) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [circuitFilter, setCircuitFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>('Load')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const generatorTypes = useMemo(() => {
    const types = new Set(generators.map((g) => g.Name))
    return Array.from(types).sort()
  }, [generators])

  const circuits = useMemo(() => {
    const map = new Map<number, number>()
    for (const g of generators) {
      const gid = g.PowerInfo?.CircuitGroupID ?? -1
      if (gid >= 0 && !map.has(gid)) map.set(gid, g.PowerInfo?.CircuitID ?? -1)
    }
    return Array.from(map.entries())
      .map(([groupId, circuitId]) => ({ groupId, circuitId }))
      .sort((a, b) => a.groupId - b.groupId)
  }, [generators])

  const stats = useMemo(() => {
    const total = generators.length
    const fullSpeed = generators.filter((g) => g.IsFullSpeed).length
    const partial = generators.filter((g) => !g.IsFullSpeed && g.CanStart).length
    const stopped = total - fullSpeed - partial
    const totalCapacity = generators.reduce((sum, g) => sum + g.BaseProd, 0)
    const totalProducing = generators.reduce((sum, g) => sum + (g.BaseProd * g.LoadPercentage / 100), 0)

    return { total, fullSpeed, partial, stopped, totalCapacity, totalProducing }
  }, [generators])

  const filtered = useMemo(() => {
    let result = [...generators]

    if (search) {
      const q = search.toLowerCase()
      result = result.filter((g) => g.Name.toLowerCase().includes(q) || t(g.Name).toLowerCase().includes(q))
    }

    if (typeFilter !== 'all') {
      result = result.filter((g) => g.Name === typeFilter)
    }

    if (statusFilter !== 'all') {
      result = result.filter((g) => {
        switch (statusFilter) {
          case 'fullspeed': return g.IsFullSpeed
          case 'partial': return !g.IsFullSpeed && g.CanStart
          case 'stopped': return !g.IsFullSpeed && !g.CanStart
          default: return true
        }
      })
    }

    if (circuitFilter !== 'all') {
      const circuitId = parseInt(circuitFilter, 10)
      result = result.filter((g) => g.PowerInfo?.CircuitGroupID === circuitId)
    }

    result.sort((a, b) => {
      let aVal: string | number = ''
      let bVal: string | number = ''

      switch (sortField) {
        case 'Name': aVal = a.Name; bVal = b.Name; break
        case 'BaseProd': aVal = a.BaseProd; bVal = b.BaseProd; break
        case 'Clock': aVal = getGeneratorClock(a); bVal = getGeneratorClock(b); break
        case 'Load': aVal = a.LoadPercentage; bVal = b.LoadPercentage; break
        case 'Fuel': aVal = a.FuelAmount; bVal = b.FuelAmount; break
        case 'Power': aVal = a.BaseProd * a.LoadPercentage / 100; bVal = b.BaseProd * b.LoadPercentage / 100; break
        case 'Circuit':
          aVal = getCircuitName(a.PowerInfo?.CircuitGroupID ?? -1)
          bVal = getCircuitName(b.PowerInfo?.CircuitGroupID ?? -1)
          break
        case 'Status':
          aVal = a.IsFullSpeed ? 2 : a.CanStart ? 1 : 0
          bVal = b.IsFullSpeed ? 2 : b.CanStart ? 1 : 0
          break
      }

      if (typeof aVal === 'string') {
        const cmp = aVal.localeCompare(bVal as string)
        return sortDir === 'asc' ? cmp : -cmp
      }
      return sortDir === 'asc' ? aVal - (bVal as number) : (bVal as number) - aVal
    })

    return result
  }, [generators, search, typeFilter, statusFilter, circuitFilter, sortField, sortDir])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  if (generators.length === 0) {
    return (
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          <Zap className="h-5 w-5 text-success" />
          Generadores
        </h2>
        <div className="rounded-lg border border-border bg-card p-6 text-center">
          <p className="text-muted-foreground text-sm">No se detectaron generadores</p>
        </div>
      </section>
    )
  }

  return (
    <section>
      <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
        <Zap className="h-5 w-5 text-success" />
        Generadores
        <span className="ml-2 text-sm font-normal text-muted-foreground">
          {stats.totalProducing.toFixed(0)} / {stats.totalCapacity} MW
        </span>
      </h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <StatCard label="Total" value={stats.total} color="text-foreground" />
        <StatCard label="Full Speed" value={stats.fullSpeed} color="text-success" />
        <StatCard label="Parciales" value={stats.partial} color="text-warning" />
        <StatCard label="Detenidos" value={stats.stopped} color="text-danger" />
        <StatCard label="Capacidad" value={`${stats.totalCapacity} MW`} color="text-primary" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar generadores..."
            className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">Todos los tipos</option>
          {generatorTypes.map((type) => (
            <option key={type} value={type}>{t(type)}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">Todos los estados</option>
          <option value="fullspeed">Full Speed</option>
          <option value="partial">Parciales</option>
          <option value="stopped">Detenidos</option>
        </select>

        <select
          value={circuitFilter}
          onChange={(e) => setCircuitFilter(e.target.value)}
          className="appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">Todos los circuitos</option>
          {circuits.map((c) => (
            <option key={c.groupId} value={String(c.groupId)}>{getCircuitName(c.groupId)}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <SortHeader label="Generador" field="Name" current={sortField} dir={sortDir} onSort={handleSort} />
                <SortHeader label="Capacidad" field="BaseProd" current={sortField} dir={sortDir} onSort={handleSort} />
                <SortHeader label="Reloj" field="Clock" current={sortField} dir={sortDir} onSort={handleSort} />
                <SortHeader label="Carga" field="Load" current={sortField} dir={sortDir} onSort={handleSort} />
                <SortHeader label="Produciendo" field="Power" current={sortField} dir={sortDir} onSort={handleSort} />
                <SortHeader label="Combustible" field="Fuel" current={sortField} dir={sortDir} onSort={handleSort} />
                <SortHeader label="Circuito" field="Circuit" current={sortField} dir={sortDir} onSort={handleSort} />
                <SortHeader label="Estado" field="Status" current={sortField} dir={sortDir} onSort={handleSort} />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    No se encontraron generadores
                  </td>
                </tr>
              ) : (
                filtered.map((gen) => <GeneratorRow key={gen.ID} generator={gen} />)
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  )
}

function SortHeader({
  label, field, current, dir, onSort,
}: {
  label: string; field: SortField; current: SortField; dir: SortDir; onSort: (f: SortField) => void
}) {
  const isActive = current === field
  return (
    <th className="px-3 py-2.5 text-center font-medium text-muted-foreground whitespace-nowrap relative group" style={{ minWidth: 60 }}>
      <button
        onClick={() => onSort(field)}
        className="flex items-center justify-center gap-1 w-full hover:text-foreground transition-colors"
      >
        {label}
        <ArrowUpDown className={`h-3 w-3 ${isActive ? 'text-primary' : 'text-muted-foreground/50'}`} />
        {isActive && <span className="text-[10px] text-primary">{dir === 'asc' ? '↑' : '↓'}</span>}
      </button>
      <div
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/40 group-hover:bg-border"
        onMouseDown={(e) => {
          e.preventDefault()
          const th = e.currentTarget.parentElement!
          const startX = e.clientX
          const startWidth = th.offsetWidth
          const onMove = (ev: MouseEvent) => {
            const delta = ev.clientX - startX
            th.style.width = `${Math.max(60, startWidth + delta)}px`
          }
          const onUp = () => {
            document.removeEventListener('mousemove', onMove)
            document.removeEventListener('mouseup', onUp)
          }
          document.addEventListener('mousemove', onMove)
          document.addEventListener('mouseup', onUp)
        }}
      />
    </th>
  )
}

function GeneratorRow({ generator }: { generator: Generator }) {
  const [showPopup, setShowPopup] = useState(false)
  const loadPct = generator.LoadPercentage
  const producing = generator.BaseProd * loadPct / 100

  const getLoadColor = (pct: number) => {
    if (pct >= 80) return 'text-success'
    if (pct >= 50) return 'text-warning'
    return 'text-danger'
  }
  const getLoadBg = (pct: number) => {
    if (pct >= 80) return 'bg-success'
    if (pct >= 50) return 'bg-warning'
    return 'bg-danger'
  }

  return (
    <>
      <tr
        className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer"
        onClick={() => setShowPopup(true)}
      >
        <td className="px-3 py-2.5 font-medium text-foreground whitespace-nowrap">{t(generator.Name)}</td>
        <td className="px-3 py-2.5 text-foreground text-right tabular-nums">{generator.BaseProd} MW</td>
        <td className="px-3 py-2.5 text-right tabular-nums">
          <span className={`text-xs font-medium ${getClockTextColor(getGeneratorClock(generator))}`}>
            {formatClock(getGeneratorClock(generator))}
          </span>
        </td>
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-2 min-w-[100px]">
            <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
              <div className={`h-full rounded-full ${getLoadBg(loadPct)}`} style={{ width: `${Math.min(loadPct, 100)}%` }} />
            </div>
            <span className={`text-xs font-medium min-w-[36px] text-right ${getLoadColor(loadPct)}`}>{loadPct.toFixed(0)}%</span>
          </div>
        </td>
        <td className="px-3 py-2.5 text-foreground text-right tabular-nums">{producing.toFixed(1)} MW</td>
        <td className="px-3 py-2.5 text-foreground text-right tabular-nums">{(generator.FuelAmount * 100).toFixed(0)}%</td>
        <td className="px-3 py-2.5 text-foreground text-sm whitespace-nowrap">{getCircuitName(generator.PowerInfo?.CircuitGroupID ?? -1)}</td>
        <td className="px-3 py-2.5">
          {generator.IsFullSpeed ? (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-success/10 text-success">
              <Play className="h-3 w-3" /> Full Speed
            </span>
          ) : generator.CanStart ? (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-warning/10 text-warning">
              <Pause className="h-3 w-3" /> Parcial
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-danger/10 text-danger">
              <AlertCircle className="h-3 w-3" /> Detenido
            </span>
          )}
        </td>
      </tr>

      {showPopup && (
        <tr><td colSpan={8} className="p-0">
          <div className="fixed inset-0 z-[200] flex items-center justify-center" onClick={() => setShowPopup(false)}>
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative w-full max-w-md mx-4 rounded-xl border border-border bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowPopup(false)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">✕</button>
              <h3 className="text-lg font-semibold text-foreground mb-1">{t(generator.Name)}</h3>
              <p className="text-sm text-muted-foreground mb-4">Tipo: {generator.FuelResource}</p>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Capacidad</span>
                  <span className="text-foreground font-medium">{generator.BaseProd} MW</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Produciendo</span>
                  <span className="text-foreground font-medium">{producing.toFixed(1)} MW</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Carga</span>
                  <span className={`font-bold ${getLoadColor(loadPct)}`}>{loadPct.toFixed(1)}%</span>
                </div>
                <div style={{background:'#1e293b',borderRadius:4,height:8,overflow:'hidden'}}>
                  <div style={{background: loadPct >= 80 ? '#22c55e' : loadPct >= 50 ? '#eab308' : '#ef4444', height:'100%', width:`${Math.min(loadPct,100)}%`, borderRadius:4}} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Combustible</span>
                  <span className="text-foreground">{(generator.FuelAmount * 100).toFixed(0)}%</span>
                </div>
                {generator.Supplement && generator.Supplement.Name !== 'N/A' && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t(generator.Supplement.Name)}</span>
                    <span className="text-foreground">{generator.Supplement.PercentFull.toFixed(0)}%</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Circuito</span>
                  <span className="text-foreground">{getCircuitName(generator.PowerInfo?.CircuitGroupID ?? -1)}</span>
                </div>
              </div>

              {generator.FuelInventory && generator.FuelInventory.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Inventario de combustible</h4>
                  <div className="space-y-1.5">
                    {generator.FuelInventory.map((item: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{t(item.Name)}</span>
                        <span className="text-muted-foreground tabular-nums">{item.Amount}/{item.MaxAmount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-border flex items-center justify-end">
                <a
                  href={`/map?focus=${generator.location.x},${generator.location.y}&id=${generator.ID}`}
                  className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  📍 Ver en mapa
                </a>
              </div>
            </div>
          </div>
        </td></tr>
      )}
    </>
  )
}

