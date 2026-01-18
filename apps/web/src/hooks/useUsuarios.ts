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
  rol_nombre?: string
  organizacion_id: string
  organizacion_nombre?: string
  activo: boolean
  created_at?: string
}

export function useUsuarios() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  // 1. LECTURA - VERSIÓN MEJORADA
  const query = useQuery({
    queryKey: ['usuarios_dashboard'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc('get_usuarios')
        if (error) throw error
        
        // Validar estructura de datos
        if (!Array.isArray(data)) {
          throw new Error('Formato de datos inválido')
        }
        
        console.log('✅ Datos de usuarios recibidos:', data);
        
        // Sanitizar datos sensibles
        return data.map(user => ({
          id: user.id,
          nombre: user.nombre || '',
          email: user.email || '',
          rol_id: Number(user.rol_id) || 0,
          rol_nombre: user.rol_nombre || 'Sin Rol',
          organizacion_id: user.organizacion_id || '',
          organizacion_nombre: user.organizacion_nombre || 'Sin Organización',
          activo: Boolean(user.activo),
          created_at: user.created_at
        }))
      } catch (error) {
        console.error('❌ Error en get_usuarios_dashboard:', error)
        throw error
      }
    }
  })

  // 2. ESCRITURA (Guardar/Editar) - VERSIÓN MEJORADA
  const saveMutation = useMutation({
    mutationFn: async (userData: Usuario) => {
      try {
        // Validación de datos
        if (!userData.nombre || userData.nombre.trim().length < 2) {
          throw new Error('El nombre debe tener al menos 2 caracteres')
        }
        
        if (!userData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
          throw new Error('Email inválido')
        }
        
        if (!userData.rol_id || userData.rol_id < 1) {
          throw new Error('Rol inválido')
        }

        const { data, error } = await supabase.rpc('fn_save_usuario_seguro', {
          p_nombre: userData.nombre.trim(),
          p_email: userData.email.toLowerCase().trim(),
          p_rol_id: Number(userData.rol_id),
          p_organizacion_id: userData.organizacion_id,
          p_id_edicion: userData.id || null
        })
        
        if (error) throw error
        return data
      } catch (error: any) {
        console.error('Error en saveMutation:', error)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios_dashboard'] })
      toast.success('Operación exitosa')
    },
    onError: (err: any) => {
      const mensaje = err.message || 'Error al guardar usuario'
      toast.error(mensaje)
    }
  })

  // 3. ELIMINAR - VERSIÓN MEJORADA
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        // Validación de UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(id)) {
          throw new Error('ID de usuario inválido')
        }

        const { data, error } = await supabase.rpc('fn_delete_usuario_seguro', { 
          p_usuario_id: id 
        })
        
        if (error) throw error
        
        // Verificar respuesta del servidor
        if (data && data.success === false) {
          throw new Error(data.error || 'Error en la operación')
        }
        
        return data
      } catch (error: any) {
        console.error('Error en deleteMutation:', error)
        throw error
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['usuarios_dashboard'] })
      toast.success(`Usuario eliminado${data?.audit_id ? ' (ID: ' + data.audit_id + ')' : ''}`)
    },
    onError: (err: any) => {
      const mensaje = err.message || 'Error al eliminar usuario'
      toast.error(mensaje)
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
      queryClient.invalidateQueries({ queryKey: ['usuarios_dashboard'] })
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