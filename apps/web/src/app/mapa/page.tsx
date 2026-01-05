'use client'

import { useSearchParams } from 'next/navigation'
import Map from '@/components/map/Map'
import { Loader2 } from 'lucide-react'

export default function MapaPage() {
  const searchParams = useSearchParams()
  const proyectoId = searchParams.get('id')

  if (!proyectoId) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <p className="text-xs font-bold uppercase text-slate-500">
            Selecciona un proyecto
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen">
      <Map proyectoId={proyectoId} />
    </div>
  )
}
