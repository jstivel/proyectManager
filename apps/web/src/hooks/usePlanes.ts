import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'

export function usePlanes() {
  const supabase = createClient()
  
  return useQuery({
    queryKey: ['planes'],
    queryFn: async () => {
      // Cambio: Invocación de RPC en lugar de consulta directa a tabla
      const { data, error } = await supabase.rpc('get_planes_disponibles')
      
      if (error) {
        console.error('Error RPC planes:', error.message)
        throw error
      }
      return data
    },
    // Opcional: Cachear por más tiempo ya que los planes no cambian seguido
    staleTime: 1000 * 60 * 60, // 1 hora
  })
}