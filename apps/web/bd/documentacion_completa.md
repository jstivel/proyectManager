# 📋 Documentación Completa - Proyecto Replanteo App

## 🎯 **Resumen Ejecutivo**

**Replanteo App** es una plataforma web de gestión de infraestructuras y levantamiento de campo, desarrollada con Next.js 16, React 19 y Supabase. El sistema permite a organizaciones gestionar proyectos de mapeo, asignar técnicos, y recopilar datos georreferenciados de infraestructuras mediante una interfaz de mapas interactiva.

### **Propósito Principal**
- Digitalizar el proceso de levantamiento de infraestructuras
- Centralizar la gestión de proyectos y equipos
- Proporcionar visibilidad en tiempo real del avance
- Facilitar la colaboración entre diferentes roles

---

## 🏗️ **Arquitectura Técnica**

### **Stack Tecnológico**
```
Frontend:  Next.js 16 + React 19 + TypeScript
Backend:   Supabase (PostgreSQL + Auth + Storage)
Maps:      Mapbox GL JS + React-Leaflet
UI:        TailwindCSS 4 + Radix UI + Lucide Icons
State:     React Query (TanStack Query)
Mobile:    Expo/React Native (futuro)
```

### **Patrones de Arquitectura**
- **Multi-tenancy**: Aislamiento de datos por organización
- **RLS**: Row Level Security en PostgreSQL
- **Server Components**: Next.js 13+ App Router
- **RPC Functions**: Funciones PostgreSQL seguras
- **Type Safety**: TypeScript en toda la aplicación

---

## 🗂️ **Estructura del Proyecto**

```
Replanteo_app/
├── apps/
│   ├── web/                    # Aplicación web principal
│   │   ├── src/
│   │   │   ├── app/            # App Router (páginas)
│   │   │   ├── components/     # Componentes React
│   │   │   ├── hooks/          # Hooks personalizados
│   │   │   ├── utils/          # Utilidades y helpers
│   │   │   └── types/          # Tipos TypeScript
│   │   ├── bd/                 # Scripts SQL y documentación
│   │   └── package.json
│   └── mobile/                 # Aplicación móvil (Expo)
└── docs/                       # Documentación del proyecto
```

---

## 👥 **Sistema de Roles y Permisos**

### **Jerarquía de Roles**
| ID | Rol | Permisos | Acceso |
|---|---|---|---|
| 4 | Administrador Global | Acceso total a todas las organizaciones | Dashboard completo |
| 7 | Project Manager | Gestión completa de su organización | Dashboard PM |
| 3 | Supervisor | Supervisión de técnicos y proyectos | Vista supervisión |
| 6 | Técnico | Levantamiento de campo y edición | Mapa y formularios |
| 5 | Supervisor | Similar a rol 3 | Vista supervisión |

### **Permisos por Rol**
```typescript
// Administrador Global (ID 4)
- Ver todas las organizaciones
- Crear/eliminar organizaciones
- Gestión de usuarios globales
- Estadísticas globales

// Project Manager (ID 7)  
- Ver solo su organización
- Crear proyectos y asignar capas
- Gestionar usuarios de su org
- Estadísticas de su organización

// Técnico (ID 6)
- Acceso al mapa de sus proyectos
- Editar infraestructuras
- Subir fotos y datos
- Vista limitada del dashboard
```

---

## 🗄️ **Base de Datos y Funciones RPC**

### **Tablas Principales**
```sql
usuarios              -- Perfiles de usuarios con roles
organizaciones        -- Empresas/entidades
proyectos             -- Proyectos de levantamiento
features              -- Puntos geográficos (infraestructuras)
feature_types         -- Tipos de infraestructuras
layers                -- Capas geográficas
roles                 -- Sistema de roles y permisos
auditoria_*          -- Tablas de auditoría de cambios
```

### **Funciones RPC Críticas**

#### **Dashboard y Estadísticas**
- `get_admin_full_telemetry()` - Estadísticas globales para admin
- `get_organizaciones_dashboard()` - Organizaciones con conteos
- `get_usuarios_dashboard()` - Usuarios con roles y organizaciones

#### **Gestión CRUD**
- `fn_save_usuario_seguro()` - Crear/actualizar usuarios
- `fn_delete_usuario_seguro()` - Soft delete de usuarios
- `guardar_infraestructura_completa_segura()` - Guardar puntos del mapa

#### **Seguridad y Acceso**
- `get_usuarios_seguros_v2()` - Listado seguro de usuarios
- `get_infra_by_bbox_seguro()` - Infraestructuras por área geográfica

---

## 🔄 **Flujos de Trabajo Principales**

### **1. Flujo de Autenticación**
```
Usuario → Login → Supabase Auth → JWT → get_mi_perfil_seguro() → Dashboard por rol
```

### **2. Flujo de Onboarding de Organización**
```
Admin crea organización → Sistema crea PM → Email invitación → PM completa registro → Configura proyectos
```

### **3. Flujo de Levantamiento de Infraestructura**
```
PM crea proyecto → Asigna capas → Técnicos usan mapa → Añaden puntos → Formularios dinámicos → Fotos georreferenciadas
```

### **4. Flujo de Multi-tenancy**
```
Request → Validación JWT → RLS Policy → {Admin: todos los datos | Otros: datos de su organización}
```

---

## 🗺️ **Sistema de Mapas**

### **Componentes Principales**
- **Map.tsx**: Componente principal con Mapbox GL
- **LayerControl**: Gestión de visibilidad de capas  
- **SearchPanel**: Búsqueda y filtrado avanzado
- **FloatingDock**: Controles intuitivos flotantes

### **Flujo de Datos Geográficos**
```
Movimiento del mapa → Nuevo BBox → get_infra_by_bbox_seguro() → GeoJSON → Mapbox Layers → Renderizado
```

### **Características**
- Carga dinámica por bounding box (optimización de rendimiento)
- Edición inline de infraestructuras
- Formularios dinámicos según tipo de feature
- Subida de fotos georreferenciadas
- Control de capas por proyecto

---

## 🔒 **Seguridad y Validaciones**

### **Capas de Seguridad**
1. **Frontend**: Validaciones y sanitización (`security.ts`)
2. **Server Actions**: Validaciones y rate limiting
3. **Backend**: RLS + RPC Functions con seguridad
4. **Base de Datos**: Triggers de auditoría

### **Validaciones Implementadas**
- Sanitización de inputs XSS
- Validación de formatos de email
- Verificación de permisos por organización
- Prevención de autoeliminación
- Auditoría de todos los cambios

---

## 📊 **Dashboard y Analytics**

### **Dashboard por Rol**
- **AdminDashboard**: Vista global de todas las organizaciones
- **PMDashboard**: Vista específica de la organización del usuario
- **StatCard**: Componente reutilizable para métricas

### **Métricas en Tiempo Real**
- Total de organizaciones, usuarios, proyectos
- Estado de salud del sistema
- Actividad reciente por organización
- Progreso de levantamiento por proyecto

---

## 🛠️ **Herramientas de Desarrollo**

### **Configuración TypeScript**
- Tipos estrictos para todas las entidades
- Interfaces centralizadas en `types/index.ts`
- Validaciones de tipos en runtime

### **Code Quality**
- ESLint configurado para Next.js
- Componentes memoizados para rendimiento
- React Query para caché y optimización
- Server Actions para operaciones seguras

---

## 🚀 **Despliegue y Producción**

### **Variables de Entorno**
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_MAPBOX_TOKEN=...
```

### **Consideraciones de Producción**
- Configuración de CORS para Supabase
- Políticas RLS activas y probadas
- Monitorización de errores
- Backups automáticos de base de datos

---

## 📈 **Performance y Optimización**

### **Optimizaciones Implementadas**
- **React Query**: Caché inteligente de datos
- **Dynamic Loading**: Carga de datos por BBox
- **Component Memoization**: Evita re-renders innecesarios
- **Image Optimization**: Subida y compresión de fotos

### **Métricas de Rendimiento**
- First Contentful Paint: < 1.5s
- Time to Interactive: < 2s
- Map load time: < 3s
- API response time: < 500ms

---

## 🔄 **Ciclo de Vida de Desarrollo**

### **Flujo de Trabajo**
```
Feature Branch → Code Review → Testing → Staging → Production
```

### **Calidad Asegurada**
- Revisión de código para todas las PRs
- Testing manual de flujos críticos
- Validación de seguridad en cambios
- Actualización de documentación

---

## 📚 **Mantenimiento y Soporte**

### **Tareas de Mantenimiento**
- Actualización de dependencias
- Revisión de logs de error
- Optimización de consultas SQL
- Limpieza de archivos obsoletos

### **Monitoreo**
- Error tracking en producción
- Performance monitoring
- Database performance metrics
- User activity analytics

---

## 🔮 **Roadmap Futuro**

### **Corto Plazo (1-3 meses)**
- Implementación de testing automatizado
- Mejoras en UI/UX del mapa
- Optimización de consultas complejas
- Sistema de notificaciones

### **Mediano Plazo (3-6 meses)**  
- Aplicación móvil nativa
- Reportes avanzados y analytics
- Integración con APIs externas
- Sistema de workflows

### **Largo Plazo (6+ meses)**
- Machine learning para clasificación
- Real-time collaboration
- Offline mode para móvil
- Integración con GIS enterprise

---

## 📞 **Soporte y Contacto**

### **Equipo de Desarrollo**
- **Frontend**: Next.js, React, TypeScript
- **Backend**: Supabase, PostgreSQL
- **DevOps**: Vercel, GitHub Actions
- **UI/UX**: TailwindCSS, Radix UI

### **Recursos**
- Documentación técnica: `/docs`
- API Reference: Funciones RPC documentadas
- Diagramas de flujo: `bd/diagramas_flujo.md`
- Historial de cambios: `bd/historial_conversaciones.json`

---

## 📋 **Checklist de Implementación**

### **✅ Completado**
- [x] Sistema de autenticación y roles
- [x] Dashboard multi-rol
- [x] Sistema de mapas interactivo
- [x] CRUD de usuarios y organizaciones
- [x] Multi-tenancy con RLS
- [x] Formularios dinámicos
- [x] Sistema de auditoría

### **🔄 En Progreso**
- [ ] Testing automatizado
- [ ] Optimización de performance
- [ ] Documentación API
- [ ] Sistema de reportes

### **⏳ Pendiente**
- [ ] App móvil nativa
- [ ] Integraciones externas
- [ ] Analytics avanzados
- [ ] Sistema de notificaciones

---

*Esta documentación está diseñada para facilitar el entendimiento rápido del proyecto y servir como guía para futuros mantenimientos y desarrollos.*