'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import BibliotecaCapaModal from '@/components/modal/BibliotecaCapaModal'
import { Trash2, Edit, Download, AlertTriangle, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { downloadLayerTemplate } from '@/services/templateService'

export default function BibliotecaList({ initialCapas }: { initialCapas: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCapa, setSelectedCapa] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  
  const supabase = createClient()
  const router = useRouter()

  const handleRefresh = () => {
    setIsModalOpen(false)
    setSelectedCapa(null)
    router.refresh()
  }

  /**
   * Eliminar Capa Maestra vía RPC:
   * Implementación de seguridad estricta a través de función de base de datos.
   * La función 'delete_capa_maestra_segura' se encarga de verificar permisos
   * y manejar la integridad referencial en cascada si es necesario.
   */
  async function eliminarCapa(id: string, nombre: string) {
    if (!confirm(`¿Estás seguro de eliminar la capa maestra "${nombre}"? Esta acción no se puede deshacer y podría afectar a proyectos existentes.`)) return
    
    setIsDeleting(id)
    try {
      // Cambio de .from().delete() a .rpc() para cumplir con el protocolo de seguridad
      const { error } = await supabase.rpc('delete_capa_maestra_segura', {
        p_capa_id: id
      })

      if (error) {
        throw new Error(error.message)
      }

      handleRefresh()
    } catch (error: any) {
      // Manejo de error con contexto de integridad o permisos
      alert("Error de seguridad o integridad: " + error.message)
    } finally {
      setIsDeleting(null)
    }
  }
  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Biblioteca de Capas</h2>
          <p className="text-xs text-slate-500 font-medium">Gestiona las estructuras maestras para el levantamiento de información.</p>
        </div>
        <Button 
          onClick={() => { setSelectedCapa(null); setIsModalOpen(true); }} 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 px-6 rounded-2xl shadow-lg shadow-blue-100 transition-all flex gap-2 items-center"
        >
          <span className="text-lg">+</span>
          <span className="uppercase text-xs tracking-wider">Nueva Capa Maestra</span>
        </Button>
      </div>

      {initialCapas.length === 0 ? (
        <div className="text-center py-32 bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem]">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-50 rounded-2xl mb-4">
            <AlertTriangle className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No hay capas definidas en la biblioteca</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {initialCapas.map((capa) => (
            <div key={capa.id} className="relative bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 group">
              
              {/* Botonera Flotante */}
              <div className="absolute top-6 right-6 flex gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 z-10">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-9 w-9 p-0 bg-white shadow-sm border border-slate-100 rounded-xl hover:bg-blue-50"
                  onClick={() => { setSelectedCapa(capa); setIsModalOpen(true); }}
                >
                  <Edit size={16} className="text-blue-600" />
                </Button>

                <Button 
                  variant="ghost" 
                  size="sm" 
                  disabled={isDeleting === capa.id}
                  className="h-9 w-9 p-0 bg-white shadow-sm border border-slate-100 rounded-xl hover:bg-red-50"
                  onClick={() => eliminarCapa(capa.id, capa.nombre)}
                >
                  <Trash2 size={16} className={isDeleting === capa.id ? "text-slate-300 animate-pulse" : "text-red-600"} />
                </Button>

                <div className="relative group/download">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-9 w-9 p-0 bg-white shadow-sm border border-slate-100 rounded-xl hover:bg-green-50"
                    onClick={() => downloadLayerTemplate(capa.id, capa.nombre)}
                  >
                    <Download size={16} className="text-green-600" />
                  </Button>

                  <div className="absolute bottom-full right-0 mb-3 hidden group-hover/download:block w-72 p-4 bg-slate-900 text-white text-[10px] rounded-2xl shadow-2xl z-50 pointer-events-none border border-slate-700">
                    <p className="font-black border-b border-slate-700 pb-2 mb-2 uppercase text-green-400 tracking-widest">Plantilla Excel</p>
                    <ul className="space-y-2 text-slate-300">
                      <li className="flex gap-2"><span className="text-green-500">●</span> No altere los encabezados (Fila 1).</li>
                      <li className="flex gap-2"><span className="text-green-500">●</span> Use <span className="text-white font-bold underline">punto (.)</span> para decimales.</li>
                      <li className="flex gap-2"><span className="text-green-500">●</span> Multiselección: separar con <span className="bg-slate-800 px-1 rounded text-blue-400 font-mono">;</span></li>
                    </ul>
                    <div className="absolute top-full right-4 border-8 border-transparent border-t-slate-900"></div>
                  </div>
                </div>
              </div>

              {/* Contenido de la Card */}
              <div className="mb-6">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 text-blue-600">
                  <span className="text-lg font-black">{capa.nombre.charAt(0)}</span>
                </div>
                <h3 className="text-lg font-black text-slate-800 leading-tight mb-1">{capa.nombre}</h3>
                <code className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-lg uppercase tracking-tighter">
                  {capa.layers?.nombre_tecnico || 'CAPA_GENERAL'}
                </code>
              </div>

              <div className="pt-4 border-t border-slate-50">
                <p className="text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest">Estructura de Datos:</p>
                <div className="flex flex-wrap gap-1.5">
                  {capa.attribute_definitions && capa.attribute_definitions.length > 0 ? (
                    capa.attribute_definitions.map((attr: any) => (
                      <span key={attr.id} className="text-[9px] bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg text-slate-600 font-bold uppercase">
                        {attr.campo}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-400 italic font-medium tracking-tight">Sin atributos definidos</span>
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
        onSuccess={handleRefresh}
      />
    </>
  )
}