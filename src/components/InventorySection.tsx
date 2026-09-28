import { useState, useMemo } from 'react'
import { Package, Search, LayoutGrid, List } from 'lucide-react'
import type { StorageContainer } from '@/types/frm'
import { t } from '@/lib/translations'

interface InventorySectionProps {
  storage: StorageContainer[]
}

type ViewMode = 'grouped' | 'containers'

interface AggregatedItem {
  name: string
  className: string
  totalAmount: number
  totalCapacity: number
  containerCount: number
}

export function InventorySection({ storage }: InventorySectionProps) {
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grouped')

  // Aggregate items across all containers
  const aggregatedItems = useMemo(() => {
    const map = new Map<string, AggregatedItem>()

    for (const container of storage) {
      for (const item of container.Inventory) {
        if (!item.Name || item.Amount === 0) continue
        const existing = map.get(item.ClassName)
        if (existing) {
          existing.totalAmount += item.Amount
          existing.totalCapacity += item.MaxAmount
          existing.containerCount++
        } else {
          map.set(item.ClassName, {
            name: item.Name,
            className: item.ClassName,
            totalAmount: item.Amount,
            totalCapacity: item.MaxAmount,
            containerCount: 1,
          })
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => b.totalAmount - a.totalAmount)
  }, [storage])

  // Filter
  const filteredItems = useMemo(() => {
    if (!search) return aggregatedItems
    const q = search.toLowerCase()
    return aggregatedItems.filter((item) => item.name.toLowerCase().includes(q))
  }, [aggregatedItems, search])

  const filteredContainers = useMemo(() => {
    if (!search) return storage
    const q = search.toLowerCase()
    return storage.filter(
      (c) =>
        c.Name.toLowerCase().includes(q) ||
        c.Inventory.some((i) => i.Name.toLowerCase().includes(q))
    )
  }, [storage, search])

  // Stats
  const totalItems = aggregatedItems.reduce((sum, i) => sum + i.totalAmount, 0)
  const uniqueItems = aggregatedItems.length

  if (storage.length === 0) {
    return (
      <section>
        <SectionHeader />
        <div className="rounded-lg border border-border bg-card p-6 text-center">
          <p className="text-muted-foreground text-sm">No se detectaron contenedores de almacenamiento</p>
        </div>
      </section>
    )
  }

  return (
    <section>
      <SectionHeader />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{storage.length}</p>
          <p className="text-xs text-muted-foreground">Contenedores</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{uniqueItems}</p>
          <p className="text-xs text-muted-foreground">Items Únicos</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <p className="text-2xl font-bold text-foreground">
            {totalItems >= 1000 ? `${(totalItems / 1000).toFixed(1)}k` : totalItems}
          </p>
          <p className="text-xs text-muted-foreground">Total Items</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar items..."
            className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex rounded-md border border-input overflow-hidden">
          <button
            onClick={() => setViewMode('grouped')}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors ${
              viewMode === 'grouped'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-muted-foreground hover:bg-accent'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Items</span>
          </button>
          <button
            onClick={() => setViewMode('containers')}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors ${
              viewMode === 'containers'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-muted-foreground hover:bg-accent'
            }`}
          >
            <List className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Contenedores</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'grouped' ? (
        <GroupedView items={filteredItems} />
      ) : (
        <ContainerView containers={filteredContainers} />
      )}
    </section>
  )
}

function SectionHeader() {
  return (
    <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
      <Package className="h-5 w-5 text-blue-400" />
      Inventario
    </h2>
  )
}

function GroupedView({ items }: { items: AggregatedItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <p className="text-muted-foreground text-sm">Ningún item coincide con la búsqueda</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {items.map((item) => {
        const fillPercent =
          item.totalCapacity > 0
            ? (item.totalAmount / item.totalCapacity) * 100
            : 0

        return (
          <div
            key={item.className}
            className="rounded-lg border border-border bg-card p-3"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm text-foreground truncate pr-2">
                {t(item.name)}
              </span>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                x{item.containerCount}
              </span>
            </div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-lg font-bold text-foreground tabular-nums">
                {item.totalAmount.toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground">
                / {item.totalCapacity.toLocaleString()}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getFillColor(fillPercent)}`}
                style={{ width: `${Math.min(fillPercent, 100)}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ContainerView({ containers }: { containers: StorageContainer[] }) {
  if (containers.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <p className="text-muted-foreground text-sm">Ningún contenedor coincide con la búsqueda</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {containers.slice(0, 50).map((container) => {
        const nonEmptyItems = container.Inventory.filter((i) => i.Amount > 0)
        const totalUsed = nonEmptyItems.reduce((s, i) => s + i.Amount, 0)
        const totalCap = container.Inventory.reduce((s, i) => s + i.MaxAmount, 0)
        const fillPercent = totalCap > 0 ? (totalUsed / totalCap) * 100 : 0

        return (
          <div
            key={container.ID}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm text-foreground">
                {t(container.Name)}
              </span>
              <span className="text-xs text-muted-foreground">
                {fillPercent.toFixed(0)}% lleno
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden mb-3">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getFillColor(fillPercent)}`}
                style={{ width: `${Math.min(fillPercent, 100)}%` }}
              />
            </div>
            {nonEmptyItems.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {nonEmptyItems.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs text-foreground"
                  >
                    {t(item.Name)}
                    <span className="text-muted-foreground">
                      ({item.Amount})
                    </span>
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground italic">Vacío</span>
            )}
          </div>
        )
      })}
      {containers.length > 50 && (
        <p className="text-xs text-muted-foreground text-center">
          Mostrando 50 de {containers.length} contenedores
        </p>
      )}
    </div>
  )
}

function getFillColor(percent: number): string {
  if (percent >= 90) return 'bg-danger'
  if (percent >= 70) return 'bg-warning'
  return 'bg-blue-400'
}
