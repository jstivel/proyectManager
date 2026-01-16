'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
// IMPORTANTE: Usamos el cliente con soporte para SSR/Cookies
import { createClient } from '@/utils/supabase/client' 
import { Button } from '@/components/ui/button'
import { UserPlus, Edit, Trash2, ShieldCheck, UserCog, HardHat, Loader2 } from 'lucide-react'
import UsuarioModal from '@/components/infra/UsuarioModal'

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  
  // Instanciamos el cliente de Supabase
  const supabase = createClient()

  const mountedRef = useRef(false)

  const fetchUsuarios = useCallback(async () => {
    if (!mountedRef.current) return
    setLoading(true)

    try {
      // Al usar el cliente SSR, esta petición enviará las cookies de sesión
      // permitiendo que el RLS valide tu rol de 'admin'
      const { data, error } = await supabase
        .from('usuarios')
        .select(`
          *,
          roles (
            nombre
          )
        `)
        .order('nombre')

      if (error) {
        console.error('Error de Supabase:', error.message)
        throw error
      }
      
      if (!mountedRef.current) return
      setUsuarios(data || [])

    } catch (error: any) {
      console.error('Error cargando usuarios:', error)
      // Opcional: Podrías manejar una notificación de error aquí
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [supabase])

  useEffect(() => {
    mountedRef.current = true
    fetchUsuarios()

    return () => {
      mountedRef.current = false
    }
  }, [fetchUsuarios])

  const getRoleIcon = (rolId: number) => {
    // Ajusta estos IDs según los valores reales de tu tabla 'roles'
    // 4 suele ser Admin, 5 Supervisor, etc.
    if (rolId === 4) return <ShieldCheck className="text-purple-600" size={18} />
    if (rolId === 5) return <UserCog className="text-blue-600" size={18} />
    return <HardHat className="text-amber-600" size={18} />
  }

  if (loading && usuarios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="text-slate-500 font-medium animate-pulse">Cargando personal...</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Personal del Sistema</h1>
          <p className="text-slate-500 text-sm">Gestiona los accesos y roles de tu equipo de trabajo.</p>
        </div>
        <Button
          onClick={() => {
            setSelectedUser(null)
            setIsModalOpen(true)
          }}
          className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
        >
          <UserPlus size={18} className="mr-2" /> Agregar Miembro
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rol</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usuarios.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-400">
                    No se encontraron usuarios o no tienes permisos para verlos.
                  </td>
                </tr>
              ) : (
                usuarios.map(u => (
                  <tr key={u.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{u.nombre}</div>
                      <div className="text-[10px] text-slate-400 md:hidden">{u.email}</div>
                    </td>
                    <td className="p-4 text-slate-600 text-sm hidden md:table-cell">{u.email}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(u.rol_id)}
                        <span className="text-xs font-bold uppercase tracking-tight text-slate-700">
                          {u.roles?.nombre || 'Sin Rol'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => {
                            setSelectedUser(u)
                            setIsModalOpen(true)
                          }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
                          title="Editar usuario"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-all"
                          title="Eliminar usuario"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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