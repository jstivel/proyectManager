'use client'
import { Layers, Check, EyeOff, CheckSquare, Square } from 'lucide-react'

interface LayerControlProps {
  capas: any[];
  visibles: string[];
  onChange: (ids: string[]) => void;
}

export default function LayerControl({ capas, visibles, onChange }: LayerControlProps) {
  
  const toggleCapa = (id: string) => {
    if (visibles.includes(id)) {
      onChange(visibles.filter(v => v !== id));
    } else {
      onChange([...visibles, id]);
    }
  };

  // Funciones para manejo masivo
  const activarTodas = () => onChange(capas.map(c => c.id));
  const desactivarTodas = () => onChange([]);

  const todasActivas = capas.length > 0 && visibles.length === capas.length;

  return (
    <div className="absolute top-4 right-20 z-40 w-64 bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl border border-slate-200 p-3 animate-in fade-in slide-in-from-top-2">
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-blue-600" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-tighter">Capas</span>
        </div>
        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-500 font-bold">
          {visibles.length}/{capas.length}
        </span>
      </div>

      {/* Botones de Acción Rápida */}
      <div className="flex gap-2 mb-3">
        <button 
          onClick={activarTodas}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-600 transition-colors text-[10px] font-bold uppercase"
        >
          <CheckSquare size={12} /> Todas
        </button>
        <button 
          onClick={desactivarTodas}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-red-500 hover:text-white text-slate-600 transition-colors text-[10px] font-bold uppercase"
        >
          <Square size={12} /> Ninguna
        </button>
      </div>
      
      {/* Lista de Capas Individuales */}
      <div className="flex flex-col gap-1 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
        {capas.map((capa) => {
          const estaActiva = visibles.includes(capa.id);
          return (
            <button
              key={capa.id}
              onClick={() => toggleCapa(capa.id)}
              className={`flex items-center justify-between p-2.5 rounded-xl transition-all border ${
                estaActiva 
                ? 'bg-blue-50 border-blue-100 text-blue-700 shadow-sm' 
                : 'bg-transparent border-transparent hover:bg-slate-50 text-slate-500'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${estaActiva ? 'bg-blue-500' : 'bg-slate-300'}`} />
                <span className="text-sm font-semibold truncate max-w-[140px] text-left">
                  {capa.nombre}
                </span>
              </div>
              {estaActiva ? <Check size={14} strokeWidth={3} /> : <EyeOff size={14} className="opacity-40" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}