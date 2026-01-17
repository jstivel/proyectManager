'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// Service Role: Acceso total para flujos críticos de administración
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
    // 1. Invitación de Auth (Necesario hacerlo vía Admin SDK para gatillar correo)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      payload.pmEmail,
      { 
        data: { 
          nombre: payload.pmNombre,
          rol_id: 7 // 7: Project Manager
        },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/set-password`
      }
    )

    if (authError) throw authError

    // 2. Llamada al RPC maestro que vincula Org + User + Roles
    const { data: rpcRes, error: rpcError } = await supabaseAdmin.rpc('create_org_with_pm_rpc', {
        p_nombre: payload.nombre,
        p_nit: payload.nit,
        p_slug: payload.slug,
        p_pm_id: authUser.user.id,
        p_pm_nombre: payload.pmNombre,
        p_pm_email: payload.pmEmail
    })

    if (rpcError) throw rpcError;
    if (rpcRes && rpcRes.success === false) throw new Error(rpcRes.error);

    revalidatePath('/dashboard/organizaciones')
    return { success: true }

  } catch (error: any) {
    console.error("Error en adminCreateOrganization:", error.message)
    return { error: error.message || "Error al crear la organización" }
  }
}

/**
 * ELIMINAR ORGANIZACIÓN (Vía RPC de limpieza profunda)
 */
export async function adminDeleteOrganization(orgId: string) {
  try {
    const { error } = await supabaseAdmin.rpc('delete_organization_safe', { p_org_id: orgId })
    
    if (error) throw error

    revalidatePath('/dashboard/organizaciones')
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

/**
 * ACTUALIZAR STATUS/PLAN DE LA ORGANIZACIÓN
 */
export async function adminUpdateOrgStatus(orgId: string, payload: { activo?: boolean, plan_id?: number }) {
  try {
    const { error } = await supabaseAdmin
      .from('organizaciones')
      .update(payload)
      .eq('id', orgId)

    if (error) throw error
    revalidatePath('/dashboard/organizaciones')
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}