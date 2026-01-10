import { useQuery } from '@tanstack/react-query'
// 1. Cambiamos la importación para usar el cliente de navegador oficial
import { createClient } from '@/utils/supabase/client'

export function useInfraestructuras(proyectoId: string | null) {
  const supabase = createClient() // Instanciamos el cliente aquí

  return useQuery({
    queryKey: ['infraestructuras', proyectoId],
    queryFn: async () => {
      if (!proyectoId) return []
      
      console.log("🔄 Iniciando consulta de infraestructuras...");

      // 2. TIMEOUT DE SEGURIDAD
      const fetchPromise = supabase
        .from('v_infraestructuras_mapa')
        .select('*')
        .eq('proyecto_id', proyectoId);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('DATABASE_TIMEOUT')), 10000)
      );

      try {
        // Ejecutamos la promesa con timeout
        const result: any = await Promise.race([fetchPromise, timeoutPromise]);
        
        // Manejo de error de Postgres
        if (result.error) {
          console.error("❌ Error de Postgres:", result.error);
          throw result.error;
        }
        
        console.log("✅ Datos recibidos correctamente");
        return result.data || [];
      } catch (err: any) {
        if (err.message === 'DATABASE_TIMEOUT') {
          console.error("🚨 La base de datos no respondió a tiempo.");
        }
        throw err;
      }
    },
    enabled: !!proyectoId,
    // CONFIGURACIÓN DE SINCRONIZACIÓN
    refetchInterval: 1000 * 30, // Sincroniza cada 30 segundos por si otros usuarios agregan puntos
    refetchOnWindowFocus: true, // Recarga al volver a la pestaña
    placeholderData: (previousData) => previousData, // Mantiene los puntos viejos mientras carga los nuevos (evita parpadeo)
  });
}