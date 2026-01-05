'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import ProyectoModal from '@/components/infra/ProyectoModal'
import AsignarCapasModal from '@/components/infra/AsignarCapasModal'
import { Trash2, Edit, Layers, Map as MapIcon, Loader2 } from 'lucide-react'

export default function AdminDashboard() {
  const [proyectos, setProyectos] = useState<any[]>([])
  const [supervisores, setSupervisores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Estados para Modales
  const [isProyectoModalOpen, setIsProyectoModalOpen] = useState(false)
  const [isCapasModalOpen, setIsCapasModalOpen] = useState(false)
  const [selectedProyecto, setSelectedProyecto] = useState<any>(null)

  // 🔒 REF para evitar setState en componentes desmontados
  const mountedRef = useRef(true)

  const fetchData = useCallback(async () => {
    if (!mountedRef.current) return

    setLoading(true)

    try {
      const { data: proyData, error: errorProy } = await supabase
        .from('proyectos')
        .select(`*, usuarios!proyectos_supervisor_id_fkey (nombre)`)
        .order('created_at', { ascending: false })

      if (errorProy) throw errorProy

      const { data: supData, error: errorSup } = await supabase
        .from('usuarios')
        .select('id, nombre')
        .eq('rol_id', 5)

      if (errorSup) throw errorSup

      if (!mountedRef.current) return

      setProyectos(proyData || [])
      setSupervisores(supData || [])
    } catch (error: any) {
      console.error('Error en Dashboard:', error.message)
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    fetchData()

    return () => {
      mountedRef.current = false
    }
  }, [fetchData])

  const handleCreateClick = () => {
    setSelectedProyecto(null)
    setIsProyectoModalOpen(true)
  }

  const handleEditClick = (proyecto: any) => {
    setSelectedProyecto(proyecto)
    setIsProyectoModalOpen(true)
  }

  const handleCapasClick = (proyecto: any) => {
    setSelectedProyecto(proyecto)
    setIsCapasModalOpen(true)
  }

  async function eliminarProyecto(id: string, nombre: string) {
    const confirmar = confirm(
      `¿Estás seguro de eliminar el proyecto "${nombre}"? Esta acción no se puede deshacer.`
    )
    if (!confirmar) return

    try {
      const { error } = await supabase.from('proyectos').delete().eq('id', id)
      if (error) throw error
      fetchData()
    } catch (error: any) {
      alert('Error al eliminar: ' + error.message)
    }
  }

  if (loading && proyectos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="text-slate-500 font-medium">Cargando proyectos...</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Gestión de Proyectos
          </h1>
          <p className="text-slate-500 mt-1">
            Administra los levantamientos y asigna capas de infraestructura.
          </p>
        </div>

        <Button
          onClick={handleCreateClick}
          className="bg-blue-600 hover:bg-blue-700 shadow-sm"
        >
          + Crear Proyecto
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {proyectos.map((proy) => (
          <div
            key={proy.id}
            className="relative bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all"
          >
            <div className="absolute top-4 right-4 flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600"
                onClick={() => handleEditClick(proy)}
              >
                <Edit size={16} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => eliminarProyecto(proy.id, proy.nombre)}
                className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
              >
                <Trash2 size={16} />
              </Button>
            </div>

            <div className="mb-4">
              <span
                className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                  proy.estado === 'activo'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {proy.estado}
              </span>
            </div>

            <h3 className="text-lg font-bold text-slate-800 pr-16 mb-1">
              {proy.nombre}
            </h3>
            <p className="text-sm text-slate-500 font-medium">
              {proy.entidad}
            </p>
            <p className="text-xs text-slate-400 mb-4 italic">
              {proy.region || 'Sin región especificada'}
            </p>

            <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg mb-6">
              <span className="text-slate-400 text-xs uppercase font-bold">
                Encargado:
              </span>
              <span className="font-semibold">
                {proy.usuarios?.nombre || 'No asignado'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="w-full text-xs flex gap-2 border-slate-200"
                onClick={() => handleCapasClick(proy)}
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

        {proyectos.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center border-2 border-dashed rounded-2xl">
            <p className="text-slate-400">
              No hay proyectos registrados. Haz clic en "Crear Proyecto".
            </p>
          </div>
        )}
      </div>

      <ProyectoModal
        isOpen={isProyectoModalOpen}
        proyecto={selectedProyecto}
        supervisores={supervisores}
        onClose={() => setIsProyectoModalOpen(false)}
        onSuccess={fetchData}
      />

      <AsignarCapasModal
        isOpen={isCapasModalOpen}
        proyecto={selectedProyecto}
        onClose={() => setIsCapasModalOpen(false)}
      />
    </div>
  )
}
