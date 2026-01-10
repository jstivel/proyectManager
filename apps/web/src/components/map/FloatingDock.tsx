'use client'

import { Plus, Crosshair, ZoomIn, ZoomOut, Layers, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FloatingDockProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocate: () => void;
  onAddElement: () => void;
  toggleSearch: () => void;
  toggleLayers: () => void;
  isAdding?: boolean;
  gpsActivo?: boolean; // Nueva prop para el estado del GPS
}

export default function FloatingDock({ 
  onZoomIn, 
  onZoomOut, 
  onLocate, 
  onAddElement, 
  toggleSearch, 
  toggleLayers,
  isAdding,
  gpsActivo 
}: FloatingDockProps) {
  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-30">
      <div className="flex flex-col bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200 p-1.5">
        <Button variant="ghost" size="icon" onClick={onZoomIn} className="rounded-xl hover:bg-slate-100">
          <ZoomIn size={20} className="text-slate-600" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onZoomOut} className="rounded-xl hover:bg-slate-100">
          <ZoomOut size={20} className="text-slate-600" />
        </Button>
        <div className="h-px bg-slate-200 mx-2 my-1" />
        
        {/* Botón de Ubicación con cambio de color dinámico */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onLocate} 
          className={`rounded-xl transition-colors ${
            gpsActivo 
            ? 'bg-blue-600 text-white hover:bg-blue-700' 
            : 'text-blue-600 hover:bg-blue-50'
          }`}
        >
          <Crosshair size={20} />
        </Button>
      </div>

      <div className="flex flex-col bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200 p-1.5">
        <Button variant="ghost" size="icon" onClick={toggleSearch} className="hover:text-blue-600 rounded-xl text-slate-600">
          <Search size={20} />
        </Button>
        <Button variant="ghost" size="icon" onClick={toggleLayers} className="hover:text-blue-600 rounded-xl text-slate-600">
          <Layers size={20} />
        </Button>
      </div>

      <Button 
        onClick={onAddElement}
        className={`h-12 w-12 rounded-2xl shadow-lg transition-all ${
          isAdding 
          ? 'bg-red-500 hover:bg-red-600 rotate-45' 
          : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
        } text-white`}
      >
        <Plus size={24} />
      </Button>
    </div>
  )
}