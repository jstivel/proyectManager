'use client'

import { Layers, Check, EyeOff, CheckSquare, Square } from 'lucide-react'

interface LayerControlProps {
  capas: any[];
  visibles: string[];
  onChange: (ids: string[]) => void;
}

export default function LayerControl({ capas, visibles, onChange }: LayerControlProps) {
  
  /**
   * Alterna la visibilidad de una capa individual
   */
  const toggleCapa = (id: string) => {
    if (visibles.includes(id)) {
      onChange(visibles.filter(v => v !== id));
    } else {
      onChange([...visibles, id]);
    }
  };

  /**
   * Funciones para manejo masivo de capas
   */
  const activarTodas = () => onChange(capas.map(c => c.id));
  const desactivarTodas = () => onChange([]);

  return (
    <div className="absolute top-6 right-24 z-40 w-72 bg-white/95 backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-[2rem] border border-slate-200/60 p-5 animate-in fade-in slide-in-from-top-4 duration-300">
      
      {/* Cabecera del Panel */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-200">
            <Layers size={14} />
          </div>
          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">Visibilidad</h3>
            <span className="text-sm font-black text-slate-800 uppercase tracking-tight">Capas de Red</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] bg-blue-50 px-2 py-0.5 rounded-lg text-blue-600 font-black border border-blue-100">
            {visibles.length} / {capas.length}
          </span>
        </div>
      </div>

      {/* Botones de Acción Rápida (Bulk Actions) */}
      <div className="flex gap-2 mb-4">
        <button 
          onClick={activarTodas}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-blue-600 hover:text-white text-slate-600 transition-all duration-300 text-[9px] font-black uppercase tracking-widest border border-slate-100 hover:border-blue-600 group"
        >
          <CheckSquare size={12} className="group-hover:scale-110 transition-transform" /> 
          Todas
        </button>
        <button 
          onClick={desactivarTodas}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-red-500 hover:text-white text-slate-600 transition-all duration-300 text-[9px] font-black uppercase tracking-widest border border-slate-100 hover:border-red-500 group"
        >
          <Square size={12} className="group-hover:scale-110 transition-transform" /> 
          Ninguna
        </button>
      </div>
      
      {/* Lista de Capas con Scroll Personalizado */}
      <div className="flex flex-col gap-1.5 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
        {capas.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase italic">Sin capas configuradas</p>
          </div>
        ) : (
          capas.map((capa) => {
            const estaActiva = visibles.includes(capa.id);
            return (
              <button
                key={capa.id}
                onClick={() => toggleCapa(capa.id)}
                className={`flex items-center justify-between p-3.5 rounded-2xl transition-all border ${
                  estaActiva 
                  ? 'bg-blue-50/50 border-blue-100 text-blue-700 shadow-sm' 
                  : 'bg-transparent border-transparent hover:bg-slate-50 text-slate-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className={`w-3 h-3 rounded-full transition-all duration-500 ${
                      estaActiva ? 'bg-blue-500 scale-100 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-slate-300 scale-75'
                    }`} />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-xs font-black uppercase tracking-tight truncate max-w-[150px]">
                      {capa.nombre}
                    </span>
                    <span className="text-[9px] font-medium opacity-60 uppercase tracking-tighter">
                      Capa de infraestructura
                    </span>
                  </div>
                </div>
                
                <div className={`p-1.5 rounded-lg transition-all ${estaActiva ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                  {estaActiva ? (
                    <Check size={12} strokeWidth={4} />
                  ) : (
                    <EyeOff size={12} className="opacity-40" />
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer del Control */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex justify-center">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em]">
          Replanteo FO • Sistema de Capas
        </p>
      </div>
    </div>
  );
}