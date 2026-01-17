'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, X, UserCog } from 'lucide-react'
// Usamos nuestro hook centralizado
import { useUsuarios } from '@/hooks/useUsuarios'

interface UsuarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void; // Opcional ahora que React Query maneja el cache
  usuario?: any; // Si existe, entra en modo edición
}

export default function UsuarioModal({ isOpen, onClose, usuario }: UsuarioModalProps) {
  // 1. Hook de lógica
  const { saveMutation } = useUsuarios()
  
  // 2. Estados locales para el formulario
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [rolId, setRolId] = useState('6') // 6: Técnico por defecto

  // Sincronización de estado al abrir/cerrar
  useEffect(() => {
    if (isOpen) {
      if (usuario) {
        setNombre(usuario.nombre || '')
        setEmail(usuario.email || '')
        setRolId(usuario.rol_id?.toString() || '6')
      } else {
        setNombre('')
        setEmail('')
        setRolId('6')
      }
    }
  }, [usuario, isOpen])

  if (!isOpen) return null

  /**
   * Maneja el envío usando la mutación del hook.
   * La mutación ya se encarga de:
   * - Llamar al Server Action (adminCreateUser)
   * - Mostrar Toasts (Sonner)
   * - Invalidar la caché para refrescar la tabla
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    saveMutation.mutate({
      id: usuario?.id, // Si existe, el hook sabe que es edición
      nombre,
      email,
      rol_id: parseInt(rolId),
      organizacion_id: usuario?.organizacion_id // Mantener la misma org en edición
    }, {
      onSuccess: () => {
        onClose() // Cerramos solo si la operación fue exitosa
      }
    })
  }

  const loading = saveMutation.isPending

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
        
        {/* Encabezado */}
        <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              {usuario ? 'Editar Miembro' : 'Nuevo Miembro'}
            </h2>
            <p className="text-xs text-slate-500 font-medium">Define el nivel de acceso al sistema</p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded-full transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cuerpo del Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Campo: Nombre */}
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

          {/* Campo: Email (Solo lectura en edición) */}
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

          {/* Campo: Selección de Rol */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              Nivel de Permisos
            </label>
            <div className="relative">
              <select
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-700 font-bold appearance-none cursor-pointer"
                value={rolId}
                onChange={e => setRolId(e.target.value)}
              >
                <option value="4">👑 Administrador Global</option>
                <option value="7">💼 Project Manager (PM)</option>
                <option value="5">🛡️ Supervisor de Proyectos</option>
                <option value="6">👷 Técnico de Campo</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <UserCog size={18} />
              </div>
            </div>
            <p className="mt-2 text-[10px] text-slate-400 leading-relaxed italic">
              * El perfil seleccionado determinará las herramientas visibles para el usuario.
            </p>
          </div>

          {/* Botones de Acción */}
          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 font-bold" 
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-[1.5] bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-100 transition-all font-bold"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2 justify-center">
                  <Loader2 className="animate-spin" size={18} />
                  <span>Procesando...</span>
                </div>
              ) : (
                usuario ? 'Actualizar Miembro' : 'Crear e Invitar'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}