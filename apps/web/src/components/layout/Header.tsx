'use client'

import { logoutAction } from "@/app/login/actions"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

interface HeaderProps {
  email?: string;
}

export default function Header({ email }: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-8 shadow-sm">
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider">
          Panel de Control
        </h2>
      </div>

      <div className="flex items-center gap-6">
        <span className="text-sm font-semibold text-slate-700">
          {email || 'Cargando usuario...'}
        </span>
        
        {/* En Next.js 16, la forma más limpia es usar un formulario con la Server Action */}
        <form action={logoutAction}>
          <Button 
            variant="destructive" 
            size="sm" 
            type="submit" // Importante que sea submit
            className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200 hover:text-red-700 transition-colors flex gap-2 items-center"
          >
            <LogOut size={14} />
            Cerrar Sesión
          </Button>
        </form>
      </div>
    </header>
  )
}