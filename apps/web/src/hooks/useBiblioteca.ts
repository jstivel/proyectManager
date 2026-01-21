'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { eliminarCapaMaestraAction, saveFeatureTypeAction } from '@/app/actions/biblioteca'
import { toast } from 'sonner'

export function useBiblioteca(initialData: any[] = []) {
  const supabase = createClient()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['biblioteca'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_biblioteca_segura')
      if (error) throw error
      return data || []
    },
    initialData,
    // Marcamos los datos iniciales como "viejos" de inmediato para que 
    // ante cualquier cambio (invalidate) React Query dispare el refetch real.
    staleTime: 0, 
  })

  const saveMutation = useMutation({
    mutationFn: saveFeatureTypeAction,
    onSuccess: async () => {
      // Usamos await para asegurar que la invalidación se procese
      await queryClient.invalidateQueries({ queryKey: ['biblioteca'] })
      toast.success("Elemento guardado con éxito en la biblioteca")
    },
    onError: (error: any) => {
      console.error("Save error:", error)
      toast.error(error.message || "Error al guardar el elemento")
    }
  })

  const deleteMutation = useMutation({
    mutationFn: eliminarCapaMaestraAction,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['biblioteca'] })
      toast.success("Elemento eliminado de la biblioteca")
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al eliminar")
    }
  })

  return {
    capas: query.data || [],
    isLoading: query.isLoading,
    saveFeatureType: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    eliminarCapa: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending
  }
}