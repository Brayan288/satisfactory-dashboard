# Proyecto: Dashboard Satisfactory (FRM) - Plantilla Local

> **IMPORTANTE**: Este archivo es una plantilla. Copia a `PROJECT_CONTEXT.md` y rellena con tus datos reales.
> `PROJECT_CONTEXT.md` está en `.gitignore` y NO se sube a GitHub.

## Resumen
Dashboard web (React + TypeScript + Vite + Tailwind) que monitorea un servidor de Satisfactory usando el mod Ficsit Remote Monitoring (FRM). Desplegado en un VPS.

## Infraestructura

### Servidor VPS
- **IP**: `TU_IP_VPS`
- **Instance ID**: `TU_INSTANCE_ID`
- **Región**: `TU_REGION`
- **Producto**: `TU_PLAN_VPS`
- **SSH**: `ssh root@TU_IP_VPS` (clave SSH configurada)
- **Ubicación de la app**: `/var/www/satisfactory/`

### Servicios en el servidor
- **FRM (Ficsit Remote Monitoring)** en puerto **8080** — API del juego Satisfactory
  - Archivos del mod: `/home/satisfactory/SatisfactoryServer/FactoryGame/Mods/GameFeatures/FicsitRemoteMonitoring/`
  - Imagen del mapa: `.../www/map/map.avif` (copiada a `public/map.avif`)
  - Iconos del juego: `.../www/map/normal/markers/*.avif` y `classnamed/*.avif`
- **nginx** en puerto **80** — sirve el dashboard (SPA con try_files fallback a index.html)
- **server-stats.service** (systemd) — genera `/var/www/satisfactory/api/stats.json` cada 5s con CPU/RAM

### IMPORTANTE: puertos
El proveedor VPS solo tiene abiertos ciertos puertos. El 80 y el 8080 funcionan.
El firewall filtra por IP (solo permite la IP pública del usuario).

## Despliegue (flujo estándar)
```
cd /ruta/a/tu/proyecto
npm run build            # construir
scp -r dist/* root@TU_IP_VPS:/var/www/satisfactory/
ssh root@TU_IP_VPS "chmod -R 755 /var/www/satisfactory && chown -R www-data:www-data /var/www/satisfactory"
```
Nota: SIEMPRE corregir permisos tras subir o dan 403 Forbidden.

## Endpoints FRM usados
getPower, getGenerators, getFactory, getExtractor, getStorageInv, getPlayer, getMapMarkers,
getCables, getPipes, getTruckStation, getVehicles, getTrains, getTrainStation, getSessionInfo

## Aprendizajes clave

### Memory leak (resuelto)
El historial NO debe guardar copias completas de toda la data cada tick. Guarda solo métricas agregadas (60 entradas máx). El leak causaba "Out of Memory" al dejar la página abierta.

### Nombres de circuitos estables (importante)
El juego asigna DOS IDs por circuito:
- `CircuitGroupID` (0,1,2): índice secuencial, se reasigna al crear/borrar circuitos.
- `CircuitID` (AssociatedCircuits[0]): ID interno, PERO también cambia tras reiniciar el servidor.
NINGÚN ID de circuito es estable entre reinicios.
**Solución** (`src/lib/circuitNames.ts`): los nombres se guardan asociados a la POSICIÓN (x,y) de los generadores del circuito (los edificios no se mueven). Se guarda en TODAS las posiciones de generadores del circuito, y al buscar, si cualquiera coincide, usa ese nombre. Guardado en localStorage con prefijo `circuit-name-pos-{x}_{y}`.

### Gráficas por circuito
El historial guarda `circuits: Record<CircuitGroupID, {production, consumed}>` para que cada gráfica muestre datos de SU circuito, no los agregados de todos.

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

### API del proveedor VPS
- Auth OAuth2: endpoint de tu proveedor
- Credenciales: CLIENT_ID, CLIENT_SECRET (guardar en gestor de contraseñas)
- Firewall ID: `TU_FIREWALL_ID`
- Reiniciar VPS: endpoint de tu proveedor

## Configuración del usuario
- Idioma: español
- Prefiere confirmación antes de acciones destructivas (reinicios, etc.)
- Las gráficas se pueden redimensionar arrastrando el borde inferior
- Circuitos nombrados: "Principal" y "Petroleo"
- Ping en el header = latencia HTTP (mayor que ping del juego, es normal)