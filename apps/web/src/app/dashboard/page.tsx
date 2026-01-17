import { createClient } from '@/utils/supabase/server'
import { AdminDashboard } from '@/components/dashboard/AdminDashboard'
import { PMDashboard } from '@/components/dashboard/PMDashboard'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const supabase = await createClient()

  // 1. Obtenemos el usuario de la sesión de forma robusta
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }

  /**
   * 2. Traemos el perfil detallado mediante RPC
   * Usamos 'get_mi_perfil_seguro' para garantizar que la info llegue
   * independientemente de las políticas RLS de las tablas.
   */
  const { data: perfiles } = await supabase.rpc('get_mi_perfil_seguro')
  const profile = perfiles && perfiles.length > 0 ? perfiles[0] : null

  /**
   * 3. Lógica de Enrutamiento Interno (Roles)
   * ID 4 = Administrador Global (SuperAdmin)
   * ID 7 = Project Manager (PM)
   * Otros roles = Supervisor / Técnico
   */
  
  // Bypass para el correo de rescate o rol de Admin
  const isSuperAdmin = user.email === 'stivel275@gmail.com' || profile?.rol_id === 4;

  if (isSuperAdmin) {
    return <AdminDashboard />
  }

  // Si no hay perfil o no tiene organización, el Layout se encargará del bloqueo,
  // pero aquí protegemos el renderizado de los componentes.
  if (!profile) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-slate-500 font-medium">Cargando configuración de perfil...</p>
      </div>
    )
  }

  /**
   * 4. Renderizado según jerarquía
   * Si es PM (7) o Supervisor (3), mostramos el dashboard de gestión.
   * Puedes crear un componente específico para Técnicos si fuera necesario.
   */
  return (
    <PMDashboard 
      orgId={profile.organizacion_id} 
      nombre={profile.nombre || 'Usuario'} 
      rolId={profile.rol_id}
    />
  )
}