'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Aumentamos el staleTime para que la UI no parpadee tanto, 
        // pero confiamos en refetchOnWindowFocus para la frescura al volver.
        staleTime: 1000 * 60 * 5, // 5 minutos
        
        // IMPORTANTES PARA EL PROBLEMA QUE TIENES:
        refetchOnWindowFocus: true, 
        retry: 2,                 // Reintenta si la sesión estaba "dormida"
        retryDelay: (attempt) => Math.min(attempt * 1000, 3000), 
        
        // Mantiene los datos en memoria aunque no se usen (evita recargas infinitas)
        gcTime: 1000 * 60 * 30,    
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}