import { createClient } from '@/utils/supabase/server'
import { FolderKanban, Users, Activity, ArrowRight, Zap, Target } from 'lucide-react'
import Link from 'next/link'
import { StatCard } from './StatCard'

interface PMProps {
  orgId: string | null
  nombre: string | null
  rolId: number
}

export async function PMDashboard({ orgId, nombre, rolId }: PMProps) {
  const supabase = await createClient()

  // Mapeo de nombre de rol según la jerarquía del sistema
  const nombreRol = rolId === 2 ? 'Project Manager' : 'Supervisor de Campo';

  /**
   * REFACTORIZACIÓN DE SEGURIDAD RPC:
   * Invocamos una única función segura que devuelve las métricas específicas
   * de la organización (tenant) a la que pertenece el PM/Supervisor.
   */
  const { data: stats, error } = await supabase.rpc('get_pm_dashboard_stats');

  if (error) {
    console.error('Error cargando métricas de PM:', error.message);
  }

  // Valores por defecto en caso de error o datos vacíos
  const totalProyectos = stats?.total_proyectos ?? 0;
  const totalPersonal = stats?.total_personal ?? 0;
  const actividadReciente = stats?.actividad_reciente ?? 0;
  return (
    <div className="space-y-10">
      {/* Header con Contexto de Usuario */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-orange-100 text-orange-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-orange-200">
              {nombreRol}
            </span>
            <span className="h-1 w-1 bg-slate-300 rounded-full" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Workspace Activo</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
            Hola, <span className="text-orange-600">{nombre?.split(' ')[0]}</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Supervisa el progreso de los levantamientos y coordina tu equipo técnico.
          </p>
        </div>

        <Link href="/dashboard/proyectos" className="flex items-center gap-4 bg-white p-2 pr-6 border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all group">
          <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white">
            <Zap size={20} className="group-hover:text-orange-400 transition-colors" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Acceso Rápido</p>
            <p className="text-sm font-bold text-slate-900">Ir a Mapas Live</p>
          </div>
          <ArrowRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Grid de Métricas de la Organización */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <Link href="/dashboard/proyectos" className="group block transition-all hover:-translate-y-1">
          <StatCard 
            title="Proyectos" 
            value={totalProyectos} 
            icon={<FolderKanban size={24} />} 
            color="bg-orange-500" 
            description="Levantamientos en curso"
          />
        </Link>

        <Link href="/dashboard/usuarios" className="group block transition-all hover:-translate-y-1">
          <StatCard 
            title="Mi Equipo" 
            value={totalPersonal} 
            icon={<Users size={24} />} 
            color="bg-blue-600" 
            description="Técnicos y supervisores"
          />
        </Link>

        <div className="group block transition-all hover:-translate-y-1">
          <StatCard 
            title="Disponibilidad" 
            value="100%" 
            icon={<Target size={24} />} 
            color="bg-emerald-500" 
            description="Servicios de geolocalización"
          />
        </div>
      </div>

      {/* Sección de Resumen Operativo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 p-10 flex flex-col justify-center items-center text-center space-y-4 min-h-[300px] shadow-sm">
          <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 mb-2">
            <FolderKanban size={32} />
          </div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Rendimiento de Proyectos</h2>
          <p className="text-slate-400 text-sm max-w-sm font-medium italic">
            El análisis de productividad por técnico y avance de metas de kilometraje se habilitará al completar el primer proyecto.
          </p>
          <Link 
            href="/dashboard/proyectos" 
            className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-orange-600 hover:text-orange-700 underline underline-offset-8 transition-colors"
          >
            Gestionar Proyectos Actuales
          </Link>
        </div>

        <div className="bg-slate-50 rounded-[2.5rem] border border-slate-100 p-8 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="text-blue-600" size={20} />
            <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Estado de Red</h3>
          </div>
          
          <div className="space-y-6 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">GPS Accuracy</span>
              <span className="text-xs font-black text-emerald-500">OPTIMAL</span>
            </div>
            <div className="h-px bg-slate-200 w-full" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">Sync Status</span>
              <span className="text-xs font-black text-blue-500">REAL-TIME</span>
            </div>
            <div className="h-px bg-slate-200 w-full" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">Auth Tokens</span>
              <span className="text-xs font-black text-slate-900">VERIFIED</span>
            </div>
          </div>

          <div className="mt-8 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
              Recuerda que los técnicos deben habilitar permisos de alta precisión en sus dispositivos móviles.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}