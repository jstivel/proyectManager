// apps/web/src/components/infra/AsignarCapasModal.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, Circle, Download, UploadCloud } from 'lucide-react'
import { downloadLayerTemplate } from '@/services/templateService'
import BulkUploadModal from './BulkUploadModal'

interface AsignarCapasModalProps {
  proyecto: any
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function AsignarCapasModal({ proyecto, isOpen, onClose, onSuccess }: AsignarCapasModalProps) {
  const [biblioteca, setBiblioteca] = useState<any[]>([])
  const [asignadas, setAsignadas] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Estado para el modal de carga masiva interno
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [selectedCapaForUpload, setSelectedCapaForUpload] = useState<any>(null)
  
  const supabase = createClient()

  useEffect(() => {
    if (isOpen && proyecto?.id) {
      const fetchData = async () => {
        setLoading(true)
        try {
          // 1. LLAMADA AL PROXY (RPC): Traemos el esquema técnico de todas las capas
          // Esto devuelve f_type_id, nombre_capa y columnas_clave (array de strings)
          const { data: esquemaData, error: schemaError } = await supabase
            .rpc('get_infra_schema_dictionary');

          if (schemaError) throw schemaError;

          // 2. Traemos las capas ya asignadas al proyecto actual
          const { data: asignadasRes, error: asignadasError } = await supabase
            .from('proyecto_capas')
            .select('feature_type_id')
            .eq('proyecto_id', proyecto.id);

          if (asignadasError) throw asignadasError;

          // Mapeamos los datos del RPC para que coincidan con la estructura del componente
          const biblioFormateada = esquemaData.map((e: any) => ({
            id: e.f_type_id,
            nombre: e.nombre_capa,
            // Guardamos las columnas clave para pasarlas al validador de CSV
            campos_requeridos: e.columnas_clave || []
          }));

          setBiblioteca(biblioFormateada);
          if (asignadasRes) setAsignadas(asignadasRes.map(a => a.feature_type_id));

        } catch (err) {
          console.error('Error cargando configuración de capas:', err)
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

  const handleOpenUpload = (e: React.MouseEvent, capa: any) => {
    e.stopPropagation(); // Evita que se desmarque la capa al hacer clic en subir
    setSelectedCapaForUpload(capa);
    setIsBulkModalOpen(true);
  }

  async function guardarCambios() {
    setSaving(true)
    try {
      // Limpiamos asignaciones actuales
      await supabase.from('proyecto_capas').delete().eq('proyecto_id', proyecto.id)

      // Insertamos las nuevas
      if (asignadas.length > 0) {
        const rows = asignadas.map(capaId => ({
          proyecto_id: proyecto.id,
          feature_type_id: capaId
        }))
        const { error } = await supabase.from('proyecto_capas').insert(rows)
        if (error) throw error;
      }

      if (onSuccess) onSuccess()
      else onClose()

    } catch (err) {
      alert('Error al guardar configuración')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 text-slate-900">
        <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="p-6 border-b bg-slate-50">
            <h2 className="text-xl font-bold text-slate-800">Configurar Capas</h2>
            <p className="text-sm text-blue-600 font-medium uppercase text-[10px] tracking-wider">
              Proyecto: {proyecto?.nombre}
            </p>
          </div>

          {/* Listado */}
          <div className="p-6 overflow-y-auto space-y-3">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-blue-600" size={32} />
              </div>
            ) : (
              biblioteca.map((capa) => {
                const isSelected = asignadas.includes(capa.id)
                return (
                  <div 
                    key={capa.id}
                    className={`flex items-center justify-between p-1 pr-4 border rounded-xl transition-all ${
                      isSelected ? 'border-blue-500 bg-blue-50/50 shadow-sm' : 'border-slate-200 opacity-70'
                    }`}
                  >
                    <button
                      onClick={() => toggleCapa(capa.id)}
                      className="flex items-center gap-3 flex-1 p-3 text-left"
                    >
                      {isSelected ? (
                        <CheckCircle2 className="text-blue-600" size={20} />
                      ) : (
                        <Circle className="text-slate-300" size={20} />
                      )}
                      <div>
                        <p className={`font-bold text-sm ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>
                          {capa.nombre}
                        </p>
                        <p className="text-[9px] text-slate-400 uppercase tracking-widest font-medium">
                          {capa.campos_requeridos?.length || 0} Atributos técnicos
                        </p>
                      </div>
                    </button>

                    {/* BOTONES DE ACCIÓN */}
                    {isSelected && (
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); downloadLayerTemplate(capa.id, capa.nombre); }}
                          className="p-2 hover:bg-blue-600 hover:text-white rounded-lg text-blue-600 transition-all bg-white border border-blue-100 shadow-sm"
                          title="Descargar Plantilla CSV"
                        >
                          <Download size={16} />
                        </button>
                        <button 
                          onClick={(e) => handleOpenUpload(e, capa)}
                          className="p-2 hover:bg-green-600 hover:text-white rounded-lg text-green-600 transition-all bg-white border border-green-100 shadow-sm"
                          title="Carga Masiva"
                        >
                          <UploadCloud size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t bg-slate-50 flex gap-3">
            <Button variant="outline" className="flex-1 font-bold uppercase text-xs" onClick={onClose} disabled={saving}>
              Cerrar
            </Button>
            <Button 
              className="flex-1 bg-slate-900 hover:bg-slate-800 font-bold uppercase text-xs text-white" 
              onClick={guardarCambios} 
              disabled={saving || loading}
            >
              {saving ? <Loader2 className="animate-spin mr-2" size={14} /> : null}
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de Carga Masiva (Recibe los datos del RPC) */}
      {isBulkModalOpen && selectedCapaForUpload && (
        <BulkUploadModal
          proyectoId={proyecto.id}
          // Pasamos la capa con sus campos_requeridos para la validación inteligente
          capa={selectedCapaForUpload}
          onClose={() => setIsBulkModalOpen(false)}
          onSuccess={() => {
            setIsBulkModalOpen(false);
            if (onSuccess) onSuccess();
          }}
        />
      )}
    </>
  )
}