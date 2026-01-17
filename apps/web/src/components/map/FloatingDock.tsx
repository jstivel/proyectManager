'use client'

import { Plus, Crosshair, ZoomIn, ZoomOut, Layers, Search, MousePointer2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FloatingDockProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocate: () => void;
  onAddElement: () => void;
  toggleSearch: () => void;
  toggleLayers: () => void;
  isAdding?: boolean;
  gpsActivo?: boolean;
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
    <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-30 group">
      
      {/* Grupo 1: Navegación y Zoom */}
      <div className="flex flex-col bg-white/90 backdrop-blur-md rounded-[1.5rem] shadow-[0_10px_30px_rgba(0,0,0,0.1)] border border-slate-200/50 p-1.5 transition-all hover:shadow-2xl">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onZoomIn} 
          className="h-11 w-11 rounded-xl hover:bg-slate-100 text-slate-600 active:scale-90 transition-all"
        >
          <ZoomIn size={20} strokeWidth={2.5} />
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onZoomOut} 
          className="h-11 w-11 rounded-xl hover:bg-slate-100 text-slate-600 active:scale-90 transition-all"
        >
          <ZoomOut size={20} strokeWidth={2.5} />
        </Button>

        <div className="h-px bg-slate-100 mx-2 my-1" />
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onLocate} 
          className={`h-11 w-11 rounded-xl transition-all active:scale-90 ${
            gpsActivo 
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700' 
            : 'text-blue-600 hover:bg-blue-50'
          }`}
        >
          <Crosshair size={20} strokeWidth={2.5} className={gpsActivo ? 'animate-pulse' : ''} />
        </Button>
      </div>

      {/* Grupo 2: Utilidades de Visualización */}
      <div className="flex flex-col bg-white/90 backdrop-blur-md rounded-[1.5rem] shadow-[0_10px_30px_rgba(0,0,0,0.1)] border border-slate-200/50 p-1.5 transition-all hover:shadow-2xl">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSearch} 
          className="h-11 w-11 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-blue-600 transition-all active:scale-90"
        >
          <Search size={20} strokeWidth={2.5} />
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleLayers} 
          className="h-11 w-11 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-blue-600 transition-all active:scale-90"
        >
          <Layers size={20} strokeWidth={2.5} />
        </Button>
      </div>

      {/* Botón de Acción Principal: Agregar Elemento */}
      <div className="relative">
        <Button 
          onClick={onAddElement}
          className={`h-14 w-14 rounded-[1.25rem] shadow-2xl transition-all duration-500 active:scale-95 flex items-center justify-center ${
            isAdding 
            ? 'bg-slate-900 hover:bg-slate-800 text-white border-2 border-white/20' 
            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/40'
          }`}
        >
          {isAdding ? (
            <MousePointer2 size={24} strokeWidth={2.5} className="animate-bounce" />
          ) : (
            <Plus size={28} strokeWidth={3} className="transition-transform group-hover:rotate-90 duration-500" />
          )}
        </Button>
        
        {/* Tooltip decorativo que aparece al hover */}
        {!isAdding && (
          <div className="absolute right-16 top-1/2 -translate-y-1/2 px-3 py-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-slate-700 shadow-xl">
            Nuevo Punto
          </div>
        )}
      </div>
    </div>
  )
}