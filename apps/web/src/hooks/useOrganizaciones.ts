'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { adminDeleteOrganization } from '@/app/actions/organizaciones'

export function useOrganizaciones() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  // 1. Obtener listado detallado
  const { data: organizaciones, isLoading } = useQuery({
    queryKey: ['organizaciones'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_organizaciones_detalladas')
      if (error) throw error
      return data
    }
  })

  // 2. Mutación para eliminar
  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminDeleteOrganization(id),
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Organización eliminada con éxito')
        queryClient.invalidateQueries({ queryKey: ['organizaciones'] })
        queryClient.invalidateQueries({ queryKey: ['admin-telemetry'] }) // Actualizamos el dashboard también
      }
    }
  })

  return {
    organizaciones,
    isLoading,
    deleteMutation
  }
}