'use client'

import { useState } from 'react'
import { X, ShieldAlert, Mail, Loader2, Save, Power } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { adminResetUserPassword, adminUpdateOrgStatus } from '@/app/actions/usuarios'

interface AdminOrgModalProps {
  isOpen: boolean
  onClose: () => void
  org: any
  onSuccess: () => void
}

export default function AdminOrgModal({ isOpen, onClose, org, onSuccess }: AdminOrgModalProps) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(org?.activo ?? false)

  if (!isOpen || !org) return null

  /**
   * Acción: Resetear Contraseña del PM
   * Utiliza la Server Action para interactuar con Supabase Auth Admin API
   */
  const handleResetPassword = async () => {
    if (!org.pm_email) return alert('Esta organización no tiene un PM asignado.')
    
    setLoading(true)
    try {
      const result = await adminResetUserPassword(org.pm_email)
      if (result.success) {
        alert(`Se ha enviado un correo de recuperación a: ${org.pm_email}`)
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      alert('Error inesperado al intentar resetear la contraseña.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Acción: Actualizar Estado de la Organización
   * Modifica la disponibilidad del acceso para todos los miembros de la organización
   */
  const handleUpdateStatus = async () => {
    setLoading(true)
    try {
      const result = await adminUpdateOrgStatus(org.id, { activo: status })
      if (result.success) {
        onSuccess()
        onClose()
      } else {
        alert('Error al actualizar: ' + result.error)
      }
    } catch (error) {
      alert('Error de conexión al intentar actualizar el estado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200">
        
        {/* Header con Estética Dashboard */}
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Panel de Control</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 leading-none tracking-tight">Administrar Cliente</h2>
            <p className="text-xs text-slate-500 mt-2 font-semibold uppercase tracking-wider">{org.nombre}</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 hover:bg-slate-200/50 rounded-2xl transition-all group active:scale-90"
          >
            <X size={20} className="text-slate-400 group-hover:text-slate-900" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          
          {/* Sección 1: Interruptor de Estado */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-black text-[10px] uppercase tracking-[0.15em]">
              <Power size={14} className="text-blue-600" />
              Estado del Acceso Global
            </div>
            <div className="flex items-center justify-between p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 transition-all">
              <div className="flex flex-col">
                <span className="text-sm font-black text-slate-700">
                  Infraestructura {status ? 'Activada' : 'Suspendida'}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">
                  {status ? 'Acceso permitido a técnicos' : 'Bloqueo total de plataforma'}
                </span>
              </div>
              <button 
                onClick={() => setStatus(!status)}
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all shadow-inner ${
                  status ? 'bg-green-500 shadow-green-200' : 'bg-slate-300'
                }`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                  status ? 'translate-x-8' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>

          {/* Sección 2: Gestión del PM */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-black text-[10px] uppercase tracking-[0.15em]">
              <ShieldAlert size={14} className="text-amber-500" />
              Seguridad del Administrador
            </div>
            <div className="p-6 bg-amber-50 rounded-[1.5rem] border border-amber-100 space-y-4">
              <p className="text-xs text-amber-700 font-bold leading-relaxed">
                ¿El Project Manager perdió el acceso? Esto enviará un token de recuperación oficial a su bandeja de entrada.
              </p>
              <Button 
                onClick={handleResetPassword}
                disabled={loading || !org.pm_email}
                variant="outline"
                className="w-full bg-white border-amber-200 text-amber-700 hover:bg-amber-100 font-black py-6 rounded-xl gap-3 text-[10px] uppercase tracking-widest transition-all shadow-sm"
              >
                {loading ? <Loader2 className="animate-spin" size={14} /> : <Mail size={14} />}
                Resetear Password PM
              </Button>
              {org.pm_email && (
                <p className="text-[9px] text-center text-amber-600/60 font-black uppercase tracking-tighter">
                  Destino: {org.pm_email}
                </p>
              )}
            </div>
          </div>

        </div>

        {/* Footer con Botones de Acción */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4">
          <Button 
            variant="ghost" 
            onClick={onClose} 
            className="flex-1 font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 py-7 rounded-2xl transition-all"
          >
            Descartar
          </Button>
          <Button 
            onClick={handleUpdateStatus}
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest py-7 rounded-2xl shadow-xl shadow-blue-100 transition-all active:scale-95 gap-3"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            Aplicar Cambios
          </Button>
        </div>
      </div>
    </div>
  )
}