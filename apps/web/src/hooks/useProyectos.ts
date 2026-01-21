import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { eliminarProyectoAction, guardarProyectoAction } from '@/app/actions/proyectos'

export function useProyectos() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  
  // 1. Consulta de datos (GET)
  const query = useQuery({
    queryKey: ['proyectos_dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_proyectos_dashboard_data')
      if (error) throw error
      return data
    }
  })

  const saveMutation = useMutation({
    mutationFn: (proyecto: any) => guardarProyectoAction(proyecto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proyectos_dashboard'] })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => eliminarProyectoAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proyectos_dashboard'] })
    }
  })

  return {
    data: query.data,
    isLoading: query.isLoading,
    saveProyecto: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    deleteProyecto: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending
  }
}