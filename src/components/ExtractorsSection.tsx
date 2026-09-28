import { useMemo, useState } from 'react'
import { Pickaxe, Play, Pause, AlertCircle, Search, ArrowUpDown } from 'lucide-react'
import type { Extractor } from '@/types/frm'
import { t } from '@/lib/translations'
import { formatClock, getClockTextColor } from '@/lib/utils'

function getCircuitName(groupId: number): string {
  return groupId >= 0 ? `Circuito ${groupId}` : 'Sin conexión'
}

interface ExtractorsSectionProps {
  extractors: Extractor[]
}

export function ExtractorsSection({ extractors }: ExtractorsSectionProps) {
  const stats = useMemo(() => {
    const total = extractors.length
    const producing = extractors.filter((e) => e.IsProducing).length
    const paused = extractors.filter((e) => e.IsPaused).length
    const idle = total - producing - paused

    const avgEfficiency =
      extractors.length > 0
        ? extractors.reduce((sum, e) => sum + (e.production[0]?.ProdPercent ?? 0), 0) /
          extractors.length
        : 0

    return { total, producing, paused, idle, avgEfficiency }
  }, [extractors])

  // Group by resource
  const groupedByResource = useMemo(() => {
    const map = new Map<string, Extractor[]>()
    for (const ext of extractors) {
      const resource = ext.Recipe || 'Unknown'
      if (!map.has(resource)) map.set(resource, [])
      map.get(resource)!.push(ext)
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [extractors])

  if (extractors.length === 0) {
    return (
      <section>
        <SectionHeader avgEfficiency={0} />
        <div className="rounded-lg border border-border bg-card p-6 text-center">
          <p className="text-muted-foreground text-sm">No se detectaron extractores</p>
        </div>
      </section>
    )
  }

  return (
    <section>
      <SectionHeader avgEfficiency={stats.avgEfficiency} />

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <MiniStat label="Total Mineros" value={stats.total} color="text-foreground" />
        <MiniStat label="Produciendo" value={stats.producing} color="text-success" />
        <MiniStat label="Inactivos" value={stats.idle} color="text-warning" />
        <MiniStat label="Pausados" value={stats.paused} color="text-muted-foreground" />
      </div>

      {/* Resource Groups */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groupedByResource.map(([resource, miners]) => (
          <ResourceCard key={resource} resource={resource} miners={miners} />
        ))}
      </div>

      {/* Detail Table */}
      <ExtractorTable extractors={extractors} />
    </section>
  )
}

function SectionHeader({ avgEfficiency }: { avgEfficiency: number }) {
  return (
    <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
      <Pickaxe className="h-5 w-5 text-warning" />
      Extractores
      <span className="ml-2 text-sm font-normal text-muted-foreground">
        Eficiencia Prom.: {avgEfficiency.toFixed(1)}%
      </span>
    </h2>
  )
}

function MiniStat({
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

function ResourceCard({
  resource,
  miners,
}: {
  resource: string
  miners: Extractor[]
}) {
  const totalCurrentProd = miners.reduce(
    (sum, m) => sum + (m.production[0]?.CurrentProd ?? 0),
    0
  )
  const totalMaxProd = miners.reduce(
    (sum, m) => sum + (m.production[0]?.MaxProd ?? 0),
    0
  )
  const avgEfficiency =
    miners.length > 0
      ? miners.reduce((sum, m) => sum + (m.production[0]?.ProdPercent ?? 0), 0) /
        miners.length
      : 0
  const allProducing = miners.every((m) => m.IsProducing)
  const someIdle = miners.some((m) => !m.IsProducing && !m.IsPaused)

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Pickaxe className="h-4 w-4 text-warning" />
          <span className="font-medium text-foreground text-sm">{t(resource)}</span>
        </div>
        <span className="text-xs text-muted-foreground">{miners.length} mineros</span>
      </div>

      {/* Efficiency Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">Eficiencia</span>
          <span
            className={`text-xs font-medium ${getEffColor(avgEfficiency)}`}
          >
            {avgEfficiency.toFixed(1)}%
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${getEffBgColor(avgEfficiency)}`}
            style={{ width: `${Math.min(avgEfficiency, 100)}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground">Actual/min</span>
          <p className="font-medium text-foreground">{totalCurrentProd.toFixed(1)}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Máx/min</span>
          <p className="font-medium text-foreground">{totalMaxProd.toFixed(1)}</p>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
        {allProducing ? (
          <span className="flex items-center gap-1 text-xs text-success">
            <Play className="h-3 w-3" />
            Todos activos
          </span>
        ) : someIdle ? (
          <span className="flex items-center gap-1 text-xs text-warning">
            <AlertCircle className="h-3 w-3" />
            Algunos inactivos
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Pause className="h-3 w-3" />
            Pausados
          </span>
        )}
      </div>
    </div>
  )
}

function getEffColor(eff: number): string {
  if (eff >= 90) return 'text-success'
  if (eff >= 50) return 'text-warning'
  return 'text-danger'
}

function getEffBgColor(eff: number): string {
  if (eff >= 90) return 'bg-success'
  if (eff >= 50) return 'bg-warning'
  return 'bg-danger'
}

// --- Detail Table ---

type ExtSortField = 'Name' | 'Resource' | 'Efficiency' | 'Clock' | 'CurrentProd' | 'MaxProd' | 'Power' | 'Circuit' | 'Status'
type SortDir = 'asc' | 'desc'
type ExtStatusFilter = 'all' | 'producing' | 'paused' | 'idle'

function ExtractorTable({ extractors }: { extractors: Extractor[] }) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<ExtStatusFilter>('all')
  const [circuitFilter, setCircuitFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<ExtSortField>('Efficiency')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const extractorTypes = useMemo(() => {
    const types = new Set(extractors.map((e) => e.Name))
    return Array.from(types).sort()
  }, [extractors])

  const resourceTypes = useMemo(() => {
    const types = new Set(extractors.map((e) => e.Recipe))
    return Array.from(types).sort()
  }, [extractors])

  const circuits = useMemo(() => {
    const map = new Map<number, number>()
    for (const e of extractors) {
      const gid = e.PowerInfo?.CircuitGroupID ?? -1
      if (gid >= 0 && !map.has(gid)) map.set(gid, e.PowerInfo?.CircuitID ?? -1)
    }
    return Array.from(map.entries())
      .map(([groupId, circuitId]) => ({ groupId, circuitId }))
      .sort((a, b) => a.groupId - b.groupId)
  }, [extractors])

  const filtered = useMemo(() => {
    let result = [...extractors]

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (e) =>
          e.Name.toLowerCase().includes(q) ||
          t(e.Name).toLowerCase().includes(q) ||
          e.Recipe.toLowerCase().includes(q) ||
          t(e.Recipe).toLowerCase().includes(q)
      )
    }

    if (typeFilter !== 'all') {
      result = result.filter((e) => e.Recipe === typeFilter)
    }

    if (statusFilter !== 'all') {
      result = result.filter((e) => {
        switch (statusFilter) {
          case 'producing': return e.IsProducing
          case 'paused': return e.IsPaused
          case 'idle': return !e.IsProducing && !e.IsPaused
          default: return true
        }
      })
    }

    if (circuitFilter !== 'all') {
      const circuitId = parseInt(circuitFilter, 10)
      result = result.filter((e) => e.PowerInfo?.CircuitGroupID === circuitId)
    }

    result.sort((a, b) => {
      let aVal: string | number = ''
      let bVal: string | number = ''

      switch (sortField) {
        case 'Name':
          aVal = a.Name; bVal = b.Name; break
        case 'Resource':
          aVal = a.Recipe; bVal = b.Recipe; break
        case 'Efficiency':
          aVal = a.production[0]?.ProdPercent ?? 0
          bVal = b.production[0]?.ProdPercent ?? 0
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
          aVal = a.IsProducing ? 2 : a.IsPaused ? 1 : 0
          bVal = b.IsProducing ? 2 : b.IsPaused ? 1 : 0
          break
      }

      if (typeof aVal === 'string') {
        const cmp = aVal.localeCompare(bVal as string)
        return sortDir === 'asc' ? cmp : -cmp
      }
      return sortDir === 'asc' ? aVal - (bVal as number) : (bVal as number) - aVal
    })

    return result
  }, [extractors, search, sortField, sortDir])

  const handleSort = (field: ExtSortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-foreground mb-3">Detalle de Extractores</h3>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar extractor o recurso..."
            className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">Todos los recursos</option>
          {resourceTypes.map((type) => (
            <option key={type} value={type}>{t(type)}</option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ExtStatusFilter)}
          className="appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">Todos los estados</option>
          <option value="producing">Activos</option>
          <option value="idle">Inactivos</option>
          <option value="paused">Pausados</option>
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
                <ExtSortHeader label="Extractor" field="Name" current={sortField} dir={sortDir} onSort={handleSort} />
                <ExtSortHeader label="Recurso" field="Resource" current={sortField} dir={sortDir} onSort={handleSort} />
                <ExtSortHeader label="Eficiencia" field="Efficiency" current={sortField} dir={sortDir} onSort={handleSort} />
                <ExtSortHeader label="Reloj" field="Clock" current={sortField} dir={sortDir} onSort={handleSort} />
                <ExtSortHeader label="Actual/min" field="CurrentProd" current={sortField} dir={sortDir} onSort={handleSort} />
                <ExtSortHeader label="Máx/min" field="MaxProd" current={sortField} dir={sortDir} onSort={handleSort} />
                <ExtSortHeader label="Consumo MW" field="Power" current={sortField} dir={sortDir} onSort={handleSort} />
                <ExtSortHeader label="Circuito" field="Circuit" current={sortField} dir={sortDir} onSort={handleSort} />
                <ExtSortHeader label="Estado" field="Status" current={sortField} dir={sortDir} onSort={handleSort} />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                    No se encontraron extractores
                  </td>
                </tr>
              ) : (
                filtered.map((ext) => <ExtractorRow key={ext.ID} extractor={ext} />)
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function ExtSortHeader({
  label,
  field,
  current,
  dir,
  onSort,
}: {
  label: string
  field: ExtSortField
  current: ExtSortField
  dir: SortDir
  onSort: (field: ExtSortField) => void
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

function ExtractorRow({ extractor }: { extractor: Extractor }) {
  const [showPopup, setShowPopup] = useState(false)
  const prod = extractor.production[0]
  const eff = prod?.ProdPercent ?? 0

  return (
    <>
      <tr
        className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer"
        onClick={() => setShowPopup(true)}
      >
        <td className="px-3 py-2.5 font-medium text-foreground whitespace-nowrap">
          {t(extractor.Name)}
        </td>
        <td className="px-3 py-2.5 text-foreground whitespace-nowrap">
          {t(extractor.Recipe)}
        </td>
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-2 min-w-[120px]">
            <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getEffBgColor(eff)}`}
                style={{ width: `${Math.min(eff, 100)}%` }}
              />
            </div>
            <span className={`text-xs font-medium min-w-[40px] text-right ${getEffColor(eff)}`}>
              {eff.toFixed(0)}%
            </span>
          </div>
        </td>
        <td className="px-3 py-2.5 text-right tabular-nums">
          <span className={`text-xs font-medium ${getClockTextColor(extractor.ManuSpeed ?? 100)}`}>
            {formatClock(extractor.ManuSpeed ?? 100)}
          </span>
        </td>
        <td className="px-3 py-2.5 text-foreground text-right tabular-nums">
          {prod ? prod.CurrentProd.toFixed(1) : '-'}
        </td>
        <td className="px-3 py-2.5 text-muted-foreground text-right tabular-nums">
          {prod ? prod.MaxProd.toFixed(1) : '-'}
        </td>
        <td className="px-3 py-2.5 text-foreground text-right tabular-nums">
          {extractor.PowerInfo?.PowerConsumed?.toFixed(1) ?? '-'} <span className="text-muted-foreground text-xs">MW</span>
        </td>
        <td className="px-3 py-2.5 text-foreground text-sm whitespace-nowrap">
          {getCircuitName(extractor.PowerInfo?.CircuitGroupID ?? -1)}
        </td>
        <td className="px-3 py-2.5">
          {extractor.IsProducing ? (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-success/10 text-success">
              <Play className="h-3 w-3" /> Activo
            </span>
          ) : extractor.IsPaused ? (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
              <Pause className="h-3 w-3" /> Pausado
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-warning/10 text-warning">
              <AlertCircle className="h-3 w-3" /> Inactivo
            </span>
          )}
        </td>
      </tr>

      {/* Popup Modal */}
      {showPopup && (
        <tr><td colSpan={9} className="p-0">
          <div className="fixed inset-0 z-[200] flex items-center justify-center" onClick={() => setShowPopup(false)}>
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative w-full max-w-md mx-4 rounded-xl border border-border bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowPopup(false)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">✕</button>
              <h3 className="text-lg font-semibold text-foreground mb-1">{t(extractor.Name)}</h3>
              <p className="text-sm text-muted-foreground mb-4">Recurso: {t(extractor.Recipe)}</p>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Producción</span>
                  <span className="text-foreground font-medium tabular-nums">{prod ? `${prod.CurrentProd.toFixed(1)} / ${prod.MaxProd.toFixed(1)} /min` : '-'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">En buffer</span>
                  <span className="text-foreground tabular-nums">{prod ? `${prod.Amount} uds.` : '-'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Velocidad</span>
                  <span className="text-foreground">{extractor.ManuSpeed}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Consumo eléctrico</span>
                  <span className="text-foreground tabular-nums">{extractor.PowerInfo?.PowerConsumed?.toFixed(1)} / {extractor.PowerInfo?.MaxPowerConsumed?.toFixed(1)} MW</span>
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between">
                <span className={`text-sm font-medium ${getEffColor(eff)}`}>Eficiencia: {eff.toFixed(1)}%</span>
                <a
                  href={`/map?focus=${extractor.location.x},${extractor.location.y}&id=${extractor.ID}`}
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

