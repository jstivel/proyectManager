'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// Cliente con privilegios de administrador (Service Role)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false }
  }
)

/**
 * CREAR ORGANIZACIÓN E INVITAR AL PM
 * Flujo: Crea Org -> Invita PM -> Sincroniza PM en public.usuarios -> Asigna pm_id en public.organizaciones
 */
export async function adminCreateOrganization(payload: { 
  nombre: string, 
  nit: string, 
  slug: string,
  pmNombre: string,
  pmEmail: string
}) {
  try {
    // 1. Crear la Organización
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizaciones')
      .insert([{ 
        nombre: payload.nombre, 
        nit: payload.nit, 
        slug: payload.slug,
        plan_id: 1, // Plan por defecto
        activo: true
      }])
      .select()
      .single()

    if (orgError) throw orgError

    // 2. Invitar al Project Manager (Auth)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      payload.pmEmail,
      { 
        data: { 
          nombre: payload.pmNombre, 
          rol_id: 7, // Rol de PM
          organizacion_id: org.id 
        },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/set-password`
      }
    )

    if (authError) throw authError

    // 3. Crear el registro en public.usuarios (Sincronización)
    const { error: dbUserError } = await supabaseAdmin
      .from('usuarios')
      .insert({ 
        id: authData.user.id,
        nombre: payload.pmNombre, 
        email: payload.pmEmail,
        rol_id: 7,
        organizacion_id: org.id, 
        activo: true
      })

    if (dbUserError) throw dbUserError

    // 4. Vincular el PM a la organización (Campo pm_id en organizaciones)
    const { error: updateOrgError } = await supabaseAdmin
      .from('organizaciones')
      .update({ pm_id: authData.user.id })
      .eq('id', org.id)

    if (updateOrgError) throw updateOrgError

    revalidatePath('/dashboard/organizaciones')
    return { success: true, orgId: org.id }

  } catch (error: any) {
    console.error('Error en adminCreateOrganization:', error.message)
    return { error: error.message }
  }
}

/**
 * CREAR O INVITAR USUARIO GENERAL
 */
export async function adminCreateUser(payload: { 
  email: string, 
  nombre: string, 
  rol_id: number, 
  organizacion_id: string 
}) {
  try {
    // 1. Invitación vía Auth
    const { data, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      payload.email,
      { 
        data: { 
          nombre: payload.nombre, 
          rol_id: payload.rol_id, 
          organizacion_id: payload.organizacion_id 
        },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/set-password`
      }
    )

    let userId: string | undefined;

    if (authError?.message.includes("already been registered")) {
      // Si el usuario ya existe en Auth, buscamos su ID en public.usuarios
      const { data: existingUser } = await supabaseAdmin
        .from('usuarios')
        .select('id')
        .eq('email', payload.email)
        .single();
      userId = existingUser?.id;
    } else if (authError) {
      throw authError;
    } else {
      userId = data?.user?.id;
    }

    if (!userId) throw new Error("No se pudo determinar el ID del usuario.");

    // 2. Sincronizar en public.usuarios
    const { error: dbError } = await supabaseAdmin
      .from('usuarios')
      .upsert({ 
        id: userId,
        nombre: payload.nombre, 
        email: payload.email,
        rol_id: payload.rol_id,
        organizacion_id: payload.organizacion_id, 
        activo: true
      })

    if (dbError) throw dbError;

    revalidatePath('/dashboard/usuarios');
    return { success: true, userId }; 
  } catch (error: any) {
    return { error: error.message };
  }
}

/**
 * RESET PASSWORD
 */
export async function adminResetUserPassword(email: string) {
  try {
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password`,
    })
    if (error) throw error
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}