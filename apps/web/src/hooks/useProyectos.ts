'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'

export function useProyectos() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['proyectos_seguros'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_proyectos_seguros')
      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 5 // 5 minutos de caché para navegación fluida
  })
}