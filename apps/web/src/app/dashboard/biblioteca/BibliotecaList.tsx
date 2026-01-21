'use client'

import { useState } from 'react'
import { useBiblioteca } from '@/hooks/useBiblioteca'
import { Button } from '@/components/ui/button'
import BibliotecaCapaModal from '@/components/modal/BibliotecaCapaModal'
import { Trash2, Edit, Download, AlertTriangle, Layers, Database, Loader2 } from 'lucide-react'
import { downloadLayerTemplate } from '@/services/templateService'

export default function BibliotecaList({ initialCapas }: { initialCapas: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCapa, setSelectedCapa] = useState<any>(null)
  
  // Pasamos initialCapas al hook para que useQuery tenga datos inmediatos
  const { capas, eliminarCapa, isDeleting } = useBiblioteca(initialCapas)

  const handleEliminar = async (id: string, nombre: string) => {
    if (window.confirm(`¿Eliminar "${nombre}"? Esta acción borrará definiciones de atributos vinculadas.`)) {
      await eliminarCapa(id)
    }
  }

  return (
    <>
      <div className="flex justify-between items-center mb-10 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-blue-600">
            <Database size={24} />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Esquemas Maestros</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase italic">{capas.length} Tipos de elementos definidos</p>
          </div>
        </div>
        <Button 
          onClick={() => { setSelectedCapa(null); setIsModalOpen(true); }} 
          className="bg-slate-900 hover:bg-blue-600 text-white font-black py-7 px-8 rounded-2xl shadow-xl transition-all flex gap-3 group"
        >
          <span className="text-xl group-hover:rotate-90 transition-transform duration-300">+</span>
          <span className="uppercase text-[10px] tracking-[0.2em]">Registrar Nuevo Tipo</span>
        </Button>
      </div>

      {capas.length === 0 ? (
        <div className="text-center py-32 bg-white border-4 border-dashed border-slate-50 rounded-[3.5rem]">
          <AlertTriangle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest text-center px-10">
            No hay estructuras definidas para tu organización.<br/>Comienza creando una capa de infraestructura.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {capas.map((capa: any) => (
            <div key={capa.id} className="relative bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl transition-all duration-500 group overflow-hidden">
              
              {/* Acciones */}
              <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <Button 
                  variant="ghost" size="sm" 
                  className="h-10 w-10 p-0 bg-white shadow-sm border border-slate-100 rounded-xl hover:bg-blue-50"
                  onClick={() => { setSelectedCapa(capa); setIsModalOpen(true); }}
                >
                  <Edit size={16} className="text-blue-600" />
                </Button>
                <Button 
                  variant="ghost" size="sm"
                  disabled={isDeleting}
                  className="h-10 w-10 p-0 bg-white shadow-sm border border-slate-100 rounded-xl hover:bg-red-50"
                  onClick={() => handleEliminar(capa.id, capa.nombre)}
                >
                  {isDeleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} className="text-red-600" />}
                </Button>
                <Button 
                  variant="ghost" size="sm"
                  className="h-10 w-10 p-0 bg-white shadow-sm border border-slate-100 rounded-xl hover:bg-green-50"
                  onClick={() => downloadLayerTemplate(capa.id, capa.nombre)}
                >
                  <Download size={16} className="text-green-600" />
                </Button>
              </div>

              {/* Header de Card */}
              <div className="mb-8">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-5 text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-inner">
                  <Layers size={28} />
                </div>
                <h3 className="text-xl font-black text-slate-900 leading-none uppercase italic tracking-tighter mb-2">
                  {capa.nombre}
                </h3>
                <span className="text-[9px] font-black text-blue-500 bg-blue-50/50 border border-blue-100 px-3 py-1 rounded-full uppercase tracking-widest">
                  {capa.nombre_capa_maestra || 'SIN GRUPO'}
                </span>
              </div>

              {/* Atributos: Corregido con Key única y limpieza de código duplicado */}
              <div className="pt-6 border-t border-slate-50">
                <p className="text-[9px] font-black text-slate-400 mb-4 uppercase tracking-[0.2em]">Formulario de Campo:</p>
                <div className="flex flex-wrap gap-2">
                  {capa.attribute_definitions && capa.attribute_definitions.length > 0 ? (
                    capa.attribute_definitions.map((attr: any, i: number) => (
                      <div 
                        key={`${capa.id}-attr-${i}`} 
                        className="flex flex-col bg-slate-50/50 border border-slate-100 px-3 py-2 rounded-xl"
                      >
                        <span className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">{attr.tipo}</span>
                        <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-tight">{attr.campo}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-300 font-bold uppercase italic tracking-widest">Sin atributos definidos</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <BibliotecaCapaModal
        isOpen={isModalOpen}
        capa={selectedCapa}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          setSelectedCapa(null);
        }}
      />
    </>
  )
}