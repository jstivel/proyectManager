'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export default function UsuarioModal({ isOpen, onClose, onSuccess, usuario }: any) {
  const [loading, setLoading] = useState(false)
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [rolId, setRolId] = useState('10') // Por defecto Técnico

  const mountedRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true

    if (usuario) {
      setNombre(usuario.nombre || '')
      setEmail(usuario.email || '')
      setRolId(usuario.rol_id?.toString() || '10')
    } else {
      setNombre('')
      setEmail('')
      setRolId('10')
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
        // ACTUALIZAR
        const { error } = await supabase
          .from('usuarios')
          .update({ nombre, rol_id: parseInt(rolId) })
          .eq('id', usuario.id)

        if (error) throw error

      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: 'PasswordTemporal123!',
          options: {
            data: {
              nombre: nombre,
              rol_id: parseInt(rolId)
            }
          }
        })

        if (error) throw error

        // Forzar rol si es diferente del default
        if (data.user && parseInt(rolId) !== 10) {
          await supabase
            .from('usuarios')
            .update({ rol_id: parseInt(rolId) })
            .eq('id', data.user.id)
        }
      }

      onSuccess()
      onClose()

    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="p-6 border-b bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">
            {usuario ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Nombre Completo
            </label>
            <input
              required
              className="w-full p-2 border rounded-md"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Correo Electrónico
            </label>
            <input
              required
              type="email"
              className="w-full p-2 border rounded-md"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Rol en el Sistema
            </label>
            <select
              className="w-full p-2 border rounded-md bg-white"
              value={rolId}
              onChange={e => setRolId(e.target.value)}
            >
              <option value="4">Administrador</option>
              <option value="5">Supervisor</option>
              <option value="6">Técnico de Campo</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Guardar Usuario'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
