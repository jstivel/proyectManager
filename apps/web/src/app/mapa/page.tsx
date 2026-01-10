// apps/web/src/app/mapa/page.tsx
'use client'

import { useSearchParams } from 'next/navigation'
import Map from '@/components/map/Map'
import { Loader2 } from 'lucide-react'
import { Suspense } from 'react'

function MapaContent() {
  const searchParams = useSearchParams()
  const proyectoId = searchParams.get('id')

  if (!proyectoId) return (
    <div className="flex h-screen w-screen items-center justify-center">
      <p className="text-slate-500 font-bold">PROYECTO NO ENCONTRADO</p>
    </div>
  )

  return <Map proyectoId={proyectoId} />
}

export default function MapaPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" />
      </div>
    }>
      <div className="h-screen w-screen">
        <MapaContent />
      </div>
    </Suspense>
  )
}