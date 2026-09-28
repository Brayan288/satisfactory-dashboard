# Satisfactory FRM Dashboard

Dashboard web completo para monitorear un servidor de **Satisfactory** usando el mod **Ficsit Remote Monitoring (FRM)**. Construido con React 19, TypeScript, Vite 8, Tailwind CSS 4 y Leaflet.

![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-6-blue)
![Vite](https://img.shields.io/badge/Vite-8-purple)
![Tailwind](https://img.shields.io/badge/Tailwind-4-teal)
![License](https://img.shields.io/badge/License-MIT-green)

## 🎯 Características Principales

### 📊 Páginas del Dashboard
| Página | Ruta | Descripción |
|--------|------|-------------|
| **Energía** | `/power` | Circuitos eléctricos, producción/consumo por circuito, gráficas de tendencias (5 min) |
| **Generadores** | `/generators` | Lista detallada con carga %, combustible, estado (velocidad máxima/parcial/detenido) |
| **Producción** | `/production` | Fábricas, recetas, productividad, estado (produciendo/pausado/detenido) |
| **Extractores** | `/extractors` | Mineros y pozos, pureza de nodo, tasa producción actual/máx, eficiencia % |
| **Inventario** | `/inventory` | Almacenamiento global, contenedores, items con iconos, búsqueda traducida |
| **Transporte** | `/transport` | Cintas, trenes, camiones, tuberías, estaciones, vehículos |
| **Mapa Interactivo** | `/map` | **Ver abajo** |

### 🗺️ Mapa Interactivo (Leaflet + CRS.Simple)
- **Imagen del juego self-hosted** (`/map.avif` extraída del mod FRM)
- **Capas conmutables** (panel lateral):
  - 🟢 Jugadores (online/offline con HP)
  - 🔵 Fábricas (círculos coloreados por estado: produciendo/pausado/detenido)
  - 🟠 Extractores (icono minero, popup con producción y pureza)
  - 🟢 Generadores (icono generador, carga %)
  - ⚡ Líneas eléctricas (cables)
  - 🟡 Tuberías (pipes)
  - 🔷 Electrobabosas (azul/amarillo/morado)
  - 🟣 Esferas de Mercer / Somersloops
  - 📦 Cápsulas de choque (saqueadas/sin saquear, requisitos)
  - 📍 Marcadores personalizados del juego
- **Navegación**:
  - Auto-centrado en fábrica al cargar
  - Botón "Centrar en fábrica"
  - Link "Ver en mapa" desde popups → centra y abre popup del marker (`/map?focus=X,Y&id=ID`)
  - Coordenadas Y invertidas (compatibilidad FRM/deck.gl)
- **Leyenda visual** integrada

### ⚙️ Configuración (Modal)
- **URL de la API FRM** (persistente en localStorage)
- **Intervalo de polling** (mín 500ms, default 1000ms)
- **Altura gráficas de circuitos** (px, min 64)
- **Altura gráficas de tendencias** (px, min 64)
- **Botón "Restablecer"** a valores por defecto

### 🔔 Header Inteligente
- Estado de conexión (WiFi verde/rojo)
- Última actualización (hora local)
- **Stats del servidor VPS** (`/api/stats.json` cada 5s): CPU %, RAM %, MB usados
- **Ping HTTP** al endpoint FRM (`getSessionInfo` cada 5s, coloreado: <100ms verde, <200ms amarillo, >200ms rojo)
- Badge de alertas (cuenta)
- Botones: Actualizar, Configuración
- Navegación responsive (desktop + mobile)

### 🌐 Internacionalización
- **Traducción completa EN → ES** (`src/lib/translations.ts`)
- Cientos de entries: recursos, lingotes, componentes, edificios, items
- Función `t()` usada en toda la UI
- Buscadores comparan nombre original Y traducido

### 📈 Gráficas (Recharts)
- **Por circuito**: producción/consumo individuales (historial circular 60 entradas = 5 min @ 1s)
- **Tendencias globales**: Eficiencia fábrica, Uso energía %, Eficiencia extractores
- **Redimensionables**: arrastra el borde inferior (handle) para cambiar altura
- Solo métricas agregadas en historial → **sin memory leaks**

## 🏗️ Arquitectura Técnica

### Polling Unificado (`useDashboardContext` + `useDashboardData`)
- **Single source of truth**: Un solo `setInterval` para todos los endpoints
- `DashboardProvider` envuelve la app → `useDashboard()` en cualquier componente
- Merge inteligente: si un endpoint devuelve vacío, mantiene datos previos (evita flicker)
- Manejo de errores: marca `isConnected=false`, mantiene datos cacheados

### Endpoints FRM Utilizados
```
getPower          → Circuitos eléctricos
getGenerators     → Generadores (combustible, carga, estado)
getFactory        → Edificios de producción
getExtractor      → Mineros / pozos petróleo
getStorageInv     → Contenedores de almacenamiento
getWorldInv       → Inventario global de items
getPlayer         → Jugadores online/offline
getMapMarkers     → Marcadores personalizados
getCables         → Líneas eléctricas (mapa)
getPipes          → Tuberías (mapa)
getTruckStation   → Estaciones de camión
getVehicles       → Camiones / tractores
getTrains         → Trenes
getTrainStation   → Estaciones de tren
getSessionInfo    → Info sesión (ping)
getPowerSlug      → Electrobabosas (mapa)
getArtifacts      → Esferas Mercer / Somersloops (mapa)
getDropPod        → Cápsulas de choque (mapa)
```

### Solución: Nombres de Circuitos Estables
**Problema**: `CircuitGroupID` (0,1,2) y `CircuitID` cambian tras reinicios.
**Solución** (`src/lib/circuitNames.ts`): Nombres guardados por **posición (x,y) de generadores** (edificios no se mueven). Se guarda en TODAS las posiciones del circuito; al buscar, si cualquiera coincide → usa ese nombre. Key: `circuit-name-pos-{x}_{y}` en localStorage.

### Self-Hosted Assets (Sin dependencias externas)
- `public/item-icons/*.png` — Iconos de items (wiki satisfactory.wiki.gg)
- `public/map-icons/*.avif` — Iconos mapa (jugador, minero, generador, etc. del mod FRM)
- `public/map.avif` — Mapa completo del juego (del mod FRM)
- `public/icons.svg`, `public/favicon.svg` — UI

## 🚀 Desarrollo Local

```bash
# Instalar dependencias
npm install

# Desarrollo con hot-reload (puerto 5173)
npm run dev

# Verificar tipos TypeScript
npx tsc --noEmit

# Build producción (genera dist/)
npm run build

# Preview build local
npm run preview
```

### Configuración API en Desarrollo
Por defecto apunta a `http://80.190.78.17:8080`. Para desarrollo local:
1. Cambia en **Configuración** (icono ⚙️ en header) → URL de tu FRM
2. O edita `localStorage` en DevTools: `frm-base-url` = `http://localhost:8080`
3. Si usas proxy, configura en `vite.config.ts`

## 📦 Despliegue en Producción

### Build
```bash
npm run build
# Output: dist/ (archivos estáticos optimizados, chunkSizeWarningLimit: 800KB)
```

### Servidor (nginx + VPS)
```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    root /var/www/satisfactory;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy a FRM API (puerto 8080) - evita CORS
    location /api/frm/ {
        proxy_pass http://localhost:8080/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Stats del servidor (systemd service → /var/www/satisfactory/api/stats.json)
    location /api/stats.json {
        add_header Cache-Control "no-store";
    }
}
```

### Deploy Script (Windows → Linux VPS)
```powershell
cd C:\ruta\proyecto
npx tsc --noEmit          # verificar tipos
npm run build             # construir
scp -r dist/* root@TU_IP:/var/www/satisfactory/
ssh root@TU_IP "chmod -R 755 /var/www/satisfactory && chown -R www-data:www-data /var/www/satisfactory"
```
> ⚠️ **SIEMPRE** corregir permisos tras subir (403 Forbidden si no)

### Variables de Entorno / Configuración
**No hay variables de entorno en build time**. Toda configuración es **runtime** via:
- `localStorage` (`frm-base-url`, `frm-dashboard-settings`)
- Settings modal en la UI
- `/api/stats.json` generado por `server-stats.service` (systemd) en el VPS

## 📁 Estructura del Proyecto

```
satisfactory-dashboard/
├── public/                    # Assets estáticos servidos directamente
│   ├── item-icons/           # 150+ iconos de items (.png)
│   ├── map-icons/            # 7 iconos de mapa (.avif)
│   ├── map.avif              # Mapa completo del juego
│   ├── icons.svg / favicon.svg
├── src/
│   ├── components/           # Componentes UI reutilizables
│   │   ├── Header.tsx        # Barra superior completa
│   │   ├── SettingsModal.tsx # Configuración (URL, polling, alturas gráficas)
│   │   ├── PowerSection.tsx  # Circuitos + gráficas por circuito
│   │   ├── EfficiencyChart.tsx # Tendencias 5min (redimensionable)
│   │   ├── GeneratorsSection.tsx
│   │   ├── ProductionSection.tsx
│   │   ├── ExtractorsSection.tsx
│   │   ├── InventorySection.tsx
│   │   ├── TransportSection.tsx
│   │   ├── AlertsPanel.tsx   # Panel de alertas (lateral)
│   │   └── LoadingSkeleton.tsx
│   ├── hooks/
│   │   ├── useDashboardData.ts    # Polling unificado, historial circular
│   │   ├── useDashboardContext.tsx # Provider + useDashboard()
│   │   ├── useSettings.ts         # Configuración (localStorage)
│   │   └── useAlerts.ts           # Lógica de alertas
│   ├── lib/
│   │   ├── api.ts              # fetchFRM tipado, fetchAllDashboardData
│   │   ├── translations.ts     # Diccionario EN→ES (t())
│   │   └── utils.ts            # Helpers (formato números, etc.)
│   ├── pages/                  # 7 páginas principales
│   ├── types/
│   │   └── frm.ts              # Tipos TypeScript completos FRM API
│   ├── App.tsx                 # Router + Provider
│   └── main.tsx                # Entry point
├── .gitignore
├── README.md
├── PROJECT_CONTEXT.template.md # Plantilla docs privadas
├── package.json
├── tsconfig.json
├── vite.config.ts
└── index.html
```

## 🔧 Stack Detallado

| Paquete | Versión | Uso |
|---------|---------|-----|
| `react` / `react-dom` | 19.2.8 | Framework UI |
| `react-router-dom` | 7.6.2 | Routing SPA |
| `typescript` | 6.0.2 | Tipado estático |
| `vite` | 8.2.0 | Build tool / Dev server |
| `@vitejs/plugin-react` | 6.1.0 | React en Vite |
| `tailwindcss` | 4.3.3 | CSS utility-first |
| `@tailwindcss/vite` | 4.3.3 | Plugin Tailwind para Vite |
| `leaflet` | 1.9.4 | Mapa interactivo |
| `@types/leaflet` | 1.9.14 | Tipos Leaflet |
| `recharts` | 3.10.1 | Gráficas SVG |
| `lucide-react` | 1.33.0 | Iconos |
| `clsx` + `tailwind-merge` | 2.1.1 / 3.6.0 | Clases condicionales |
| `class-variance-authority` | 0.7.1 | Variantes de componentes |

## 🛡️ Seguridad y Buenas Prácticas

- ✅ **Sin secrets en código** (API keys, tokens, IPs, credenciales)
- ✅ **Sin variables de entorno** en build — config 100% runtime
- ✅ **Assets self-hosted** — cero dependencias CDN externas
- ✅ **TypeScript strict** — tipos completos para FRM API
- ✅ **Error boundaries implícitos** — try/catch en fetch, fallback a datos previos
- ✅ **Memory leak prevention** — historial circular (60 entradas), solo métricas agregadas
- ✅ **CORS manejado** — nginx proxy en producción, config baseUrl en dev

## 📝 Licencia

MIT — Libre para uso personal y comercial.

---

## 📋 Para Mantenedores

### Documentación Privada (NO en repo)
- `PROJECT_CONTEXT.md` → Ignorado por `.gitignore` (contiene IPs, IDs, credenciales)
- Usa `PROJECT_CONTEXT.template.md` como plantilla

### Comandos Útiles
```bash
# Ver diff antes de commit
git diff

# Commit convencional
git commit -m "feat: descripción"   # nueva feature
git commit -m "fix: descripción"    # bug fix
git commit -m "refactor: descripción" # refactor
git commit -m "docs: descripción"   # documentación

# Push
git push
```