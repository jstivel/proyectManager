'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import BibliotecaCapaModal from '@/components/infra/BibliotecaCapaModal'
import { Trash2, Edit, Download } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { downloadLayerTemplate } from '@/services/templateService'

export default function BibliotecaList({ initialCapas }: { initialCapas: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCapa, setSelectedCapa] = useState<any>(null)
  
  const supabase = createClient()
  const router = useRouter()

  const handleRefresh = () => {
    setIsModalOpen(false)
    router.refresh()
  }

  async function eliminarCapa(id: string, nombre: string) {
    if (!confirm(`¿Eliminar "${nombre}"? Se borrarán sus campos.`)) return
    const { error } = await supabase.from('feature_types').delete().eq('id', id)
    if (error) {
      alert("Error al eliminar: " + error.message)
    } else {
      handleRefresh()
    }
  }

  return (
    <>
      <div className="flex justify-end mb-6">
        <Button 
          onClick={() => { setSelectedCapa(null); setIsModalOpen(true); }} 
          className="bg-blue-600 hover:bg-blue-700 font-bold uppercase text-xs"
        >
          + Nueva Capa Maestra
        </Button>
      </div>

      {initialCapas.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-xl">
          <p className="text-slate-400">No hay capas definidas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {initialCapas.map((capa) => (
            <div key={capa.id} className="relative bg-white border border-slate-200 rounded-xl p-6 shadow-sm group">
              
              {/* Botonera Superior Derecha: Aparece al hacer hover en la Card */}
              <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                
                {/* Botón Editar */}
                <Button variant="ghost" size="sm" onClick={() => { setSelectedCapa(capa); setIsModalOpen(true); }}>
                  <Edit size={16} className="text-blue-600" />
                </Button>

                {/* Botón Eliminar */}
                <Button variant="ghost" size="sm" onClick={() => eliminarCapa(capa.id, capa.nombre)}>
                  <Trash2 size={16} className="text-red-600" />
                </Button>

                {/* BOTÓN DESCARGA + TOOLTIP ESPECÍFICO */}
                <div className="relative group/download">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => downloadLayerTemplate(capa.id, capa.nombre)}
                  >
                    <Download size={16} className="text-blue-600" />
                  </Button>

                  {/* Nota aclaratoria: Solo visible al hover sobre este botón */}
                  <div className="absolute bottom-full right-0 mb-2 hidden group-hover/download:block w-72 p-3 bg-slate-800 text-white text-[10px] rounded-lg shadow-xl z-50 pointer-events-none">
                    <p className="font-bold border-b border-slate-600 pb-1 mb-2 uppercase text-blue-400">Instrucciones de llenado:</p>
                    <ul className="space-y-1 list-disc pl-3">
                      <li>No borre la primera fila (encabezados).</li>
                      <li>La fila 2 es ejemplo, <span className="text-red-400 font-bold uppercase">bórrela antes de subir</span>.</li>
                      <li>En <span className="text-yellow-400 font-bold">MULTISELECCIÓN</span>, separe con <span className="bg-slate-700 px-1 rounded text-white font-mono text-xs">;</span> (punto y coma).</li>
                      <li>Coordenadas: Use <span className="font-bold underline text-blue-200">punto (.)</span> para decimales.</li>
                      <li>ID Técnico: No use tildes ni espacios (Ej: P_100).</li>
                    </ul>
                    <div className="absolute top-full right-3 border-8 border-transparent border-t-slate-800"></div>
                  </div>
                </div>
              </div>

              {/* Información de la Card */}
              <h3 className="text-lg font-bold text-slate-800 mb-1">{capa.nombre}</h3>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                {capa.layers?.nombre_tecnico || 'CAPA_GENERAL'}
              </span>

              <div className="mt-4 pt-4 border-t border-slate-50">
                <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-tight">Atributos definidos:</p>
                <div className="flex flex-wrap gap-1">
                  {capa.attribute_definitions?.map((attr: any) => (
                    <span key={attr.id} className="text-[10px] bg-blue-50 px-2 py-0.5 rounded text-blue-700 font-medium">
                      {attr.campo}
                    </span>
                  )) || <span className="text-[10px] text-slate-400 italic">Sin atributos</span>}
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