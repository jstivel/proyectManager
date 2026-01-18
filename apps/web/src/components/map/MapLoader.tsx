import React from 'react'

interface MapLoaderProps {
  message?: string
}

export default function MapLoader({ message = "Cargando mapa..." }: MapLoaderProps) {
  return (
    <div className="flex items-center justify-center h-full bg-slate-100 rounded-lg">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-slate-600 font-medium">{message}</p>
      </div>
    </div>
  )
}