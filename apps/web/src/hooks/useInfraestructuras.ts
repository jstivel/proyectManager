'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { saveInfraestructura, deleteInfraestructura } from '@/app/actions/infraestructura'
import { toast } from 'sonner'
import { Infraestructura, MapBounds, QueryOptions } from '@/types'

export function useInfraestructura(proyectoId?: string | null) {
  const supabase = createClient()
  const queryClient = useQueryClient()

  // 1. Carga optimizada para el Mapa (Bounding Box) - VERSIÓN MEJORADA
  const useMapa = (bounds: MapBounds | null) => useQuery<Infraestructura[]>({
    queryKey: ['infra_mapa', proyectoId, bounds],
    queryFn: async () => {
      if (!proyectoId || !bounds) return []
      
      try {
        // Validar límites del bounding box
        const { west, south, east, north } = bounds;
        if (south < -90 || north > 90 || west < -180 || east > 180) {
          throw new Error('Coordenadas fuera de rango válido');
        }
        
        if (south >= north || west >= east) {
          throw new Error('Bounding box inválido');
        }

        // Limitar el tamaño del bbox para prevenir abusos
        const latSpan = north - south;
        const lngSpan = east - west;
        if (latSpan > 2 || lngSpan > 2) { // Reducido para mejor rendimiento
          throw new Error('Área de búsqueda demasiado grande');
        }

        const { data, error } = await supabase.rpc('get_infra_by_bbox_seguro', {
          p_proyecto_id: proyectoId,
          p_min_lng: Number(west.toFixed(6)), 
          p_min_lat: Number(south.toFixed(6)),
          p_max_lng: Number(east.toFixed(6)), 
          p_max_lat: Number(north.toFixed(6)),
          p_limit: 1000 // Límite de resultados
        })
        
        if (error) {
          console.error("Error RPC en get_infra_by_bbox_seguro:", error);
          throw error;
        }

        // Validar y sanitizar resultados
        if (!Array.isArray(data)) {
          throw new Error('Formato de datos inválido');
        }

        return data.map(item => ({
          id: item.id,
          nombre: item.tipo_nombre || item.nombre || 'Sin nombre',
          proyecto_id: item.proyecto_id,
          tipo: item.tipo_nombre || item.tipo || 'Desconocido',
          latitud: item.latitud || 0,
          longitud: item.longitud || 0,
          estado: item.estado || 'PENDIENTE',
          descripcion: item.descripcion || null,
          created_at: item.created_at,
          properties: item.atributos || {},
          feature_type_id: item.feature_type_id,
          geom: item.geom
        }));
        
      } catch (error: any) {
        console.error("Error en useMapa query:", error.message);
        throw error;
      }
    },
    enabled: !!proyectoId && !!bounds,
    staleTime: 1000 * 60 * 2, // 2 minutos
    placeholderData: (prev) => prev || [],
    refetchOnWindowFocus: false,
    retry: 2, // Reintentar hasta 2 veces
    retryDelay: 1000, // 1 segundo entre reintentos
  })

  // 2. Carga para Ficha Técnica - VERSIÓN MEJORADA
  const useDetalle = (featureId?: string | null) => useQuery({
    queryKey: ['infra_detalle', featureId],
    queryFn: async () => {
      if (!featureId) return null
      
      try {
        // Validación de UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(featureId)) {
          throw new Error('ID de feature inválido');
        }

        const { data, error } = await supabase.rpc('get_feature_detallado_rpc_seguro', { 
          p_feature_id: featureId 
        })
        
        if (error) {
          console.error("Error RPC en get_feature_detallado_rpc_seguro:", error);
          throw error;
        }
        
        if (!data || !Array.isArray(data) || data.length === 0) {
          return null;
        }

        const item = data[0];
        return {
          id: item.id,
          nombre: item.tipo_nombre || item.nombre || 'Sin nombre',
          proyecto_id: item.proyecto_id,
          tipo: item.tipo_nombre || item.tipo || 'Desconocido',
          latitud: item.latitud || 0,
          longitud: item.longitud || 0,
          estado: item.estado || 'PENDIENTE',
          descripcion: item.descripcion || null,
          created_at: item.created_at,
          properties: item.atributos || {},
          feature_type_id: item.feature_type_id,
          geom: item.geom
        };
        
      } catch (error: any) {
        console.error("Error en useDetalle query:", error.message);
        throw error;
      }
    },
    enabled: !!featureId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 2,
    retryDelay: 1000,
  })

  const saveMutation = useMutation({
    mutationFn: saveInfraestructura,
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ['infra_mapa'] })
      const previous = queryClient.getQueryData(['infra_mapa'])
      return { previous }
    },
    onError: (err: any, newData, context) => {
      toast.error('Error al guardar: ' + err.message)
      if (context?.previous) {
        queryClient.setQueryData(['infra_mapa'], context.previous)
      }
    },
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error)
      } else {
        queryClient.invalidateQueries({ queryKey: ['infra_mapa'] })
        queryClient.invalidateQueries({ queryKey: ['infra_detalle'] })
        toast.success('Infraestructura guardada')
      }
    }
  })

  const deleteMutation = useMutation({
    mutationFn: ({ id, proyectoId }: { id: string, proyectoId: string }) => 
      deleteInfraestructura(id, proyectoId),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['infra_mapa'] })
      const previous = queryClient.getQueryData(['infra_mapa'])
      queryClient.setQueryData(['infra_mapa'], (old: Infraestructura[] = []) => 
        old.filter(item => item.id !== variables.id)
      )
      return { previous }
    },
    onError: (err: any, variables, context) => {
      toast.error('Error al eliminar: ' + err.message)
      if (context?.previous) {
        queryClient.setQueryData(['infra_mapa'], context.previous)
      }
    },
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Elemento eliminado')
      }
    }
  })

  return { useMapa, useDetalle, saveMutation, deleteMutation }
}