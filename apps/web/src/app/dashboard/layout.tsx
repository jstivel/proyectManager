import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { ShieldAlert, LogOut, RefreshCw } from "lucide-react"; 
import { logoutAction } from "@/app/login/actions";
import { User, UserProfile } from "@/types";
import SessionWatcher from "@/components/auth/SessionWatcher";

/**
 * Verifica si el usuario tiene privilegios de Super Administrador
 * Se utilizan múltiples capas de validación para mayor robustez
 */
function checkIsSuperAdmin(user: User | null, perfil: UserProfile | null): boolean {
  if (!user) return false;
  
  // 1. Prioridad: Verificar por rol_id en la tabla de perfiles (Rol 4 = SuperAdmin)
  if (perfil?.rol_id === 4) return true;
  
  // 2. Fallback: Verificar metadata del usuario en Auth
  if (user.user_metadata?.super_admin === true) return true;
  
  // 3. Temporal: Lista blanca de emails para asegurar acceso durante migración
  const adminEmails = ['stivel275@gmail.com', 'admin@replanteo.com'];
  return adminEmails.includes(user.email || '');
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  // 1. Verificación de sesión activa (Auth)
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  /**
   * 2. Obtención del perfil detallado mediante RPC segura
   */
  const { data: perfiles, error: profileError } = await supabase.rpc('get_mi_perfil_seguro');
  
  const perfil = perfiles && perfiles.length > 0 ? perfiles[0] : null;

  /**
   * 3. Evaluación de permisos
   */
  const isSuperAdmin = checkIsSuperAdmin(user, perfil);
  
  /**
   * 4. Validación de Acceso (Gatekeeper)
   * - SuperAdmin: Acceso total garantizado.
   * - Usuario normal: Debe estar activo y pertenecer a una organización.
   */
  const tieneAcceso = isSuperAdmin || (
    perfil && 
    perfil.activo === true && 
    perfil.organizacion_id !== null
  );

  // 5. Renderizado de interfaz para acceso denegado
  if (!tieneAcceso) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden">
          <div className="p-10 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-50 rounded-3xl mb-8 animate-pulse">
              <ShieldAlert className="w-10 h-10 text-red-600" />
            </div>
            
            <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">
              Acceso Restringido
            </h2>
            
            <p className="text-slate-500 mb-8 leading-relaxed font-medium">
              Tu cuenta <span className="text-slate-900 font-bold">{user.email}</span> ha sido detectada, pero parece que aún no has sido asignado a una organización activa o tus permisos son insuficientes.
            </p>

            <div className="space-y-3 mb-8">
               <a 
                 href="/dashboard" 
                 className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-4 rounded-2xl transition-all shadow-lg shadow-blue-100"
               >
                <RefreshCw className="w-4 h-4" />
                Reintentar Acceso
               </a>
            </div>

            <form action={logoutAction}>
              <button 
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-500 font-bold py-4 px-4 rounded-2xl border-2 border-slate-100 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Cerrar sesión actual
              </button>
            </form>
          </div>
          
          <div className="bg-slate-50 px-10 py-6 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 text-center uppercase tracking-[0.2em] font-black">
              Sistema de Gestión Global v2.0
            </p>
          </div>
        </div>
      </div>
    );
  }

  /**
   * 6. Preparación de variables de entorno de UI
   */
  const userRole = perfil?.rol_id || (isSuperAdmin ? 4 : null);
  const nombreOrganizacion = isSuperAdmin ? "ADMINISTRACIÓN GLOBAL" : (perfil?.organizacion_nombre || "Cargando...");
  
  // Ofuscamos el email en el Header si es SuperAdmin por seguridad
  const displayEmail = isSuperAdmin ? `Admin: ${user.email?.split('@')[0]}***` : (user.email || '');

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Client Component que vigila la sesión en tiempo real */}
      <SessionWatcher />
      
      <Sidebar userRole={userRole} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          email={displayEmail} 
          organizacion={nombreOrganizacion} 
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto animate-in fade-in duration-700">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}