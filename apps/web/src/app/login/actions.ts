'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function loginAction(prevState: any, formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // 1. Intentar el login en Supabase Auth
  const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError || !user) {
    return { error: 'Credenciales inválidas o error de conexión' }
  }

  /**
   * 2. Validar el estado del perfil y organización usando RPC
   */
  const { data: perfiles } = await supabase.rpc('get_mi_perfil_seguro')
  const profile = perfiles && perfiles.length > 0 ? perfiles[0] : null

  /**
   * REGLAS DE ACCESO:
   * - Si es Admin Global (ID 4) o el email de rescate técnico, entra siempre.
   * - El resto debe estar activo y su organización activa.
   */
  const esAdminRescate = user.email === 'stivel275@gmail.com'
  const esAdminRol = profile?.rol_id === 4
  const esSuperAdmin = esAdminRescate || esAdminRol

  // Si no es SuperAdmin, aplicamos restricciones estrictas
  if (!esSuperAdmin) {
    // Si ni siquiera existe el perfil en la tabla usuarios
    if (!profile) {
      await supabase.auth.signOut()
      return { error: 'No se encontró un perfil asociado a esta cuenta.' }
    }

    // Validar si el usuario está activo
    if (profile.activo !== true) {
      await supabase.auth.signOut()
      return { error: 'Tu cuenta de usuario está desactivada.' }
    }

    // Validar si la organización existe y está activa
    if (!profile.organizacion_id || profile.org_activa !== true) {
      await supabase.auth.signOut()
      return { error: 'Tu organización está inactiva o no tienes una asignada.' }
    }
  }

  // 3. Redirección si todo está correcto
  redirect('/dashboard')
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}