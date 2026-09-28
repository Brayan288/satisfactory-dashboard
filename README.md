# Satisfactory FRM Dashboard

Dashboard web para monitorear un servidor de **Satisfactory** usando el mod **Ficsit Remote Monitoring (FRM)**.

![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-6-blue)
![Vite](https://img.shields.io/badge/Vite-8-purple)
![Tailwind](https://img.shields.io/badge/Tailwind-4-teal)

## Características

- **Monitoreo de energía**: Producción, consumo, gráficas por circuito
- **Generadores**: Estado detallado, eficiencia, combustible
- **Producción**: Fábricas, recetas, throughput
- **Extractores**: Mineros, pozos de petróleo, pureza de nodos
- **Inventario**: Almacenamiento, contenedores, items
- **Transporte**: Cintas, trenes, camiones, tuberías
- **Mapa interactivo**: Leaflet con imagen del juego, marcadores en tiempo real
- **Alertas**: Notificaciones de problemas (energía baja, producción detenida, etc.)
- **Totalmente self-hosted**: Sin dependencias externas, todo corre en tu VPS

## Stack Tecnológico

| Tecnología | Uso |
|------------|-----|
| React 19 + TypeScript | Frontend |
| Vite 8 | Build tool & dev server |
| Tailwind CSS 4 | Estilos |
| React Router 7 | Navegación SPA |
| Leaflet | Mapa interactivo |
| Recharts | Gráficas |
| Lucide React | Iconos |

## Requisitos

- Node.js 20+
- Servidor Satisfactory con mod **Ficsit Remote Monitoring** habilitado
- Puerto 8080 accesible desde donde corra el dashboard (FRM API)

## Desarrollo Local

```bash
# Instalar dependencias
npm install

# Desarrollo con hot-reload
npm run dev

# Verificar tipos
npm run build

# Preview de producción
npm run preview
```

El dashboard hace polling a `http://localhost:8080` (FRM API). Para desarrollo local, necesitas:
1. Tener el servidor Satisfactory corriendo con FRM
2. O configurar un proxy en `vite.config.ts` para apuntar a tu servidor remoto

## Despliegue

### Build de producción
```bash
npm run build
```
Genera la carpeta `dist/` con archivos estáticos optimizados.

### Servidor (nginx + VPS)
```nginx
# Ejemplo configuración nginx
server {
    listen 80;
    server_name tu-dominio.com;
    root /var/www/satisfactory;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy a FRM API (puerto 8080)
    location /api/frm/ {
        proxy_pass http://localhost:8080/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### Permisos importantes
```bash
chmod -R 755 /var/www/satisfactory
chown -R www-data:www-data /var/www/satisfactory
```

## Estructura del Proyecto

```
src/
├── components/     # Componentes UI reutilizables
├── hooks/          # Custom hooks (useDashboardData, useSettings, etc.)
├── lib/            # Utilidades, API, traducciones
├── pages/          # Páginas principales (Power, Generators, Map, etc.)
├── types/          # Tipos TypeScript (FRM API)
└── main.tsx        # Entry point
```

## Endpoints FRM Utilizados

- `getPower` - Estado de red eléctrica
- `getGenerators` - Generadores detallados
- `getFactory` / `getExtractor` - Producción y extracción
- `getStorageInv` - Inventarios
- `getPlayer` / `getMapMarkers` - Mapa y jugadores
- `getCables` / `getPipes` / `getTrains` / `getVehicles` - Transporte

## Soluciones Implementadas

### Memory Leak (Resuelto)
El historial guarda solo métricas agregadas (máx 60 entradas) en lugar de copias completas de datos cada tick.

### Nombres de Circuitos Estables
Los IDs de circuito cambian tras reinicios. La solución guarda nombres asociados a **posiciones (x,y)** de generadores en `localStorage`.

### Self-Hosted Assets
Todos los iconos (items, mapa) se sirven localmente desde `public/`.

## Licencia

MIT - Libre para uso personal y comercial.

---

**Nota**: La configuración de infraestructura (VPS, credenciales, IPs) se mantiene en documentación privada local.