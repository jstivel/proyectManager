'use server'

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from 'next/cache'

/**
 * Guarda o Actualiza una infraestructura (Punto en el mapa)
 * Mantiene compatibilidad con JSONB para atributos dinámicos
 */
export async function saveInfraestructura(payload: any) {
  // Uso correcto de tu función asíncrona de servidor
  const supabase = await createClient();

  try {
    // 1. Verificación de sesión
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Sesión no válida o expirada');

    // 2. Validación estricta de Roles (PM y Administrador)
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('id', user.id)
      .single();

    const rolesPermitidos = ['Project Manager', 'Administrador Global'];
    if (!usuario || !rolesPermitidos.includes(usuario.rol)) {
      throw new Error('Acceso denegado: Se requieren permisos de Project Manager o Administrador.');
    }

    const { 
      id, 
      proyectoId, 
      capaId, 
      coordenadas, 
      atributos, 
      estado, 
      id_tecnico 
    } = payload;

    // 3. Preparación de Geometría PostGIS (WKT)
    // Coordenadas deben venir como { lng: number, lat: number }
    const pointWKT = `POINT(${coordenadas.lng} ${coordenadas.lat})`;

    const datosBase = {
      proyecto_id: proyectoId,
      feature_type_id: capaId,
      geom: pointWKT,
      atributos: atributos || {}, // Objeto JSONB
      estado: estado || 'preliminar',
      id_tecnico: id_tecnico || null,
      updated_at: new Date().toISOString(),
    };

    let response;

    if (id) {
      // MODO EDICIÓN
      response = await supabase
        .from('infraestructuras')
        .update(datosBase)
        .eq('id', id)
        .select();
    } else {
      // MODO CREACIÓN
      response = await supabase
        .from('infraestructuras')
        .insert([{ 
          ...datosBase, 
          creado_por: user.id 
        }])
        .select();
    }

    if (response.error) {
      console.error("Error Supabase:", response.error);
      throw new Error(response.error.message);
    }

    // Limpiar caché del path del proyecto para ver reflejados los cambios
    revalidatePath(`/proyectos/${proyectoId}`);

    return { 
      success: true, 
      data: response.data[0] 
    };

  } catch (error: any) {
    console.error('Error en Action saveInfraestructura:', error.message);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

/**
 * Elimina un elemento de infraestructura
 * Solo permitido para roles de gestión
 */
export async function deleteInfraestructura(id: string, proyectoId: string) {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autorizado');

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('id', user.id)
      .single();

    if (!usuario || !['Project Manager', 'Administrador Global'].includes(usuario.rol)) {
      throw new Error('No tienes permisos para eliminar elementos de este proyecto.');
    }

    const { error } = await supabase
      .from('infraestructuras')
      .delete()
      .eq('id', id)
      .eq('proyecto_id', proyectoId);

    if (error) throw error;

    revalidatePath(`/proyectos/${proyectoId}`);
    return { success: true };

  } catch (error: any) {
    console.error('Error en Action deleteInfraestructura:', error.message);
    return { 
      success: false, 
      error: error.message 
    };
  }
}