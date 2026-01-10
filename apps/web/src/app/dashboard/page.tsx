import { createClient } from '@/utils/supabase/server'
import DashboardList from './DashboardList'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [proyectosResponse, supervisoresResponse] = await Promise.all([
    supabase
      .from('proyectos')
      .select(`*, usuarios!proyectos_supervisor_id_fkey (nombre)`)
      .order('created_at', { ascending: false }),
    supabase
      .from('usuarios')
      .select('id, nombre')
      .eq('rol_id', 5)
  ])

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Gestión de Proyectos
        </h1>
        <p className="text-slate-500 mt-1">
          Administra los levantamientos y asigna capas de infraestructura.
        </p>
      </div>

      <DashboardList 
        initialProyectos={proyectosResponse.data || []} 
        supervisores={supervisoresResponse.data || []} 
      />
    </div>
  )
}