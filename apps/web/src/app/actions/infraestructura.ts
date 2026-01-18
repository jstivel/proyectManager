'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { validateAndFormatInfrastructure, isValidUUID } from '@/utils/security'

// Service Role: Crucial para validaciones espaciales y triggers complejos
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GUARDAR INFRAESTRUCTURA (CREAR O EDITAR) - VERSIÓN MEJORADA
 * Centraliza la lógica de puntos (Postes, Cámaras, etc.) con validación PostGIS.
 */
export async function saveInfraestructura(payload: {
  proyectoId: string,
  featureTypeId: string,
  latitud: number,
  longitud: number,
  atributos: Record<string, any>,
  idEdicion?: string 
}) {
  try {
    // 0. Validación estricta de inputs usando utilidades de seguridad
    const validation = validateAndFormatInfrastructure(payload);
    if (!validation.isValid) {
      return { error: `Validación fallida: ${validation.errors.join(', ')}` };
    }

    // 1. Usar datos sanitizados
    const sanitized = validation.sanitized;
    
    // 2. Conversión a WKT para que PostGIS lo entienda como GEOMETRY
    const wktGeom = `POINT(${sanitized.longitud} ${sanitized.latitud})`;

    // 3. Llamada al RPC maestro de infraestructura (versión segura)
    const { data: result, error: rpcError } = await supabaseAdmin.rpc(
      'guardar_infraestructura_completa_segura',
      {
        p_proyecto_id: sanitized.proyectoId,
        p_feature_type_id: sanitized.featureTypeId,
        p_geom: wktGeom,
        p_atributos: sanitized.atributos,
        p_id_edicion: sanitized.idEdicion
      }
    );

    if (rpcError) {
      console.error("Error RPC en saveInfraestructura:", rpcError);
      return { error: "Error en la operación de base de datos" };
    }

    // 5. Revalidación de caché de Next.js
    revalidatePath('/dashboard/mapa');
    revalidatePath(`/dashboard/proyectos/${payload.proyectoId}`);

    return { 
      success: true, 
      data: result 
    };

  } catch (error: any) {
    console.error("Error en saveInfraestructura:", error.message);
    
    // No exponer detalles de errores internos en producción
    if (process.env.NODE_ENV === 'production') {
      return { error: "Error al procesar la solicitud" };
    }
    
    return { error: error.message || "Error al procesar los datos geográficos" };
  }
}

/**
 * ELIMINAR ELEMENTO DE INFRAESTRUCTURA - VERSIÓN MEJORADA
 */
export async function deleteInfraestructura(featureId: string, proyectoId: string) {
  try {
    // Validación de UUID
    if (!isValidUUID(featureId)) {
      return { error: "ID de feature inválido" };
    }

    // Usar función RPC segura con auditoría
    const { data: result, error } = await supabaseAdmin.rpc('fn_feature_delete_segura', {
      p_feature_id: featureId
    });

    if (error) {
      console.error("Error RPC en deleteInfraestructura:", error);
      return { error: "Error al eliminar el elemento" };
    }

    // Verificar que la operación fue exitosa
    if (result && result.success === false) {
      return { error: result.error || "Error en la operación" };
    }

    revalidatePath('/dashboard/mapa');
    revalidatePath(`/dashboard/proyectos/${proyectoId}`);
    
    return { success: true, auditLog: result?.audit_id };
  } catch (error: any) {
    console.error("Error en deleteInfraestructura:", error.message);
    
    if (process.env.NODE_ENV === 'production') {
      return { error: "Error al procesar la solicitud" };
    }
    
    return { error: error.message };
  }
}

/**
 * OBTENER FOTOS (Vía RPC de seguridad) - VERSIÓN MEJORADA
 */
export async function getFeaturePhotos(featureId: string) {
  try {
    // Validación de UUID
    if (!isValidUUID(featureId)) {
      return { error: "ID de feature inválido" };
    }

    // Usar función RPC segura con validación de paths
    const { data, error } = await supabaseAdmin.rpc('fn_feature_photos_signed_segura', {
      p_feature_id: featureId
    });

    if (error) {
      console.error("Error RPC en getFeaturePhotos:", error);
      return { error: "Error al obtener las fotos" };
    }

    // Validar que los datos devueltos sean seguros
    const photos = Array.isArray(data) ? data.filter(photo => 
      photo && 
      typeof photo.id === 'string' && 
      typeof photo.signed_url === 'string' &&
      photo.signed_url.startsWith('https://')
    ) : [];

    return { success: true, photos };
  } catch (error: any) {
    console.error("Error en getFeaturePhotos:", error.message);
    
    if (process.env.NODE_ENV === 'production') {
      return { error: "Error al procesar la solicitud" };
    }
    
    return { error: error.message };
  }
}