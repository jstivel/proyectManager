'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'

// Definimos una interfaz para el usuario para evitar el 'any'
interface Usuario {
  id?: string
  nombre: string
  email: string
  rol_id: number
  organizacion_id: string
}

export function useUsuarios() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  // 1. LECTURA
  const query = useQuery({
    queryKey: ['usuarios_seguros'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_usuarios_seguros')
      if (error) throw error
      return data as any[]
    }
  })

  // 2. ESCRITURA (Guardar/Editar)
  const saveMutation = useMutation({
    mutationFn: async (userData: Usuario) => {
      const { data, error } = await supabase.rpc('fn_save_usuario', {
        p_nombre: userData.nombre,
        p_email: userData.email,
        p_rol_id: userData.rol_id,
        p_organizacion_id: userData.organizacion_id,
        p_id_edicion: userData.id || null
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios_seguros'] })
      toast.success('Operación exitosa')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error al guardar')
    }
  })

  // 3. ELIMINAR
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('fn_delete_usuario', { 
        p_usuario_id: id 
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios_seguros'] })
      toast.success('Usuario eliminado')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error al eliminar')
    }
  })

  // 4. ESTADO (Activar/Desactivar)
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, activo }: { id: string; activo: boolean }) => {
      const { error } = await supabase.rpc('fn_toggle_usuario_activo', { 
        p_usuario_id: id, 
        p_estado: activo 
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios_seguros'] })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error al cambiar estado')
    }
  })

  return {
    usuarios: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    saveMutation,
    deleteMutation,
    toggleStatusMutation // Cambié el nombre para ser más claro
  }
}