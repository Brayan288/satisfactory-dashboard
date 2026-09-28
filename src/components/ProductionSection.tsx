import { useState, useMemo } from 'react'
import {
  Factory,
  Play,
  Pause,
  AlertCircle,
  Search,
  ArrowUpDown,
  Filter,
} from 'lucide-react'
import type { FactoryBuilding } from '@/types/frm'
import { t } from '@/lib/translations'
import { formatClock, getClockTextColor } from '@/lib/utils'

function getCircuitName(groupId: number): string {
  return groupId >= 0 ? `Circuito ${groupId}` : 'Sin conexión'
}

interface ProductionSectionProps {
  factories: FactoryBuilding[]
}

type SortField = 'Name' | 'Recipe' | 'Efficiency' | 'Clock' | 'CurrentProd' | 'MaxProd' | 'Power' | 'Circuit' | 'Status'
type SortDir = 'asc' | 'desc'
type StatusFilter = 'all' | 'producing' | 'paused' | 'idle' | 'unconfigured'

export function ProductionSection({ factories }: ProductionSectionProps) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [circuitFilter, setCircuitFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>('Efficiency')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  // Get unique machine types
  const machineTypes = useMemo(() => {
    const types = new Set(factories.map((f) => f.Name))
    return Array.from(types).sort()
  }, [factories])

  // Get unique circuits (con GroupID para filtrar y CircuitID para el nombre)
  const circuits = useMemo(() => {
    const map = new Map<number, number>() // groupId -> circuitId
    for (const f of factories) {
      const gid = f.PowerInfo?.CircuitGroupID ?? -1
      if (gid >= 0 && !map.has(gid)) map.set(gid, f.PowerInfo?.CircuitID ?? -1)
    }
    return Array.from(map.entries())
      .map(([groupId, circuitId]) => ({ groupId, circuitId }))
      .sort((a, b) => a.groupId - b.groupId)
  }, [factories])

  // Summary stats
  const stats = useMemo(() => {
    const total = factories.length
    const producing = factories.filter((f) => f.IsProducing).length
    const paused = factories.filter((f) => f.IsPaused).length
    const unconfigured = factories.filter((f) => !f.IsConfigured).length
    const idle = total - producing - paused - unconfigured

    const avgEfficiency =
      factories.length > 0
        ? factories.reduce((sum, f) => {
            const eff = getEfficiency(f)
            return sum + eff
          }, 0) / factories.filter((f) => f.IsConfigured).length || 0
        : 0

    return { total, producing, paused, unconfigured, idle, avgEfficiency }
  }, [factories])

  // Filtered + sorted data
  const filteredData = useMemo(() => {
    let result = [...factories]

    // Search filter
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (f) =>
          f.Name.toLowerCase().includes(q) ||
          t(f.Name).toLowerCase().includes(q) ||
          f.Recipe.toLowerCase().includes(q) ||
          t(f.Recipe).toLowerCase().includes(q) ||
          f.production.some((p) => p.Name.toLowerCase().includes(q) || t(p.Name).toLowerCase().includes(q))
      )
    }

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter((f) => f.Name === typeFilter)
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((f) => {
        switch (statusFilter) {
          case 'producing':
            return f.IsProducing
          case 'paused':
            return f.IsPaused
          case 'idle':
            return !f.IsProducing && !f.IsPaused && f.IsConfigured
          case 'unconfigured':
            return !f.IsConfigured
          default:
            return true
        }
      })
    }

    // Circuit filter
    if (circuitFilter !== 'all') {
      const circuitId = parseInt(circuitFilter, 10)
      result = result.filter((f) => f.PowerInfo?.CircuitGroupID === circuitId)
    }

    // Sort
    result.sort((a, b) => {
      let aVal: string | number = ''
      let bVal: string | number = ''

      switch (sortField) {
        case 'Name':
          aVal = a.Name
          bVal = b.Name
          break
        case 'Recipe':
          aVal = a.Recipe
          bVal = b.Recipe
          break
        case 'Efficiency':
          aVal = getEfficiency(a)
          bVal = getEfficiency(b)
          break
        case 'Clock':
          aVal = a.ManuSpeed ?? 100
          bVal = b.ManuSpeed ?? 100
          break
        case 'CurrentProd':
          aVal = a.production[0]?.CurrentProd ?? 0
          bVal = b.production[0]?.CurrentProd ?? 0
          break
        case 'MaxProd':
          aVal = a.production[0]?.MaxProd ?? 0
          bVal = b.production[0]?.MaxProd ?? 0
          break
        case 'Power':
          aVal = a.PowerInfo?.PowerConsumed ?? 0
          bVal = b.PowerInfo?.PowerConsumed ?? 0
          break
        case 'Circuit':
          aVal = getCircuitName(a.PowerInfo?.CircuitGroupID ?? -1)
          bVal = getCircuitName(b.PowerInfo?.CircuitGroupID ?? -1)
          break
        case 'Status':
          aVal = getStatusOrder(a)
          bVal = getStatusOrder(b)
          break
      }

      if (typeof aVal === 'string') {
        const cmp = aVal.localeCompare(bVal as string)
        return sortDir === 'asc' ? cmp : -cmp
      }
      return sortDir === 'asc' ? aVal - (bVal as number) : (bVal as number) - aVal
    })

    return result
  }, [factories, search, typeFilter, statusFilter, sortField, sortDir])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  if (factories.length === 0) {
    return (
      <section>
        <SectionHeader avgEfficiency={0} />
        <div className="rounded-lg border border-border bg-card p-6 text-center">
          <p className="text-muted-foreground text-sm">No se detectaron edificios de producción</p>
        </div>
      </section>
    )
  }

  return (
    <section>
      <SectionHeader avgEfficiency={stats.avgEfficiency} />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <StatCard label="Total" value={stats.total} color="text-foreground" />
        <StatCard label="Produciendo" value={stats.producing} color="text-success" />
        <StatCard label="Inactivas" value={stats.idle} color="text-warning" />
        <StatCard label="Pausadas" value={stats.paused} color="text-muted-foreground" />
        <StatCard label="Sin receta" value={stats.unconfigured} color="text-danger" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar máquinas o recetas..."
            className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Type filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="appearance-none rounded-md border border-input bg-background pl-8 pr-8 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">Todos los tipos</option>
            {machineTypes.map((type) => (
              <option key={type} value={type}>
                {t(type)}
              </option>
            ))}
          </select>
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">Todos los estados</option>
          <option value="producing">Produciendo</option>
          <option value="idle">Inactivas</option>
          <option value="paused">Pausadas</option>
          <option value="unconfigured">Sin receta</option>
        </select>

        {/* Circuit filter */}
        <select
          value={circuitFilter}
          onChange={(e) => setCircuitFilter(e.target.value)}
          className="appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">Todos los circuitos</option>
          {circuits.map((c) => (
            <option key={c.groupId} value={String(c.groupId)}>
              {getCircuitName(c.groupId)}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <SortableHeader
                  label="Máquina"
                  field="Name"
                  currentField={sortField}
                  currentDir={sortDir}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Receta"
                  field="Recipe"
                  currentField={sortField}
                  currentDir={sortDir}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Eficiencia"
                  field="Efficiency"
                  currentField={sortField}
                  currentDir={sortDir}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Reloj"
                  field="Clock"
                  currentField={sortField}
                  currentDir={sortDir}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Actual/min"
                  field="CurrentProd"
                  currentField={sortField}
                  currentDir={sortDir}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Máx/min"
                  field="MaxProd"
                  currentField={sortField}
                  currentDir={sortDir}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Consumo MW"
                  field="Power"
                  currentField={sortField}
                  currentDir={sortDir}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Circuito"
                  field="Circuit"
                  currentField={sortField}
                  currentDir={sortDir}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Estado"
                  field="Status"
                  currentField={sortField}
                  currentDir={sortDir}
                  onSort={handleSort}
                />
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                    Ninguna máquina coincide con los filtros actuales
                  </td>
                </tr>
              ) : (
                filteredData.slice(0, 100).map((factory) => (
                  <FactoryRow key={factory.ID} factory={factory} />
                ))
              )}
            </tbody>
          </table>
        </div>
        {filteredData.length > 100 && (
          <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground text-center">
            Mostrando 100 de {filteredData.length} máquinas
          </div>
        )}
      </div>
    </section>
  )
}

function SectionHeader({ avgEfficiency }: { avgEfficiency: number }) {
  return (
    <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
      <Factory className="h-5 w-5 text-primary" />
      Producción
      <span className="ml-2 text-sm font-normal text-muted-foreground">
        Eficiencia Prom.: {avgEfficiency.toFixed(1)}%
      </span>
    </h2>
  )
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  )
}

function SortableHeader({
  label,
  field,
  currentField,
  currentDir,
  onSort,
}: {
  label: string
  field: SortField
  currentField: SortField
  currentDir: SortDir
  onSort: (field: SortField) => void
}) {
  const isActive = currentField === field
  return (
    <th className="px-3 py-2.5 text-center font-medium text-muted-foreground whitespace-nowrap relative group" style={{ minWidth: 60 }}>
      <button
        onClick={() => onSort(field)}
        className="flex items-center justify-center gap-1 w-full hover:text-foreground transition-colors"
      >
        {label}
        <ArrowUpDown
          className={`h-3 w-3 ${isActive ? 'text-primary' : 'text-muted-foreground/50'}`}
        />
        {isActive && (
          <span className="text-[10px] text-primary">
            {currentDir === 'asc' ? '↑' : '↓'}
          </span>
        )}
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

function FactoryRow({ factory }: { factory: FactoryBuilding }) {
  const [showPopup, setShowPopup] = useState(false)
  const efficiency = getEfficiency(factory)
  const status = getStatus(factory)
  const mainProduct = factory.production[0]

  return (
    <>
      <tr
        className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer"
        onClick={() => setShowPopup(true)}
      >
        {/* Machine */}
        <td className="px-3 py-2.5 font-medium text-foreground whitespace-nowrap">
          {t(factory.Name)}
        </td>

        {/* Recipe */}
        <td className="px-3 py-2.5 text-foreground whitespace-nowrap">
          {factory.Recipe ? t(factory.Recipe) : <span className="text-muted-foreground italic">Ninguna</span>}
        </td>

        {/* Efficiency */}
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-2 min-w-[120px]">
            <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getEfficiencyColor(efficiency)}`}
                style={{ width: `${Math.min(efficiency, 100)}%` }}
              />
            </div>
            <span
              className={`text-xs font-medium min-w-[40px] text-right ${getEfficiencyTextColor(efficiency)}`}
            >
              {efficiency.toFixed(0)}%
            </span>
          </div>
        </td>

        {/* Clock speed */}
        <td className="px-3 py-2.5 text-right tabular-nums">
          <span className={`text-xs font-medium ${getClockTextColor(factory.ManuSpeed ?? 100)}`}>
            {formatClock(factory.ManuSpeed ?? 100)}
          </span>
        </td>

        {/* Current Prod */}
        <td className="px-3 py-2.5 text-foreground text-right tabular-nums">
          {mainProduct ? mainProduct.CurrentProd.toFixed(1) : '-'}
        </td>

        {/* Max Prod */}
        <td className="px-3 py-2.5 text-muted-foreground text-right tabular-nums">
          {mainProduct ? mainProduct.MaxProd.toFixed(1) : '-'}
        </td>

        {/* Power */}
        <td className="px-3 py-2.5 text-foreground text-right tabular-nums">
          {factory.PowerInfo?.PowerConsumed?.toFixed(1) ?? '-'} <span className="text-muted-foreground text-xs">MW</span>
        </td>

        {/* Circuit */}
        <td className="px-3 py-2.5 text-foreground text-sm whitespace-nowrap">
          {getCircuitName(factory.PowerInfo?.CircuitGroupID ?? -1)}
        </td>

        {/* Status */}
        <td className="px-3 py-2.5">
          <StatusBadge status={status} />
        </td>
      </tr>

      {/* Popup Modal */}
      {showPopup && (
        <tr><td colSpan={9} className="p-0">
          <div className="fixed inset-0 z-[200] flex items-center justify-center" onClick={() => setShowPopup(false)}>
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative w-full max-w-md mx-4 rounded-xl border border-border bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowPopup(false)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">✕</button>
              <h3 className="text-lg font-semibold text-foreground mb-1">{t(factory.Name)}</h3>
              <p className="text-sm text-muted-foreground mb-4">Receta: {factory.Recipe ? t(factory.Recipe) : 'Ninguna'}</p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Input */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">⬇ Entrada</h4>
                  {factory.InputInventory && factory.InputInventory.length > 0 ? (
                    <div className="space-y-1.5">
                      {factory.InputInventory.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <img
                            src={`/item-icons/${item.Name.replace(/ /g, '_')}.png`}
                            alt=""
                            className="w-5 h-5 object-contain"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                          />
                          <span className="text-foreground flex-1">{t(item.Name)}</span>
                          <span className="text-muted-foreground tabular-nums">{item.Amount}/{item.MaxAmount}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Vacío</p>
                  )}
                </div>

                {/* Output */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">⬆ Salida</h4>
                  {factory.OutputInventory && factory.OutputInventory.length > 0 ? (
                    <div className="space-y-1.5">
                      {factory.OutputInventory.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <img
                            src={`/item-icons/${item.Name.replace(/ /g, '_')}.png`}
                            alt=""
                            className="w-5 h-5 object-contain"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                          />
                          <span className="text-foreground flex-1">{t(item.Name)}</span>
                          <span className="text-muted-foreground tabular-nums">{item.Amount}/{item.MaxAmount}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Vacío</p>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between">
                <span className={`text-sm font-medium ${getEfficiencyTextColor(efficiency)}`}>Eficiencia: {efficiency.toFixed(1)}%</span>
                <a
                  href={`/map?focus=${factory.location.x},${factory.location.y}&id=${factory.ID}`}
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

function StatusBadge({ status }: { status: ReturnType<typeof getStatus> }) {
  const config = {
    producing: {
      icon: <Play className="h-3 w-3" />,
      label: 'Produciendo',
      classes: 'bg-success/10 text-success',
    },
    paused: {
      icon: <Pause className="h-3 w-3" />,
      label: 'Pausada',
      classes: 'bg-muted text-muted-foreground',
    },
    idle: {
      icon: <AlertCircle className="h-3 w-3" />,
      label: 'Inactiva',
      classes: 'bg-warning/10 text-warning',
    },
    unconfigured: {
      icon: <AlertCircle className="h-3 w-3" />,
      label: 'Sin receta',
      classes: 'bg-danger/10 text-danger',
    },
  }

  const c = config[status]
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${c.classes}`}
    >
      {c.icon}
      {c.label}
    </span>
  )
}

// --- Helpers ---

function getEfficiency(factory: FactoryBuilding): number {
  if (!factory.IsConfigured) return 0
  const prod = factory.production[0]
  if (!prod || prod.MaxProd === 0) return 0
  return prod.ProdPercent
}

function getStatus(factory: FactoryBuilding) {
  if (!factory.IsConfigured) return 'unconfigured' as const
  if (factory.IsPaused) return 'paused' as const
  if (factory.IsProducing) return 'producing' as const
  return 'idle' as const
}

function getStatusOrder(factory: FactoryBuilding): number {
  const status = getStatus(factory)
  switch (status) {
    case 'unconfigured':
      return 0
    case 'idle':
      return 1
    case 'paused':
      return 2
    case 'producing':
      return 3
  }
}

function getEfficiencyColor(efficiency: number): string {
  if (efficiency >= 90) return 'bg-success'
  if (efficiency >= 50) return 'bg-warning'
  return 'bg-danger'
}

function getEfficiencyTextColor(efficiency: number): string {
  if (efficiency >= 90) return 'text-success'
  if (efficiency >= 50) return 'text-warning'
  return 'text-danger'
}

