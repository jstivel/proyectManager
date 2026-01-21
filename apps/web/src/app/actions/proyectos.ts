'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function eliminarProyectoAction(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('delete_proyecto_seguro', { p_id: id })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/proyectos')
  return { success: true }
}


export async function guardarProyectoAction(proyecto: any) {
  const supabase = await createClient()

  // Llamamos a un RPC que valide organización y rol antes de insertar/editar
  const { data, error } = await supabase.rpc('upsert_proyecto_seguro', { 
    p_proyecto: proyecto 
  })

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/proyectos')
  return data
}