'use client'

import mapboxgl from 'mapbox-gl'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { FeatureCollection, Point } from 'geojson'
import { Button } from '@/components/ui/button'
import { Plus, X, Loader2, RefreshCw, MapPin, Check } from 'lucide-react'
import 'mapbox-gl/dist/mapbox-gl.css'
import FormularioDinamico from '@/components/infra/FormularioDinamico'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

interface Props {
  proyectoId?: string | null
}

export default function Map({ proyectoId }: Props) {
  const mapContainer = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const proyectoIdRef = useRef<string | null>(proyectoId ?? null)
  const marcadorSelectorRef = useRef<mapboxgl.Marker | null>(null)

  // ESTADOS
  const [modoEdicion, setModoEdicion] = useState(false)
  const [capasProyecto, setCapasProyecto] = useState<any[]>([])
  const [capaSeleccionada, setCapaSeleccionada] = useState('')
  const [puntoSeleccionado, setPuntoSeleccionado] = useState<{ lng: number; lat: number } | null>(null)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [isMapReady, setIsMapReady] = useState(false)
  const [errorCarga, setErrorCarga] = useState(false)
  const [confirmandoPosicion, setConfirmandoPosicion] = useState(false)

  const [idEdicion, setIdEdicion] = useState<string | null>(null);
  // Referencia para saber si estamos editando o creando
  const [esEdicion, setEsEdicion] = useState(false);

  /* ============================
      1️⃣ Cargar capas del proyecto
      ============================ */
  useEffect(() => {
    if (!proyectoId) return
    proyectoIdRef.current = proyectoId

    const fetchConfig = async () => {
      const { data, error } = await supabase
        .from('v_proyecto_capas_config')
        .select('*')
        .eq('proyecto_id', proyectoId)

      if (!error && data) {
        setCapasProyecto(
          data.map(d => ({
            id: d.feature_type_id,
            nombre: d.capa_nombre,
            layer: d.capa_codigo
          }))
        )
      }
    }
    fetchConfig()
  }, [proyectoId])

  /* ============================
      2️⃣ Inicializar mapa (UNA VEZ)
      ============================ */
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    let cancelled = false

    const initMap = (coords: [number, number]) => {
      if (cancelled || !mapContainer.current) return

      try {
        const map = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: coords,
          zoom: 15,
          fadeDuration: 0
        })

        map.addControl(new mapboxgl.NavigationControl(), 'top-right')
        map.addControl(
          new mapboxgl.GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: true,
            showUserHeading: true,
            showAccuracyCircle: false
          }),
          'top-right'
        )

        map.once('load', () => {
          if (cancelled) return
          mapRef.current = map
          setIsMapReady(true)

          if (proyectoIdRef.current) {
            cargarInfraestructuras(map)
          }
        })
      } catch (e) {
        console.error("Error al inicializar Mapbox:", e)
        setErrorCarga(true)
      }
    }

    // Priorizar geolocalización inicial para el 'center'
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => initMap([pos.coords.longitude, pos.coords.latitude]),
        () => initMap([-74.08, 4.61]),
        { timeout: 5000, enableHighAccuracy: true }
      )
    } else {
      initMap([-74.08, 4.61])
    }

    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  /* ============================
      3️⃣ Recargar infraestructuras
      ============================ */
  useEffect(() => {
    if (!mapRef.current || !isMapReady || !proyectoId) return
    cargarInfraestructuras(mapRef.current)
  }, [proyectoId, isMapReady])

  /* ============================
      4️⃣ Cargar infraestructuras
      ============================ */
  async function cargarInfraestructuras(map: mapboxgl.Map) {
    try {
      if (!map || !map.getStyle()) return

      const { data, error } = await supabase
        .from('v_infraestructuras_mapa')
        .select('*')
        .eq('proyecto_id', proyectoIdRef.current)

      if (error || !data || !map.getStyle()) return

      const geojson: FeatureCollection<Point> = {
        type: 'FeatureCollection',
        features: data.map(row => ({
          type: 'Feature',
          geometry: row.geometry,
          properties: { id: row.id, capaId: row.feature_type_id, tipo: row.tipo }
        }))
      }

      const source = map.getSource('infra') as mapboxgl.GeoJSONSource
      if (source) {
        source.setData(geojson)
      } else {
        map.addSource('infra', { type: 'geojson', data: geojson })
        map.addLayer({
          id: 'infra-layer',
          type: 'circle',
          source: 'infra',
          paint: {
            'circle-radius': 6,
            'circle-color': '#2563eb',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff'
          }
        })
        // Cambiar el cursor al pasar sobre un punto
        map.on('mouseenter', 'infra-layer', () => {
          map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mouseleave', 'infra-layer', () => {
          map.getCanvas().style.cursor = '';
        });

        // Evento de clic para editar
        map.on('click', 'infra-layer', async (e) => {
          if (!e.features || e.features.length === 0) return;

          const feature = e.features[0];
          const id = feature.properties?.id;
          const cId = feature.properties?.capaId; // El UUID de la capa
          const geometry = feature.geometry as Point;

          console.log("Punto tocado - ID:", id, "Capa:", cId); // LOG PARA DEBUG

          if (id) {
            setIdEdicion(id);
            setEsEdicion(true);
            setCapaSeleccionada(cId); // <-- Aquí estaba el error de sintaxis en tu post
            setPuntoSeleccionado({ 
              lng: geometry.coordinates[0], 
              lat: geometry.coordinates[1] 
            });
            setMostrarFormulario(true);
          }
        });
      }
    } catch (e) {
      console.error('Error cargando puntos:', e)
      setErrorCarga(true)
    }
  }

  /* ============================
      5️⃣ UI handlers (Modo Selección)
      ============================ */
  const handleSeleccionarCapa = (id: string) => {
    if (!id || !mapRef.current) return
    
    setCapaSeleccionada(id)
    setModoEdicion(false)
    setConfirmandoPosicion(true)

    // Crear marcador arrastrable en el centro actual
    const centro = mapRef.current.getCenter()
    
    // Si ya existe un marcador previo, lo quitamos
    if (marcadorSelectorRef.current) marcadorSelectorRef.current.remove()

    const marker = new mapboxgl.Marker({ 
      draggable: true, 
      color: '#ef4444' 
    })
      .setLngLat(centro)
      .addTo(mapRef.current)

    marcadorSelectorRef.current = marker
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

  const handleCancelarSeleccion = () => {
    if (marcadorSelectorRef.current) {
      marcadorSelectorRef.current.remove()
      marcadorSelectorRef.current = null
    }
    setConfirmandoPosicion(false)
    setCapaSeleccionada('')
  }

  /* ============================
      6️⃣ Render
      ============================ */
  if (!proyectoId) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-50 gap-2">
        <Loader2 className="animate-spin text-blue-600" />
        <span className="text-xs text-slate-400">Identificando Proyecto...</span>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full bg-slate-100 overflow-hidden">
      {/* Pantalla de Carga/Error Global */}
      {!isMapReady && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 gap-4">
          {errorCarga ? (
            <div className="text-center">
              <p className="text-sm font-bold text-red-500 mb-2">Error al cargar el mapa</p>
              <Button onClick={() => window.location.reload()} variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" /> Reintentar
              </Button>
            </div>
          ) : (
            <>
              <Loader2 className="animate-spin text-blue-600 h-10 w-10" />
              <p className="text-xs font-bold text-slate-500 uppercase">Sincronizando WebGL...</p>
            </>
          )}
        </div>
      )}

      {/* Botón Principal / Selector de Capas */}
      <div className="absolute top-4 left-4 z-10">
        {!modoEdicion && !confirmandoPosicion ? (
          <Button
            onClick={() => setModoEdicion(true)}
            disabled={!isMapReady}
            className="bg-blue-600 hover:bg-blue-700 shadow-lg gap-2"
          >
            <Plus size={16} /> Agregar Elemento
          </Button>
        ) : modoEdicion && (
          <div className="bg-white p-4 rounded-xl shadow-2xl w-64 border animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Nueva Infraestructura
              </span>
              <button onClick={() => setModoEdicion(false)} className="text-slate-400 hover:text-red-500">
                <X size={16} />
              </button>
            </div>

            <select
              className="w-full p-2 border rounded-lg text-sm bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500"
              value={capaSeleccionada}
              onChange={e => handleSeleccionarCapa(e.target.value)}
            >
              <option value="">Selecciona tipo...</option>
              {capasProyecto.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Banner de Confirmación de Ubicación */}
      {confirmandoPosicion && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[20] bg-white p-4 rounded-2xl shadow-2xl border-2 border-blue-500 flex flex-col items-center gap-3 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2 text-blue-600">
            <MapPin size={18} className="animate-bounce" />
            <p className="text-sm font-bold">Arrastra el marcador rojo</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCancelarSeleccion}>
              Cancelar
            </Button>
            <Button className="bg-green-600 hover:bg-green-700 gap-2" size="sm" onClick={handleConfirmarPunto}>
              <Check size={16} /> Confirmar Ubicación
            </Button>
          </div>
        </div>
      )}

      {/* Contenedor del Mapa */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Formulario Modal */}
      {mostrarFormulario && puntoSeleccionado && (
        <FormularioDinamico
          key={idEdicion || 'nuevo'}
          idEdicion={idEdicion}
          capaId={capaSeleccionada}
          proyectoId={proyectoId}
          coordenadas={puntoSeleccionado}
          onClose={() => {
            setMostrarFormulario(false)
            setCapaSeleccionada('')
            setIdEdicion(null)
          }}
          onSave={() => {
            setMostrarFormulario(false)
            setCapaSeleccionada('')
            setIdEdicion(null)
            if (mapRef.current) cargarInfraestructuras(mapRef.current)
          }}
        />
      )}
    </div>
  )
}