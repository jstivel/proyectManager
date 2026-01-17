'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import ProyectoModal from '@/components/modal/ProyectoModal'
import AsignarCapasModal from '@/components/modal/AsignarCapasModal'
import { 
  Trash2, 
  Edit, 
  Layers, 
  Map as MapIcon, 
  Plus, 
  UserCircle2, 
  Building2,
  ChevronRight,
  Loader2
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DashboardList({ initialProyectos, supervisores }: any) {
  const [isProyectoModalOpen, setIsProyectoModalOpen] = useState(false)
  const [isCapasModalOpen, setIsCapasModalOpen] = useState(false)
  const [selectedProyecto, setSelectedProyecto] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  
  const supabase = createClient()
  const router = useRouter()

  const handleRefresh = () => {
    setIsProyectoModalOpen(false)
    setIsCapasModalOpen(false)
    setSelectedProyecto(null)
    router.refresh()
  }

  /**
   * Eliminar Proyecto vía RPC:
   * Se invoca la función segura 'delete_proyecto_seguro' en lugar de usar .delete()
   * Esto garantiza que solo el dueño de la organización o un SuperAdmin pueda borrarlo.
   */
  async function eliminarProyecto(id: string, nombre: string) {
    if (!confirm(`¿Estás seguro de eliminar el proyecto "${nombre}"? Esta acción no se puede deshacer y borrará toda la infraestructura asociada.`)) return
    
    setIsDeleting(id)
    try {
      const { error } = await supabase.rpc('delete_proyecto_seguro', {
        p_proyecto_id: id
      })
      
      if (error) throw error
      
      handleRefresh()
    } catch (error: any) {
      alert("Error de seguridad: " + error.message)
    } finally {
      setIsDeleting(null)
    }
  }

  return (
    <>
      {/* Barra de Acciones Superior */}
      <div className="flex justify-end mb-10">
        <Button 
          onClick={() => { setSelectedProyecto(null); setIsProyectoModalOpen(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-black py-7 px-8 rounded-2xl shadow-xl shadow-blue-100 transition-all flex gap-3 items-center group"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          <span className="uppercase tracking-widest text-xs">Crear Proyecto</span>
        </Button>
      </div>

      {/* Grid de Proyectos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {initialProyectos.map((proy: any) => (
          <div 
            key={proy.id} 
            className="group relative bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 flex flex-col"
          >
            {/* Toolbar de Acciones (Hover) */}
            <div className="absolute top-6 right-6 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
              <button 
                onClick={() => { setSelectedProyecto(proy); setIsProyectoModalOpen(true); }}
                className="p-3 bg-white shadow-lg rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                title="Editar Proyecto"
              >
                <Edit size={18} />
              </button>
              <button 
                onClick={() => eliminarProyecto(proy.id, proy.nombre)}
                className="p-3 bg-white shadow-lg rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                title="Eliminar"
              >
                <Trash2 size={18} />
              </button>
            </div>

            {/* Cabecera de la Tarjeta */}
            <div className="mb-6">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500">
                <MapIcon size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-900 pr-12 line-clamp-1 group-hover:text-blue-600 transition-colors">
                {proy.nombre}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Building2 size={14} className="text-slate-300" />
                <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest">
                  {proy.entidad || 'Sin Entidad'}
                </p>
              </div>
            </div>

            {/* Info del Encargado */}
            <div className="bg-slate-50/50 border border-slate-100/50 rounded-2xl p-4 mb-8 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-blue-500 shadow-sm">
                <UserCircle2 size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Responsable</span>
                <span className="text-sm font-bold text-slate-700 truncate max-w-[150px]">
                  {proy.usuarios?.nombre || 'No asignado'}
                </span>
              </div>
            </div>

            {/* Botones de Navegación y Configuración */}
            <div className="mt-auto grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="py-6 rounded-2xl text-[10px] font-black uppercase tracking-widest flex gap-2 border-slate-100 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-all"
                onClick={() => { setSelectedProyecto(proy); setIsCapasModalOpen(true); }}
              >
                <Layers size={16} /> Capas
              </Button>

              <Link href={`/dashboard/visor?p=${proy.id}`} className="w-full">
                <Button className="w-full py-6 rounded-2xl text-[10px] font-black uppercase tracking-widest flex gap-2 bg-slate-900 hover:bg-blue-600 transition-all shadow-lg shadow-slate-100 group/btn">
                  Mapa <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        ))}

        {/* Empty State opcional (si initialProyectos está vacío) */}
        {initialProyectos.length === 0 && (
          <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">No hay proyectos activos</p>
          </div>
        )}
      </div>

      {/* Modales */}
      <ProyectoModal
        isOpen={isProyectoModalOpen}
        proyecto={selectedProyecto}
        supervisores={supervisores}
        onClose={() => setIsProyectoModalOpen(false)}
        onSuccess={handleRefresh}
      />

      {/* AsignarCapasModal debe ser importado y existir en tu carpeta de componentes */}
      {isCapasModalOpen && (
        <AsignarCapasModal
          isOpen={isCapasModalOpen}
          proyecto={selectedProyecto}
          onClose={() => setIsCapasModalOpen(false)}
        />
      )}
    </>
  )
}