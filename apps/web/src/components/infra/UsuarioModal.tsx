'use client'

import { useState, useEffect, useRef } from 'react'
// CAMBIO CLAVE: Usar el cliente que soporta Cookies/SSR
import { createClient } from '@/utils/supabase/client' 
import { Button } from '@/components/ui/button'
import { Loader2, X } from 'lucide-react'

export default function UsuarioModal({ isOpen, onClose, onSuccess, usuario }: any) {
  const [loading, setLoading] = useState(false)
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [rolId, setRolId] = useState('6') // Por defecto Técnico según tus opciones (6)
  
  // Instanciamos el cliente SSR
  const supabase = createClient()
  const mountedRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true

    if (usuario) {
      setNombre(usuario.nombre || '')
      setEmail(usuario.email || '')
      setRolId(usuario.rol_id?.toString() || '6')
    } else {
      setNombre('')
      setEmail('')
      setRolId('6')
    }

    return () => {
      mountedRef.current = false
    }
  }, [usuario, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mountedRef.current) return

    setLoading(true)

    try {
      if (usuario?.id) {
        // --- ACTUALIZAR REGISTRO EXISTENTE ---
        // Esto dispara el trigger 'tr_sincronizar_rol' que creamos en la DB
        const { error } = await supabase
          .from('usuarios')
          .update({ 
            nombre, 
            rol_id: parseInt(rolId) 
          })
          .eq('id', usuario.id)

        if (error) throw error

      } else {
        // --- CREAR NUEVO USUARIO ---
        // Nota: signUp creará al usuario en auth.users y tu trigger lo insertará en public.usuarios
        const { data, error } = await supabase.auth.signUp({
          email,
          password: 'PasswordTemporal123!',
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              nombre: nombre,
              rol_id: parseInt(rolId)
            }
          }
        })

        if (error) throw error

        // Si el usuario se creó pero el rol no se asignó correctamente en la tabla public.usuarios
        if (data.user) {
           await supabase
            .from('usuarios')
            .update({ rol_id: parseInt(rolId) })
            .eq('id', data.user.id)
        }
      }

      onSuccess()
      onClose()

    } catch (err: any) {
      console.error("Error en Modal:", err)
      alert('Error: ' + (err.message || 'Error desconocido'))
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        
        {/* Header con botón de cerrar */}
        <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              {usuario ? 'Editar Miembro' : 'Nuevo Miembro'}
            </h2>
            <p className="text-xs text-slate-500 font-medium">Define los permisos de acceso</p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded-full transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Nombre */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              Nombre Completo
            </label>
            <input
              required
              placeholder="Ej: Juan Pérez"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-700 font-medium"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
            />
          </div>

          {/* Email - Deshabilitado en edición para evitar conflictos de Auth */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              Correo Electrónico
            </label>
            <input
              required
              disabled={!!usuario}
              type="email"
              placeholder="correo@empresa.com"
              className={`w-full px-4 py-2.5 border rounded-xl outline-none transition-all font-medium ${
                usuario 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' 
                : 'bg-slate-50 border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700'
              }`}
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          {/* Rol */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              Rol Asignado
            </label>
            <select
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-700 font-bold"
              value={rolId}
              onChange={e => setRolId(e.target.value)}
            >
              <option value="4">Administrador</option>
              <option value="5">Supervisor</option>
              <option value="6">Técnico de Campo</option>
            </select>
            <p className="mt-2 text-[10px] text-slate-400">
              * El cambio de rol actualizará los permisos de sesión automáticamente.
            </p>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-6">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50" 
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-200 transition-all"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={18} />
                  <span>Procesando...</span>
                </div>
              ) : (
                usuario ? 'Actualizar Miembro' : 'Crear Acceso'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}