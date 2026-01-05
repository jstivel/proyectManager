import Link from 'next/link'
import { Library, LayoutDashboard, Map, Settings } from 'lucide-react';

export default function Sidebar({ userRole }: { userRole: number }) {
  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col">
      <div className="p-6 text-xl font-bold border-b border-slate-800">
        Replanteo FO
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        <Link href="/dashboard" className="block p-2 hover:bg-slate-800 rounded">
          Dashboard
        </Link>
        
        {/* Solo Admin (4) y Supervisor (5) ven Proyectos */}
        {(userRole === 4 || userRole === 5) && (
          <Link href="/dashboard/proyectos" className="block p-2 hover:bg-slate-800 rounded">
            Gestión de Proyectos
          </Link>
        )}

        <Link href="/mapa" className="block p-2 hover:bg-slate-800 rounded">
          Mapa en Vivo
        </Link>
        <Link href="/dashboard/biblioteca" className="flex items-center gap-3 px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg">
          <Library size={20} /> {/* O el icono que prefieras */}
          <span>Biblioteca Global</span>
        </Link>

        {/* Solo Admin (4) ve Configuración Global */}
        {userRole === 4 && (
          <Link href="/dashboard/usuarios" className="block p-2 hover:bg-slate-800 rounded">
            Usuarios y Roles
          </Link>
        )}
      </nav>
    </div>
  )
}