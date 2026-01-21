'use client'

import { useState } from 'react'
import { useProyectos } from '@/hooks/useProyectos'
import { Button } from '@/components/ui/button'
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
import Link from 'next/link'
import { toast } from 'sonner'

interface DashboardListProps {
  rolId?: number
}

export default function DashboardList({ rolId }: DashboardListProps) {
  // Consumimos el hook que centraliza la lógica de TanStack Query y Server Actions
  const { data, isLoading, deleteProyecto, isDeleting } = useProyectos()
  
  const [isProyectoModalOpen, setIsProyectoModalOpen] = useState(false)
  const [isCapasModalOpen, setIsCapasModalOpen] = useState(false)
  const [selectedProyecto, setSelectedProyecto] = useState<any>(null)
  
  const puedeBorrar = rolId === 4 || rolId === 7

  async function handleEliminar(id: string, nombre: string) {
    if (!puedeBorrar) return toast.error("No tienes permisos para eliminar proyectos")
    if (!confirm(`¿Estás seguro de eliminar "${nombre}"? Esta acción no se puede deshacer.`)) return
    
    try {
      // deleteProyecto es la mutación asíncrona del hook useProyectos
      await deleteProyecto(id)
      toast.success("Proyecto eliminado correctamente")
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar el proyecto")
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
          Cargando infraestructura...
        </p>
      </div>
    )
  }

  const proyectos = data?.proyectos || []
  const supervisores = data?.supervisores || []

  return (
    <>
      {/* Cabecera de Acciones */}
      <div className="flex justify-end mb-10">
        <Button 
          onClick={() => { 
            setSelectedProyecto(null)
            setIsProyectoModalOpen(true) 
          }}
          className="bg-slate-900 hover:bg-blue-600 text-white font-black py-7 px-8 rounded-2xl shadow-xl transition-all flex gap-3 items-center group"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          <span className="uppercase tracking-widest text-[11px]">Nuevo Proyecto</span>
        </Button>
      </div>

      {/* Grid de Proyectos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {proyectos.map((proy: any) => (
          <div 
            key={proy.id} 
            className="group relative bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col"
          >
            {/* Toolbar de Acciones (Hover) */}
            <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
              <button 
                onClick={() => { 
                  setSelectedProyecto(proy)
                  setIsProyectoModalOpen(true) 
                }} 
                className="p-3 bg-white shadow-md rounded-xl text-slate-400 hover:text-blue-600 transition-all"
                title="Editar Proyecto"
              >
                <Edit size={16} />
              </button>
              
              {puedeBorrar && (
                <button 
                  onClick={() => handleEliminar(proy.id, proy.nombre)} 
                  disabled={isDeleting}
                  className="p-3 bg-white shadow-md rounded-xl text-slate-400 hover:text-red-600 transition-all disabled:opacity-50"
                  title="Eliminar Proyecto"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            {/* Icono y Título */}
            <div className="mb-6">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-inner">
                <MapIcon size={28} />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-tight line-clamp-2">
                {proy.nombre}
              </h3>
              <div className="flex items-center gap-2 mt-2">
                <Building2 size={12} className="text-blue-500" />
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                  {proy.entidad || 'S/E'}
                </span>
              </div>
            </div>

            {/* Tarjeta de Supervisor */}
            <div className="bg-slate-50 rounded-2xl p-4 mb-6 flex items-center gap-3 border border-slate-100/50">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-blue-600 shadow-sm">
                <UserCircle2 size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">Supervisor</span>
                <span className="text-xs font-bold text-slate-700 truncate max-w-[140px]">
                  {proy.usuarios?.nombre || 'No asignado'}
                </span>
              </div>
            </div>

            {/* Footer de la Tarjeta (Botones de Acción) */}
            <div className="mt-auto grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="py-6 rounded-2xl text-[9px] font-black uppercase tracking-widest gap-2 border-slate-100 hover:bg-blue-50 hover:text-blue-600 transition-all" 
                onClick={() => { 
                  setSelectedProyecto(proy)
                  setIsCapasModalOpen(true) 
                }}
              >
                <Layers size={14} /> Capas
              </Button>
              <Link href={`/dashboard/visor?p=${proy.id}`} className="w-full">
                <Button className="w-full py-6 rounded-2xl text-[9px] font-black uppercase tracking-widest gap-2 bg-slate-900 hover:bg-blue-600 transition-all shadow-lg group/btn">
                  Mapa <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        ))}
        
        {/* Empty State */}
        {proyectos.length === 0 && (
          <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">
              No se encontraron proyectos activos
            </p>
          </div>
        )}
      </div>

      {/* Modal de Creación/Edición */}
      <ProyectoModal
        isOpen={isProyectoModalOpen}
        proyecto={selectedProyecto}
        supervisores={supervisores}
        onClose={() => setIsProyectoModalOpen(false)}
        // onSuccess ahora es opcional o manejado por el hook, 
        // pero lo dejamos para compatibilidad si el modal lo requiere.
        onSuccess={() => setIsProyectoModalOpen(false)} 
      />

      {/* Modal de Asignación de Capas */}
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