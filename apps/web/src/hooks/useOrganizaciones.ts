'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { adminDeleteOrganization, adminUpdateOrgStatus } from '@/app/actions/organizaciones'

export function useOrganizaciones() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  /**
   * 1. OBTENER LISTADO DETALLADO
   * Llama a la RPC 'get_organizaciones_detalladas' que debe devolver:
   * id, nombre, nit, plan_nombre, activo, pm_nombre, total_proyectos, total_usuarios
   */
  const { data: organizaciones, isLoading, error, refetch } = useQuery({
    queryKey: ['organizaciones_dashboard'],
    queryFn: async () => {
      // Invocación a la RPC unificada
      const { data, error } = await supabase.rpc('get_organizaciones_detalladas')
      
      if (error) {
        // Accedemos a las propiedades internas del error de Supabase
        if (error.message) {
          console.error('❌ Error en RPC:', error.message);
        }
        throw error;
      }
      
      // Procesamiento de datos: Aseguramos que los conteos sean números (JS maneja bigint como string/objeto a veces)
      return data?.map((org: any) => ({
        ...org,
        total_usuarios: Number(org.total_usuarios || 0),
        total_proyectos: Number(org.total_proyectos || 0)
      })) || []
    },
    staleTime: 1000 * 60 * 5, // Considerar datos frescos por 1 minuto
    refetchOnWindowFocus: true, // REAVELL: Esto hará que si cambias de pestaña y vuelves, se actualice solo
    retry: 1
  })

  /**
   * 2. MUTACIÓN PARA BORRADO FÍSICO
   * Ejecuta una limpieza profunda en la base de datos vía Server Action
   */
  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminDeleteOrganization(id),
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Organización eliminada permanentemente')
        // Invalidamos para refrescar la lista y la telemetría del dashboard
        queryClient.invalidateQueries({ queryKey: ['organizaciones_dashboard'] })
        queryClient.invalidateQueries({ queryKey: ['admin-telemetry'] })
      }
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error al procesar la eliminación')
    }
  })

  /**
   * 3. MUTACIÓN PARA CAMBIO DE ESTADO (ACTIVAR/SUSPENDER)
   * Permite inhabilitar el acceso de una organización sin borrar sus datos
   */
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) => 
      adminUpdateOrgStatus(id, activo),
    onSuccess: async (res) => {
      if (res.success) {
        toast.success('Estado actualizado');
        // FORZAR RECARGA TOTAL DE LA CACHÉ
        await queryClient.invalidateQueries({ 
          queryKey: ['organizaciones_dashboard'],
          exact: true 
        });
      } else {
        toast.error(res.error);
      }
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Estado de la organización actualizado')
        // Refresco instantáneo de la UI
        queryClient.invalidateQueries({ queryKey: ['organizaciones_dashboard'] })
      }
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error al actualizar el estado')
    }
  })

  return {
    organizaciones,
    isLoading,
    error,
    deleteMutation,
    toggleStatusMutation
  }
}