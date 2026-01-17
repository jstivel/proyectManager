'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { 
  Search, X, Hash, Loader2, 
  Filter, ChevronRight, SlidersHorizontal,
  MapPin, Database
} from 'lucide-react'
import { Button } from '@/components/ui/button'

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

  // 2. Cargar definiciones de atributos vía RPC
  useEffect(() => {
    if (selectedCapa && activeTab === 'filter') {
      const fetchDefs = async () => {
        // Usamos RPC para obtener definiciones permitidas para este usuario/proyecto
        const { data } = await supabase.rpc('get_attribute_definitions_seguras', {
          p_feature_type_id: selectedCapa
        });
        setAtributosCapa(data || []);
      };
      fetchDefs();
    }
  }, [selectedCapa, activeTab]);

  // LÓGICA DE BÚSQUEDA UNIVERSAL (RPC)
  const handleSearch = async (searchQuery: string) => {
    setLoading(true)
    try {
      // RPC que busca en campos ID_Técnico, Etiquetas y Atributos clave
      const { data, error } = await supabase.rpc('search_infraestructura_segura', {
        p_proyecto_id: proyectoId,
        p_search_query: searchQuery
      });

      if (error) throw error
      setResults(data || [])
    } catch (err) {
      console.error('Error en búsqueda:', err)
    } finally {
      setLoading(false)
    }
  }

  // LÓGICA DE FILTRADO AVANZADO (RPC con parámetros JSONB)
  const ejecutarFiltroAvanzado = async () => {
    if (!selectedCapa) return;
    setLoading(true);
    try {
      /**
       * Invocamos RPC especializado en filtrado JSONB.
       * p_filtros recibe un objeto clave-valor que la función de Postgres
       * procesa internamente con el operador @> o ->>.
       */
      const { data, error } = await supabase.rpc('filter_infraestructura_avanzada', {
        p_proyecto_id: proyectoId,
        p_feature_type_id: selectedCapa,
        p_filtros: filtrosActivos
      });

      if (error) throw error;
      
      setResults(data || []);
      onApplyFilters(data || []); 
      
    } catch (err) {
      console.error("Error al filtrar:", err);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="absolute top-6 left-6 z-40 w-[22rem] bg-white/95 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.2)] rounded-[2.5rem] border border-slate-200/60 overflow-hidden flex flex-col animate-in slide-in-from-left-8 duration-500 max-h-[85vh]">
      
      {/* HEADER: Selector de Pestañas */}
      <div className="p-5 pb-2">
        <div className="flex bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/50">
          <button 
            onClick={() => { setActiveTab('search'); setResults([]); setQuery(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'search' ? 'bg-white shadow-md text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Search size={14} strokeWidth={3} /> Búsqueda
          </button>
          <button 
            onClick={() => { setActiveTab('filter'); setResults([]); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'filter' ? 'bg-white shadow-md text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Filter size={14} strokeWidth={3} /> Filtros
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-5">
        {activeTab === 'search' && (
          <div className="pb-4">
            <div className="relative group">
              <Search className="absolute left-4 top-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input
                autoFocus
                type="text"
                placeholder="ID, Serie o Dirección..."
                className="w-full pl-12 pr-10 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all placeholder:text-slate-400"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button onClick={() => { setQuery(''); setResults([]); }} className="absolute right-4 top-4 text-slate-400 hover:text-red-500 transition-colors">
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'filter' && (
          <div className="pb-6 space-y-5 animate-in fade-in duration-300">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Capa de Red</label>
              <select 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black text-slate-700 outline-none appearance-none"
                value={selectedCapa}
                onChange={(e) => { setSelectedCapa(e.target.value); setFiltrosActivos({}); }}
              >
                <option value="">¿QUÉ BUSCAMOS?</option>
                {capas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>

            {selectedCapa && (
              <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                {atributosCapa
                  .filter(a => ['select', 'boolean'].includes(a.tipo))
                  .map(atrib => (
                    <div key={atrib.id} className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">{atrib.campo}</label>
                      <select 
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold shadow-sm"
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
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-200 hover:bg-blue-500 active:scale-95 transition-all flex items-center justify-center gap-3"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : <SlidersHorizontal size={14} />}
                  Ejecutar Filtro
                </button>
              </div>
            )}
          </div>
        )}

        {/* LISTADO DE RESULTADOS */}
        <div className="pb-4">
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin text-blue-500" size={24} />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sincronizando...</span>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1 mb-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{results.length} Hallazgos</span>
                <button onClick={() => {setResults([]); setQuery(''); onApplyFilters([]);}} className="text-[9px] font-black text-blue-600 uppercase">Limpiar</button>
              </div>
              
              {results.map((res) => (
                <button
                  key={res.id}
                  onClick={() => {
                    const coords = res.geom?.coordinates || res.geometry?.coordinates;
                    if (coords) onResultClick(coords[0], coords[1], res.id, res.feature_type_id);
                  }}
                  className="w-full p-4 hover:bg-blue-50/50 bg-white border border-slate-100 rounded-[1.5rem] flex items-center justify-between group transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4 text-left overflow-hidden">
                    <div className="bg-slate-100 p-2.5 rounded-xl text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                      <Hash size={16} strokeWidth={3} />
                    </div>
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[13px] font-black text-slate-800 tracking-tight leading-none uppercase">{res.id_tecnico || 'N/A'}</span>
                        <span className="text-[8px] bg-slate-100 px-1.5 py-0.5 rounded-md text-slate-500 font-black uppercase tracking-tighter">
                          {res.tipo_nombre}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate font-medium">
                        {res.busqueda_universal?.split(res.id_tecnico?.toLowerCase())[1]?.trim() || 'Haga clic para ver'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between px-6">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          <span className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">Indexador Activo</span>
        </div>
        <button onClick={onClose} className="text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors">
          Cerrar
        </button>
      </div>
    </div>
  )
}