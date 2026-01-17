'use client'

import { useState } from 'react'
import { 
  Plus, 
  Search, 
  Loader2, 
  ChevronRight,
  Users,
  FolderKanban,
  Trash2,
  Settings2,
  ShieldCheck,
  Building2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useOrganizaciones } from '@/hooks/useOrganizaciones'
import OrganizacionModal from '@/components/modal/OrgModal' 

export default function OrganizacionesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Usamos el hook basado en TanStack Query
  const { organizaciones, isLoading, deleteMutation } = useOrganizaciones()

  // Filtrado local (React Query mantiene 'organizaciones' en caché)
  const orgsFiltradas = organizaciones?.filter((o: any) => 
    o.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.nit?.includes(searchTerm)
  ) || []

  /**
   * Manejo de eliminación usando la mutación del hook
   */
  const handleDelete = async (id: string, nombre: string) => {
    if (window.confirm(`¿Estás seguro de eliminar a "${nombre}"? Esta acción no se puede deshacer.`)) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header y Buscador */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase leading-none">
            Organizaciones
          </h1>
          <p className="text-slate-500 font-medium mt-2">Gestión de Clientes y Entidades.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Buscar por nombre o NIT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all w-full md:w-80 font-bold text-sm"
            />
          </div>
          
          <Button 
            onClick={() => { setSelectedOrg(null); setIsModalOpen(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-black py-7 px-8 rounded-2xl shadow-xl shadow-blue-100 transition-all flex gap-3 items-center active:scale-95"
          >
            <Plus size={22} />
            <span className="uppercase tracking-[0.1em] text-xs">Nueva Organización</span>
          </Button>
        </div>
      </div>

      {/* Estado de Carga */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <Loader2 className="animate-spin text-blue-600" size={48} />
          <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em]">Consultando RPC Detallada...</p>
        </div>
      ) : orgsFiltradas.length === 0 ? (
        <div className="py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
          <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
            <Building2 className="text-slate-200" size={48} />
          </div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Sin resultados</h3>
          <p className="text-slate-400 max-w-xs mx-auto text-sm mt-2 font-medium">
            {searchTerm ? 'No hay coincidencias para tu búsqueda.' : 'Aún no has registrado ninguna organización.'}
          </p>
        </div>
      ) : (
        /* Grid de Organizaciones */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {orgsFiltradas.map((org: any) => (
            <div 
              key={org.id}
              className="bg-white rounded-[2.5rem] border border-slate-50 p-8 shadow-sm hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-500 group flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-xl">
                  <ShieldCheck size={14} className="text-blue-400" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">
                    {org.plan_nombre || 'Enterprise'}
                  </span>
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                  <button 
                    onClick={() => { setSelectedOrg(org); setIsModalOpen(true); }}
                    className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                  >
                    <Settings2 size={18} />
                  </button>
                  <button 
                    disabled={deleteMutation.isPending}
                    onClick={() => handleDelete(org.id, org.nombre)}
                    className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all disabled:opacity-30"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1">
                <h3 className="text-2xl font-black text-slate-900 mb-1 uppercase tracking-tight group-hover:text-blue-600 transition-colors leading-tight">
                  {org.nombre}
                </h3>
                <p className="text-[11px] text-slate-400 font-bold mb-8 tracking-widest font-mono">
                  NIT: {org.nit || 'PENDIENTE'}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-50">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-tighter">Proyectos</p>
                    <div className="flex items-center gap-3 font-black text-slate-700">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                        <FolderKanban size={16} />
                      </div>
                      <span className="text-lg">{org.total_proyectos || 0}</span>
                    </div>
                  </div>
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-50">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-tighter">Usuarios</p>
                    <div className="flex items-center gap-3 font-black text-slate-700">
                      <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                        <Users size={16} />
                      </div>
                      <span className="text-lg">{org.total_usuarios || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => { setSelectedOrg(org); setIsModalOpen(true); }}
                className="w-full bg-slate-50 hover:bg-blue-600 group-hover:bg-blue-600 hover:text-white text-slate-600 flex items-center justify-center gap-3 py-5 rounded-2xl font-black transition-all shadow-sm"
              >
                <span className="uppercase text-[10px] tracking-[0.2em]">Configurar Entidad</span>
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <OrganizacionModal 
        isOpen={isModalOpen}
        onClose={() => { 
          setIsModalOpen(false); 
          setSelectedOrg(null); 
        }}
        organizacion={selectedOrg}
      />
    </div>
  )
}