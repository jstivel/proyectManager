'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveLayerAction(payload: {
  id?: string | null
  nombre_tecnico: string
  descripcion?: string
}) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('upsert_layer', {
    p_id: payload.id || null,
    p_nombre_tecnico: payload.nombre_tecnico,
    p_descripcion: payload.descripcion || 'Creado desde biblioteca'
  })

  if (error) {
    console.error("Error en saveLayerAction:", error.message)
    throw new Error(error.message)
  }
  
  // Refrescamos la ruta para que los componentes RSC obtengan datos frescos
  revalidatePath('/dashboard/biblioteca')
  return data
}

export async function deleteLayerAction(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('delete_layer', {
    p_id: id
  })

  if (error) {
    console.error("Error en deleteLayerAction:", error.message)
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/biblioteca')
  return { success: true }
}