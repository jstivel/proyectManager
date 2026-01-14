'use client'

import mapboxgl from 'mapbox-gl'
import { useEffect, useRef, useState } from 'react'
import { renderToString } from 'react-dom/server'
import { createClient } from '@/utils/supabase/client'
import type { FeatureCollection, Point } from 'geojson'
import { Loader2, X } from 'lucide-react'
import * as Icons from 'lucide-react'
import 'mapbox-gl/dist/mapbox-gl.css'
import FormularioDinamico from '@/components/infra/FormularioDinamico'
import { useInfraestructuras } from '@/hooks/useInfraestructuras'
import { useQueryClient } from '@tanstack/react-query'
import SearchPanel from './SearchPanel'
import FloatingDock from './FloatingDock' 
import LayerControl from './LayerControl'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

interface Props {
  proyectoId: string
}

export default function Map({ proyectoId }: Props) {
  const queryClient = useQueryClient()
  const mapContainer = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const marcadorSelectorRef = useRef<mapboxgl.Marker | null>(null)
  const geolocateControlRef = useRef<mapboxgl.GeolocateControl | null>(null)
  const supabase = createClient()

  // --- ESTADOS DE UI (PANELES) ---
  const [showSearch, setShowSearch] = useState(false)
  const [showLayers, setShowLayers] = useState(false)
  const [modoEdicion, setModoEdicion] = useState(false)
  
  // --- ESTADOS DE LÓGICA ---
  const [gpsActivo, setGpsActivo] = useState(false)
  const [capasProyecto, setCapasProyecto] = useState<any[]>([])
  const [capaSeleccionada, setCapaSeleccionada] = useState('')
  const [puntoSeleccionado, setPuntoSeleccionado] = useState<{ lng: number; lat: number } | null>(null)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [isMapReady, setIsMapReady] = useState(false)
  const [confirmandoPosicion, setConfirmandoPosicion] = useState(false)
  const [idEdicion, setIdEdicion] = useState<string | null>(null)
  const [capasVisibles, setCapasVisibles] = useState<string[]>([])
  const [idsResaltados, setIdsResaltados] = useState<string[]>([])

  // --- NUEVO ESTADO PARA CARGA DINÁMICA (BBOX) ---
  const [mapBounds, setMapBounds] = useState<any>(null)

  // Hook actualizado: ahora pide datos según lo que se ve en el mapa
  const { data: infraData, isLoading: isLoadingInfra } = useInfraestructuras(proyectoId, mapBounds)

  const togglePanel = (panel: 'search' | 'layers' | 'edit') => {
    setShowSearch(panel === 'search' ? !showSearch : false);
    setShowLayers(panel === 'layers' ? !showLayers : false);
    setModoEdicion(panel === 'edit' ? !modoEdicion : false);
    
    if (panel !== 'edit' || modoEdicion) {
      if (!confirmandoPosicion) {
        marcadorSelectorRef.current?.remove();
        marcadorSelectorRef.current = null;
      }
    }
  };

  const handleZoomIn = () => mapRef.current?.zoomIn()
  const handleZoomOut = () => mapRef.current?.zoomOut()

  const handleLocate = () => {
    const geolocate = geolocateControlRef.current;
    if (!geolocate) return;
    const nativeBtn = document.querySelector('.mapboxgl-ctrl-geolocate') as HTMLButtonElement;
    if (nativeBtn) {
      nativeBtn.click();
      setGpsActivo(!gpsActivo);
      if (!gpsActivo) {
        setTimeout(() => { mapRef.current?.easeTo({ zoom: 19, pitch: 0 }); }, 800);
      }
    }
  };

  const getLucideIconAsImage = (iconName: string, color: string) => {
    const IconComponent = (Icons as any)[iconName] || Icons.MapPin
    const svgString = renderToString(<IconComponent color={color} size={32} strokeWidth={2.5} />)
    return `data:image/svg+xml;base64,${btoa(svgString)}`
  }

  const resetearTodo = () => {
    setModoEdicion(false); setConfirmandoPosicion(false); setCapaSeleccionada('');
    setMostrarFormulario(false); setIdEdicion(null); setPuntoSeleccionado(null);
    setIdsResaltados([]);

    if (marcadorSelectorRef.current) {
      marcadorSelectorRef.current.remove();
      marcadorSelectorRef.current = null;
    }

    const map = mapRef.current;
    if (map && map.getLayer('infra-layer')) {
      const filter = ['in', ['get', 'capaId'], ['literal', capasVisibles.length > 0 ? capasVisibles : ['none']]];
      map.setFilter('infra-layer', filter);
      map.setFilter('infra-bg', filter);
      const visibilidad = capasVisibles.length === 0 ? 'none' : 'visible';
      map.setLayoutProperty('infra-layer', 'visibility', visibilidad);
      map.setLayoutProperty('infra-bg', 'visibility', visibilidad);
      map.setLayoutProperty('infra-highlight', 'visibility', 'none');
    }
  };

  // 1. CONFIGURACIÓN DE CAPAS
  useEffect(() => {
    if (!proyectoId) return
    const fetchConfig = async () => {
      const { data, error } = await supabase.from('v_proyecto_capas_config').select('*').eq('proyecto_id', proyectoId)
      if (!error && data) {
        const nuevasCapas = data.map(d => ({
          id: d.feature_type_id, nombre: d.capa_nombre, layer: d.capa_codigo, icono: d.capa_icono 
        }));
        setCapasProyecto(nuevasCapas);
        setCapasVisibles(nuevasCapas.map(c => c.id));
      }
    }
    fetchConfig()
  }, [proyectoId, supabase]);

  // 2. FILTRADO Y RESALTADO
  useEffect(() => {
    if (!mapRef.current || !isMapReady) return;
    const map = mapRef.current;
    
    if (map.getLayer('infra-layer')) {
      const tieneResaltado = idsResaltados.length > 0;
      if (tieneResaltado) {
        const filterResaltado = ['in', ['get', 'id'], ['literal', idsResaltados]];
        map.setFilter('infra-layer', filterResaltado);
        map.setFilter('infra-bg', filterResaltado);
        map.setFilter('infra-highlight', filterResaltado);
        map.setLayoutProperty('infra-layer', 'visibility', 'visible');
        map.setLayoutProperty('infra-bg', 'visibility', 'visible');
        map.setLayoutProperty('infra-highlight', 'visibility', 'visible');
      } else {
        const visibilidad = capasVisibles.length === 0 ? 'none' : 'visible';
        const filterCapas = ['in', ['get', 'capaId'], ['literal', capasVisibles]];
        map.setFilter('infra-layer', filterCapas);
        map.setFilter('infra-bg', filterCapas);
        map.setLayoutProperty('infra-layer', 'visibility', visibilidad);
        map.setLayoutProperty('infra-bg', 'visibility', visibilidad);
        map.setLayoutProperty('infra-highlight', 'visibility', 'none');
      }
    }
  }, [capasVisibles, idsResaltados, isMapReady]);

  // 3. INICIALIZACIÓN Y EVENTO DE MOVIMIENTO
  // 3. INICIALIZACIÓN Y EVENTO DE MOVIMIENTO
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return
    
    const initMap = (coords: [number, number]) => {
      const map = new mapboxgl.Map({
        container: mapContainer.current!,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: coords, zoom: 17, pitch: 45, antialias: true, attributionControl: false
      })

      const geolocate = new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true, showUserHeading: true
      })
      map.addControl(geolocate)
      geolocateControlRef.current = geolocate

      // Función auxiliar para extraer bounds de forma segura
      const updateBoundsState = (m: mapboxgl.Map) => {
        const b = m.getBounds();
        if (b) {
          const sw = b.getSouthWest();
          const ne = b.getNorthEast();
          setMapBounds({
            sw: { lng: sw.lng, lat: sw.lat },
            ne: { lng: ne.lng, lat: ne.lat }
          });
        }
      };

      map.on('load', () => {
        mapRef.current = map
        setIsMapReady(true)

        // Capturar bounds iniciales al cargar
        updateBoundsState(map);
      })

      // EVENTO CLAVE: Actualizar bounds cuando el usuario deja de mover el mapa
      map.on('moveend', () => {
        updateBoundsState(map);
      });
    }

    navigator.geolocation.getCurrentPosition(
      pos => initMap([pos.coords.longitude, pos.coords.latitude]),
      () => initMap([-74.08, 4.61]),
      { timeout: 5000 }
    )
    return () => mapRef.current?.remove()
  }, [])

  // 4. RENDERIZADO DE GEOJSON
  useEffect(() => {
    const map = mapRef.current
    if (!map || !isMapReady || !infraData) return

    infraData.forEach((row: any) => {
      const iconName = row.capa_icono || 'MapPin'
      if (!map.hasImage(iconName)) {
        const img = new Image();
        img.onload = () => { if (!map.hasImage(iconName)) map.addImage(iconName, img) };
        img.src = getLucideIconAsImage(iconName, '#ffffff');
      }
    });

    const geojson: FeatureCollection<Point> = {
      type: 'FeatureCollection',
      features: infraData.map((row: any) => ({
        type: 'Feature', geometry: row.geometry,
        properties: { 
          id: row.id, id_tecnico: row.id_tecnico, capaId: row.feature_type_id,
          icono: row.capa_icono || 'MapPin', estado: row.estado
        }
      }))
    }

    if (map.getSource('infra')) {
      (map.getSource('infra') as mapboxgl.GeoJSONSource).setData(geojson)
    } else {
      map.addSource('infra', { type: 'geojson', data: geojson })
      map.addLayer({
        id: 'infra-highlight', type: 'circle', source: 'infra',
        layout: { 'visibility': 'none' },
        paint: { 'circle-radius': 22, 'circle-color': '#ffffff', 'circle-opacity': 0.8, 'circle-blur': 0.5 }
      })
      map.addLayer({
        id: 'infra-bg', type: 'circle', source: 'infra',
        paint: {
          'circle-radius': 14,
          'circle-color': ['match', ['get', 'estado'], 'preliminar', '#94a3b8', 'validado', '#22c55e', 'proyeccion', '#ef4444', '#3b82f6'],
          'circle-stroke-width': 2, 'circle-stroke-color': '#ffffff'
        }
      })
      map.addLayer({
        id: 'infra-layer', type: 'symbol', source: 'infra',
        layout: { 'icon-image': ['get', 'icono'], 'icon-size': 0.55, 'icon-allow-overlap': true }
      })
      map.on('click', 'infra-layer', (e) => {
        const feat = e.features?.[0]; if (!feat) return;
        const geom = feat.geometry as Point;
        setIdEdicion(feat.properties?.id); 
        setCapaSeleccionada(feat.properties?.capaId);
        setPuntoSeleccionado({ lng: geom.coordinates[0], lat: geom.coordinates[1] });
        setMostrarFormulario(true);
      })
    }
  }, [infraData, isMapReady])

  const handleSeleccionarCapa = (id: string) => {
    if (!id || !mapRef.current) return
    marcadorSelectorRef.current?.remove()
    setCapaSeleccionada(id); setModoEdicion(false); setConfirmandoPosicion(true);
    const centro = mapRef.current.getCenter()
    marcadorSelectorRef.current = new mapboxgl.Marker({ draggable: true, color: '#ef4444' })
      .setLngLat(centro).addTo(mapRef.current)
  }

  return (
    <div className="relative w-full h-full bg-slate-100 overflow-hidden">
      {(!isMapReady || isLoadingInfra) && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
          <Loader2 className="animate-spin text-blue-600 mb-2" size={40} />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Sincronizando...</p>
        </div>
      )}

      <FloatingDock 
        onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} onLocate={handleLocate}
        onAddElement={() => togglePanel('edit')}
        toggleSearch={() => togglePanel('search')}
        toggleLayers={() => togglePanel('layers')}
        isAdding={modoEdicion || confirmandoPosicion}
        gpsActivo={gpsActivo}
      />

      {showLayers && <LayerControl capas={capasProyecto} visibles={capasVisibles} onChange={setCapasVisibles} />}

      {showSearch && (
        <SearchPanel 
          proyectoId={proyectoId} capas={capasProyecto}
          onClose={() => { setShowSearch(false); setIdsResaltados([]); }}
          onApplyFilters={(filtrados: any[]) => {
            const ids = filtrados.map(f => f.id);
            setIdsResaltados(ids);
            if (ids.length > 0 && mapRef.current) {
                const bounds = new mapboxgl.LngLatBounds();
                filtrados.forEach(f => {
                  const c = f.geom?.coordinates || f.geometry?.coordinates;
                  if (c) bounds.extend([c[0], c[1]]);
                });
                mapRef.current.fitBounds(bounds, { padding: 80, maxZoom: 18 });
            }
          }}
          onResultClick={(lng, lat, id, capaId) => {
            if (!capasVisibles.includes(capaId)) setCapasVisibles(prev => [...prev, capaId]);
            setIdsResaltados([id]);
            mapRef.current?.flyTo({ center: [lng, lat], zoom: 19, pitch: 45 })
            setIdEdicion(id); setCapaSeleccionada(capaId);
            setPuntoSeleccionado({ lng, lat }); setMostrarFormulario(true); setShowSearch(false);
          }}
        />
      )}

      {modoEdicion && (
        <div className="absolute top-4 right-20 z-10 bg-white p-4 rounded-xl shadow-2xl w-64 border animate-in fade-in zoom-in">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-black text-slate-400 uppercase">Nueva Infraestructura</span>
            <button onClick={() => setModoEdicion(false)}><X size={16} /></button>
          </div>
          <select 
            className="w-full p-2.5 border rounded-lg text-sm bg-slate-50 text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20"
            onChange={(e) => handleSeleccionarCapa(e.target.value)}
            value={capaSeleccionada}
          >
            <option value="">Seleccionar tipo...</option>
            {capasProyecto.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
      )}

      {confirmandoPosicion && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 bg-white p-4 rounded-2xl shadow-2xl border-2 border-blue-500 flex flex-col items-center gap-3 animate-in slide-in-from-bottom-4">
          <p className="text-sm font-bold text-blue-600 flex items-center gap-2">
            <Icons.MapPin size={18} /> Arrastre el marcador
          </p>
          <div className="flex gap-2">
            <button onClick={resetearTodo} className="px-4 py-2 text-xs font-bold text-slate-400">CANCELAR</button>
            <button 
              onClick={() => {
                const { lng, lat } = marcadorSelectorRef.current!.getLngLat()
                setPuntoSeleccionado({ lng, lat }); setMostrarFormulario(true);
                setConfirmandoPosicion(false); marcadorSelectorRef.current?.remove();
              }}
              className="px-6 py-2 text-sm font-bold bg-green-600 text-white rounded-xl shadow-lg"
            >
              CONFIRMAR UBICACIÓN
            </button>
          </div>
        </div>
      )}

      <div ref={mapContainer} className="w-full h-full" />

      {mostrarFormulario && puntoSeleccionado && (
        <FormularioDinamico
          idEdicion={idEdicion} capaId={capaSeleccionada} proyectoId={proyectoId}
          coordenadas={puntoSeleccionado} onClose={resetearTodo}
          onSave={() => { 
            resetearTodo(); 
            queryClient.invalidateQueries({ queryKey: ['infraestructuras'] }); 
          }}
        />
      )}
    </div>
  )
}