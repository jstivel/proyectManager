import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import Sidebar from "@/components/layout/Sidebar"
import Header from "@/components/layout/Header"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  // 1. Verificamos la sesión directamente en el servidor
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. Traemos el perfil (esto reemplaza lo que hacía el AuthContext)
  const { data: perfil } = await supabase
    .from('usuarios')
    .select('*, roles(nombre)')
    .eq('id', user.id)
    .single()

  if (!perfil) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Pasamos el rol directamente desde la DB */}
      <Sidebar userRole={perfil.rol_id} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Pasamos el email del usuario de auth o el nombre del perfil */}
        <Header email={user.email} />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  )
}