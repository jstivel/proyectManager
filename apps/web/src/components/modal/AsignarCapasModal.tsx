'use client'

import { useState, useEffect } from 'react'
import { useProyectoCapas } from '@/hooks/useProyectoCapas'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, Circle, Download, UploadCloud, X } from 'lucide-react'
import { downloadLayerTemplate } from '@/services/templateService'
import BulkUploadModal from './BulkUploadModal'

interface AsignarCapasModalProps {
  proyecto: any
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function AsignarCapasModal({ proyecto, isOpen, onClose, onSuccess }: AsignarCapasModalProps) {
  // El hook consume get_proyecto_biblioteca() para lectura segura
  const { 
    biblioteca, 
    asignadasIds, 
    isLoading, 
    isSaving, 
    syncCapas 
  } = useProyectoCapas(proyecto?.id)
  
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [selectedCapaForUpload, setSelectedCapaForUpload] = useState<any>(null)
  const [asignadasLocal, setAsignadasLocal] = useState<string[]>([])

  // Sincroniza la selección local con lo que realmente hay en la DB al abrir/cargar
  useEffect(() => {
    if (asignadasIds) {
      setAsignadasLocal(asignadasIds)
    }
  }, [asignadasIds])

  const toggleCapa = (id: string) => {
    setAsignadasLocal(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleGuardar = async () => {
    try {
      // Esta llamada activa syncProyectoCapasAction -> RPC sync_proyecto_capas
      await syncCapas(asignadasLocal)
      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      // El error de "No tienes permisos" definido en el SQL será capturado aquí
      console.error("Error en la sincronización de capas:", err)
    }
  }

  const handleOpenUpload = (e: React.MouseEvent, capa: any) => {
    e.stopPropagation()
    setSelectedCapaForUpload(capa)
    setIsBulkModalOpen(true)
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 text-slate-900">
        <div className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh] border border-white/20 animate-in fade-in zoom-in duration-200">
          
          {/* Header con información del proyecto */}
          <div className="p-8 border-b bg-slate-50/50 relative">
            <button 
              onClick={onClose} 
              className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Configuración Técnica</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 leading-none tracking-tight">Capas del Proyecto</h2>
            <p className="text-xs text-blue-600 font-bold mt-2 uppercase tracking-wide">
              {proyecto?.nombre}
            </p>
          </div>

          {/* Listado de Biblioteca (Filtrado por Organización en SQL) */}
          <div className="p-8 overflow-y-auto space-y-3">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="animate-spin text-blue-600" size={32} />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                  Cargando biblioteca de organización...
                </span>
              </div>
            ) : biblioteca.length > 0 ? (
              biblioteca.map((capa: any) => {
                const isSelected = asignadasLocal.includes(capa.id)
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

                    {/* Acciones para capas habilitadas */}
                    {isSelected && (
                      <div className="flex gap-2 animate-in slide-in-from-right-2 duration-300">
                        <button 
                          onClick={(e) => { e.stopPropagation(); downloadLayerTemplate(capa.id, capa.nombre); }} 
                          className="w-10 h-10 flex items-center justify-center hover:bg-blue-600 hover:text-white rounded-xl text-blue-600 border border-blue-100 bg-white shadow-sm active:scale-90 transition-all"
                          title="Descargar Plantilla CSV"
                        >
                          <Download size={18} />
                        </button>
                        <button 
                          onClick={(e) => handleOpenUpload(e, capa)} 
                          className="w-10 h-10 flex items-center justify-center hover:bg-emerald-600 hover:text-white rounded-xl text-emerald-600 border border-emerald-100 bg-white shadow-sm active:scale-90 transition-all"
                          title="Carga Masiva"
                        >
                          <UploadCloud size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-[2rem]">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  No se encontraron tipos de capas para esta organización
                </p>
              </div>
            )}
          </div>

          {/* Footer de Acciones (Protección de Rol integrada en isSaving) */}
          <div className="p-8 border-t bg-slate-50/80 flex gap-4">
            <Button 
              variant="ghost" 
              className="flex-1 font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-slate-600" 
              onClick={onClose} 
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button 
              className="flex-1 bg-slate-900 hover:bg-blue-600 font-black uppercase text-[10px] tracking-widest text-white py-7 rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-[0.98]" 
              onClick={handleGuardar} 
              disabled={isSaving || isLoading}
            >
              {isSaving && <Loader2 className="animate-spin mr-3" size={16} />}
              {isSaving ? 'Guardando...' : 'Actualizar Configuración'}
            </Button>
          </div>
        </div>
      </div>

      {/* Modal Secundario para Carga de Datos */}
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