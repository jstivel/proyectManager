'use client'

import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  email?: string; // El email puede ser opcional mientras carga
}

export default function Header({ email }: HeaderProps) {
  const router = useRouter()

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      router.push('/login')
    }
  }

  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-8 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Aquí podrías poner un breadcrumb o el título de la sección actual */}
        <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider">
          Panel de Control
        </h2>
      </div>

      <div className="flex items-center gap-6">
        <span className="text-sm font-semibold text-slate-700">
          {email || 'Cargando usuario...'}
        </span>
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={logout}
          className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200 hover:text-red-700 transition-colors"
        >
          Cerrar Sesión
        </Button>
      </div>
    </header>
  )
}