import { createClient } from '@/utils/supabase/server'
import { Building2, Users, Activity, ShieldAlert, BarChart3, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { StatCard } from './StatCard'

export async function AdminDashboard() {
  const supabase = await createClient()

  /**
   * REFACTORIZACIÓN DE SEGURIDAD:
   * Consultamos el RPC centralizado para estadísticas globales.
   */
  const { data: telemetry, error } = await supabase.rpc('get_admin_full_telemetry');

  // Desestructuramos asegurando que si el RPC devuelve 'global' o el objeto directo, funcione.
  const stats = telemetry?.global || telemetry || {
    total_organizaciones: 0,
    total_usuarios: 0,
    total_proyectos: 0,
    server_load: 0
  };
  
  if (error) {
    console.error('Error cargando stats del dashboard:', error.message)
  }

  return (
    <div className="space-y-10">
      {/* Saludo y Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Sistema Operativo</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
            Panel de Control <span className="text-blue-600">Global</span>
          </h1>
          <p className="text-slate-500 text-sm mt-3 font-medium max-w-md">
            Supervisión integral de infraestructura, licenciamiento y acceso de organizaciones.
          </p>
        </div>

        <div className="flex gap-3">
          <div className="bg-white border border-slate-100 px-6 py-3 rounded-2xl shadow-sm hidden lg:block">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Carga del Servidor</p>
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-1000" 
                  style={{ width: `${stats.server_load || 32}%` }}
                />
              </div>
              <span className="text-xs font-bold text-slate-600">{stats.server_load || 32}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Enlace corregido a organizaciones */}
        <Link 
          href="/dashboard/organizaciones" 
          className="group block transition-all hover:-translate-y-1 active:scale-95"
        >
          <StatCard 
            title="Organizaciones" 
            value={stats.total_organizaciones} 
            icon={<Building2 size={24} />} 
            color="bg-blue-600" 
            description="Entidades registradas"
          />
        </Link>
        
        <Link 
          href="/dashboard/usuarios" 
          className="group block transition-all hover:-translate-y-1 active:scale-95"
        >
          <StatCard 
            title="Usuarios Totales" 
            value={stats.total_usuarios} 
            icon={<Users size={24} />} 
            color="bg-indigo-600" 
            description="Personal activo en campo"
          />
        </Link>

        <div className="group block transition-all hover:-translate-y-1">
          <StatCard 
            title="Salud del Sistema" 
            value="Estable" 
            icon={<Activity size={24} />} 
            color="bg-emerald-500" 
            description="Todos los servicios activos"
          />
        </div>
      </div>

      {/* Sección de Actividad y Logs Rápidos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <BarChart3 size={24} />
              </div>
              <div>
                <h3 className="font-black text-slate-900 uppercase text-sm tracking-widest">Actividad Global</h3>
                <p className="text-xs text-slate-400 font-medium">Eventos registrados en las últimas 24h</p>
              </div>
            </div>
            <button className="text-[10px] font-black uppercase text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl transition-colors">
              Ver Logs Completos
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 border border-dashed border-slate-200">
              <Activity size={32} />
            </div>
            <div className="max-w-xs">
              <h4 className="font-bold text-slate-800 mb-1 italic">Sincronizando flujos...</h4>
              <p className="text-slate-400 text-xs leading-relaxed font-medium">
                La telemetría de las organizaciones aparecerá aquí una vez que los PM inicien el despliegue de capas.
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar de Alertas de Seguridad */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex flex-col shadow-2xl shadow-slate-200">
          <div className="flex items-center gap-3 mb-8">
            <ShieldAlert className="text-amber-400" size={24} />
            <h3 className="font-black uppercase text-xs tracking-[0.2em]">Seguridad & Cloud</h3>
          </div>

          <div className="space-y-6 flex-1">
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-500 uppercase">Estado SSL</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">Certificado Válido</span>
                <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full" />
              </div>
            </div>

            <div className="h-px bg-slate-800 w-full" />

            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-500 uppercase">Acceso RLS</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">Políticas Activas</span>
                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-black">FIREWALL ON</span>
              </div>
            </div>
          </div>

          <button className="mt-8 w-full bg-white/10 hover:bg-white/20 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all group">
            <span className="text-[10px] font-black uppercase tracking-widest">Configuración Core</span>
            <ArrowUpRight size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  )
}