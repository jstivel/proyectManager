'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, Circle } from 'lucide-react'

interface AsignarCapasModalProps {
  proyecto: any
  isOpen: boolean
  onClose: () => void
}

export default function AsignarCapasModal({ proyecto, isOpen, onClose }: AsignarCapasModalProps) {
  const [biblioteca, setBiblioteca] = useState<any[]>([])
  const [asignadas, setAsignadas] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const mountedRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true

    if (isOpen && proyecto?.id) {
      fetchData()
    }

    return () => {
      mountedRef.current = false
    }
  }, [isOpen, proyecto?.id])

  async function fetchData() {
    if (!mountedRef.current) return
    setLoading(true)

    try {
      // 1. Cargar toda la biblioteca global
      const { data: biblio, error: biblioError } = await supabase
        .from('feature_types')
        .select('*')
        .order('nombre')

      if (biblioError) throw biblioError
      if (!mountedRef.current) return

      setBiblioteca(biblio || [])

      // 2. Cargar qué capas ya tiene este proyecto
      const { data: yaAsignadas, error: asignadasError } = await supabase
        .from('proyecto_capas')
        .select('feature_type_id')
        .eq('proyecto_id', proyecto.id)

      if (asignadasError) throw asignadasError
      if (!mountedRef.current) return

      setAsignadas(yaAsignadas?.map(a => a.feature_type_id) || [])

    } catch (err) {
      console.error('Error cargando capas del proyecto:', err)
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }

  const toggleCapa = (id: string) => {
    setAsignadas(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  async function guardarCambios() {
    if (saving) return
    setSaving(true)

    try {
      // Sincronización simple: Borrar y Re-insertar
      await supabase
        .from('proyecto_capas')
        .delete()
        .eq('proyecto_id', proyecto.id)

      if (asignadas.length > 0) {
        const rows = asignadas.map(capaId => ({
          proyecto_id: proyecto.id,
          feature_type_id: capaId
        }))

        await supabase.from('proyecto_capas').insert(rows)
      }

      onClose()

    } catch (err) {
      console.error('Error guardando capas:', err)
      alert('Error al guardar configuración')
    } finally {
      if (mountedRef.current) {
        setSaving(false)
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-6 border-b bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">Configurar Capas</h2>
          <p className="text-sm text-blue-600 font-medium">
            Proyecto: {proyecto?.nombre}
          </p>
        </div>

        <div className="p-6 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
          ) : (
            <div className="grid gap-3">
              {biblioteca.map((capa) => {
                const isSelected = asignadas.includes(capa.id)
                return (
                  <div
                    key={capa.id}
                    onClick={() => toggleCapa(capa.id)}
                    className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isSelected
                        ? <CheckCircle2 className="text-blue-600" size={20} />
                        : <Circle className="text-slate-300" size={20} />
                      }
                      <div>
                        <p className={`font-bold ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>
                          {capa.nombre}
                        </p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                          {capa.layer}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}

              {biblioteca.length === 0 && (
                <p className="text-center text-slate-400 py-10">
                  No hay capas en la biblioteca global.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-slate-50 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            onClick={guardarCambios}
            disabled={saving || loading}
          >
            {saving ? 'Guardando...' : 'Aplicar Cambios'}
          </Button>
        </div>
      </div>
    </div>
  )
}
