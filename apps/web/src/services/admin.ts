import { createClient } from '@/utils/supabase/server'

export async function getAdminTelemetry() {
  const supabase = await createClient()
  
  const { data, error } = await supabase.rpc('get_admin_full_telemetry')
  
  if (error) {
    console.error('❌ Error en Telemetría:', error.message)
    return {
      total_organizaciones: 0,
      total_usuarios: 0,
      total_proyectos: 0,
      server_load: 0
    }
  }

  // Normalizamos la respuesta de la RPC aquí, no en el componente
  return data?.[0]?.global || {
    total_organizaciones: 0,
    total_usuarios: 0,
    total_proyectos: 0,
    server_load: 0
  }
}