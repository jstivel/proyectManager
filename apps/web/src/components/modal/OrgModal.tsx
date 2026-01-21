'use client'

import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { usePlanes } from '@/hooks/usePlanes'
import { adminCreateOrganization, adminUpdateOrganization } from '@/app/actions/organizaciones' 
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Loader2, 
  Building2 as BuildingIcon, 
  UserPlus as UserIcon, 
  Mail as MailIcon, 
  Fingerprint as NitIcon, 
  Crown as PlanIcon,
  Activity as StatusIcon
} from 'lucide-react'
import { toast } from 'sonner'

interface OrgModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  organizacion?: any;
}

export default function OrgModal({ isOpen, onClose, onSuccess, organizacion }: OrgModalProps) {
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()
  
  // Consumo vía RPC de los planes
  const { data: planes, isLoading: loadingPlanes } = usePlanes()
  
  const [formData, setFormData] = useState({
    nombre: '',
    nit: '',
    pmNombre: '',
    pmEmail: '',
    plan_id: 1,
    activo: true
  })

  // Sincronizar datos al abrir/cerrar o cambiar organización
  useEffect(() => {
    if (isOpen) {
      if (organizacion) {
        setFormData({
          nombre: organizacion.nombre || '',
          nit: organizacion.nit || '',
          pmNombre: organizacion.pm_nombre || '', 
          pmEmail: organizacion.pm_email || '',
          plan_id: organizacion.plan_id || 1,
          activo: organizacion.activo ?? true
        })
      } else {
        setFormData({ 
          nombre: '', nit: '', pmNombre: '', pmEmail: '', plan_id: 1, activo: true 
        })
      }
    }
  }, [isOpen, organizacion])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (loading) return
    
    setLoading(true)
    
    // Generación de slug limpia
    const isEditing = !!organizacion?.id
    const slug = formData.nombre
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')

    try {
      // Llamada al Server Action (que invoca el RPC seguro)
      const result = isEditing 
        ? await adminUpdateOrganization({ id: organizacion.id, ...formData, slug })
        : await adminCreateOrganization({ ...formData, slug });

      if (!result.success) throw new Error(result.error);
      
      toast.success(isEditing ? 'Organización actualizada' : 'Organización creada con éxito');
      
      // Invalidamos la cache y esperamos el refresh
      await queryClient.invalidateQueries({ queryKey: ['organizaciones_dashboard'] });
      
      if (onSuccess) onSuccess();
      onClose(); // Cerramos el modal
      
    } catch (error: any) {
      console.error("Error en submit modal:", error)
      toast.error(error.message || 'Ocurrió un error inesperado')
    } finally {
      setLoading(false)
    }
  }

  // Manejador de cambio de visibilidad seguro para Radix
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
        
        {/* Header Decorativo */}
        <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 relative z-10 shadow-lg">
            <BuildingIcon size={24} className="text-white" />
          </div>
          
          <DialogHeader className="relative z-10 text-left">
            <DialogTitle className="text-2xl font-black tracking-tight text-white uppercase leading-none">
              {organizacion ? 'Editar Organización' : 'Nueva Organización'}
            </DialogTitle>
            <DialogDescription className="text-slate-400 font-medium mt-2">
              Gestión centralizada mediante procedimientos almacenados (RPC).
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-white max-h-[75vh] overflow-y-auto custom-scrollbar">
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                  <BuildingIcon size={12} className="text-blue-500" /> Empresa
                </label>
                <Input 
                  value={formData.nombre}
                  onChange={e => setFormData({...formData, nombre: e.target.value})}
                  required disabled={loading}
                  className="rounded-2xl border-slate-100 bg-slate-50 py-7 font-bold text-slate-700 focus:ring-blue-500/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                  <NitIcon size={12} className="text-blue-500" /> NIT / ID Fiscal
                </label>
                <Input 
                  value={formData.nit}
                  onChange={e => setFormData({...formData, nit: e.target.value})}
                  required disabled={loading}
                  className="rounded-2xl border-slate-100 bg-slate-50 py-7 font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                  <PlanIcon size={12} className="text-amber-500" /> Plan Asignado
                </label>
                <div className="relative">
                  <select 
                    value={formData.plan_id}
                    onChange={e => setFormData({...formData, plan_id: Number(e.target.value)})}
                    disabled={loading || loadingPlanes}
                    className="w-full rounded-2xl border-slate-100 bg-slate-50 p-4 font-bold text-slate-700 outline-none border cursor-pointer appearance-none"
                  >
                    {loadingPlanes ? (
                      <option>Cargando planes...</option>
                    ) : (
                      planes?.map((plan: any) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.nombre} ({plan.max_usuarios} IDs)
                        </option>
                      ))
                    )}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                    {loadingPlanes ? <Loader2 className="animate-spin" size={14}/> : '▼'}
                  </div>
                </div>
              </div>

              {organizacion && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                    <StatusIcon size={12} className={formData.activo ? "text-emerald-500" : "text-red-500"} /> Estado Entidad
                  </label>
                  <select 
                    value={formData.activo ? 'true' : 'false'}
                    onChange={e => setFormData({...formData, activo: e.target.value === 'true'})}
                    className="w-full rounded-2xl border-slate-100 bg-slate-50 p-4 font-bold text-slate-700 outline-none border"
                  >
                    <option value="true">Activa</option>
                    <option value="false">Inactiva</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {!organizacion && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="py-2 flex items-center gap-4">
                <div className="h-px bg-slate-100 flex-1"></div>
                <span className="text-[10px] font-black text-slate-300 uppercase px-2 tracking-widest">Project Manager</span>
                <div className="h-px bg-slate-100 flex-1"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative group">
                   <UserIcon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500" />
                   <Input 
                    value={formData.pmNombre}
                    onChange={e => setFormData({...formData, pmNombre: e.target.value})}
                    placeholder="Nombre Completo" required={!organizacion} disabled={loading}
                    className="rounded-2xl border-slate-100 bg-slate-50 py-7 pl-11 font-bold"
                  />
                </div>
                <div className="relative group">
                  <MailIcon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500" />
                  <Input 
                    value={formData.pmEmail}
                    onChange={e => setFormData({...formData, pmEmail: e.target.value})}
                    type="email" placeholder="Email PM" required={!organizacion} disabled={loading}
                    className="rounded-2xl border-slate-100 bg-slate-50 py-7 pl-11 font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-slate-50">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onClose} 
              disabled={loading} 
              className="flex-1 rounded-2xl py-7 font-bold text-slate-400 uppercase text-[11px] hover:bg-slate-50"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || loadingPlanes} 
              className="flex-[2] bg-slate-900 hover:bg-blue-600 text-white rounded-2xl py-7 font-black shadow-xl transition-all"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={18} />
                  <span>PROCESANDO...</span>
                </div>
              ) : (
                <span className="tracking-widest">{organizacion ? 'GUARDAR CAMBIOS' : 'CREAR E INVITAR'}</span>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}