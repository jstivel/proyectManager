import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,      // Mantiene la sesión al cerrar/abrir el navegador
      autoRefreshToken: true,    // Renueva el token automáticamente antes de que caduque
      detectSessionInUrl: true,  // Necesario para flujos de login/recuperación
      //storageKey: 'infra-auth-token',
    },
    global: {
    // Esto asegura que si una petición se queda pegada, no bloquee el resto
      fetch: (...args) => fetch(...args).catch(err => {
        console.error("Error de red en Supabase Fetch:", err);
        throw err;
      })
    }
  }
)
export const refreshSupabaseConnection = async () => {
  console.log("🔄 Re-sincronizando conectividad con Supabase...");
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    // Forzamos al cliente a reconocer la sesión actual de nuevo
    await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token
    });
  }
}
// Helper para asegurar sesión activa antes de cualquier operación crítica
// apps/web/src/lib/supabase.ts

export async function ensureSession() {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // Si hay sesión activa, la devolvemos inmediatamente
    if (session && !sessionError) return session;

    // Si no hay sesión, intentamos refrescar pero de forma silenciosa
    console.warn("🔄 Sesión no encontrada, intentando refrescar...");
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError || !refreshData.session) {
      // AQUÍ ESTABA EL PROBLEMA: En lugar de un Error fatal, 
      // lanzamos un mensaje amigable o redirigimos.
      throw new Error("No hay una sesión activa. Por favor, inicia sesión de nuevo.");
    }
    
    return refreshData.session;
  } catch (err) {
    console.error("🔑 Error de Autenticación:", err);
    // Opcional: Redirigir al login si estás en el cliente
    if (typeof window !== 'undefined') {
       // window.location.href = '/login'; 
    }
    throw err; 
  }
}