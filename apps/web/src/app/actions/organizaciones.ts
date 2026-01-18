'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
// Importamos tu utilidad de servidor con alias para evitar conflictos
import { createClient as createServerClient } from '@/utils/supabase/server'

// Service Role: Acceso total para flujos críticos de administración (Bypass RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { 
      autoRefreshToken: false, 
      persistSession: false 
    },
    db: {
      schema: 'public'
    }
  }
)

/**
 * VALIDACIÓN DE INPUTS DE ORGANIZACIÓN
 */
function validateOrganizationInput(payload: any) {
  const errors: string[] = [];
  
  if (!payload.nombre || payload.nombre.trim().length < 2) {
    errors.push('El nombre debe tener al menos 2 caracteres');
  }
  
  if (!payload.nit || !/^[0-9]+$/.test(payload.nit.replace(/[-.\s]/g, ''))) {
    errors.push('NIT inválido');
  }
  
  if (!payload.slug || !/^[a-z0-9-]+$/.test(payload.slug)) {
    errors.push('Slug inválido (solo minúsculas, números y guiones)');
  }
  
  if (!payload.pmEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.pmEmail)) {
    errors.push('Email del PM inválido');
  }
  
  if (!payload.pmNombre || payload.pmNombre.trim().length < 2) {
    errors.push('El nombre del PM debe tener al menos 2 caracteres');
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
  pmEmail: string
}) {
  try {
    const validationErrors = validateOrganizationInput(payload);
    if (validationErrors.length > 0) {
      return { error: `Validación fallida: ${validationErrors.join(', ')}` };
    }

    const sanitizedPayload = {
      nombre: payload.nombre.trim(),
      nit: payload.nit.replace(/[-.\s]/g, ''),
      slug: payload.slug.toLowerCase().trim(),
      pmNombre: payload.pmNombre.trim(),
      pmEmail: payload.pmEmail.toLowerCase().trim()
    };

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      sanitizedPayload.pmEmail,
      { 
        data: { 
          nombre: sanitizedPayload.pmNombre,
          rol_id: 7 // Project Manager
        },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/set-password`
      }
    )

    if (authError) {
      console.error("Error en admin.inviteUserByEmail:", authError);
      if (authError.message.includes('already registered')) {
        return { error: "Este email ya está registrado en el sistema" };
      }
      return { error: "Error al generar la invitación del PM" };
    }

    const { data: rpcRes, error: rpcError } = await supabaseAdmin.rpc('create_org_with_pm_rpc_seguro', {
        p_nombre: sanitizedPayload.nombre,
        p_nit: sanitizedPayload.nit,
        p_slug: sanitizedPayload.slug,
        p_pm_id: authUser.user.id,
        p_pm_nombre: sanitizedPayload.pmNombre,
        p_pm_email: sanitizedPayload.pmEmail
    })

    if (rpcError) {
      console.error("Error RPC create_org_with_pm:", rpcError);
      return { error: "La cuenta fue invitada pero falló la creación de la organización" };
    }
    
    if (rpcRes && rpcRes.success === false) {
      return { error: rpcRes.error || "Error en la operación de base de datos" };
    }

    revalidatePath('/dashboard/organizaciones')
    return { 
      success: true, 
      orgId: rpcRes?.org_id,
      auditId: rpcRes?.audit_id
    }

  } catch (error: any) {
    console.error("Error crítico en adminCreateOrganization:", error.message);
    return { error: "Error interno al procesar la solicitud" };
  }
}

/**
 * ELIMINAR ORGANIZACIÓN (BORRADO FÍSICO)
 */
export async function adminDeleteOrganization(orgId: string) {
  try {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(orgId)) return { error: "ID de organización inválido" };

    const { data, error } = await supabaseAdmin.rpc('delete_organization_safe', { 
      p_org_id: orgId 
    })
    
    if (error) {
      console.error("Error RPC delete_organization:", error);
      return { error: "Error al intentar eliminar la organización" };
    }

    if (data && data.success === false) {
      return { error: data.error || "La base de datos rechazó la eliminación" };
    }

    revalidatePath('/dashboard/organizaciones')
    return { 
      success: true,
      auditId: data?.audit_id,
      affectedRows: data?.affected_rows || 0
    }
  } catch (error: any) {
    console.error("Error en adminDeleteOrganization:", error.message);
    return { error: "Error al procesar la eliminación" };
  }
}

/**
 * ACTUALIZAR STATUS DE LA ORGANIZACIÓN (SEGURO)
 */
export async function adminUpdateOrgStatus(orgId: string, p_estado: boolean) {
  try {
    // Usamos el alias para obtener la sesión del usuario logueado
    const supabase = await createServerClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { error: "Sesión no válida o expirada" };
    }

    // Ejecutamos con el cliente Admin pasando el ID del usuario validado
    const { data, error } = await supabaseAdmin.rpc('fn_toggle_org_status', { 
      p_org_id: orgId,
      p_estado: p_estado,
      p_admin_id: user.id 
    });

    if (error) {
      console.error("Error RPC toggle_status:", error.message);
      return { error: error.message };
    }

    const result = Array.isArray(data) ? data[0] : data;
    
    if (!result?.v_success) {
      return { error: result?.v_message || "No se pudo actualizar el estado" };
    }

    revalidatePath('/dashboard/organizaciones');
    return { success: true };

  } catch (error: any) {
    console.error("Error en adminUpdateOrgStatus:", error.message);
    return { error: "Error interno al actualizar el estado" };
  }
}