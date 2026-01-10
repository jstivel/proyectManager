'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import ProyectoModal from '@/components/infra/ProyectoModal'
import AsignarCapasModal from '@/components/infra/AsignarCapasModal'
import { Trash2, Edit, Layers, Map as MapIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DashboardList({ initialProyectos, supervisores }: any) {
  const [isProyectoModalOpen, setIsProyectoModalOpen] = useState(false)
  const [isCapasModalOpen, setIsCapasModalOpen] = useState(false)
  const [selectedProyecto, setSelectedProyecto] = useState<any>(null)
  
  const supabase = createClient()
  const router = useRouter() // 👈 IMPORTANTE para refrescar la página

  // Esta función es la "magia" para que aparezcan los proyectos nuevos
  const handleRefresh = () => {
    setIsProyectoModalOpen(false)
    setIsCapasModalOpen(false)
    router.refresh() // 👈 Esto le dice a Next.js: "Vuelve a ejecutar el SQL en el servidor"
  }

  async function eliminarProyecto(id: string, nombre: string) {
    if (!confirm(`¿Eliminar "${nombre}"?`)) return
    const { error } = await supabase.from('proyectos').delete().eq('id', id)
    if (!error) handleRefresh()
  }

  return (
    <>
      <div className="flex justify-end mb-8">
        <Button 
          onClick={() => { setSelectedProyecto(null); setIsProyectoModalOpen(true); }}
          className="bg-blue-600 hover:bg-blue-700 shadow-sm"
        >
          + Crear Proyecto
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {initialProyectos.map((proy: any) => (
          <div key={proy.id} className="relative bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all">
            {/* Botones de Edición y Borrado */}
            <div className="absolute top-4 right-4 flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => { setSelectedProyecto(proy); setIsProyectoModalOpen(true); }}>
                <Edit size={16} className="text-slate-400 hover:text-blue-600" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => eliminarProyecto(proy.id, proy.nombre)}>
                <Trash2 size={16} className="text-slate-400 hover:text-red-600" />
              </Button>
            </div>

            <h3 className="text-lg font-bold text-slate-800 pr-16 mb-1">{proy.nombre}</h3>
            <p className="text-sm text-slate-500 font-medium mb-4">{proy.entidad}</p>

            <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg mb-6">
              <span className="text-slate-400 text-xs uppercase font-bold">Encargado:</span>
              <span className="font-semibold">{proy.usuarios?.nombre || 'No asignado'}</span>
            </div>

            {/* AQUÍ RECUPERAMOS LOS BOTONES QUE FALTABAN */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="w-full text-xs flex gap-2 border-slate-200"
                onClick={() => { setSelectedProyecto(proy); setIsCapasModalOpen(true); }}
              >
                <Layers size={14} /> Capas
              </Button>

              <Link href={`/mapa?id=${proy.id}`} className="w-full">
                <Button className="w-full text-xs flex gap-2 bg-slate-800 hover:bg-slate-900">
                  <MapIcon size={14} /> Mapa
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Modales configurados para refrescar la data al terminar */}
      <ProyectoModal
        isOpen={isProyectoModalOpen}
        proyecto={selectedProyecto}
        supervisores={supervisores}
        onClose={() => setIsProyectoModalOpen(false)}
        onSuccess={handleRefresh} // 👈 Llama a router.refresh()
      />

      <AsignarCapasModal
        isOpen={isCapasModalOpen}
        proyecto={selectedProyecto}
        onClose={() => setIsCapasModalOpen(false)}
      />
    </>
  )
}