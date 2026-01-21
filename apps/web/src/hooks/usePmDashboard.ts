import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'

export function usePmDashboard() {
  const supabase = createClient()
  
  return useQuery({
    queryKey: ['pm_dashboard_stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_pm_dashboard_stats')
      if (error) throw error
      return data
    }
  })
}