/**
 * UTILIDADES DE SEGURIDAD PARA EL FRONTEND
 * Centraliza validaciones y sanitización de datos
 */

/**
 * Validación de UUID
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validación de email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.toLowerCase().trim());
}

/**
 * Validación de coordenadas geográficas
 */
export function isValidCoordinates(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Validación de bounding box
 */
export function isValidBoundingBox(bounds: { north: number; south: number; east: number; west: number }): boolean {
  const { north, south, east, west } = bounds;
  
  if (!isValidCoordinates(north, east) || !isValidCoordinates(south, west)) {
    return false;
  }
  
  if (south >= north || west >= east) {
    return false;
  }
  
  const latSpan = north - south;
  const lngSpan = east - west;
  
  // Limitar tamaño para prevenir abusos
  return latSpan <= 10 && lngSpan <= 10;
}

/**
 * Sanitización de texto (XSS protection)
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

/**
 * Sanitización de objeto JSON
 */
export function sanitizeObject(obj: Record<string, any>): Record<string, any> {
  const sanitized = { ...obj };
  
  // Eliminar propiedades peligrosas
  delete sanitized['__proto__'];
  delete sanitized['constructor'];
  delete sanitized['prototype'];
  delete sanitized['eval'];
  delete sanitized['Function'];
  delete sanitized['setTimeout'];
  delete sanitized['setInterval'];
  
  return sanitized;
}

/**
 * Validación de nombre (para personas, organizaciones, etc.)
 */
export function isValidName(name: string): boolean {
  const trimmedName = name.trim();
  return trimmedName.length >= 2 && trimmedName.length <= 100 && /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s.'-]+$/.test(trimmedName);
}

/**
 * Validación de NIT (formato colombiano)
 */
export function isValidNIT(nit: string): boolean {
  // Remover guiones, puntos y espacios
  const cleanNIT = nit.replace(/[-.\s]/g, '');
  return /^[0-9]{9,15}$/.test(cleanNIT);
}

/**
 * Validación de slug
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug) && slug.length >= 2 && slug.length <= 50;
}

/**
 * Validación de número de teléfono
 */
export function isValidPhone(phone: string): boolean {
  const cleanPhone = phone.replace(/[\s\-\+\(\)]/g, '');
  return /^[0-9]{7,15}$/.test(cleanPhone);
}

/**
 * Formatear coordenadas a 6 decimales
 */
export function formatCoordinate(coord: number): number {
  return Number(coord.toFixed(6));
}

/**
 * Validar y formatear objeto de infraestructura
 */
export function validateAndFormatInfrastructure(payload: any) {
  const errors: string[] = [];
  
  // Validar coordenadas
  if (typeof payload.latitud !== 'number' || !isValidCoordinates(payload.latitud, payload.longitud || 0)) {
    errors.push('Coordenadas inválidas');
  }
  
  // Validar UUIDs
  if (!isValidUUID(payload.proyectoId)) {
    errors.push('ID de proyecto inválido');
  }
  
  if (!isValidUUID(payload.featureTypeId)) {
    errors.push('ID de feature type inválido');
  }
  
  // Validar atributos
  try {
    if (payload.atributos) {
      JSON.stringify(payload.atributos);
    }
  } catch {
    errors.push('Atributos inválidos');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      proyectoId: payload.proyectoId,
      featureTypeId: payload.featureTypeId,
      latitud: formatCoordinate(payload.latitud),
      longitud: formatCoordinate(payload.longitud),
      atributos: sanitizeObject(payload.atributos || {}),
      idEdicion: payload.idEdicion || null
    }
  };
}

/**
 * Validar y formatear objeto de usuario
 */
export function validateAndFormatUser(payload: any) {
  const errors: string[] = [];
  
  // Validar nombre
  if (!isValidName(payload.nombre)) {
    errors.push('Nombre inválido (debe tener 2-100 caracteres)');
  }
  
  // Validar email
  if (!isValidEmail(payload.email)) {
    errors.push('Email inválido');
  }
  
  // Validar rol
  if (!payload.rol_id || payload.rol_id < 1 || payload.rol_id > 10) {
    errors.push('Rol inválido');
  }
  
  // Validar organización
  if (!isValidUUID(payload.organizacion_id)) {
    errors.push('ID de organización inválido');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      id: payload.id || null,
      nombre: sanitizeText(payload.nombre.trim()),
      email: payload.email.toLowerCase().trim(),
      rol_id: Number(payload.rol_id),
      organizacion_id: payload.organizacion_id
    }
  };
}

/**
 * Validar y formatear objeto de organización
 */
export function validateAndFormatOrganization(payload: any) {
  const errors: string[] = [];
  
  // Validar nombre
  if (!isValidName(payload.nombre)) {
    errors.push('Nombre inválido (debe tener 2-100 caracteres)');
  }
  
  // Validar NIT
  if (!isValidNIT(payload.nit)) {
    errors.push('NIT inválido');
  }
  
  // Validar slug
  if (!isValidSlug(payload.slug)) {
    errors.push('Slug inválido (solo minúsculas, números y guiones)');
  }
  
  // Validar PM
  if (!isValidEmail(payload.pmEmail)) {
    errors.push('Email del PM inválido');
  }
  
  if (!isValidName(payload.pmNombre)) {
    errors.push('Nombre del PM inválido');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      nombre: sanitizeText(payload.nombre.trim()),
      nit: payload.nit.replace(/[-.\s]/g, ''),
      slug: payload.slug.toLowerCase().trim(),
      pmNombre: sanitizeText(payload.pmNombre.trim()),
      pmEmail: payload.pmEmail.toLowerCase().trim()
    }
  };
}

/**
 * Limitar tamaño de string para prevenir abusos
 */
export function limitString(str: string, maxLength: number): string {
  if (!str || typeof str !== 'string') return '';
  return str.substring(0, maxLength);
}

/**
 * Rate limiting simple en memoria (para pruebas/desarrollo)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string, 
  maxRequests: number = 30, 
  windowMs: number = 60000 // 1 minuto
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const existing = rateLimitStore.get(identifier);
  
  if (!existing || now > existing.resetTime) {
    // Nueva ventana o reset
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    });
    return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs };
  }
  
  if (existing.count >= maxRequests) {
    return { 
      allowed: false, 
      remaining: 0, 
      resetTime: existing.resetTime 
    };
  }
  
  existing.count++;
  return { 
    allowed: true, 
    remaining: maxRequests - existing.count, 
    resetTime: existing.resetTime 
  };
}