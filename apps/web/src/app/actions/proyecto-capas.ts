'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function syncProyectoCapasAction(proyectoId: string, featureTypeIds: string[]) {
  const supabase = await createClient()

  // LLAMADA CORREGIDA: Debe ser a la función de sincronización, no a la de lectura
  const { error } = await supabase.rpc('sync_proyecto_capas', {
    p_proyecto_id: proyectoId,
    p_feature_type_ids: featureTypeIds
  })

  if (error) {
    console.error('Error en syncProyectoCapasAction:', error.message)
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/proyectos')
  return { success: true }
}