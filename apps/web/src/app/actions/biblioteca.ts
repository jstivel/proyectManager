'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveFeatureTypeAction(payload: {
  id?: string | null
  layer_id: string
  nombre: string
  icono: string
  atributos: any[]
}) {
  const supabase = await createClient()

  // Invocamos el RPC con los parámetros exactos del SQL
  const { data, error } = await supabase.rpc('save_feature_type_with_attributes', {
    p_id: payload.id || null,
    p_layer_id: payload.layer_id,
    p_nombre: payload.nombre,
    p_icono: payload.icono,
    p_atributos: payload.atributos 
  })

  if (error) {
    console.error('Error en saveFeatureTypeAction:', error.message)
    throw new Error(error.message)
  }
  
  revalidatePath('/dashboard/biblioteca')
  return data
}

export async function eliminarCapaMaestraAction(id: string) {
  const supabase = await createClient()
  
  // Obtenemos el usuario para validación de rol previa al delete (opcional pero recomendado)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('rol_id')
    .eq('id', user.id)
    .single()

  if (!perfil || ![4, 7].includes(perfil.rol_id)) {
    throw new Error("No tienes permisos para eliminar elementos")
  }

  // La eliminación disparará la integridad referencial o RLS si está activa
  const { error } = await supabase
    .from('feature_types')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  
  revalidatePath('/dashboard/biblioteca')
  return { success: true }
}