'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// Service Role: Crucial para validaciones espaciales y triggers complejos
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GUARDAR INFRAESTRUCTURA (CREAR O EDITAR)
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
    // 1. Conversión a WKT para que PostGIS lo entienda como GEOMETRY
    const wktGeom = `POINT(${payload.longitud} ${payload.latitud})`;

    // 2. Llamada al RPC maestro de infraestructura
    const { data: result, error: rpcError } = await supabaseAdmin.rpc(
      'guardar_infraestructura_completa',
      {
        p_proyecto_id: payload.proyectoId,
        p_feature_type_id: payload.featureTypeId,
        p_geom: wktGeom,
        p_atributos: payload.atributos,
        p_id_edicion: payload.idEdicion || null
      }
    );

    if (rpcError) throw rpcError;

    // 3. Revalidación de caché de Next.js
    revalidatePath('/dashboard/mapa');
    revalidatePath(`/dashboard/proyectos/${payload.proyectoId}`);

    return { 
      success: true, 
      data: result 
    };

  } catch (error: any) {
    console.error("Error en saveInfraestructura:", error.message);
    return { error: error.message || "Error al procesar los datos geográficos" };
  }
}

/**
 * ELIMINAR ELEMENTO DE INFRAESTRUCTURA
 */
export async function deleteInfraestructura(featureId: string, proyectoId: string) {
  try {
    const { error } = await supabaseAdmin.rpc('fn_feature_delete', {
      p_feature_id: featureId
    });

    if (error) throw error;

    revalidatePath('/dashboard/mapa');
    revalidatePath(`/dashboard/proyectos/${proyectoId}`);
    
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

/**
 * OBTENER FOTOS (Vía RPC de seguridad)
 */
export async function getFeaturePhotos(featureId: string) {
  try {
    const { data, error } = await supabaseAdmin.rpc('fn_feature_photos_signed', {
      p_feature_id: featureId
    });

    if (error) throw error;
    return { success: true, photos: data };
  } catch (error: any) {
    return { error: error.message };
  }
}