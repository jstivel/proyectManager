'use client'

import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { adminCreateOrganization } from '@/app/actions/organizaciones' // Asegúrate que la ruta sea correcta
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Building2, UserPlus, Mail, Fingerprint, Save } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'

interface OrgModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void; // Opcional ahora que usamos QueryClient
  organizacion?: any;
}

export default function OrgModal({ isOpen, onClose, onSuccess, organizacion }: OrgModalProps) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const queryClient = useQueryClient()
  
  const [formData, setFormData] = useState({
    nombre: '',
    nit: '',
    pmNombre: '',
    pmEmail: ''
  })

  // Sincronizar datos al abrir/editar
  useEffect(() => {
    if (isOpen && organizacion) {
      setFormData({
        nombre: organizacion.nombre || '',
        nit: organizacion.nit || '',
        pmNombre: organizacion.pm_nombre || '', 
        pmEmail: organizacion.pm_email || ''
      })
    } else {
      setFormData({ nombre: '', nit: '', pmNombre: '', pmEmail: '' })
    }
  }, [isOpen, organizacion])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    
    const isEditing = !!organizacion?.id

    // Generación de SLUG profesional
    const slug = formData.nombre
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')

    try {
      if (isEditing) {
        // Actualización directa de la organización
        const { error } = await supabase
          .from('organizaciones')
          .update({ 
            nombre: formData.nombre, 
            nit: formData.nit,
            slug: slug
          })
          .eq('id', organizacion.id)

        if (error) throw error
        toast.success('Organización actualizada correctamente')
      } else {
        // Creación mediante Server Action (Maneja Auth + DB)
        const result = await adminCreateOrganization({
          nombre: formData.nombre,
          nit: formData.nit,
          slug,
          pmNombre: formData.pmNombre,
          pmEmail: formData.pmEmail
        })

        if (result.error) throw new Error(result.error)
        toast.success('Organización creada e invitación enviada al PM')
      }

      // INVALIDACIÓN DE CACHÉ: Esto refresca la página de organizaciones automáticamente
      queryClient.invalidateQueries({ queryKey: ['organizaciones'] })
      
      if (onSuccess) onSuccess()
      onClose()
      
    } catch (error: any) {
      console.error('Error:', error.message)
      toast.error('Error al procesar: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        
        {/* Banner Superior */}
        <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 relative z-10 shadow-lg shadow-blue-500/20">
            <Building2 size={24} className="text-white" />
          </div>
          
          <DialogHeader className="relative z-10 text-left">
            <DialogTitle className="text-2xl font-black tracking-tight text-white leading-none uppercase">
              {organizacion ? 'Editar Organización' : 'Nueva Organización'}
            </DialogTitle>
            <DialogDescription className="text-slate-400 font-medium mt-2">
              {organizacion 
                ? 'Actualiza los datos fiscales y el nombre corporativo de la entidad.' 
                : 'Configura el entorno corporativo y envía la invitación de acceso al PM.'}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-white">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                <Building2 size={12} className="text-blue-500" /> Nombre de la Empresa
              </label>
              <Input 
                value={formData.nombre}
                onChange={e => setFormData({...formData, nombre: e.target.value})}
                placeholder="Ej: Constructora Alfa S.A." 
                required 
                disabled={loading}
                className="rounded-2xl border-slate-100 bg-slate-50 py-7 font-bold text-slate-700 focus:ring-4 focus:ring-blue-50 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                <Fingerprint size={12} className="text-blue-500" /> NIT / Identificación Fiscal
              </label>
              <Input 
                value={formData.nit}
                onChange={e => setFormData({...formData, nit: e.target.value})}
                placeholder="900.123.456-1" 
                required 
                disabled={loading}
                className="rounded-2xl border-slate-100 bg-slate-50 py-7 font-mono font-bold focus:ring-4 focus:ring-blue-50 transition-all"
              />
            </div>
          </div>

          {!organizacion && (
            <>
              <div className="py-2 flex items-center gap-4">
                <div className="h-px bg-slate-100 flex-1"></div>
                <span className="text-[10px] font-black text-slate-300 uppercase px-2 tracking-widest">Datos del Project Manager</span>
                <div className="h-px bg-slate-100 flex-1"></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre PM</label>
                  <Input 
                    value={formData.pmNombre}
                    onChange={e => setFormData({...formData, pmNombre: e.target.value})}
                    placeholder="Nombre completo" 
                    required={!organizacion}
                    className="rounded-2xl border-slate-100 bg-slate-50 py-7 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                    <Mail size={12} className="text-blue-500" /> Email PM
                  </label>
                  <Input 
                    value={formData.pmEmail}
                    onChange={e => setFormData({...formData, pmEmail: e.target.value})}
                    type="email"
                    placeholder="pm@empresa.com" 
                    required={!organizacion}
                    className="rounded-2xl border-slate-100 bg-slate-50 py-7 font-bold"
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-2xl py-7 font-bold text-slate-400 hover:bg-slate-50 uppercase text-[11px] tracking-widest"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="flex-[2] bg-slate-900 hover:bg-blue-600 text-white rounded-2xl py-7 font-black shadow-xl transition-all active:scale-[0.98]"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={18} />
                  <span className="uppercase text-[11px] tracking-widest">Procesando...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {organizacion ? <Save size={18} /> : <UserPlus size={18} />}
                  <span className="uppercase text-[11px] tracking-[0.2em]">
                    {organizacion ? 'Guardar Cambios' : 'Crear e Invitar PM'}
                  </span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}