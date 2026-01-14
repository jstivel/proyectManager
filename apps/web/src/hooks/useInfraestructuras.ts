'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'

// Definimos la interfaz para los límites del mapa para TypeScript
interface MapBounds {
  sw: { lng: number; lat: number };
  ne: { lng: number; lat: number };
}

/**
 * Hook para obtener infraestructuras de forma dinámica basadas en el área visible.
 * Utiliza una función RPC en el servidor para máxima estabilidad con filtros espaciales.
 */
export function useInfraestructuras(proyectoId: string | null, bounds: MapBounds | null) {
  const supabase = createClient()

  return useQuery({
    // 1. CLAVE DE CONSULTA: Incluye proyecto y límites para invalidar caché al mover el mapa
    queryKey: ['infraestructuras', proyectoId, bounds],
    
    queryFn: async () => {
      // Validación de seguridad para evitar peticiones vacías
      if (!proyectoId || !bounds) return []
      
      console.log("🔄 Sincronizando infraestructura vía RPC (BBox)...");

      /**
       * LLAMADA RPC:
       * Usamos la función remota para evitar errores de sintaxis en el cliente
       * y aprovechar el índice espacial ST_MakeEnvelope en el servidor.
       */
      const fetchPromise = supabase.rpc('get_infra_by_bbox', {
        p_proyecto_id: proyectoId,
        min_lng: bounds.sw.lng,
        min_lat: bounds.sw.lat,
        max_lng: bounds.ne.lng,
        max_lat: bounds.ne.lat
      });

      // 3. TIMEOUT DE SEGURIDAD: 10 segundos antes de abortar por lentitud de red/DB
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('DATABASE_TIMEOUT')), 10000)
      );

      try {
        // Carrera entre la petición y el timeout
        const result: any = await Promise.race([fetchPromise, timeoutPromise]);
        
        if (result.error) {
          console.error("❌ Error de Postgres:", result.error);
          throw result.error;
        }
        
        return result.data || [];
      } catch (err: any) {
        if (err.message === 'DATABASE_TIMEOUT') {
          console.error("🚨 La base de datos tardó demasiado en responder al BBox query.");
        } else {
          console.error("🚨 Error inesperado:", err);
        }
        throw err;
      }
    },

    // --- CONFIGURACIÓN DE FUNCIONALIDAD ---
    
    // Solo se activa si tenemos ID de proyecto y el mapa ha reportado sus coordenadas
    enabled: !!proyectoId && !!bounds,

    // staleTime: Mantiene los datos como "válidos" por 10 segundos para suavizar el movimiento
    staleTime: 1000 * 10, 

    // refetchInterval: Sincroniza automáticamente cambios de otros usuarios cada 30 segundos
    refetchInterval: 1000 * 30,

    // refetchOnWindowFocus: Actualiza los puntos al volver a la pestaña de la app
    refetchOnWindowFocus: true,

    // placeholderData: Mantiene los puntos anteriores mientras carga los nuevos.
    // Esto es lo que evita que los iconos desaparezcan y aparezcan (parpadeo) al mover el mapa.
    placeholderData: (previousData) => previousData, 
  });
}