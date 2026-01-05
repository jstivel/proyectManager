'use client'
import { useAuth } from "@/context/AuthContext"
import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation" // Añadimos usePathname
import Sidebar from "@/components/layout/Sidebar"
import Header from "@/components/layout/Header"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { perfil, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname() // Para identificar cambios de ruta

  useEffect(() => {
    if (!loading && !perfil) {
      router.push('/login')
    }
  }, [perfil, loading, router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-slate-500 font-medium">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (!perfil) return null

  return (
    <div className="flex h-screen bg-slate-100">
      <Sidebar userRole={perfil.rol_id} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header email={perfil.email} />
        {/* Añadimos la key={pathname} para forzar a React a limpiar componentes entre rutas */}
        <main key={pathname} className="flex-1 overflow-x-hidden overflow-y-auto p-8">
          {perfil ? children : null}
        </main>
      </div>
    </div>
  )
}