# Implementación de Funciones RPC Mejoradas con Seguridad

Este documento describe la implementación de versiones mejoradas de las funciones RPC existentes con validación estricta de organización, verificación de roles y permisos, manejo seguro de errores y logging de auditoría.

## 📋 Resumen de Mejoras

### Problemas Identificados

1. **fn_busqueda_global_infra** - No validaba organización del usuario
2. **fn_feature_delete** - Podría ser más robusta  
3. **fn_feature_photos_signed** - Necesitaba mejor validación

### Soluciones Implementadas

### 1. fn_busqueda_global_infra_segura

**Mejoras:**
- ✅ Validación estricta de organización usando `fn_my_org()`
- ✅ Verificación de roles y permisos específicos
- ✅ Paginación segura con límites (1-1000 resultados)
- ✅ Sanitización de parámetros de búsqueda
- ✅ Logging completo de auditoría
- ✅ Manejo robusto de errores

**Parámetros:**
```sql
fn_busqueda_global_infra_segura(
    p_search text DEFAULT NULL,
    p_limit integer DEFAULT 100,
    p_offset integer DEFAULT 0
)
```

**Validaciones:**
- Usuario autenticado y activo
- Parámetros sanitizados
- Permisos verificables en tabla `permisos_rol`
- Admin Global (rol 4) tiene acceso total

---

### 2. fn_feature_delete_segura

**Mejoras:**
- ✅ Validación completa de permisos por organización
- ✅ Soft delete con auditoría completa
- ✅ Verificación de rol antes de eliminación
- ✅ Registro de intentos no autorizados
- ✅ Respuesta estructurada con información detallada

**Parámetros:**
```sql
fn_feature_delete_segura(p_feature_id uuid)
```

**Retorna:**
```json
{
    "success": boolean,
    "message": string,
    "feature_id": uuid,
    "deleted_at": timestamp
}
```

---

### 3. fn_feature_photos_signed_segura

**Mejoras:**
- ✅ Validación de paths seguros (prevención path traversal)
- ✅ Límite de fotos para prevenir abuso (máximo 50)
- ✅ Verificación de organización y permisos
- ✅ Detección de patrones sospechosos
- ✅ Metadata extendida sobre archivos

**Retorna información adicional:**
- `storage_path` - Ruta sanitizada
- `file_size` - Tamaño del archivo
- `mime_type` - Tipo MIME
- `uploaded_by` - Usuario que subió
- `uploader_name` - Nombre del uploader
- `access_granted_at` - Timestamp de acceso

---

## 🗃️ Tablas de Auditoría

### auditoria_accesos

Registra todos los accesos a funciones críticas:

```sql
CREATE TABLE public.auditoria_accesos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id uuid REFERENCES auth.users(id),
    accion text NOT NULL,
    recurso text NOT NULL,
    ip_address inet,
    user_agent text,
    exito boolean NOT NULL,
    detalles jsonb,
    creado_en timestamp with time zone DEFAULT now(),
    organizacion_id uuid REFERENCES public.organizaciones(id)
);
```

### auditoria_borrados (mejorada)

```sql
ALTER TABLE public.auditoria_borrados 
ADD COLUMN IF NOT EXISTS ip_address inet,
ADD COLUMN IF NOT EXISTS user_agent text,
ADD COLUMN IF NOT EXISTS organizacion_id uuid REFERENCES public.organizaciones(id);
```

---

## 🔧 Funciones Auxiliares

### fn_verificar_permisos_usuario
Verifica permisos específicos del usuario actual en una organización.

### fn_registrar_evento_seguridad
Registra eventos de seguridad para auditoría centralizada.

### fn_validar_acceso_feature
Validación centralizada de acceso a features.

### fn_limpiar_auditoria_antigua
Limpia registros antiguos según política de retención (default 365 días).

### fn_estadisticas_seguridad
Genera estadísticas de seguridad para dashboard administrativo.

### fn_detectar_patrones_sospechosos
Detecta automáticamente patrones de comportamiento anómalo.

---

## 📦 Archivos Creados

### 1. `funciones_rpc_mejoradas.sql`
Contiene las tres funciones principales mejoradas y las tablas de auditoría.

### 2. `funciones_auxiliares_seguridad.sql`
Contiene las funciones auxiliares de seguridad y utilidades.

### 3. `src/app/actions/infraestructura-segura.ts`
Actions del lado del servidor con validaciones de TypeScript y Zod.

---

## 🚀 Implementación Paso a Paso

### 1. Ejecutar Scripts SQL

```bash
# En Supabase SQL Editor o psql
\i funciones_rpc_mejoradas.sql
\i funciones_auxiliares_seguridad.sql
```

### 2. Actualizar Código TypeScript

```typescript
// Importar las nuevas funciones seguras
import {
  busquedaGlobalInfraestructuraSegura,
  deleteInfraestructuraSegura,
  getFeaturePhotosSegura,
  registrarEventoSeguridad
} from '@/app/actions/infraestructura-segura'

// Usar en componentes
const resultados = await busquedaGlobalInfraestructuraSegura({
  search: searchTerm,
  limit: 50,
  offset: 0
})
```

### 3. Configurar Monitoreo

```typescript
// Configurar logging de eventos de seguridad
await registrarEventoSeguridad({
  accion: 'USER_LOGIN',
  recurso: 'dashboard',
  exito: true,
  detalles: { userId, timestamp: new Date() }
})
```

---

## 🛡️ Niveles de Seguridad

### Level 1: Autenticación
- Usuario autenticado requerido
- Validación de JWT tokens
- Verificación de estado activo

### Level 2: Autorización
- Validación de organización
- Verificación de roles (Admin Global = rol 4)
- Permisos específicos en tabla `permisos_rol`

### Level 3: Validación de Input
- Sanitización de parámetros
- Validación de tipos y formatos
- Prevención de inyección SQL

### Level 4: Auditoría
- Logging completo de accesos
- Registro de intentos fallidos
- Metadatos de contexto (IP, User-Agent)

### Level 5: Detección de Anomalías
- Patrones sospechosos
- Múltiples IPs
- Acceso fuera de horario
- Intentos fallidos consecutivos

---

## 📊 Métricas de Seguridad

### Eventos Monitoreados
- ✅ Búsquedas globales de infraestructura
- ✅ Eliminación de features
- ✅ Acceso a fotos firmadas
- ✅ Intentos de acceso no autorizados
- ✅ Patrones de comportamiento anómalo

### Alertas Automáticas
- 🔴 Alto: 5+ eliminaciones fallidas en 1 hora
- 🟡 Medio: Acceso desde 3+ IPs en 30 minutos
- 🟢 Bajo: Acceso frecuente fuera de horario laboral

---

## 🔍 Debugging y Monitoreo

### Ver Logs de Auditoría

```sql
-- Ver accesos recientes
SELECT * FROM public.auditoria_accesos 
WHERE creado_en > now() - interval '24 hours'
ORDER BY creado_en DESC;

-- Ver intentos fallidos
SELECT * FROM public.auditoria_accesos 
WHERE exito = false 
  AND creado_en > now() - interval '1 hour';

-- Detectar patrones sospechosos
SELECT * FROM fn_detectar_patrones_sospechosos();
```

### Estadísticas de Seguridad

```sql
-- Estadísticas de últimos 30 días
SELECT * FROM fn_estadisticas_seguridad(30);

-- Limpiar auditoría antigua
SELECT * FROM fn_limpiar_auditoria_antigua(365);
```

---

## ⚠️ Consideraciones Importantes

### Performance
- Los logs de auditoría pueden crecer rápidamente
- Implementar limpieza automática periódica
- Considerar tablas particionadas por fecha

### Privacidad
- Los logs contienen IP addresses y user agents
- Cumplir con GDPR y regulaciones locales
- Implementar políticas de retención adecuadas

### Escalabilidad
- Monitorizar el tamaño de las tablas de auditoría
- Considerar storage dedicado para logs históricos
- Implementar índices apropiados para consultas frecuentes

---

## 🔄 Migración Gradual

### Fase 1: Implementación Paralela
- Desplegar nuevas funciones junto con las existentes
- Comparar resultados y性能
- Identificar diferencias de comportamiento

### Fase 2: Testing en Producción
- Usar las funciones seguras en rutas específicas
- Monitorear logs de errores y rendimiento
- Recibir feedback de usuarios

### Fase 3: Migración Completa
- Reemplazar completamente las funciones antiguas
- Eliminar código legacy
- Documentar nuevos patrones

---

## 📞 Soporte y Mantenimiento

### Monitoreo Continuo
- Revisar logs de errores diariamente
- Monitorear patrones de uso anómalos
- Optimizar queries basado en métricas

### Actualizaciones de Seguridad
- Revisar permisos trimestralmente
- Actualizar patrones de detección
- Capacitar equipo sobre nuevas amenazas

### Documentación
- Mantener este documento actualizado
- Documentar incidentes de seguridad
- Crear playbooks de respuesta

---

## 🎯 Mejoras Futuras

### Corto Plazo (1-2 meses)
- [ ] Implementar rate limiting por usuario
- [ ] Agregar validación de geolocalización
- [ ] Integrar con sistema de SIEM

### Mediano Plazo (3-6 meses)
- [ ] Machine learning para detección de anomalías
- [ ] Dashboard de seguridad en tiempo real
- [ ] Integración con servicios de threat intelligence

### Largo Plazo (6+ meses)
- [ ] Sistema de scoring de riesgo de usuarios
- [ ] Respuesta automatizada a incidentes
- [ ] Integración con frameworks de compliance

---

## 📝 Checklist de Implementación

- [ ] Ejecutar scripts SQL en ambiente de desarrollo
- [ ] Probar funciones con diferentes roles de usuario
- [ ] Verificar logs de auditoría
- [ ] Actualizar código TypeScript
- [ ] Realizar pruebas de carga
- [ ] Documentar procedimientos
- [ ] Capacitar equipo de desarrollo
- [ ] Planificar roll-back strategy
- [ ] Implementar en producción
- [ ] Monitorear post-deployment

---

**Creado:** 2026-01-17  
**Versión:** 1.0  
**Responsable:** Equipo de Seguridad