'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { syncProyectoCapasAction } from '@/app/actions/proyecto-capas'
import { toast } from 'sonner'

/**
 * Hook actualizado: Utiliza exclusivamente RPCs con validación de 
 * pertenencia a organización en el lado del servidor.
 */
export function useProyectoCapas(proyectoId: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['proyecto-capas', proyectoId],
    queryFn: async () => {
      if (!proyectoId) return { biblioteca: [], asignadasIds: [] }

      // Ejecución paralela de ambos RPCs para mayor velocidad
      const [resBib, resActuales] = await Promise.all([
        supabase.rpc('get_proyecto_biblioteca'),
        supabase.rpc('get_capas_asignadas_proyecto', { p_proyecto_id: proyectoId })
      ])

      if (resBib.error) throw new Error(`Biblioteca: ${resBib.error.message}`)
      if (resActuales.error) throw new Error(`Asignadas: ${resActuales.error.message}`)

      return {
        biblioteca: resBib.data || [],
        asignadasIds: resActuales.data?.map((a: any) => a.feature_type_id) || []
      }
    },
    enabled: !!proyectoId,
    staleTime: 1000 * 60 * 5, // Cache por 5 min
  })

  const syncMutation = useMutation({
    mutationFn: (ids: string[]) => syncProyectoCapasAction(proyectoId, ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proyecto-capas', proyectoId] })
      toast.success("Configuración de capas guardada")
    },
    onError: (err: any) => {
      toast.error(err.message || "Error al sincronizar capas")
    }
  })

  return {
    biblioteca: query.data?.biblioteca ?? [],
    asignadasIds: query.data?.asignadasIds ?? [],
    isLoading: query.isLoading,
    isSaving: syncMutation.isPending,
    isError: query.isError,
    error: query.error,
    syncCapas: syncMutation.mutateAsync
  }
}