'use client'

import { useEffect, useState, useCallback } from 'react' // Añadimos useCallback
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import BibliotecaCapaModal from '@/components/infra/BibliotecaCapaModal'
import { Trash2, Edit } from 'lucide-react'

export default function BibliotecaPage() {
  const [capas, setCapas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCapa, setSelectedCapa] = useState<any>(null)

  // Usamos useCallback para que la función sea estable y no cause re-renderizados
  const fetchCapas = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('feature_types')
        .select(`*, attribute_definitions (*)`)
      
      if (error) throw error // Forzamos el salto al catch si hay error
      setCapas(data || [])
    } catch (error: any) {
      console.error("Error cargando biblioteca:", error.message)
      alert("No se pudo cargar la biblioteca. Verifica tu conexión.")
    } finally {
      // ESTO ES LO VITAL: Se ejecuta aunque falle la red o la DB
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCapas()
  }, [fetchCapas])

  const handleEdit = (capa: any) => {
    setSelectedCapa(capa)
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setSelectedCapa(null)
    setIsModalOpen(true)
  }

  async function eliminarCapa(id: string, nombre: string) {
    const confirmar = confirm(
      `¿Eliminar "${nombre}" de la biblioteca? Se borrarán sus definiciones de campos.`
    )
    if (!confirmar) return

    setLoading(true) // Bloqueamos UI mientras elimina
    try {
      const res = await supabase
        .from('feature_types')
        .delete()
        .eq('id', id)

      if (res.error) throw res.error

      await fetchCapas() // Recargamos datos
    } catch (error: any) {
      alert("Error al eliminar: " + error.message)
      setLoading(false) // Si falla recargar, al menos liberamos el loading
    }
  }

  // Renderizado condicional optimizado
  if (loading && capas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-slate-500 font-medium">Cargando biblioteca...</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Biblioteca Global</h1>
          <p className="text-slate-500">Estructuras base para todos los proyectos.</p>
        </div>
        <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
          + Nueva Capa Maestra
        </Button>
      </div>

      {capas.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-xl">
          <p className="text-slate-400">
            No hay capas definidas. Crea la primera para comenzar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {capas.map((capa) => (
            <div
              key={capa.id}
              className="relative bg-white border border-slate-200 rounded-xl p-6 shadow-sm group"
            >
              <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(capa)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => eliminarCapa(capa.id, capa.nombre)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <h3 className="text-lg font-bold text-slate-800 mb-1">
                {capa.nombre}
              </h3>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                {capa.layer}
              </span>

              <div className="mt-4 pt-4 border-t border-slate-50">
                <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-tight">
                  Atributos:
                </p>
                <div className="flex flex-wrap gap-1">
                  {capa.attribute_definitions?.length > 0 ? (
                    capa.attribute_definitions.map((attr: any) => (
                      <span
                        key={attr.id}
                        className="text-[10px] bg-blue-50 px-2 py-0.5 rounded text-blue-700 font-medium"
                      >
                        {attr.campo}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">
                      Sin atributos
                    </span>
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
        onSuccess={fetchCapas}
      />
    </div>
  )
}
