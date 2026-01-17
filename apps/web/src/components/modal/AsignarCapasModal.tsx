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
          /**
           * 1. LLAMADA AL PROXY (RPC): Traemos el esquema técnico de todas las capas.
           * El RPC garantiza que solo vemos capas habilitadas para nuestra organización.
           */
          const { data: esquemaData, error: schemaError } = await supabase
            .rpc('get_infra_schema_dictionary');

          if (schemaError) throw schemaError;

          /**
           * 2. Traemos las capas ya asignadas al proyecto actual.
           * Nota: Esta consulta se mantiene simple, pero la persistencia (save) será por RPC.
           */
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
  }, [isOpen, proyecto?.id, supabase])

  const toggleCapa = (id: string) => {
    setAsignadas(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleOpenUpload = (e: React.MouseEvent, capa: any) => {
    e.stopPropagation(); 
    setSelectedCapaForUpload(capa);
    setIsBulkModalOpen(true);
  }

  /**
   * REFACTORIZACIÓN RPC:
   * En lugar de hacer DELETE e INSERT manuales (propenso a errores de carrera),
   * llamamos a una función atómica que sincroniza las capas en una sola transacción.
   */
  async function guardarCambios() {
    setSaving(true)
    try {
      const { error } = await supabase.rpc('sync_proyecto_capas', {
        p_proyecto_id: proyecto.id,
        p_feature_type_ids: asignadas
      });

      if (error) throw error;

      if (onSuccess) onSuccess()
      else onClose()

    } catch (err: any) {
      console.error('Error al guardar:', err.message)
      alert('Error al guardar configuración: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 text-slate-900">
        <div className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh] border border-white/20 animate-in fade-in zoom-in duration-200">
          
          {/* Header con Estilo Pro */}
          <div className="p-8 border-b bg-slate-50/50 relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Configuración de Red</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 leading-none tracking-tight">Habilitar Capas</h2>
            <p className="text-xs text-blue-600 font-bold mt-2 uppercase tracking-wide">
              Proyecto: {proyecto?.nombre}
            </p>
          </div>

          {/* Listado de Biblioteca Técnica */}
          <div className="p-8 overflow-y-auto space-y-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="animate-spin text-blue-600" size={32} />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargando Diccionario...</span>
              </div>
            ) : (
              biblioteca.map((capa) => {
                const isSelected = asignadas.includes(capa.id)
                return (
                  <div 
                    key={capa.id}
                    className={`flex items-center justify-between p-2 pr-5 border-2 rounded-[1.25rem] transition-all duration-300 ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50/30 shadow-md shadow-blue-100' 
                        : 'border-slate-100 opacity-60 hover:opacity-100 hover:border-slate-200'
                    }`}
                  >
                    <button
                      onClick={() => toggleCapa(capa.id)}
                      className="flex items-center gap-4 flex-1 p-3 text-left group"
                    >
                      <div className={`transition-transform duration-200 ${isSelected ? 'scale-110' : 'group-hover:scale-110'}`}>
                        {isSelected ? (
                          <CheckCircle2 className="text-blue-600" size={24} />
                        ) : (
                          <Circle className="text-slate-200" size={24} />
                        )}
                      </div>
                      <div>
                        <p className={`font-black text-sm uppercase tracking-tight ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>
                          {capa.nombre}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 bg-white border border-slate-100 rounded-md text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                            {capa.campos_requeridos?.length || 0} Atributos
                          </span>
                        </div>
                      </div>
                    </button>

                    {/* BOTONES DE ACCIÓN DINÁMICOS */}
                    {isSelected && (
                      <div className="flex gap-2 animate-in slide-in-from-right-2 duration-300">
                        <button 
                          onClick={(e) => { e.stopPropagation(); downloadLayerTemplate(capa.id, capa.nombre); }}
                          className="w-10 h-10 flex items-center justify-center hover:bg-blue-600 hover:text-white rounded-xl text-blue-600 transition-all bg-white border border-blue-100 shadow-sm active:scale-90"
                          title="Descargar Plantilla CSV"
                        >
                          <Download size={18} />
                        </button>
                        <button 
                          onClick={(e) => handleOpenUpload(e, capa)}
                          className="w-10 h-10 flex items-center justify-center hover:bg-emerald-600 hover:text-white rounded-xl text-emerald-600 transition-all bg-white border border-emerald-100 shadow-sm active:scale-90"
                          title="Carga Masiva"
                        >
                          <UploadCloud size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Footer con Acciones de Guardado */}
          <div className="p-8 border-t bg-slate-50/80 flex gap-4">
            <Button 
              variant="ghost" 
              className="flex-1 font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-slate-600" 
              onClick={onClose} 
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button 
              className="flex-1 bg-slate-900 hover:bg-blue-600 font-black uppercase text-[10px] tracking-widest text-white py-7 rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-[0.98]" 
              onClick={guardarCambios} 
              disabled={saving || loading}
            >
              {saving ? <Loader2 className="animate-spin mr-3" size={16} /> : null}
              {saving ? 'Sincronizando...' : 'Guardar Configuración'}
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de Carga Masiva (Recibe los datos validados del RPC) */}
      {isBulkModalOpen && selectedCapaForUpload && (
        <BulkUploadModal
          proyectoId={proyecto.id}
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