# Proyecto: Dashboard Satisfactory (FRM)

## Resumen
Dashboard web (React + TypeScript + Vite + Tailwind) que monitorea un servidor de
Satisfactory usando el mod Ficsit Remote Monitoring (FRM). Desplegado en un VPS Contabo.

## Infraestructura

### Servidor VPS (Contabo)
- **IP**: 80.190.78.17
- **Instance ID**: 203519034
- **Región**: United States (East), datacenter USE1
- **Producto**: Cloud VPS (V154), 6 cores, ~12GB RAM
- **SSH**: `ssh root@80.190.78.17` (clave SSH ya configurada, sin password)
- **Ubicación de la app**: `/var/www/satisfactory/`

### Servicios en el servidor
- **FRM (Ficsit Remote Monitoring)** en puerto **8080** — API del juego Satisfactory
  - Archivos del mod: `/home/satisfactory/SatisfactoryServer/FactoryGame/Mods/GameFeatures/FicsitRemoteMonitoring/`
  - Imagen del mapa: `.../www/map/map.avif` (copiada a `public/map.avif`)
  - Iconos del juego: `.../www/map/normal/markers/*.avif` y `classnamed/*.avif`
- **nginx** en puerto **80** — sirve el dashboard (SPA con try_files fallback a index.html)
- **server-stats.service** (systemd) — genera `/var/www/satisfactory/api/stats.json` cada 5s con CPU/RAM

### IMPORTANTE: puertos
El proveedor Contabo solo tiene abiertos ciertos puertos. El 80 y el 8080 funcionan.
El firewall de Contabo filtra por IP (solo permite la IP pública del usuario).

## Despliegue (flujo estándar)
```
cd C:\Users\bqn28\Documents\satisfactory
npx tsc --noEmit          # verificar tipos
npx vite build            # construir
scp -r dist\* root@80.190.78.17:/var/www/satisfactory/
ssh root@80.190.78.17 "chmod -R 755 /var/www/satisfactory && chown -R www-data:www-data /var/www/satisfactory"
```
Nota: SIEMPRE corregir permisos tras subir o dan 403 Forbidden.

## Estructura de la app
- **Páginas** (`src/pages/`): PowerPage (/power), GeneratorsPage (/generators),
  ProductionPage (/production), ExtractorsPage (/extractors), InventoryPage (/inventory),
  TransportPage (/transport), MapPage (/map). Raíz redirige a /power.
- **Navegación** en Header.tsx: Energía | Generadores | Producción | Extractores | Inventario | Transporte | Mapa
- **Router**: react-router-dom 7.6.2 (React 19, NO usar react-leaflet que requiere React 18)
- **Datos**: hook `useDashboardData` hace polling a todos los endpoints. Comparte vía
  `DashboardProvider` (Context) para que haya UNA sola instancia de polling.
- **Traducciones**: `src/lib/translations.ts` con función `t()`. Los datos de FRM vienen en
  inglés; se traducen al español. Los buscadores comparan contra nombre original Y traducido.

## Endpoints FRM usados
getPower, getGenerators, getFactory, getExtractor, getStorageInv, getPlayer, getMapMarkers,
getCables, getPipes, getTruckStation, getVehicles, getTrains, getTrainStation, getSessionInfo

## Aprendizajes clave

### Memory leak (resuelto)
El historial NO debe guardar copias completas de toda la data cada tick. Guarda solo
métricas agregadas (60 entradas máx). El leak causaba "Out of Memory" al dejar la página abierta.

### Nombres de circuitos estables (importante)
El juego asigna DOS IDs por circuito:
- `CircuitGroupID` (0,1,2): índice secuencial, se reasigna al crear/borrar circuitos.
- `CircuitID` (AssociatedCircuits[0]): ID interno, PERO también cambia tras reiniciar el servidor.
NINGÚN ID de circuito es estable entre reinicios.
**Solución** (`src/lib/circuitNames.ts`): los nombres se guardan asociados a la POSICIÓN (x,y)
de los generadores del circuito (los edificios no se mueven). Se guarda en TODAS las posiciones
de generadores del circuito, y al buscar, si cualquiera coincide, usa ese nombre. Guardado en
localStorage con prefijo `circuit-name-pos-{x}_{y}`.

### Gráficas por circuito
El historial guarda `circuits: Record<CircuitGroupID, {production, consumed}>` para que cada
gráfica muestre datos de SU circuito, no los agregados de todos.

### Producción vs Capacidad
En generadores de carbón, Producción = Capacidad porque producen a tasa fija constante.

### Iconos de items
Descargados del wiki (satisfactory.wiki.gg) a `public/item-icons/{Nombre_Con_Guiones}.png`.
Los iconos del mapa (jugador, miner, generador) copiados del servidor FRM a `public/map-icons/`.
NO depender de servicios externos: todo self-hosted.

### Mapa
Usa `map.avif` (imagen del mod FRM) como imageOverlay en Leaflet con CRS.Simple.
Bounds del juego: WEST=-324698.16, EAST=425301.83, SOUTH=-375000, NORTH=375000.
La coordenada Y se INVIERTE (FRM usa y*-1 en deck.gl).
Link "Ver en mapa" desde popups: `/map?focus=X,Y&id=ID` — centra y abre popup del marker cercano.

### Contabo API
- Auth OAuth2: POST a `https://auth.contabo.com/auth/realms/contabo/protocol/openid-connect/token`
  con grant_type=password. USAR curl.exe (PowerShell Invoke-WebRequest es bloqueado por Cloudflare).
- Credenciales: CLIENT_ID=INT-15312186, la contraseña API empieza con `/` (fácil de olvidar).
- Firewall ID: 975831d9-6cae-46e9-8f41-675547df3ecf
- Reiniciar VPS: POST a `/v1/compute/instances/203519034/actions/restart` con body `-d "{}"`
  (falla con "Body cannot be empty" si no se pasa el {}).

### Skill global de firewall
Creada en `~/.kiro/skills/update-firewall/SKILL.md`. Verifica IP pública, compara con reglas
del firewall Contabo, actualiza solo si cambió.

## Configuración del usuario
- Idioma: español
- Prefiere confirmación antes de acciones destructivas (reinicios, etc.)
- Las gráficas se pueden redimensionar arrastrando el borde inferior
- Circuitos nombrados: "Principal" y "Petroleo"
- Ping en el header = latencia HTTP (mayor que ping del juego, es normal)
