'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { UserPlus, Edit, Trash2, ShieldCheck, UserCog, HardHat } from 'lucide-react'
import UsuarioModal from '@/components/infra/UsuarioModal'

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)

  const mountedRef = useRef(false)

  const fetchUsuarios = useCallback(async () => {
    if (!mountedRef.current) return
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select(`*, roles (nombre)`)
        .order('nombre')

      if (error) throw error
      if (!mountedRef.current) return

      setUsuarios(data || [])

    } catch (error) {
      console.error('Error cargando usuarios:', error)
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    fetchUsuarios()

    return () => {
      mountedRef.current = false
    }
  }, [fetchUsuarios])

  const getRoleIcon = (rolId: number) => {
    if (rolId === 4) return <ShieldCheck className="text-purple-600" size={18} />
    if (rolId === 5) return <UserCog className="text-blue-600" size={18} />
    return <HardHat className="text-amber-600" size={18} />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Personal del Sistema</h1>
          <p className="text-slate-500">Gestiona los accesos y roles de tu equipo de trabajo.</p>
        </div>
        <Button
          onClick={() => {
            setSelectedUser(null)
            setIsModalOpen(true)
          }}
          className="bg-blue-600"
        >
          <UserPlus size={18} className="mr-2" /> Agregar Miembro
        </Button>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-4 text-xs font-bold text-slate-400 uppercase">Nombre</th>
              <th className="p-4 text-xs font-bold text-slate-400 uppercase">Email</th>
              <th className="p-4 text-xs font-bold text-slate-400 uppercase">Rol</th>
              <th className="p-4 text-xs font-bold text-slate-400 uppercase text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {usuarios.map(u => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-semibold text-slate-700">{u.nombre}</td>
                <td className="p-4 text-slate-500">{u.email}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    {getRoleIcon(u.rol_id)}
                    <span className="text-sm font-medium">{u.roles?.nombre}</span>
                  </div>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => {
                      setSelectedUser(u)
                      setIsModalOpen(true)
                    }}
                    className="p-2 text-slate-400 hover:text-blue-600"
                  >
                    <Edit size={16} />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <UsuarioModal
        isOpen={isModalOpen}
        usuario={selectedUser}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchUsuarios}
      />
    </div>
  )
}
