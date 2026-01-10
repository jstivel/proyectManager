'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client' // Cliente moderno
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
  
  const supabase = createClient()

  // Solo cargamos los datos cuando el modal se abre
  useEffect(() => {
    if (isOpen && proyecto?.id) {
      const fetchData = async () => {
        setLoading(true)
        try {
          // Cargamos biblioteca y asignaciones en paralelo
          const [biblioRes, asignadasRes] = await Promise.all([
            supabase.from('feature_types').select('*').order('nombre'),
            supabase.from('proyecto_capas').select('feature_type_id').eq('proyecto_id', proyecto.id)
          ])

          if (biblioRes.data) setBiblioteca(biblioRes.data)
          if (asignadasRes.data) setAsignadas(asignadasRes.data.map(a => a.feature_type_id))
        } catch (err) {
          console.error('Error:', err)
        } finally {
          setLoading(false)
        }
      }
      fetchData()
    }
  }, [isOpen, proyecto?.id])

  const toggleCapa = (id: string) => {
    setAsignadas(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  async function guardarCambios() {
    setSaving(true)
    try {
      // Usamos el ID del proyecto directamente
      await supabase.from('proyecto_capas').delete().eq('proyecto_id', proyecto.id)

      if (asignadas.length > 0) {
        const rows = asignadas.map(capaId => ({
          proyecto_id: proyecto.id,
          feature_type_id: capaId
        }))
        await supabase.from('proyecto_capas').insert(rows)
      }
      onClose()
    } catch (err) {
      alert('Error al guardar configuración')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 text-slate-900">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-6 border-b bg-slate-50">
          <h2 className="text-xl font-bold">Configurar Capas</h2>
          <p className="text-sm text-blue-600 font-medium">Proyecto: {proyecto?.nombre}</p>
        </div>

        {/* Listado */}
        <div className="p-6 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
          ) : (
            <div className="grid gap-3">
              {biblioteca.map((capa) => {
                const isSelected = asignadas.includes(capa.id)
                return (
                  <button
                    key={capa.id}
                    onClick={() => toggleCapa(capa.id)}
                    className={`flex items-center justify-between p-4 border rounded-xl text-left transition-all ${
                      isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isSelected ? <CheckCircle2 className="text-blue-600" size={20} /> : <Circle className="text-slate-300" size={20} />}
                      <div>
                        <p className={`font-bold ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>{capa.nombre}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest">{capa.layer}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-slate-50 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button className="flex-1 bg-blue-600" onClick={guardarCambios} disabled={saving || loading}>
            {saving ? 'Guardando...' : 'Aplicar Cambios'}
          </Button>
        </div>
      </div>
    </div>
  )
}