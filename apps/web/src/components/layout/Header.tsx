'use client'

import { logoutAction } from "@/app/login/actions"
import { Button } from "@/components/ui/button"
import { LogOut, Building2, User, ChevronDown } from "lucide-react"

interface HeaderProps {
  email?: string | null;
  organizacion?: string;
}

export default function Header({ email, organizacion }: HeaderProps) {
  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-40">
      {/* Sección Izquierda: Identidad del Workspace */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">
              Workspace Activo
            </h2>
          </div>
          
          <div className="flex items-center gap-2 group cursor-default">
            <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
              <Building2 size={16} />
            </div>
            <span className="text-sm font-black text-slate-800 tracking-tight uppercase">
              {organizacion || 'Sistema Global'}
            </span>
          </div>
        </div>
      </div>

      {/* Sección Derecha: Usuario y Acciones */}
      <div className="flex items-center gap-8">
        {/* Info del Usuario */}
        <div className="hidden md:flex items-center gap-4 pl-8 border-l border-slate-100">
          <div className="text-right">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">
              Operador
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-700 tracking-tight">
                {email || 'Cargando...'}
              </span>
            </div>
          </div>
          
          <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-200">
            <User size={18} />
          </div>
        </div>
        
        {/* Botón de Salida */}
        <form action={logoutAction}>
          <Button 
            variant="ghost" 
            size="sm" 
            type="submit" 
            className="group hover:bg-red-50 text-slate-400 hover:text-red-600 transition-all rounded-xl px-4 py-6"
          >
            <div className="flex flex-col items-center gap-1">
              <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-[9px] font-black uppercase tracking-tighter hidden sm:inline">Salir</span>
            </div>
          </Button>
        </form>
      </div>
    </header>
  )
}