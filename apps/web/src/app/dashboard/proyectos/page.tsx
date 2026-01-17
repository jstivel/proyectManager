import { createClient } from '@/utils/supabase/server'
import DashboardList from './DashboardList'

export default async function AdminDashboard() {
  const supabase = await createClient()

  /**
   * REFACTORIZACIÓN DE SEGURIDAD RPC:
   * Reemplazamos las consultas paralelas a 'proyectos' y 'usuarios' por un único 
   * punto de entrada seguro. La función 'get_admin_dashboard_data' devuelve un 
   * objeto con los arrays de proyectos y supervisores permitidos para el usuario.
   */
  const { data, error } = await supabase.rpc('get_admin_dashboard_data')

  if (error) {
    console.error('Error fetching dashboard data:', error.message)
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-10 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
        </div>
        <h3 className="text-slate-900 font-black uppercase text-sm tracking-widest">Error de Seguridad</h3>
        <p className="text-slate-500 text-xs mt-2 font-medium max-w-xs">
          No se pudo validar la sesión o el acceso a los datos. Por favor, reintenta o contacta al administrador.
        </p>
      </div>
    )
  }

  // Extraemos los datos del retorno de la función
  const proyectos = data?.proyectos || []
  const supervisores = data?.supervisores || []

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
        initialProyectos={proyectos} 
        supervisores={supervisores} 
      />
    </div>
  )
}