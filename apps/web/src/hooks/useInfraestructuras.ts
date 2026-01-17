'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { saveInfraestructura, deleteInfraestructura } from '@/app/actions/infraestructura'
import { toast } from 'sonner'

export function useInfraestructura(proyectoId?: string | null) {
  const supabase = createClient()
  const queryClient = useQueryClient()

  // 1. Carga para el Mapa (Bounding Box)
  const useMapa = (bounds: any) => useQuery({
    queryKey: ['infra_mapa', proyectoId, bounds],
    queryFn: async () => {
      if (!proyectoId || !bounds) return []
      const { data, error } = await supabase.rpc('get_infra_by_bbox', {
        p_proyecto_id: proyectoId,
        min_lng: bounds.sw.lng, min_lat: bounds.sw.lat,
        max_lng: bounds.ne.lng, max_lat: bounds.ne.lat
      })
      if (error) throw error
      return data
    },
    enabled: !!proyectoId && !!bounds,
    placeholderData: (prev) => prev
  })

  // 2. Carga para Ficha Técnica
  const useDetalle = (featureId?: string | null) => useQuery({
    queryKey: ['infra_detalle', featureId],
    queryFn: async () => {
      if (!featureId) return null
      const { data, error } = await supabase.rpc('get_feature_detallado_rpc', { p_feature_id: featureId })
      if (error) throw error
      return data ? data[0] : null
    },
    enabled: !!featureId
  })

  const saveMutation = useMutation({
    mutationFn: saveInfraestructura,
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error)
      } else {
        queryClient.invalidateQueries({ queryKey: ['infra_mapa'] })
        queryClient.invalidateQueries({ queryKey: ['infra_detalle'] })
        toast.success('Infraestructura guardada')
      }
    },
    onError: (err: any) => toast.error('Error al guardar: ' + err.message)
  })

  const deleteMutation = useMutation({
    mutationFn: ({ id, proyectoId }: { id: string, proyectoId: string }) => 
      deleteInfraestructura(id, proyectoId),
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error)
      } else {
        queryClient.invalidateQueries({ queryKey: ['infra_mapa'] })
        toast.success('Elemento eliminado')
      }
    },
    onError: (err: any) => toast.error('Error al eliminar: ' + err.message)
  })

  return { useMapa, useDetalle, saveMutation, deleteMutation }
}