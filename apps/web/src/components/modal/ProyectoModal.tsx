'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { X, Briefcase, MapPin, Building2, UserCircle2, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

interface ProyectoModalProps {
  proyecto?: any; 
  isOpen: boolean;
  onClose: () => void;
}

export default function ProyectoModal({ proyecto, isOpen, onClose }: ProyectoModalProps) {
  const [loading, setLoading] = useState(false)
  const [userRol, setUserRol] = useState<number | null>(null)
  const [supervisores, setSupervisores] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    nombre: '',
    entidad: '',
    region: '',
    supervisor_id: '',
    estado: 'activo'
  })

  const supabase = createClient()
  const queryClient = useQueryClient()

  useEffect(() => {
    async function loadContext() {
      if (!isOpen) return
      
      // Obtener el rol del usuario actual
      const { data: { user } } = await supabase.auth.getUser()
      const { data: perfil } = await supabase.from('perfiles').select('rol_id').eq('id', user?.id).single()
      setUserRol(perfil?.rol_id || null)

      // Cargar supervisores disponibles
      const { data: sups } = await supabase.from('perfiles').select('id, nombre').in('rol_id', [2, 3, 7]).order('nombre')
      if (sups) setSupervisores(sups)
    }
    loadContext()
  }, [isOpen, supabase])

  useEffect(() => {
    if (isOpen && proyecto) {
      setFormData({
        nombre: proyecto.nombre || '',
        entidad: proyecto.entidad || '',
        region: proyecto.region || '',
        supervisor_id: proyecto.supervisor_id || '',
        estado: proyecto.estado || 'activo'
      })
    } else {
      setFormData({ nombre: '', entidad: '', region: '', supervisor_id: '', estado: 'activo' })
    }
  }, [proyecto, isOpen])

  if (!isOpen) return null

  // Bloqueo de creación para SuperAdmin
  const isCreatingAsAdmin = !proyecto && userRol === 4

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isCreatingAsAdmin) return

    setLoading(true)
    try {
      const isEditing = !!proyecto?.id
      const payload = { ...formData, supervisor_id: formData.supervisor_id || null }

      const { error } = isEditing 
        ? await supabase.from('proyectos').update(payload).eq('id', proyecto.id)
        : await supabase.from('proyectos').insert([payload])

      if (error) throw error

      toast.success(isEditing ? 'Cambios guardados' : 'Proyecto lanzado')
      queryClient.invalidateQueries({ queryKey: ['proyectos'] })
      onClose()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Briefcase size={20} />
            </div>
            <h2 className="text-xl font-black text-slate-900 uppercase">{proyecto ? 'Editar Proyecto' : 'Nuevo Proyecto'}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400"><X size={20} /></button>
        </div>
        
        {isCreatingAsAdmin ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-500">
              <AlertCircle size={32} />
            </div>
            <p className="text-slate-600 font-bold">Como Superusuario no puedes crear proyectos.</p>
            <p className="text-sm text-slate-400">Esta función está reservada para los Project Managers de cada organización.</p>
            <Button onClick={onClose} className="w-full mt-4 bg-slate-100 text-slate-900 hover:bg-slate-200 rounded-2xl py-6">Entendido</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">Nombre</label>
              <input required className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">Entidad</label>
              <input className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" value={formData.entidad} onChange={e => setFormData({...formData, entidad: e.target.value})} /></div>
              <div className="space-y-1.5"><label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">Región</label>
              <input className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} /></div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">Supervisor</label>
              <select className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold appearance-none" value={formData.supervisor_id} onChange={e => setFormData({...formData, supervisor_id: e.target.value})}>
                <option value="">Sin supervisor</option>
                {supervisores.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </div>

            <div className="flex gap-3 pt-6">
              <Button type="button" variant="ghost" className="flex-1 py-7 rounded-2xl font-bold" onClick={onClose}>Cancelar</Button>
              <Button type="submit" className="flex-[1.5] bg-slate-900 hover:bg-blue-600 text-white font-black py-7 rounded-2xl" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" size={20} /> : <span className="uppercase text-[11px] tracking-widest">{proyecto ? 'Actualizar' : 'Crear'}</span>}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}