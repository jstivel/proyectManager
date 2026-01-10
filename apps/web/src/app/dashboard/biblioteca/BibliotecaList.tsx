'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import BibliotecaCapaModal from '@/components/infra/BibliotecaCapaModal'
import { Trash2, Edit } from 'lucide-react'
import { useRouter } from 'next/navigation'
import * as LucideIcons from 'lucide-react'

export default function BibliotecaList({ initialCapas }: { initialCapas: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCapa, setSelectedCapa] = useState<any>(null)
  
  const supabase = createClient()
  const router = useRouter()

  const handleRefresh = () => {
    setIsModalOpen(false)
    router.refresh() // Refresca los datos del servidor sin recargar la página
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
          className="bg-blue-600 hover:bg-blue-700"
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
              <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="sm" onClick={() => { setSelectedCapa(capa); setIsModalOpen(true); }}>
                  <Edit size={16} className="text-blue-600" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => eliminarCapa(capa.id, capa.nombre)}>
                  <Trash2 size={16} className="text-red-600" />
                </Button>
              </div>

              <h3 className="text-lg font-bold text-slate-800 mb-1">{capa.nombre}</h3>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">{capa.layer}</span>

              <div className="mt-4 pt-4 border-t border-slate-50">
                <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-tight">Atributos:</p>
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