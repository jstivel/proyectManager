// apps/web/src/hooks/useInfraMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client' // USA ESTE CLIENTE

export function useInfraMutations() {
  const queryClient = useQueryClient()
  const supabase = createClient() // Instanciar aquí dentro

  const saveMutation = useMutation({
    mutationFn: async ({ idEdicion, proyectoId, capaId, coords, formData }: any) => {
      // Definimos la operación interna para poder envolverla en un Timeout
      const operation = async () => {
        // 1. Verificamos sesión con el cliente de navegador
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          throw new Error("Sesión expirada o inválida. Por favor reingresa.");
        }

        // 2. Formatear punto WKT: IMPORTANTE: Espacio entre Longitud y Latitud, sin comas.
        // Aseguramos que sean números para evitar strings mal formateados
        const lng = parseFloat(coords.lng);
        const lat = parseFloat(coords.lat);
        const wktPoint = `POINT(${lng} ${lat})`;

        console.log("🚀 Enviando a RPC:", {
          id: idEdicion,
          proyecto: proyectoId,
          capa: capaId,
          geom: wktPoint,
          datos: formData
        });

        // 3. Llamada a la función RPC
        const { data, error } = await supabase.rpc('guardar_infraestructura_completa', {
          p_proyecto_id: proyectoId,
          p_feature_type_id: capaId,
          p_geom: wktPoint,
          p_atributos: formData,
          p_id_edicion: idEdicion ? idEdicion : null
        });

        // Manejo de errores devueltos por la función SQL personalizada
        if (data && data.success === false) {
          throw new Error(data.error || "Error interno en la base de datos");
        }

        if (error) {
          console.error("❌ Error de Supabase RPC:", error);
          throw error;
        }

        return data;
      };

      // 4. Ejecutamos con un timeout de 15 segundos
      return Promise.race([
        operation(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('El servidor tarda demasiado en responder (Timeout)')), 15000)
        )
      ]);
    },
    onSuccess: (data) => {
      console.log("✅ Guardado exitoso:", data);
      // Invalidamos la cache para que el mapa se refresque automáticamente
      queryClient.invalidateQueries({ queryKey: ['infraestructuras'] });
    },
    onError: (error: any) => {
      console.error("❌ Error final en saveMutation:", error);
      alert(`No se pudo guardar: ${error.message}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error("Sesión expirada")

      const { error } = await supabase.from('features').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['infraestructuras'] }),
    onError: (err: any) => alert(`Error al eliminar: ${err.message}`)
  })

  return { saveMutation, deleteMutation }
}