'use client'

import { useEffect, useState } from 'react'
import { useProyectos } from '@/hooks/useProyectos'
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select'
import { Loader2, MapPin, Building2, UserCircle2, Save, Globe } from 'lucide-react'
import { toast } from 'sonner'

// Listado de regiones/departamentos de Colombia para el select
const REGIONES_COLOMBIA = [
  "Amazonas", "Antioquia", "Arauca", "Atlántico", "Bogotá D.C.", "Bolívar", "Boyacá", 
  "Caldas", "Caquetá", "Casanare", "Cauca", "Cesar", "Chocó", "Córdoba", "Cundinamarca", 
  "Guainía", "Guaviare", "Huila", "La Guajira", "Magdalena", "Meta", "Nariño", 
  "Norte de Santander", "Putumayo", "Quindío", "Risaralda", "San Andrés", "Santander", 
  "Sucre", "Tolima", "Valle del Cauca", "Vaupés", "Vichada"
].sort()

interface ProyectoModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  proyecto?: any 
  supervisores: any[]
}

export default function ProyectoModal({ 
  isOpen, 
  onClose, 
  proyecto, 
  supervisores, 
  onSuccess 
}: ProyectoModalProps) {
  
  const { saveProyecto, isSaving } = useProyectos()
  
  const [formData, setFormData] = useState({
    nombre: '',
    entidad: '',
    region: '',
    supervisor_id: '',
    fase_actual: 'replanteo'
  })

  // Sincronizar estado cuando se abre el modal o cambia el proyecto seleccionado
  useEffect(() => {
    if (isOpen) {
      if (proyecto) {
        setFormData({
          nombre: proyecto.nombre || '',
          entidad: proyecto.entidad || '',
          region: proyecto.region || '',
          supervisor_id: proyecto.supervisor_id || '',
          fase_actual: proyecto.fase_actual || 'replanteo'
        })
      } else {
        setFormData({ 
          nombre: '', 
          entidad: '', 
          region: '', 
          supervisor_id: '', 
          fase_actual: 'replanteo' 
        })
      }
    }
  }, [proyecto, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nombre || !formData.supervisor_id || !formData.region) {
      return toast.error("Nombre, Región y Supervisor son obligatorios")
    }

    try {
      await saveProyecto({ ...formData, id: proyecto?.id })
      toast.success(proyecto ? "Proyecto actualizado" : "Proyecto creado con éxito")
      if (onSuccess) onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.message || "Error al procesar la solicitud")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
        {/* Decoración visual */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none"></div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-8">
            <DialogHeader className="p-0 mb-8">
              <DialogTitle className="text-3xl font-black uppercase tracking-tighter italic text-slate-900">
                {proyecto ? 'Editar' : 'Nuevo'} <span className="text-blue-600">Proyecto</span>
              </DialogTitle>
              <DialogDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Gestión de infraestructura y asignación de personal
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              {/* Campo Nombre */}
              <div className="space-y-2">
                <Label className="ml-1">Nombre del Proyecto</Label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input 
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    placeholder="Ej: Red Dorsal Tramo 04" 
                    className="pl-12 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Campo Entidad */}
                <div className="space-y-2">
                  <Label className="ml-1">Entidad / Cliente</Label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <Input 
                      value={formData.entidad}
                      onChange={(e) => setFormData({...formData, entidad: e.target.value})}
                      placeholder="Empresa Contratante" 
                      className="pl-12 font-bold"
                    />
                  </div>
                </div>

                {/* Campo Región (Select de Ciudades/Departamentos) */}
                <div className="space-y-2">
                  <Label className="ml-1">Región / Departamento</Label>
                  <Select 
                    value={formData.region} 
                    onValueChange={(val) => setFormData({...formData, region: val})}
                  >
                    <SelectTrigger className="font-bold">
                      <div className="flex items-center gap-2 truncate">
                        <Globe size={16} className="text-blue-500" />
                        <SelectValue placeholder="Seleccionar" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {REGIONES_COLOMBIA.map((reg) => (
                        <SelectItem key={reg} value={reg} className="font-bold">
                          {reg}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Campo Supervisor (Select Dinámico) */}
              <div className="space-y-2">
                <Label className="ml-1">Supervisor Responsable</Label>
                <Select 
                  value={formData.supervisor_id} 
                  onValueChange={(val) => setFormData({...formData, supervisor_id: val})}
                >
                  <SelectTrigger className="font-bold h-16">
                    <div className="flex items-center gap-3 text-left">
                      <UserCircle2 size={24} className="text-blue-500 shrink-0" />
                      <div className="flex flex-col">
                        <SelectValue placeholder="Seleccionar un supervisor de la lista" />
                      </div>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="max-h-[250px] rounded-2xl shadow-2xl">
                    {supervisores && supervisores.length > 0 ? (
                      supervisores.map((s) => (
                        <SelectItem key={s.id} value={s.id} className="py-3">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900">{s.nombre}</span>
                            <span className="text-[10px] text-slate-400 font-medium lowercase italic">
                              {s.email}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-400 font-bold uppercase tracking-widest">
                        No hay supervisores disponibles
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="bg-slate-50 p-8 pt-6 border-t border-slate-100">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onClose}
              className="rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSaving}
              className="bg-slate-900 hover:bg-blue-600 text-white rounded-2xl px-10 py-6 font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all gap-2"
            >
              {isSaving ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Save size={16} />
              )}
              {proyecto ? 'Guardar Cambios' : 'Crear Proyecto Nuevo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}