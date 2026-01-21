// apps/web/src/app/dashboard/visor/page.tsx
'use client'

import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import { Suspense } from 'react'
import MapLoader from '@/components/map/MapLoader'

// Importación dinámica para evitar errores de Mapbox en el servidor (SSR)
const Map = dynamic(() => import('@/components/map/Map'), {
  loading: () => <MapLoader message="Cargando entorno cartográfico..." />,
  ssr: false
})

function MapaContent() {
  const searchParams = useSearchParams()
  // CAMBIO AQUÍ: Usamos 'p' para coincidir con el Link del Dashboard
  const proyectoId = searchParams.get('p') 

  if (!proyectoId) return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50">
      <div className="text-center">
        <p className="text-slate-400 font-black uppercase tracking-tighter text-2xl">
          404
        </p>
        <p className="text-slate-600 font-medium">PROYECTO NO ESPECIFICADO</p>
      </div>
    </div>
  )

  // Pasamos el proyectoId al componente principal del mapa
  return <Map proyectoId={proyectoId} />
}

export default function MapaPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-blue-500" size={40} />
          <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">
            Inicializando Visor
          </span>
        </div>
      </div>
    }>
      <div className="h-screen w-full relative overflow-hidden">
        <MapaContent />
      </div>
    </Suspense>
  )
}