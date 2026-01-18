'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  UserPlus, 
  Edit, 
  Trash2, 
  ShieldCheck, 
  UserCog, 
  HardHat, 
  Loader2,
  Mail,
  Fingerprint,
  Power,
  PowerOff
} from 'lucide-react'
import UsuarioModal from '@/components/modal/UsuarioModal'
import { useUsuarios } from '@/hooks/useUsuarios'

export default function UsuariosPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  
  // Conectamos con el hook que ahora incluye toggleStatusMutation
  const { usuarios, isLoading, deleteMutation, toggleStatusMutation } = useUsuarios()

  /**
   * Eliminación de Usuario (Soft Delete)
   */
  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar a ${nombre}? Esta acción revocará todos sus accesos de inmediato.`)) return
    deleteMutation.mutate(id)
  }

  /**
   * Cambio de Estado (Activar/Desactivar)
   */
  const handleToggleStatus = (id: string, currentStatus: boolean) => {
    toggleStatusMutation.mutate({ id, activo: !currentStatus })
  }

  const getRoleIcon = (rolId: number, rolNombre?: string) => {
    switch (rolId) {
      case 4: // Administrador Global
        return <ShieldCheck className="text-indigo-600" size={18} />
      case 7: // Project Manager
        return <UserCog className="text-blue-600" size={18} />
      case 5: // Supervisor
        return <ShieldCheck className="text-emerald-600" size={18} />
      case 6: // Técnico
        return <HardHat className="text-amber-600" size={18} />
      default:
        return <HardHat className="text-slate-600" size={18} />
    }
  }

  return (
    <div className="space-y-8">
      {/* Header Superior */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Gestión de Personal</h1>
          <p className="text-slate-500 font-medium">Control de accesos, roles y perfiles de usuario del sistema.</p>
        </div>
        <Button
          onClick={() => {
            setSelectedUser(null)
            setIsModalOpen(true)
          }}
          className="bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all font-black py-7 px-8 rounded-2xl flex gap-3 items-center group"
        >
          <UserPlus size={20} className="group-hover:scale-110 transition-transform" />
          <span className="uppercase tracking-widest text-xs">Agregar Miembro</span>
        </Button>
      </div>

      {/* Tabla de Usuarios / Loader */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <Loader2 className="animate-spin text-blue-600" size={48} />
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">Sincronizando nómina...</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Miembro</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hidden md:table-cell">Credencial / Email</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Rango / Nivel</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {!usuarios || usuarios.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-20 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Fingerprint size={48} className="text-slate-100" />
                        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">No hay registros de personal</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  usuarios.map((u: any) => (
                    <tr 
                      key={u.id} 
                      className={`transition-all group ${!u.activo ? 'bg-slate-50/40 opacity-70' : 'hover:bg-slate-50/50'}`}
                    >
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all font-black uppercase text-xs ${
                            u.activo 
                            ? 'bg-slate-100 text-slate-400 group-hover:bg-blue-600 group-hover:text-white' 
                            : 'bg-slate-200 text-slate-500'
                          }`}>
                            {u.nombre?.substring(0, 2)}
                          </div>
                          <div>
                            <div className={`font-black transition-colors ${u.activo ? 'text-slate-900 group-hover:text-blue-600' : 'text-slate-500 line-through'}`}>
                              {u.nombre}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-tighter md:hidden">
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-6 hidden md:table-cell">
                        <div className="flex items-center gap-2 text-slate-500 font-medium">
                          <Mail size={14} className="text-slate-300" />
                          <span className="text-sm">{u.email}</span>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="inline-flex items-center gap-2.5 bg-slate-100 px-4 py-1.5 rounded-full border border-slate-200/50">
                          {getRoleIcon(u.rol_id, u.rol_nombre)}
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                            {u.rol_nombre || 'Sin Rol'} 
                          </span>
                        </div>
                      </td>
                      <td className="p-6 text-right">
                        <div className="flex justify-end gap-1">
                          {/* BOTÓN TOGGLE STATUS (Solo visible si el SuperAdmin ve inactivos o para desactivar) */}
                          <button
                            onClick={() => handleToggleStatus(u.id, u.activo)}
                            disabled={toggleStatusMutation.isPending}
                            className={`p-3 rounded-xl transition-all ${
                              u.activo 
                                ? 'text-slate-400 hover:text-amber-600 hover:bg-white hover:shadow-lg' 
                                : 'text-blue-600 hover:bg-white hover:shadow-lg'
                            }`}
                            title={u.activo ? "Desactivar usuario" : "Activar usuario"}
                          >
                            {toggleStatusMutation.isPending && toggleStatusMutation.variables?.id === u.id 
                              ? <Loader2 className="animate-spin" size={18} /> 
                              : u.activo ? <Power size={18} /> : <PowerOff size={18} />
                            }
                          </button>

                          <button
                            onClick={() => {
                              setSelectedUser(u)
                              setIsModalOpen(true)
                            }}
                            className="p-3 text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-lg rounded-xl transition-all"
                            title="Editar usuario"
                          >
                            <Edit size={18} />
                          </button>

                          <button 
                            onClick={() => handleDelete(u.id, u.nombre)}
                            className="p-3 text-slate-400 hover:text-red-600 hover:bg-white hover:shadow-lg rounded-xl transition-all"
                            disabled={deleteMutation.isPending}
                            title="Eliminar usuario"
                          >
                            <Trash2 size={18} />
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
      )}

      {/* Modal para Creación / Edición */}
      <UsuarioModal
        isOpen={isModalOpen}
        usuario={selectedUser}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedUser(null)
        }}
      />
    </div>
  )
}