'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { createClient as createServerClient } from '@/utils/supabase/server'

/**
 * INSTANCIA ADMIN (Bypass RLS)
 * Usamos esta instancia solo para acciones que requieren privilegios de sistema
 * como invitar usuarios o borrados físicos.
 */
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

/**
 * VALIDACIÓN DE INPUTS DE ORGANIZACIÓN
 */
function validateOrganizationInput(payload: any) {
  const errors: string[] = [];
  
  if (!payload.nombre || payload.nombre.trim().length < 2) {
    errors.push('El nombre corporativo es demasiado corto');
  }
  
  if (!payload.nit || payload.nit.length < 5) {
    errors.push('NIT inválido');
  }
  
  if (!payload.pmEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.pmEmail)) {
    errors.push('Email del PM no tiene formato válido');
  }
  
  return errors;
}

/**
 * CREAR ORGANIZACIÓN Y PM (FLUJO ATÓMICO)
 */
export async function adminCreateOrganization(payload: { 
  nombre: string, 
  nit: string, 
  slug: string,
  pmNombre: string,
  pmEmail: string,
  plan_id: number // Añadido
}) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "No autenticado" };

    // 1. Invitar al PM
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      payload.pmEmail.toLowerCase().trim(),
      { 
        data: { nombre: payload.pmNombre, rol_id: 7 },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/set-password`
      }
    );

    let finalPmId = authUser?.user?.id;
    if (authError?.code === 'email_exists') {
        const { data: list } = await supabaseAdmin.auth.admin.listUsers();
        finalPmId = list.users.find(u => u.email === payload.pmEmail.toLowerCase())?.id;
    } else if (authError) return { success: false, error: authError.message };

    if (!finalPmId) return { success: false, error: "No se pudo determinar el ID del PM" };

    // 2. Llamar a la RPC unificada
    const { data, error: rpcError } = await supabaseAdmin.rpc('create_org_with_pm_rpc_seguro', {
        p_nombre: payload.nombre,
        p_nit: payload.nit,
        p_slug: payload.slug,
        p_pm_id: finalPmId,
        p_pm_nombre: payload.pmNombre,
        p_pm_email: payload.pmEmail.toLowerCase().trim(),
        p_admin_id: user.id,
        p_plan_id: payload.plan_id
    });

    const result = Array.isArray(data) ? data[0] : data;
    if (!result?.success) return { success: false, error: result?.message || "Error en DB" };

    revalidatePath('/dashboard/organizaciones');
    return { success: true, orgId: result.org_id };
  } catch (error: any) {
    return { success: false, error: "Error interno de creación" };
  }
}
/**
 * ELIMINAR ORGANIZACIÓN (BORRADO FÍSICO)
 */
export async function adminDeleteOrganization(orgId: string) {
  try {
    const { data, error } = await supabaseAdmin.rpc('delete_organization_safe', { 
      p_org_id: orgId 
    })
    
    if (error) {
      console.error("Error RPC delete:", error);
      return { error: error.message };
    }

    revalidatePath('/dashboard/organizaciones');
    return { success: true };
  } catch (error: any) {
    return { error: "Error al procesar la eliminación" };
  }
}

/**
 * ACTUALIZAR STATUS DE LA ORGANIZACIÓN (SEGURO)
 */
export async function adminUpdateOrgStatus(orgId: string, p_estado: boolean) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { error: "No autorizado" };

    const { data, error } = await supabaseAdmin.rpc('fn_toggle_org_status', { 
      p_org_id: orgId,
      p_estado: p_estado,
      p_admin_id: user.id 
    });

    if (error) return { error: error.message };

    // Manejo de respuesta flexible según estructura de la RPC
    const result = Array.isArray(data) ? data[0] : data;
    
    revalidatePath('/dashboard/organizaciones');
    return { success: true };

  } catch (error: any) {
    return { error: "Error al actualizar el estado" };
  }
}

/**
 * ACTUALIZAR ORGANIZACIÓN (EDICIÓN)
 * Nueva función para evitar el error de "Permission Denied"
 */
export async function adminUpdateOrganization(payload: {
  id: string,
  nombre: string,
  nit: string,
  slug: string,
  plan_id: number,
  activo: boolean
}) {
  try {
    const supabase = await createServerClient();
    
    // Verificación básica de sesión en el Edge/Server
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { success: false, error: "Sesión expirada o no válida" };

    // Llamada al RPC blindado
    const { error: rpcError } = await supabase.rpc('update_organizacion_v1', {
      p_org_id: payload.id,
      p_nombre: payload.nombre,
      p_nit: payload.nit,
      p_slug: payload.slug,
      p_plan_id: payload.plan_id,
      p_activo: payload.activo
    });

    if (rpcError) {
      // Capturamos el RAISE EXCEPTION de Postgres
      console.error("RPC Error:", rpcError.message);
      return { success: false, error: rpcError.message };
    }

    revalidatePath('/dashboard/organizaciones');
    return { success: true };

  } catch (error: any) {
    return { success: false, error: "Error inesperado en el servidor" };
  }
}