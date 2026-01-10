'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

// El primer argumento es 'prevState' (necesario para useActionState)
export async function loginAction(prevState: any, formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: 'Credenciales inválidas o error de conexión' }
  }

  // Redirección exitosa
  redirect('/dashboard')
}

export async function logoutAction() {
  const supabase = await createClient()

  // 1. Borra la sesión en Supabase y limpia las cookies
  await supabase.auth.signOut()

  // 2. Redirige al login y limpia el caché del router
  redirect('/login')
}