'use client'

import { useState, useEffect } from 'react'
import { Search, X, MapPin, User, Hash } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface SearchPanelProps {
  proyectoId: string;
  onResultClick: (lng: number, lat: number, id: string, capaId: string) => void;
  onClose: () => void;
}

export default function SearchPanel({ proyectoId, onResultClick, onClose }: SearchPanelProps) {
  const [term, setTerm] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (term.length >= 2) searchStuff()
      else setResults([])
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [term])

  const searchStuff = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('elementos_infraestructura')
      .select('*, feature_types(nombre, icono)')
      .eq('proyecto_id', proyectoId)
      .or(`id_tecnico.ilike.%${term}%, direccion.ilike.%${term}%, tecnico_asignado.ilike.%${term}%`)
      .limit(10)
    
    setResults(data || [])
    setLoading(false)
  }

  return (
    <div className="absolute top-4 left-4 z-40 w-80 bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-left-4 duration-300">
      <div className="p-3 border-b bg-slate-50/50 flex items-center gap-2">
        <Search size={18} className="text-slate-400" />
        <input 
          autoFocus
          className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-slate-700"
          placeholder="Buscar ID, técnico o dirección..."
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
        <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
          <X size={16} className="text-slate-500" />
        </button>
      </div>

      <div className="max-h-[60vh] overflow-y-auto">
        {loading && <div className="p-4 text-center text-xs text-slate-400">Buscando...</div>}
        
        {results.map((item) => (
          <button
            key={item.id}
            onClick={() => onResultClick(item.geometry.coordinates[0], item.geometry.coordinates[1], item.id, item.feature_type_id)}
            className="w-full p-3 flex items-start gap-3 hover:bg-blue-50 border-b border-slate-50 transition-colors text-left"
          >
            <div className="mt-1 p-2 bg-slate-100 rounded-lg text-slate-600">
              <Hash size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{item.id_tecnico || 'Sin ID'}</p>
              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                <MapPin size={10} />
                <span className="truncate">{item.direccion || 'Sin dirección'}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-blue-600 font-semibold mt-1">
                <User size={10} />
                <span>{item.tecnico_asignado || 'N/A'}</span>
              </div>
            </div>
          </button>
        ))}

        {term.length >= 2 && results.length === 0 && !loading && (
          <div className="p-8 text-center">
            <p className="text-xs text-slate-400">No se encontraron resultados</p>
          </div>
        )}
      </div>
    </div>
  )
}