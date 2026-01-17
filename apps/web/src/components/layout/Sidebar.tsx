'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Building2, 
  Users, 
  Map as MapIcon, 
  Library, 
  FolderKanban,
  Settings,
  Zap
} from 'lucide-react';

export default function Sidebar({ userRole }: { userRole: number }) {
  const pathname = usePathname()

  // Función para determinar si el link está activo (exacto o subrutas)
  const isActive = (path: string) => {
    if (path === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(path);
  }

  const navItemClasses = (path: string) => `
    flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group
    ${isActive(path) 
      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'}
  `

  return (
    <div className="w-72 bg-[#0F172A] text-white flex flex-col h-full border-r border-slate-800 shadow-2xl">
      {/* Brand Logo */}
      <div className="p-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Zap size={22} className="text-white fill-current" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tighter leading-none uppercase">
              Replanteo <span className="text-blue-500">FO</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
              {userRole === 4 ? 'Super Admin' : 'PM Workspace'}
            </p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 px-4 space-y-8 overflow-y-auto custom-scrollbar">
        
        {/* SECCIÓN: GENERAL */}
        <div>
          <p className="px-4 text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4">General</p>
          <div className="space-y-1">
            <Link href="/dashboard" className={navItemClasses('/dashboard')}>
              <Home size={18} className={isActive('/dashboard') ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'} />
              <span className="text-xs font-black uppercase tracking-widest">Dashboard</span>
            </Link>
          </div>
        </div>

        {/* SECCIÓN: SUPERADMIN (Rol 4) - JOHAN TRUJILLO */}
        {userRole === 4 && (
          <div className="animate-in slide-in-from-left duration-500">
            <p className="px-4 text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-4">Administración</p>
            <div className="space-y-1">
              <Link href="/dashboard/organizaciones" className={navItemClasses('/dashboard/organizaciones')}>
                <Building2 size={18} className={isActive('/dashboard/organizaciones') ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'} />
                <span className="text-xs font-black uppercase tracking-widest">Organizaciones</span>
              </Link>
              <Link href="/dashboard/usuarios" className={navItemClasses('/dashboard/usuarios')}>
                <Users size={18} className={isActive('/dashboard/usuarios') ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'} />
                <span className="text-xs font-black uppercase tracking-widest">Usuarios Global</span>
              </Link>
            </div>
          </div>
        )}

        {/* SECCIÓN: OPERACIONES */}
        <div>
          <p className="px-4 text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4">Operaciones</p>
          <div className="space-y-1">
            {/* Acceso para SuperAdmin (4), PM (7) u otros roles operativos */}
            {(userRole === 4 || userRole === 7 || userRole === 1) && (
              <Link href="/dashboard/proyectos" className={navItemClasses('/dashboard/proyectos')}>
                <FolderKanban size={18} className={isActive('/dashboard/proyectos') ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'} />
                <span className="text-xs font-black uppercase tracking-widest">Proyectos</span>
              </Link>
            )}

            <Link href="/dashboard/visor" className={navItemClasses('/dashboard/visor')}>
              <MapIcon size={18} className={isActive('/dashboard/visor') ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'} />
              <span className="text-xs font-black uppercase tracking-widest">Mapa en Vivo</span>
            </Link>

            <Link href="/dashboard/biblioteca" className={navItemClasses('/dashboard/biblioteca')}>
              <Library size={18} className={isActive('/dashboard/biblioteca') ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'} />
              <span className="text-xs font-black uppercase tracking-widest">Capas Globales</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Footer del Sidebar: Perfil / Settings */}
      <div className="p-4 mt-auto border-t border-slate-800/50">
        <Link 
          href="/dashboard/configuracion" 
          className={navItemClasses('/dashboard/configuracion')}
        >
          <Settings size={18} className={isActive('/dashboard/configuracion') ? 'text-white' : 'text-slate-500 group-hover:rotate-90 transition-transform duration-500'} />
          <span className="text-xs font-black uppercase tracking-widest">Ajustes</span>
        </Link>
      </div>
    </div>
  )
}