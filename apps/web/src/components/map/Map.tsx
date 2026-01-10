'use client'

import mapboxgl from 'mapbox-gl'
import { useEffect, useRef, useState } from 'react'
import { renderToString } from 'react-dom/server'
import { createClient } from '@/utils/supabase/client'
import type { FeatureCollection, Point } from 'geojson'
import { Button } from '@/components/ui/button'
import { Plus, X, Loader2, MapPin, Check, Navigation } from 'lucide-react'
import * as Icons from 'lucide-react' // Importamos todos los iconos para el mapeo
import 'mapbox-gl/dist/mapbox-gl.css'
import FormularioDinamico from '@/components/infra/FormularioDinamico'
import { useInfraestructuras } from '@/hooks/useInfraestructuras'
import { useQueryClient } from '@tanstack/react-query'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

interface Props {
  proyectoId: string
}

export default function Map({ proyectoId }: Props) {
  const queryClient = useQueryClient()
  const mapContainer = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const marcadorSelectorRef = useRef<mapboxgl.Marker | null>(null)
  const supabase = createClient()

  // ESTADOS
  const [modoEdicion, setModoEdicion] = useState(false)
  const [capasProyecto, setCapasProyecto] = useState<any[]>([])
  const [capaSeleccionada, setCapaSeleccionada] = useState('')
  const [puntoSeleccionado, setPuntoSeleccionado] = useState<{ lng: number; lat: number } | null>(null)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [isMapReady, setIsMapReady] = useState(false)
  const [errorCarga, setErrorCarga] = useState(false)
  const [confirmandoPosicion, setConfirmandoPosicion] = useState(false)
  const [idEdicion, setIdEdicion] = useState<string | null>(null)

  const { data: infraData, isLoading: isLoadingInfra } = useInfraestructuras(proyectoId)

  // Función Utility para convertir componente Lucide a Imagen para Mapbox
  const getLucideIconAsImage = (iconName: string, color: string) => {
    const IconComponent = (Icons as any)[iconName] || Icons.MapPin
    const svgString = renderToString(
      <IconComponent color={color} size={32} strokeWidth={2.5} />
    )
    const svgBase64 = btoa(svgString)
    return `data:image/svg+xml;base64,${svgBase64}`
  }

  const resetearTodo = () => {
    setModoEdicion(false)
    setConfirmandoPosicion(false)
    setCapaSeleccionada('')
    setMostrarFormulario(false)
    setIdEdicion(null)
    setPuntoSeleccionado(null)
    if (marcadorSelectorRef.current) {
      marcadorSelectorRef.current.remove()
      marcadorSelectorRef.current = null
    }
  }

  // Cargar configuración de capas
  useEffect(() => {
    if (!proyectoId) return
    const fetchConfig = async () => {
      const { data, error } = await supabase
        .from('v_proyecto_capas_config')
        .select('*')
        .eq('proyecto_id', proyectoId)

      if (!error && data) {
        setCapasProyecto(data.map(d => ({
          id: d.feature_type_id,
          nombre: d.capa_nombre,
          layer: d.capa_codigo,
          icono: d.capa_icono 
        })))
      }
    }
    fetchConfig()
  }, [proyectoId, supabase])

  // INICIALIZACIÓN DEL MAPA
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    const initMap = (coords: [number, number]) => {
      const map = new mapboxgl.Map({
        container: mapContainer.current!,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: coords,
        zoom: 15,
        pitch: 45,
        antialias: true
      })

      map.addControl(new mapboxgl.NavigationControl(), 'top-right')
      map.addControl(new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true
      }), 'top-right')

      map.on('load', () => {
        mapRef.current = map
        setIsMapReady(true)
      })

      map.on('error', () => setErrorCarga(true))
    }

    navigator.geolocation.getCurrentPosition(
      pos => initMap([pos.coords.longitude, pos.coords.latitude]),
      () => initMap([-74.08, 4.61]),
      { timeout: 5000 }
    )

    return () => mapRef.current?.remove()
  }, [])

  // SINCRONIZACIÓN DE PUNTOS E ICONOS
  useEffect(() => {
    const map = mapRef.current
    if (!map || !isMapReady || !infraData) return

    // Pre-cargar todos los iconos necesarios en el Sprite de Mapbox
    const uniqueIcons = Array.from(new Set(infraData.map((i: any) => i.capa_icono || 'MapPin')))
    
    uniqueIcons.forEach((iconName: any) => {
      if (!map.hasImage(iconName)) {
        const img = new Image()
        img.onload = () => map.addImage(iconName, img)
        img.src = getLucideIconAsImage(iconName, '#ffffff')
      }
    })

    const geojson: FeatureCollection<Point> = {
      type: 'FeatureCollection',
      features: infraData.map((row: any) => ({
        type: 'Feature',
        geometry: row.geometry,
        properties: { 
          id: row.id, 
          capaId: row.feature_type_id,
          icono: row.capa_icono || 'MapPin',
          estado: row.estado
        }
      }))
    }

    if (map.getSource('infra')) {
      (map.getSource('infra') as mapboxgl.GeoJSONSource).setData(geojson)
    } else {
      map.addSource('infra', { type: 'geojson', data: geojson })
      
      // Capa de fondo circular
      map.addLayer({
        id: 'infra-bg',
        type: 'circle',
        source: 'infra',
        paint: {
          'circle-radius': 14,
          'circle-color': [
            'match',
            ['get', 'estado'],
            'preliminar', '#94a3b8', // Gris
            'validado', '#22c55e',   // Verde
            'proyeccion', '#ef4444', // Rojo
            '#3b82f6'                // Azul fallback
          ],
          'circle-opacity': [
            'case',
            ['==', ['get', 'estado'], 'preliminar'], 0.6, 1
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });
      map.addLayer({
        id: 'infra-layer', // Mantenemos este ID porque los eventos 'click' lo usan
        type: 'symbol',
        source: 'infra',
        layout: {
          'icon-image': ['get', 'icono'],
          'icon-size': 0.55,
          'icon-allow-overlap': true,
          'icon-ignore-placement': true // Crucial para que siempre detecte el clic
        }
      });

      map.on('click', 'infra-layer', (e) => {
        const feat = e.features?.[0]
        if (!feat) return
        const geom = feat.geometry as Point
        setIdEdicion(feat.properties?.id)
        setCapaSeleccionada(feat.properties?.capaId)
        setPuntoSeleccionado({ lng: geom.coordinates[0], lat: geom.coordinates[1] })
        setMostrarFormulario(true)
      })

      map.on('mouseenter', 'infra-layer', () => map.getCanvas().style.cursor = 'pointer')
      map.on('mouseleave', 'infra-layer', () => map.getCanvas().style.cursor = '')
    }
  }, [infraData, isMapReady])

  const handleSeleccionarCapa = (id: string) => {
    if (!id || !mapRef.current) return
    marcadorSelectorRef.current?.remove()
    setCapaSeleccionada(id)
    setModoEdicion(false)
    setConfirmandoPosicion(true)

    const centro = mapRef.current.getCenter()
    const nuevoMarcador = new mapboxgl.Marker({ draggable: true, color: '#ef4444' })
      .setLngLat(centro)
      .addTo(mapRef.current)

    marcadorSelectorRef.current = nuevoMarcador
    mapRef.current.easeTo({ center: centro })
  }

  const handleConfirmarPunto = () => {
    if (marcadorSelectorRef.current) {
      const { lng, lat } = marcadorSelectorRef.current.getLngLat()
      setPuntoSeleccionado({ lng, lat })
      setMostrarFormulario(true)
      setConfirmandoPosicion(false)
      marcadorSelectorRef.current.remove()
      marcadorSelectorRef.current = null
    }
  }

  return (
    <div className="relative w-full h-full bg-slate-100">
      <Button 
        variant="outline" 
        size="icon" 
        className="absolute bottom-24 right-2.5 z-10 bg-white shadow-md rounded-full"
        onClick={() => {
          navigator.geolocation.getCurrentPosition(pos => {
            mapRef.current?.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 17 })
          })
        }}
      >
        <Navigation size={18} className="text-blue-600" />
      </Button>

      {(!isMapReady || isLoadingInfra) && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
          <Loader2 className="animate-spin text-blue-600 mb-2" size={40} />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Sincronizando...</p>
        </div>
      )}

      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        {!modoEdicion && !confirmandoPosicion && (
          <Button onClick={() => setModoEdicion(true)} className="bg-blue-600 hover:bg-blue-700 shadow-xl">
            <Plus className="mr-2" size={18} /> Nuevo Elemento
          </Button>
        )}

        {modoEdicion && (
          <div className="bg-white p-4 rounded-xl shadow-2xl w-64 border animate-in slide-in-from-left-2">
            <div className="flex justify-between items-center mb-3 text-slate-900">
              <span className="text-[10px] font-black text-slate-400 uppercase">Seleccionar Tipo</span>
              <button onClick={() => setModoEdicion(false)}><X size={16} /></button>
            </div>
            <select 
              className="w-full p-2 border rounded-lg text-sm outline-none text-slate-900"
              onChange={(e) => handleSeleccionarCapa(e.target.value)}
              value={capaSeleccionada}
            >
              <option value="">Elegir capa...</option>
              {capasProyecto.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
        )}
      </div>

      {confirmandoPosicion && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 bg-white p-4 rounded-2xl shadow-2xl border-2 border-blue-500 flex flex-col items-center gap-3">
          <p className="text-sm font-bold text-blue-600 flex items-center gap-2">
            <MapPin size={18} /> Arrastra el marcador
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={resetearTodo}>Cancelar</Button>
            <Button className="bg-green-600 hover:bg-green-700" size="sm" onClick={handleConfirmarPunto}>
              <Check className="mr-1" size={16} /> Confirmar Aquí
            </Button>
          </div>
        </div>
      )}

      <div ref={mapContainer} className="w-full h-full" />

      {mostrarFormulario && puntoSeleccionado && (
        <FormularioDinamico
          idEdicion={idEdicion}
          capaId={capaSeleccionada}
          proyectoId={proyectoId}
          coordenadas={puntoSeleccionado}
          onClose={resetearTodo}
          onSave={() => {
            resetearTodo()
            queryClient.invalidateQueries({ queryKey: ['infraestructuras'] })
          }}
        />
      )}
    </div>
  )
}