'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { 
  Search, X, Hash, Loader2, 
  Filter, ChevronRight, SlidersHorizontal 
} from 'lucide-react'

interface SearchPanelProps {
  proyectoId: string
  capas: any[]
  onClose: () => void
  onResultClick: (lng: number, lat: number, id: string, capaId: string) => void
  onApplyFilters: (filtrados: any[]) => void
}

export default function SearchPanel({ proyectoId, capas, onClose, onResultClick, onApplyFilters }: SearchPanelProps) {
  const [activeTab, setActiveTab] = useState<'search' | 'filter'>('search')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const [selectedCapa, setSelectedCapa] = useState('')
  const [atributosCapa, setAtributosCapa] = useState<any[]>([])
  const [filtrosActivos, setFiltrosActivos] = useState<Record<string, string>>({})

  // 1. Búsqueda con Debounce
  useEffect(() => {
    if (activeTab !== 'search') return;
    const delayDebounceFn = setTimeout(() => {
      if (query.length > 1) {
        handleSearch(query)
      } else {
        setResults([])
      }
    }, 400)
    return () => clearTimeout(delayDebounceFn)
  }, [query, activeTab])

  // 2. Cargar definiciones de atributos
  useEffect(() => {
    if (selectedCapa && activeTab === 'filter') {
      const fetchDefs = async () => {
        const { data } = await supabase
          .from('attribute_definitions')
          .select('*')
          .eq('feature_type_id', selectedCapa)
          .order('orden', { ascending: true });
        setAtributosCapa(data || []);
      };
      fetchDefs();
    }
  }, [selectedCapa, activeTab]);

  // LÓGICA DE BÚSQUEDA (Servidor)
  const handleSearch = async (searchQuery: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('v_busqueda_global_infra')
        .select('*')
        .eq('proyecto_id', proyectoId)
        .ilike('busqueda_universal', `%${searchQuery.toLowerCase()}%`)
        .limit(15)

      if (error) throw error
      setResults(data || [])
      // Opcional: Notificar al mapa los resultados encontrados para resaltarlos
      onApplyFilters(data || []);
    } catch (err) {
      console.error('Error en búsqueda:', err)
    } finally {
      setLoading(false)
    }
  }

  // LÓGICA DE FILTROS (Servidor)
  const ejecutarFiltroAvanzado = async () => {
    if (!selectedCapa) return;
    setLoading(true);
    try {
      let queryBase = supabase
        .from('v_busqueda_global_infra')
        .select('*')
        .eq('proyecto_id', proyectoId)
        .eq('feature_type_id', selectedCapa);

      Object.entries(filtrosActivos).forEach(([campo, valor]) => {
        if (valor) {
          queryBase = queryBase.eq(`atributos->>${campo}`, valor);
        }
      });

      const { data, error } = await queryBase.limit(100);
      if (error) throw error;
      
      setResults(data || []);
      // ENVIAR AL MAPA: Esto permite que el mapa resalte y haga zoom a los filtrados
      onApplyFilters(data || []);
      
    } catch (err) {
      console.error("Error al filtrar:", err);
      alert("Error al ejecutar el filtro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute top-4 left-4 z-40 w-80 bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl border border-slate-200 overflow-hidden flex flex-col animate-in slide-in-from-left-2 max-h-[85vh]">
      
      {/* Selector de Pestañas */}
      <div className="flex bg-slate-100 p-1 m-3 rounded-xl border border-slate-200">
        <button 
          onClick={() => { setActiveTab('search'); setResults([]); setQuery(''); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'search' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Search size={14} /> Búsqueda
        </button>
        <button 
          onClick={() => { setActiveTab('filter'); setResults([]); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'filter' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Filter size={14} /> Filtros
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'search' && (
          <div className="px-3 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-400" size={18} />
              <input
                autoFocus
                type="text"
                placeholder="ID, Serie, Dirección..."
                className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button onClick={() => { setQuery(''); setResults([]); }} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'filter' && (
          <div className="px-3 pb-4 space-y-4">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Capa de Infraestructura</label>
              <select 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none"
                value={selectedCapa}
                onChange={(e) => { setSelectedCapa(e.target.value); setFiltrosActivos({}); }}
              >
                <option value="">Selecciona qué filtrar...</option>
                {capas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>

            {selectedCapa && atributosCapa.length > 0 && (
              <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                {atributosCapa
                  .filter(a => ['select', 'boolean'].includes(a.tipo))
                  .map(atrib => (
                    <div key={atrib.id} className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase ml-1">{atrib.campo}</label>
                      <select 
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                        value={filtrosActivos[atrib.campo] || ''}
                        onChange={(e) => setFiltrosActivos({...filtrosActivos, [atrib.campo]: e.target.value})}
                      >
                        <option value="">Cualquiera</option>
                        {atrib.tipo === 'boolean' ? (
                          <>
                            <option value="true">SÍ</option>
                            <option value="false">NO</option>
                          </>
                        ) : (
                          atrib.opciones?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)
                        )}
                      </select>
                    </div>
                  ))}
                <button 
                  onClick={ejecutarFiltroAvanzado}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase shadow-lg shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : <SlidersHorizontal size={14} />}
                  Aplicar Filtros
                </button>
              </div>
            )}
          </div>
        )}

        {/* LISTADO DE RESULTADOS */}
        <div className="border-t border-slate-100 bg-white">
          {loading && (
            <div className="p-8 flex flex-col items-center justify-center gap-2">
              <Loader2 className="animate-spin text-blue-500" size={20} />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Consultando Base de Datos...</span>
            </div>
          )}

          {results.length > 0 && (
            <div className="p-2 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
              <span className="text-[9px] font-black text-slate-400 uppercase px-2">{results.length} Coincidencias</span>
              <button 
                onClick={() => {setResults([]); setFiltrosActivos({}); setQuery(''); onApplyFilters([]);}} 
                className="text-[9px] font-black text-blue-600 uppercase px-2"
              >
                Limpiar
              </button>
            </div>
          )}

          {results.map((res) => (
            <button
              key={res.id}
              onClick={() => {
                // GeoJSON en la vista puede venir como 'geom' o 'geometry'
                const coords = res.geom?.coordinates || res.geometry?.coordinates;
                if (coords) {
                  onResultClick(coords[0], coords[1], res.id, res.feature_type_id);
                }
              }}
              className="w-full p-3 hover:bg-blue-50/50 flex items-center justify-between group transition-all border-b border-slate-50 last:border-none"
            >
              <div className="flex items-center gap-3">
                <div className="bg-slate-100 p-2.5 rounded-xl text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                  <Hash size={16} />
                </div>
                <div className="text-left overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-800 tracking-tight">{res.id_tecnico || 'SIN ID'}</span>
                    <span className="text-[9px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-500 font-bold uppercase">
                      {res.tipo_nombre || 'Infra'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate italic">
                    {res.busqueda_universal?.split(res.id_tecnico?.toLowerCase())[1]?.trim() || 'Ver ubicación'}
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-400 transition-colors" />
            </button>
          ))}
          
          {query.length > 1 && results.length === 0 && !loading && (
            <div className="p-10 text-center space-y-2">
              <Search size={20} className="text-slate-300 mx-auto" />
              <p className="text-xs text-slate-400 font-medium">Sin resultados en este proyecto</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Búsqueda Global</span>
         </div>
         <button onClick={onClose} className="text-[10px] font-black text-slate-500 hover:text-red-500 uppercase transition-colors">
            Cerrar
         </button>
      </div>
    </div>
  )
}