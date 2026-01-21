'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { saveLayerAction, deleteLayerAction } from '@/app/actions/layers'
import { toast } from 'sonner'

export function useLayers() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  // 1. Consulta de capas (Lectura)
  const query = useQuery({
    queryKey: ['layers_biblioteca'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_layers')
      if (error) throw error
      return data || []
    }
  })

  // 2. Mutación para crear/editar (Escritura)
  const saveMutation = useMutation({
    mutationFn: saveLayerAction,
    onSuccess: () => {
      // Invalidamos la caché para forzar un refresco de los selectores
      queryClient.invalidateQueries({ queryKey: ['layers_biblioteca'] })
      toast.success("Grupo GIS procesado correctamente")
    },
    onError: (error: any) => {
      toast.error(error.message || "No tienes permisos para esta acción")
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteLayerAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['layers_biblioteca'] })
      toast.success("Grupo eliminado correctamente")
    },
    onError: (error: any) => {
      toast.error(error.message || "Error: No se pudo eliminar el grupo")
    }
  })

  return {
    layers: query.data || [],
    isLoading: query.isLoading,
    saveLayer: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    deleteLayer: deleteMutation.mutateAsync, // Esta es la propiedad que buscaba el modal
    isDeleting: deleteMutation.isPending  
  }
}