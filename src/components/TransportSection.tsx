import { useState, useMemo, useEffect } from 'react'
import { Truck, Fuel, Package, Search, ArrowUpDown, Gauge, MapPin, Navigation, TrainFront, Weight } from 'lucide-react'
import type { TruckStation, Vehicle, Train, TrainStation } from '@/types/frm'
import { fetchFRM } from '@/lib/api'
import { useSettings } from '@/hooks/useSettings'
import { t } from '@/lib/translations'

export function TransportSection() {
  const { settings } = useSettings()
  const [stations, setStations] = useState<TruckStation[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [trains, setTrains] = useState<Train[]>([])
  const [trainStations, setTrainStations] = useState<TrainStation[]>([])

  useEffect(() => {
    async function load() {
      try {
        const st = await fetchFRM('getTruckStation', settings.baseUrl)
        const stationsArr = Array.isArray(st) ? st : ((st as any)?.value ?? [])
        setStations(stationsArr)
      } catch {}
      try {
        const v = await fetchFRM('getVehicles', settings.baseUrl)
        setVehicles(Array.isArray(v) ? v : ((v as any)?.value ?? []))
      } catch {}
      try {
        const tr = await fetchFRM('getTrains', settings.baseUrl)
        setTrains(Array.isArray(tr) ? tr : ((tr as any)?.value ?? []))
      } catch {}
      try {
        const ts = await fetchFRM('getTrainStation', settings.baseUrl)
        setTrainStations(Array.isArray(ts) ? ts : ((ts as any)?.value ?? []))
      } catch {}
    }
    load()
    const interval = setInterval(load, settings.pollingInterval)
    return () => clearInterval(interval)
  }, [settings.baseUrl, settings.pollingInterval])

  const stats = useMemo(() => {
    const totalStations = stations.length + trainStations.length
    const activeStations = stations.filter((s) => s.StationStatus === 'Producing').length
    const totalVehicles = vehicles.length
    const totalTrains = trains.length
    return { totalStations, activeStations, totalVehicles, totalTrains }
  }, [stations, vehicles, trains, trainStations])

  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
        <Truck className="h-5 w-5 text-primary" />
        Transporte
      </h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Estaciones" value={stats.totalStations} color="text-foreground" />
        <StatCard label="Trenes" value={stats.totalTrains} color="text-success" />
        <StatCard label="Vehículos" value={stats.totalVehicles} color="text-foreground" />
        <StatCard label="Est. Camión Activas" value={stats.activeStations} color="text-success" />
      </div>

      {/* Trains */}
      <TrainsTable trains={trains} />

      {/* Train Stations */}
      <TrainStationsTable stations={trainStations} />

      {/* Truck Stations */}
      <StationsTable stations={stations} />

      {/* Vehicles */}
      <VehiclesTable vehicles={vehicles} />
    </section>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  )
}

// --- Stations Table ---

type StSortField = 'Name' | 'LoadMode' | 'TransferRate' | 'Status'
type SortDir = 'asc' | 'desc'

function StationsTable({ stations }: { stations: TruckStation[] }) {
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<StSortField>('Name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const filtered = useMemo(() => {
    let result = [...stations]
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((s) => s.Name.toLowerCase().includes(q) || t(s.Name).toLowerCase().includes(q))
    }
    result.sort((a, b) => {
      let aVal: string | number = ''
      let bVal: string | number = ''
      switch (sortField) {
        case 'Name': aVal = a.Name; bVal = b.Name; break
        case 'LoadMode': aVal = a.LoadMode; bVal = b.LoadMode; break
        case 'TransferRate': aVal = a.TransferRate; bVal = b.TransferRate; break
        case 'Status': aVal = a.StationStatus; bVal = b.StationStatus; break
      }
      if (typeof aVal === 'string') {
        const cmp = aVal.localeCompare(bVal as string)
        return sortDir === 'asc' ? cmp : -cmp
      }
      return sortDir === 'asc' ? aVal - (bVal as number) : (bVal as number) - aVal
    })
    return result
  }, [stations, search, sortField, sortDir])

  const handleSort = (field: StSortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortField(field); setSortDir('asc') }
  }

  if (stations.length === 0) return null

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <MapPin className="h-4 w-4 text-primary" />
        Estaciones de Camiones
      </h3>
      <div className="relative mb-3 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar estación..."
          className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <StHeader label="Estación" field="Name" current={sortField} dir={sortDir} onSort={handleSort} />
                <StHeader label="Modo" field="LoadMode" current={sortField} dir={sortDir} onSort={handleSort} />
                <StHeader label="Tasa/min" field="TransferRate" current={sortField} dir={sortDir} onSort={handleSort} />
                <StHeader label="Estado" field="Status" current={sortField} dir={sortDir} onSort={handleSort} />
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => <StationRow key={s.ID} station={s} />)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StHeader({ label, field, current, dir, onSort }: {
  label: string; field: StSortField; current: StSortField; dir: SortDir; onSort: (f: StSortField) => void
}) {
  const isActive = current === field
  return (
    <th className="px-3 py-2.5 text-center font-medium text-muted-foreground whitespace-nowrap" style={{ minWidth: 60 }}>
      <button onClick={() => onSort(field)} className="flex items-center justify-center gap-1 w-full hover:text-foreground transition-colors">
        {label}
        <ArrowUpDown className={`h-3 w-3 ${isActive ? 'text-primary' : 'text-muted-foreground/50'}`} />
        {isActive && <span className="text-[10px] text-primary">{dir === 'asc' ? '↑' : '↓'}</span>}
      </button>
    </th>
  )
}

function StationRow({ station }: { station: TruckStation }) {
  const [showPopup, setShowPopup] = useState(false)
  const isLoading = station.LoadMode.toLowerCase().includes('load')

  return (
    <>
      <tr className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer" onClick={() => setShowPopup(true)}>
        <td className="px-3 py-2.5 font-medium text-foreground whitespace-nowrap">{t(station.Name)}</td>
        <td className="px-3 py-2.5 text-center text-foreground">{station.LoadMode === 'Idle' ? 'Inactivo' : station.LoadMode}</td>
        <td className="px-3 py-2.5 text-right tabular-nums text-foreground">{station.TransferRate.toFixed(0)}</td>
        <td className="px-3 py-2.5 text-center">
          {station.StationStatus === 'Producing' ? (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-success/10 text-success">Activo</span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">{station.StationStatus}</span>
          )}
        </td>
      </tr>
      {showPopup && (
        <tr><td colSpan={4} className="p-0">
          <div className="fixed inset-0 z-[200] flex items-center justify-center" onClick={() => setShowPopup(false)}>
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative w-full max-w-md mx-4 rounded-xl border border-border bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowPopup(false)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">✕</button>
              <h3 className="text-lg font-semibold text-foreground mb-1">{t(station.Name)}</h3>
              <p className="text-sm text-muted-foreground mb-4">{isLoading ? 'Cargando' : station.LoadMode === 'Idle' ? 'Inactivo' : 'Descargando'}</p>
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Tasa de transferencia</span><span className="text-foreground">{station.TransferRate.toFixed(1)} / {station.MaxTransferRate.toFixed(1)} /min</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Consumo eléctrico</span><span className="text-foreground">{station.PowerInfo?.PowerConsumed?.toFixed(1)} MW</span></div>
              </div>
              {station.Inventory && station.Inventory.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1"><Package className="h-3 w-3" /> Inventario</h4>
                  <div className="space-y-1.5">
                    {station.Inventory.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <img src={`/item-icons/${item.Name.replace(/ /g, '_')}.png`} alt="" className="w-5 h-5 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        <span className="text-foreground flex-1">{t(item.Name)}</span>
                        <span className="text-muted-foreground tabular-nums">{item.Amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="pt-3 mt-3 border-t border-border flex justify-end">
                <a href={`/map?focus=${station.location.x},${station.location.y}&id=${station.ID}`} className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors">📍 Ver en mapa</a>
              </div>
            </div>
          </div>
        </td></tr>
      )}
    </>
  )
}

// --- Vehicles Table ---

function VehiclesTable({ vehicles }: { vehicles: Vehicle[] }) {
  if (vehicles.length === 0) return null

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <Navigation className="h-4 w-4 text-primary" />
        Vehículos
      </h3>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Vehículo</th>
                <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Piloto Auto.</th>
                <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Velocidad</th>
                <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Combustible</th>
                <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Estado</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.ID} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-3 py-2.5 font-medium text-foreground text-center flex items-center justify-center gap-2">
                    <Truck className="h-4 w-4 text-primary" /> {t(v.Name)}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {v.Autopilot ? (
                      <span className="inline-flex items-center gap-1 text-xs text-success"><Gauge className="h-3 w-3" /> Sí</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Manual</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center text-foreground tabular-nums">{Math.abs(v.ForwardSpeed).toFixed(1)} km/h</td>
                  <td className="px-3 py-2.5 text-center">
                    {v.HasFuel ? (
                      <span className="inline-flex items-center gap-1 text-xs text-success"><Fuel className="h-3 w-3" /> Sí</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-danger"><Fuel className="h-3 w-3" /> Sin combustible</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-secondary text-foreground">
                      {v.AutoPilotStatus === 'No Fuel' ? 'Sin combustible' : v.AutoPilotStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}


// --- Trains Table ---

function TrainsTable({ trains }: { trains: Train[] }) {
  if (trains.length === 0) return null

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <TrainFront className="h-4 w-4 text-primary" />
        Trenes
      </h3>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Tren</th>
                <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Estado</th>
                <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Velocidad</th>
                <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Carga</th>
                <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Vagones</th>
                <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Piloto Auto.</th>
              </tr>
            </thead>
            <tbody>
              {trains.map((train) => <TrainRow key={train.ID} train={train} />)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function TrainRow({ train }: { train: Train }) {
  const [showPopup, setShowPopup] = useState(false)
  const loadPct = train.MaxPayloadMass > 0 ? (train.PayloadMass / train.MaxPayloadMass) * 100 : 0
  const cargoWagons = train.Vehicles.filter((v) => v.ClassName.includes('FreightWagon'))

  const statusLabel = (s: string) => {
    switch (s) {
      case 'Parked': return 'Estacionado'
      case 'SelfDriving': return 'Conduciendo'
      case 'Manual': return 'Manual'
      default: return s
    }
  }

  return (
    <>
      <tr className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer" onClick={() => setShowPopup(true)}>
        <td className="px-3 py-2.5 font-medium text-foreground text-center">
          <span className="flex items-center justify-center gap-2"><TrainFront className="h-4 w-4 text-primary" /> {t(train.Name)}</span>
        </td>
        <td className="px-3 py-2.5 text-center">
          {train.Derailed ? (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-danger/10 text-danger">Descarrilado</span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-secondary text-foreground">{statusLabel(train.Status)}</span>
          )}
        </td>
        <td className="px-3 py-2.5 text-center text-foreground tabular-nums">{Math.abs(train.ForwardSpeed).toFixed(0)} km/h</td>
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-2 min-w-[100px]">
            <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
              <div className={`h-full rounded-full ${loadPct >= 90 ? 'bg-danger' : loadPct >= 50 ? 'bg-warning' : 'bg-success'}`} style={{ width: `${Math.min(loadPct, 100)}%` }} />
            </div>
            <span className="text-xs text-muted-foreground min-w-[36px] text-right">{loadPct.toFixed(0)}%</span>
          </div>
        </td>
        <td className="px-3 py-2.5 text-center text-foreground">{train.Vehicles.length}</td>
        <td className="px-3 py-2.5 text-center">
          {train.SelfDriving === 'SDLE_NoError' ? (
            <span className="inline-flex items-center gap-1 text-xs text-success"><Gauge className="h-3 w-3" /> Sí</span>
          ) : (
            <span className="text-xs text-muted-foreground">Manual</span>
          )}
        </td>
      </tr>
      {showPopup && (
        <tr><td colSpan={6} className="p-0">
          <div className="fixed inset-0 z-[200] flex items-center justify-center" onClick={() => setShowPopup(false)}>
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative w-full max-w-md mx-4 rounded-xl border border-border bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowPopup(false)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">✕</button>
              <h3 className="text-lg font-semibold text-foreground mb-1">{t(train.Name)}</h3>
              <p className="text-sm text-muted-foreground mb-4">{train.Derailed ? 'Descarrilado' : statusLabel(train.Status)}</p>
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Velocidad</span><span className="text-foreground">{Math.abs(train.ForwardSpeed).toFixed(1)} km/h</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground flex items-center gap-1"><Weight className="h-3 w-3" /> Carga</span><span className="text-foreground">{(train.PayloadMass / 1000).toFixed(1)} / {(train.MaxPayloadMass / 1000).toFixed(1)} t</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Destino</span><span className="text-foreground">{train.TrainStation === 'No Station' ? 'Sin estación' : t(train.TrainStation)}</span></div>
              </div>
              {cargoWagons.map((wagon, wi) => (
                wagon.Inventory.length > 0 && (
                  <div key={wi} className="mb-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1"><Package className="h-3 w-3" /> Vagón {wi + 1}</h4>
                    <div className="space-y-1.5">
                      {wagon.Inventory.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <img src={`/item-icons/${item.Name.replace(/ /g, '_')}.png`} alt="" className="w-5 h-5 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                          <span className="text-foreground flex-1">{t(item.Name)}</span>
                          <span className="text-muted-foreground tabular-nums">{item.Amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        </td></tr>
      )}
    </>
  )
}

// --- Train Stations Table ---

function TrainStationsTable({ stations }: { stations: TrainStation[] }) {
  if (stations.length === 0) return null

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <MapPin className="h-4 w-4 text-primary" />
        Estaciones de Tren
      </h3>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Estación</th>
                <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Modo</th>
                <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Tasa/min</th>
                <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Plataformas</th>
              </tr>
            </thead>
            <tbody>
              {stations.map((s) => <TrainStationRow key={s.ID} station={s} />)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function TrainStationRow({ station }: { station: TrainStation }) {
  const [showPopup, setShowPopup] = useState(false)
  const cargo = station.CargoInventory ?? []
  const mode = cargo[0]?.LoadingMode ?? '-'
  const modeLabel = mode === 'Loading' ? 'Cargando' : mode === 'Unloading' ? 'Descargando' : mode

  return (
    <>
      <tr className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer" onClick={() => setShowPopup(true)}>
        <td className="px-3 py-2.5 font-medium text-foreground text-center">{t(station.Name)}</td>
        <td className="px-3 py-2.5 text-center text-foreground">{modeLabel}</td>
        <td className="px-3 py-2.5 text-center text-foreground tabular-nums">{station.TransferRate.toFixed(1)}</td>
        <td className="px-3 py-2.5 text-center text-foreground">{cargo.length}</td>
      </tr>
      {showPopup && (
        <tr><td colSpan={4} className="p-0">
          <div className="fixed inset-0 z-[200] flex items-center justify-center" onClick={() => setShowPopup(false)}>
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative w-full max-w-md mx-4 rounded-xl border border-border bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowPopup(false)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">✕</button>
              <h3 className="text-lg font-semibold text-foreground mb-1">{t(station.Name)}</h3>
              <p className="text-sm text-muted-foreground mb-4">Tasa de transferencia: {station.TransferRate.toFixed(2)}/min</p>
              {cargo.map((platform, pi) => (
                <div key={pi} className="mb-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1">
                    <Package className="h-3 w-3" /> {platform.LoadingMode === 'Loading' ? 'Cargando' : 'Descargando'}
                  </h4>
                  {platform.Inventory.length > 0 ? (
                    <div className="space-y-1.5">
                      {platform.Inventory.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <img src={`/item-icons/${item.Name.replace(/ /g, '_')}.png`} alt="" className="w-5 h-5 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                          <span className="text-foreground flex-1">{t(item.Name)}</span>
                          <span className="text-muted-foreground tabular-nums">{item.Amount}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Vacío</p>
                  )}
                </div>
              ))}
              <div className="pt-3 mt-3 border-t border-border flex justify-end">
                <a href={`/map?focus=${station.location.x},${station.location.y}&id=${station.ID}`} className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors">📍 Ver en mapa</a>
              </div>
            </div>
          </div>
        </td></tr>
      )}
    </>
  )
}
