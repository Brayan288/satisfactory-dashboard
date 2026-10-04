import { useEffect, useRef, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useDashboard } from '@/hooks/useDashboardContext'
import { fetchFRM } from '@/lib/api'
import { useSettings } from '@/hooks/useSettings'
import type { Player, MapMarker, PowerSlug, Artifact, DropPod } from '@/types/frm'
import { t } from '@/lib/translations'
import { Layers, User, Factory, Pickaxe, Zap, MapPin, Crosshair, Cable, Pipette, Zap as SlugIcon, Sparkles, Package } from 'lucide-react'

// Map image served locally from /public/map.avif
// This is the same image the FRM mod uses (extracted from the game files)
const MAP_IMAGE_URL = '/map.avif'

// Satisfactory world coordinate bounds (exact, from FRM source code)
// FRM BitmapLayer bounds: [west, south, east, north] in game units
// BUT FRM plots with y * -1, so the image maps to inverted Y coordinates
// The image top = Y positive in game, image bottom = Y negative in game
const WORLD_WEST = -324698.16796875
const WORLD_EAST = 425301.83203125
const WORLD_SOUTH = -375000
const WORLD_NORTH = 375000

// We'll map the game world to a Leaflet CRS.Simple coordinate space
// The image represents the full world, so we map it to a fixed pixel space
const MAP_HEIGHT = 1000 // arbitrary leaflet units for the image height
const MAP_WIDTH = MAP_HEIGHT * ((WORLD_EAST - WORLD_WEST) / (WORLD_NORTH - WORLD_SOUTH))

// Leaflet image bounds: [[south-lat, west-lng], [north-lat, east-lng]]
const IMAGE_BOUNDS: L.LatLngBoundsExpression = [
  [0, 0],
  [MAP_HEIGHT, MAP_WIDTH],
]

// Convert game coordinates (x, y) to Leaflet LatLng
// x = horizontal (west to east), y = vertical (south to north)
function gameToLatLng(gameX: number, gameY: number): L.LatLngExpression {
  // FRM inverts Y when plotting: deckgl_y = gameY * -1
  // The bitmap bounds in deck.gl are [minX=-324698, minY=-375000, maxX=425301, maxY=375000]
  // So a game point with y=289606 becomes deckgl_y=-289606
  // In the bitmap, minY=-375000 is the bottom and maxY=375000 is the top
  // -289606 is near the bottom: normalized = (-289606 - (-375000)) / (375000 - (-375000)) = 0.114
  //
  // In Leaflet CRS.Simple: lat=0 is bottom, lat=MAP_HEIGHT is top
  const deckY = -gameY // FRM inversion
  const normalizedX = (gameX - WORLD_WEST) / (WORLD_EAST - WORLD_WEST)
  const normalizedY = (deckY - WORLD_SOUTH) / (WORLD_NORTH - WORLD_SOUTH)

  const lng = normalizedX * MAP_WIDTH
  const lat = normalizedY * MAP_HEIGHT
  return [lat, lng]
}

type LayerName = 'players' | 'factories' | 'extractors' | 'generators' | 'markers' | 'cables' | 'pipes' | 'slugs' | 'artifacts' | 'droppods'

export function MapPage() {
  const [searchParams] = useSearchParams()
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerGroupsRef = useRef<Record<LayerName, L.LayerGroup>>({
    players: L.layerGroup(),
    factories: L.layerGroup(),
    extractors: L.layerGroup(),
    generators: L.layerGroup(),
    markers: L.layerGroup(),
    cables: L.layerGroup(),
    pipes: L.layerGroup(),
    slugs: L.layerGroup(),
    artifacts: L.layerGroup(),
    droppods: L.layerGroup(),
  })

  const { data } = useDashboard()
  const { settings } = useSettings()
  const [activeLayers, setActiveLayers] = useState<Record<LayerName, boolean>>({
    players: false,
    factories: true,
    extractors: false,
    generators: false,
    markers: false,
    cables: false,
    pipes: false,
    slugs: false,
    artifacts: false,
    droppods: false,
  })
  const [layerPanelOpen, setLayerPanelOpen] = useState(false)
  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([])
  const [slugs, setSlugs] = useState<PowerSlug[]>([])
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [dropPods, setDropPods] = useState<DropPod[]>([])
  const [stats, setStats] = useState({ factories: 0, extractors: 0, generators: 0, players: 0 })

  // Fetch map markers periodically
  useEffect(() => {
    async function loadMarkers() {
      try {
        const markers = await fetchFRM('getMapMarkers', settings.baseUrl)
        setMapMarkers(markers)
      } catch {
        // ignore
      }
    }
    loadMarkers()
    const interval = setInterval(loadMarkers, 10000)
    return () => clearInterval(interval)
  }, [settings.baseUrl])

  // Fetch collectables (power slugs, artifacts/mercer spheres, drop pods) - static data, slow refresh
  useEffect(() => {
    async function loadCollectables() {
      try {
        const s = await fetchFRM('getPowerSlug', settings.baseUrl)
        setSlugs(Array.isArray(s) ? s : ((s as any)?.value ?? []))
      } catch { /* ignore */ }
      try {
        const a = await fetchFRM('getArtifacts', settings.baseUrl)
        setArtifacts(Array.isArray(a) ? a : ((a as any)?.value ?? []))
      } catch { /* ignore */ }
      try {
        const d = await fetchFRM('getDropPod', settings.baseUrl)
        setDropPods(Array.isArray(d) ? d : ((d as any)?.value ?? []))
      } catch { /* ignore */ }
    }
    loadCollectables()
    const interval = setInterval(loadCollectables, 30000)
    return () => clearInterval(interval)
  }, [settings.baseUrl])

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const map = L.map(mapContainerRef.current, {
      crs: L.CRS.Simple,
      minZoom: -2,
      maxZoom: 4,
      zoomControl: false,
      attributionControl: false,
      maxBounds: [
        [-100, -100],
        [MAP_HEIGHT + 100, MAP_WIDTH + 100],
      ],
      maxBoundsViscosity: 0.8,
    })

    // Add the game map as an image overlay (self-hosted, no external dependency)
    L.imageOverlay(MAP_IMAGE_URL, IMAGE_BOUNDS).addTo(map)

    // Add zoom control
    L.control.zoom({ position: 'topleft' }).addTo(map)

    // Set initial view to center of map
    map.setView([MAP_HEIGHT / 2, MAP_WIDTH / 2], -1)

    // Add all layer groups to map
    Object.values(layerGroupsRef.current).forEach((lg) => lg.addTo(map))

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Update layer visibility
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    Object.entries(activeLayers).forEach(([name, active]) => {
      const lg = layerGroupsRef.current[name as LayerName]
      if (active && !map.hasLayer(lg)) {
        lg.addTo(map)
      } else if (!active && map.hasLayer(lg)) {
        lg.removeFrom(map)
      }
    })
  }, [activeLayers])

  // Update markers when data changes
  // Use refs to track previous data and avoid unnecessary re-renders that kill popups
  const prevDataRef = useRef<string>('')

  useEffect(() => {
    if (!data) return

    // Only rebuild layers if data actually changed
    const dataFingerprint = JSON.stringify({
      f: data.factory.length,
      e: data.extractors.length,
      g: data.generators.length,
    })
    if (dataFingerprint === prevDataRef.current) return
    prevDataRef.current = dataFingerprint

    // Players - separate logic to avoid flicker
    const playersLayer = layerGroupsRef.current.players
    fetchFRM('getPlayer', settings.baseUrl)
      .then((players: Player[]) => {
        setStats((s) => ({ ...s, players: players.length }))

        // Only rebuild if count changed
        const currentCount = playersLayer.getLayers().length
        if (currentCount === players.length && currentCount > 0) {
          const layers = playersLayer.getLayers() as L.Marker[]
          players.forEach((player, i) => {
            if (layers[i]) {
              layers[i].setLatLng(gameToLatLng(player.location.x, player.location.y))
            }
          })
          return
        }

        playersLayer.clearLayers()
        players.forEach((player) => {
          const latlng = gameToLatLng(player.location.x, player.location.y)
          const icon = L.icon({
            iconUrl: player.Online ? '/map-icons/player.avif' : '/map-icons/player_offline.avif',
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            popupAnchor: [0, -16],
          })
          const marker = L.marker(latlng, { icon })
          marker.bindPopup(
            `<div style="font-family:system-ui;min-width:140px;padding:4px">
              <strong style="font-size:14px">${player.Name}</strong><br/>
              <span style="color:${player.Online ? '#22c55e' : '#ef4444'}">
                ${player.Online ? '● Online' : '● Offline'}
              </span><br/>
              <span style="color:#94a3b8">HP: ${player.PlayerHP}%</span>
            </div>`
          )
          marker.addTo(playersLayer)
        })
      })
      .catch(() => {})

    // Factories - back to circleMarker (as requested)
    const factoriesLayer = layerGroupsRef.current.factories
    factoriesLayer.clearLayers()
    setStats((s) => ({ ...s, factories: data.factory.length }))
    data.factory.forEach((f) => {
      const latlng = gameToLatLng(f.location.x, f.location.y)
      const color = f.IsProducing ? '#3b82f6' : f.IsPaused ? '#eab308' : '#ef4444'
      const marker = L.circleMarker(latlng, {
        radius: 5,
        fillColor: color,
        color: color,
        weight: 1,
        fillOpacity: 0.8,
      })
      marker.bindPopup(
        `<div style="font-family:system-ui;min-width:160px;padding:4px"><strong>${t(f.Name)}</strong><br/><span style="color:#94a3b8">Receta:</span> ${t(f.Recipe)}<br/><span style="color:#94a3b8">Eficiencia:</span> <span style="color:${f.Productivity >= 80 ? '#22c55e' : f.Productivity >= 50 ? '#eab308' : '#ef4444'};font-weight:bold;font-size:16px">${f.Productivity.toFixed(1)}%</span><br/><div style="background:#1e293b;border-radius:4px;height:8px;margin:6px 0;overflow:hidden"><div style="background:${f.Productivity >= 80 ? '#22c55e' : f.Productivity >= 50 ? '#eab308' : '#ef4444'};height:100%;width:${Math.min(f.Productivity, 100)}%;border-radius:4px"></div></div><span style="color:${color}">${f.IsProducing ? '✅ Produciendo' : f.IsPaused ? '⏸️ Pausado' : '⚠️ Detenido'}</span></div>`,

      )
      marker.addTo(factoriesLayer)
    })

    // Extractors - with icon
    const extractorsLayer = layerGroupsRef.current.extractors
    extractorsLayer.clearLayers()
    setStats((s) => ({ ...s, extractors: data.extractors.length }))
    data.extractors.forEach((e) => {
      const latlng = gameToLatLng(e.location.x, e.location.y)
      const icon = L.icon({
        iconUrl: '/map-icons/miner.avif',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14],
      })
      const marker = L.marker(latlng, { icon })
      const prod = e.production?.[0]
      const pct = prod ? prod.ProdPercent : 0
      marker.bindPopup(
        `<div style="font-family:system-ui;min-width:160px;padding:4px"><strong>${t(e.Name)}</strong><br/><span style="color:#94a3b8">Recurso:</span> ${t(e.Recipe)}<br/><span style="color:#94a3b8">Producción:</span> ${prod ? `${prod.CurrentProd.toFixed(1)}/${prod.MaxProd.toFixed(1)} /min` : 'N/A'}<br/><span style="color:${pct >= 80 ? '#22c55e' : pct >= 50 ? '#eab308' : '#ef4444'};font-weight:bold;font-size:16px">${pct.toFixed(1)}%</span><div style="background:#1e293b;border-radius:4px;height:8px;margin:6px 0;overflow:hidden"><div style="background:${pct >= 80 ? '#22c55e' : pct >= 50 ? '#eab308' : '#ef4444'};height:100%;width:${Math.min(pct, 100)}%;border-radius:4px"></div></div><span style="color:${e.IsProducing ? '#22c55e' : '#ef4444'}">${e.IsProducing ? '✅ Extrayendo' : '⚠️ Detenido'}</span></div>`,
      )
      marker.addTo(extractorsLayer)
    })

    // Generators - with icon
    const generatorsLayer = layerGroupsRef.current.generators
    generatorsLayer.clearLayers()
    setStats((s) => ({ ...s, generators: data.generators.length }))
    data.generators.forEach((g) => {
      const latlng = gameToLatLng(g.location.x, g.location.y)
      const icon = L.icon({
        iconUrl: '/map-icons/generator.avif',
        iconSize: [26, 26],
        iconAnchor: [13, 13],
        popupAnchor: [0, -13],
      })
      const marker = L.marker(latlng, { icon })
      const loadPct = g.LoadPercentage
      marker.bindPopup(
        `<div style="font-family:system-ui;min-width:160px;padding:4px"><strong>${t(g.Name)}</strong><br/><span style="color:#94a3b8">Producción:</span> ${g.BaseProd} MW<br/><span style="color:#94a3b8">Carga:</span> <span style="color:${loadPct >= 80 ? '#22c55e' : loadPct >= 50 ? '#eab308' : '#ef4444'};font-weight:bold;font-size:16px">${loadPct.toFixed(1)}%</span><div style="background:#1e293b;border-radius:4px;height:8px;margin:6px 0;overflow:hidden"><div style="background:${loadPct >= 80 ? '#22c55e' : loadPct >= 50 ? '#eab308' : '#ef4444'};height:100%;width:${Math.min(loadPct, 100)}%;border-radius:4px"></div></div><span style="color:${g.IsFullSpeed ? '#22c55e' : g.CanStart ? '#eab308' : '#ef4444'}">${g.IsFullSpeed ? '✅ Velocidad máxima' : g.CanStart ? '⚡ Parcial' : '❌ Detenido'}</span></div>`,
      )
      marker.addTo(generatorsLayer)
    })

    // Cables (power lines)
    const cablesLayer = layerGroupsRef.current.cables
    cablesLayer.clearLayers()
    fetchFRM('getCables', settings.baseUrl)
      .then((cables: any[]) => {
        cables.forEach((cable) => {
          if (cable.location0 && cable.location1) {
            const start = gameToLatLng(cable.location0.x, cable.location0.y)
            const end = gameToLatLng(cable.location1.x, cable.location1.y)
            const line = L.polyline([start, end], {
              color: '#2c75ff',
              weight: 1.5,
              opacity: 0.6,
            })
            line.addTo(cablesLayer)
          }
        })
      })
      .catch(() => {})

    // Pipes
    const pipesLayer = layerGroupsRef.current.pipes
    pipesLayer.clearLayers()
    fetchFRM('getPipes', settings.baseUrl)
      .then((pipes: any[]) => {
        pipes.forEach((pipe) => {
          if (pipe.SplineData && pipe.SplineData.length >= 2) {
            const points = pipe.SplineData.map((p: any) => gameToLatLng(p.x, p.y))
            const line = L.polyline(points, {
              color: '#ffcc99',
              weight: 2,
              opacity: 0.6,
            })
            line.addTo(pipesLayer)
          }
        })
      })
      .catch(() => {})
  }, [data, settings.baseUrl])

  // Update custom map markers
  useEffect(() => {
    const markersLayer = layerGroupsRef.current.markers
    markersLayer.clearLayers()

    mapMarkers.forEach((m) => {
      const latlng = gameToLatLng(m.location.x, m.location.y)
      const icon = L.icon({
        iconUrl: '/map-icons/marker.avif',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12],
      })
      const marker = L.marker(latlng, { icon })
      marker.bindPopup(
        `<div style="font-family:system-ui;padding:4px">
          <strong>${m.Name}</strong><br/>
          <span style="color:#94a3b8">Tipo:</span> ${m.MapMarkerType}
        </div>`,
        { closeOnClick: false, autoClose: false }
      )
      marker.bindTooltip(m.Name, { permanent: false, direction: 'top', offset: [0, -12] })
      marker.addTo(markersLayer)
    })
  }, [mapMarkers])

  // Power Slugs (electrobabosas)
  useEffect(() => {
    const layer = layerGroupsRef.current.slugs
    layer.clearLayers()
    const slugColor = (name: string): string => {
      const n = name.toLowerCase()
      if (n.includes('blue')) return '#3b82f6'
      if (n.includes('yellow')) return '#eab308'
      if (n.includes('purple')) return '#a855f7'
      return '#22d3ee'
    }
    const slugLabel = (name: string): string => {
      const n = name.toLowerCase()
      if (n.includes('blue')) return 'Electrobabosa Azul'
      if (n.includes('yellow')) return 'Electrobabosa Amarilla'
      if (n.includes('purple')) return 'Electrobabosa Morada'
      return 'Electrobabosa'
    }
    slugs.forEach((s) => {
      const latlng = gameToLatLng(s.location.x, s.location.y)
      const color = slugColor(s.Name)
      const marker = L.circleMarker(latlng, {
        radius: 6,
        fillColor: color,
        color: '#ffffff',
        weight: 1.5,
        fillOpacity: 0.9,
      })
      marker.bindPopup(
        `<div style="font-family:system-ui;min-width:140px;padding:4px"><strong>${slugLabel(s.Name)}</strong><br/><span style="color:#94a3b8">Electrobabosa</span></div>`
      )
      marker.bindTooltip(slugLabel(s.Name), { direction: 'top', offset: [0, -6] })
      marker.addTo(layer)
    })
  }, [slugs])

  // Artifacts (Mercer Spheres / Somersloops)
  useEffect(() => {
    const layer = layerGroupsRef.current.artifacts
    layer.clearLayers()
    artifacts.forEach((a) => {
      const latlng = gameToLatLng(a.location.x, a.location.y)
      const isSomersloop = a.Name.toLowerCase().includes('somersloop')
      const color = isSomersloop ? '#f472b6' : '#8b5cf6'
      const label = isSomersloop ? 'Somersloop' : 'Esfera de Mercer'
      const marker = L.circleMarker(latlng, {
        radius: 6,
        fillColor: color,
        color: '#ffffff',
        weight: 1.5,
        fillOpacity: 0.9,
      })
      marker.bindPopup(
        `<div style="font-family:system-ui;min-width:140px;padding:4px"><strong>${label}</strong><br/><span style="color:#94a3b8">Artefacto</span></div>`
      )
      marker.bindTooltip(label, { direction: 'top', offset: [0, -6] })
      marker.addTo(layer)
    })
  }, [artifacts])

  // Drop Pods (cápsulas de choque)
  useEffect(() => {
    const layer = layerGroupsRef.current.droppods
    layer.clearLayers()
    dropPods.forEach((d) => {
      const latlng = gameToLatLng(d.location.x, d.location.y)
      const looted = d.Looted
      const color = looted ? '#6b7280' : '#f59e0b'
      const reqItem = d.RequiredItem && d.RequiredItem.Name !== 'N/A'
        ? `<br/><span style="color:#94a3b8">Requiere:</span> ${t(d.RequiredItem.Name)} x${d.RequiredItem.Amount}`
        : (d.RequiredPower > 0 ? `<br/><span style="color:#94a3b8">Requiere:</span> ${d.RequiredPower} MW` : '')
      const marker = L.circleMarker(latlng, {
        radius: 5,
        fillColor: color,
        color: '#ffffff',
        weight: 1,
        fillOpacity: 0.85,
      })
      marker.bindPopup(
        `<div style="font-family:system-ui;min-width:150px;padding:4px"><strong>Cápsula de Choque</strong><br/><span style="color:${looted ? '#6b7280' : '#22c55e'}">${looted ? '✔ Saqueada' : '● Sin saquear'}</span>${reqItem}</div>`
      )
      marker.addTo(layer)
    })
  }, [dropPods])

  // Center on factory data
  const centerOnData = useCallback(() => {
    const map = mapRef.current
    if (!map || !data) return

    const allPoints: L.LatLngExpression[] = []
    data.factory.forEach((f) => allPoints.push(gameToLatLng(f.location.x, f.location.y)))
    data.extractors.forEach((e) => allPoints.push(gameToLatLng(e.location.x, e.location.y)))
    data.generators.forEach((g) => allPoints.push(gameToLatLng(g.location.x, g.location.y)))

    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints)
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [data])

  // Auto-center on first data load or focus from query params
  const hasCenteredRef = useRef(false)
  useEffect(() => {
    const map = mapRef.current
    if (!map || !data) return
    if (hasCenteredRef.current) return

    const focusParam = searchParams.get('focus')
    if (focusParam) {
      // Focus on specific coordinates from "ver en mapa" link
      const [x, y] = focusParam.split(',').map(Number)
      if (!isNaN(x) && !isNaN(y)) {
        hasCenteredRef.current = true
        const latlng = gameToLatLng(x, y)
        setTimeout(() => {
          map.setView(latlng, 3)
          // Find the closest marker and open its popup
          let closestMarker: L.Marker | L.CircleMarker | null = null
          let closestDist = Infinity
          Object.values(layerGroupsRef.current).forEach((lg) => {
            lg.eachLayer((layer) => {
              if ('getLatLng' in layer) {
                const markerLatLng = (layer as L.Marker).getLatLng()
                const dist = map.distance(markerLatLng, L.latLng(latlng as [number, number]))
                if (dist < closestDist) {
                  closestDist = dist
                  closestMarker = layer as L.Marker
                }
              }
            })
          })
          if (closestMarker && closestDist < 50) {
            (closestMarker as L.Marker).openPopup()
          }
        }, 800)
      }
    } else if (data.factory.length > 0 || data.extractors.length > 0) {
      hasCenteredRef.current = true
      setTimeout(centerOnData, 500)
    }
  }, [data, centerOnData, searchParams])

  const toggleLayer = useCallback((layer: LayerName) => {
    setActiveLayers((prev) => ({ ...prev, [layer]: !prev[layer] }))
  }, [])

  const layerConfig: { name: LayerName; label: string; icon: typeof Factory; color: string; count: number }[] = [
    { name: 'players', label: 'Jugadores', icon: User, color: '#22c55e', count: stats.players },
    { name: 'factories', label: 'Fábricas', icon: Factory, color: '#3b82f6', count: stats.factories },
    { name: 'extractors', label: 'Extractores', icon: Pickaxe, color: '#f59e0b', count: stats.extractors },
    { name: 'generators', label: 'Generadores', icon: Zap, color: '#22c55e', count: stats.generators },
    { name: 'cables', label: 'Líneas Eléctricas', icon: Cable, color: '#2c75ff', count: 0 },
    { name: 'pipes', label: 'Tuberías', icon: Pipette, color: '#ffcc99', count: 0 },
    { name: 'slugs', label: 'Electrobabosas', icon: SlugIcon, color: '#22d3ee', count: slugs.length },
    { name: 'artifacts', label: 'Esferas de Mercer', icon: Sparkles, color: '#8b5cf6', count: artifacts.length },
    { name: 'droppods', label: 'Cápsulas de Choque', icon: Package, color: '#f59e0b', count: dropPods.length },
    { name: 'markers', label: 'Marcadores', icon: MapPin, color: '#a855f7', count: mapMarkers.length },
  ]

  return (
    <div className="relative w-full h-[calc(100vh-120px)] rounded-lg overflow-hidden border border-border">
      {/* Map container */}
      <div ref={mapContainerRef} className="w-full h-full bg-[#10141a]" />

      {/* Center on data button */}
      <div className="absolute top-3 left-14 z-[1000]">
        <button
          onClick={centerOnData}
          className="flex items-center justify-center h-8 w-8 rounded-md bg-card border border-border shadow-lg hover:bg-accent transition-colors"
          title="Centrar en fábrica"
        >
          <Crosshair className="h-4 w-4 text-foreground" />
        </button>
      </div>

      {/* Layer control panel */}
      <div className="absolute top-3 right-3 z-[1000]">
        <button
          onClick={() => setLayerPanelOpen(!layerPanelOpen)}
          className="flex items-center gap-2 h-8 px-3 rounded-md bg-card border border-border shadow-lg hover:bg-accent transition-colors text-sm"
          title="Capas"
        >
          <Layers className="h-4 w-4 text-foreground" />
          <span className="hidden sm:inline text-foreground text-xs">Capas</span>
        </button>

        {layerPanelOpen && (
          <div className="absolute top-10 right-0 w-52 rounded-lg border border-border bg-card shadow-xl p-3 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Capas del mapa
            </p>
            {layerConfig.map(({ name, label, icon: Icon, color, count }) => (
              <label
                key={name}
                className="flex items-center gap-2 cursor-pointer text-sm text-foreground hover:bg-accent rounded px-2 py-1.5 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={activeLayers[name]}
                  onChange={() => toggleLayer(name)}
                  className="rounded accent-primary"
                />
                <Icon className="h-3.5 w-3.5 shrink-0" style={{ color }} />
                <span className="flex-1">{label}</span>
                <span className="text-xs text-muted-foreground">{count}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] rounded-lg border border-border bg-card/95 backdrop-blur px-3 py-2">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500" /> Fábricas
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500" /> Extractores
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" /> Generadores
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-purple-500" /> Marcadores
          </span>
        </div>
      </div>
    </div>
  )
}
