'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'

export function useBiblioteca() {
  const supabase = createClient()

  const query = useQuery({
    queryKey: ['biblioteca_capas'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_biblioteca_segura')
      if (error) throw error
      return data as any[]
    },
    staleTime: 1000 * 60 * 30 // 30 minutos de caché
  })

  // Función útil para encontrar una capa rápido por su ID (ej. para el Formulario Dinámico)
  const getCapaPorId = (id: string) => {
    return query.data?.find(capa => capa.id === id)
  }

  return {
    ...query,
    capas: query.data || [],
    getCapaPorId
  }
}