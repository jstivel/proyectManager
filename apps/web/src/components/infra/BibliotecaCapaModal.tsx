'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2, Plus, MapPin, Database, ChevronRight, Tags } from 'lucide-react'
import * as LucideIcons from 'lucide-react'

interface AtributoInput {
  campo: string
  tipo: string
  requerido: boolean
  opciones?: string 
}

interface LayerGis {
  id: string
  nombre_tecnico: string
}

export default function BibliotecaCapaModal({ isOpen, onClose, onSuccess, capa }: any) {
  const [loading, setLoading] = useState(false)
  const [nombre, setNombre] = useState('')
  const [layerId, setLayerId] = useState('') // Ahora guardamos el UUID de la tabla layers
  const [layersGis, setLayersGis] = useState<LayerGis[]>([])
  const [icono, setIcono] = useState('MapPin')
  const [atributos, setAtributos] = useState<AtributoInput[]>([
    { campo: '', tipo: 'text', requerido: false, opciones: '' }
  ])

  // Estado para crear nueva Layer Maestra (GIS)
  const [mostrarCreadorLayer, setMostrarCreadorLayer] = useState(false)
  const [nuevoNombreTecnico, setNuevoNombreTecnico] = useState('')

  const ICONOS_DISPONIBLES = [
    'Square', 'Lamp', 'Router', 'Spline', 'Cable', 'RadioTower',
    'HardHat', 'Hammer', 'Compass', 'TriangleAlert',
    'Zap', 'Droplet', 'Wifi', 'Lightbulb', 'MapPin', 'Flag', 'Trash2', 'Home'
  ];

  const supabase = createClient()

  // Cargar Layers Maestras desde la BD
  const fetchLayers = async () => {
    const { data, error } = await supabase.from('layers').select('id, nombre_tecnico').order('nombre_tecnico')
    if (!error && data) setLayersGis(data)
  }

  useEffect(() => {
    if (isOpen) {
      fetchLayers()
      if (capa) {
        setNombre(capa.nombre || '')
        setLayerId(capa.layer_id || '') // Usamos layer_id
        setIcono(capa.icono || 'MapPin')
        const atribsFormateados = capa.attribute_definitions?.map((a: any) => ({
          ...a,
          opciones: Array.isArray(a.opciones) ? a.opciones.join(', ') : ''
        }))
        setAtributos(atribsFormateados?.length > 0 
          ? atribsFormateados 
          : [{ campo: '', tipo: 'text', requerido: false, opciones: '' }]
        )
      } else {
        setNombre('')
        setLayerId('')
        setIcono('MapPin')
        setAtributos([{ campo: '', tipo: 'text', requerido: false, opciones: '' }])
      }
    }
  }, [capa, isOpen])

  if (!isOpen) return null

  const handleCrearNuevaLayer = async () => {
    if (!nuevoNombreTecnico) return
    setLoading(true)
    try {
      const slug = nuevoNombreTecnico.toLowerCase().replace(/\s+/g, '_').trim()
      const { data, error } = await supabase
        .from('layers')
        .insert([{ nombre_tecnico: slug }])
        .select().single()
      
      if (error) throw error
      
      setLayersGis([...layersGis, data])
      setLayerId(data.id)
      setNuevoNombreTecnico('')
      setMostrarCreadorLayer(false)
    } catch (err: any) {
      alert('Error al crear Layer GIS: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const agregarCampo = () => {
    setAtributos(prev => [...prev, { campo: '', tipo: 'text', requerido: false, opciones: '' }])
  }

  const eliminarCampo = (index: number) => {
    setAtributos(prev => prev.length > 1 
      ? prev.filter((_, i) => i !== index) 
      : [{ campo: '', tipo: 'text', requerido: false, opciones: '' }]
    )
  }

  const handleAtributoChange = (index: number, key: string, value: any) => {
    setAtributos(prev => {
      const nuevos = [...prev]
      nuevos[index] = { ...nuevos[index], [key]: value }
      return nuevos
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!layerId) return alert('Debes seleccionar o crear una Capa GIS')
    setLoading(true)

    try {
      let featureTypeId = capa?.id

      const payload = { 
        nombre, 
        layer_id: layerId, // Guardamos la relación UUID
        icono 
      }

      if (featureTypeId) {
        const { error: updError } = await supabase
          .from('feature_types')
          .update(payload)
          .eq('id', featureTypeId)
        if (updError) throw updError

        await supabase.from('attribute_definitions').delete().eq('feature_type_id', featureTypeId)
      } else {
        const { data, error } = await supabase
          .from('feature_types')
          .insert([payload])
          .select().single()
        if (error) throw error
        featureTypeId = data.id
      }

      const atributosData = atributos
        .filter(a => a.campo.trim() !== '')
        .map((a, index) => ({
          feature_type_id: featureTypeId,
          campo: a.campo,
          tipo: a.tipo,
          requerido: a.requerido,
          orden: index,
          opciones: (a.tipo === 'select' || a.tipo === 'multiselect') && a.opciones
            ? a.opciones.split(',').map(opt => opt.trim()).filter(opt => opt !== '')
            : null
        }))

      if (atributosData.length > 0) {
        const { error: errorAtrib } = await supabase
          .from('attribute_definitions')
          .insert(atributosData)
        if (errorAtrib) throw errorAtrib
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEliminarLayer = async () => {
    if (!layerId) return;
    
    const confirmacion = confirm("¿Estás seguro de eliminar esta Capa Maestra? Esto fallará si hay elementos vinculados a ella.");
    if (!confirmacion) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('layers')
        .delete()
        .eq('id', layerId);
      
      if (error) {
        if (error.code === '23503') {
          throw new Error("No se puede eliminar: Esta capa tiene elementos (postes, cámaras, etc.) asociados.");
        }
        throw error;
      }
      
      // Limpiar estados
      setLayersGis(layersGis.filter(l => l.id !== layerId));
      setLayerId('');
      alert("Capa Maestra eliminada correctamente.");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-900">
        
        {/* Header */}
        <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Database size={18} className="text-blue-600" />
              <h2 className="text-xl font-bold">Biblioteca de Infraestructura</h2>
            </div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-tight">Define elementos y capas técnicas para el proyecto</p>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={agregarCampo} className="text-blue-600 border-blue-200 hover:bg-blue-50">
            <Plus size={16} className="mr-1" /> Nuevo Atributo
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-8">
          
          {/* SECCIÓN 1: JERARQUÍA DE CAPAS */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-slate-400">
              <ChevronRight size={14} />
              <label className="text-[10px] font-black uppercase tracking-widest">Configuración GIS & Identidad</label>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Selector de Layer Maestra */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-600">Capa Maestra (GIS Group)</label>
                  <button 
                    type="button" 
                    onClick={() => setMostrarCreadorLayer(!mostrarCreadorLayer)}
                    className="text-[10px] text-blue-600 font-bold hover:underline"
                  >
                    {mostrarCreadorLayer ? 'Cancelar' : '+ Crear Nueva'}
                  </button>
                </div>

                {!mostrarCreadorLayer ? (
                <div className="flex gap-2">
                  <select 
                    required
                    value={layerId}
                    onChange={(e) => setLayerId(e.target.value)}
                    className="flex-1 p-2.5 border rounded-lg bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    <option value="">Seleccione grupo...</option>
                    {layersGis.map(l => (
                      <option key={l.id} value={l.id}>{l.nombre_tecnico.toUpperCase()}</option>
                    ))}
                  </select>
                  
                  {/* BOTÓN DE ELIMINAR LAYER MAESTRA */}
                  {layerId && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon"
                      onClick={handleEliminarLayer}
                      className="border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200"
                      title="Eliminar Capa Maestra"
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>                
                ) : (
                  <div className="flex gap-2 animate-in slide-in-from-top-2">
                    <input 
                      autoFocus
                      className="flex-1 p-2 border rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="ej: red_primaria"
                      value={nuevoNombreTecnico}
                      onChange={e => setNuevoNombreTecnico(e.target.value)}
                    />
                    <Button type="button" size="sm" className="bg-green-600" onClick={handleCrearNuevaLayer}>
                      OK
                    </Button>
                  </div>
                )}
                <p className="text-[10px] text-slate-400 italic">Determina cómo se agruparán los elementos en el mapa.</p>
              </div>

              {/* Nombre Visual */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Nombre Visual (En App)</label>
                <div className="relative">
                  <Tags className="absolute left-3 top-2.5 text-slate-400" size={16} />
                  <input 
                    required 
                    className="w-full p-2.5 pl-10 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                    placeholder="Ej: Poste Madera 8m" 
                    value={nombre} 
                    onChange={e => setNombre(e.target.value)} 
                  />
                </div>
              </div>
            </div>
          </section>

          {/* SECCIÓN 2: ICONOGRAFÍA */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-slate-400">
              <ChevronRight size={14} />
              <label className="text-[10px] font-black uppercase tracking-widest">Representación Visual</label>
            </div>
            <div className="grid grid-cols-9 gap-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
              {ICONOS_DISPONIBLES.map((nombreIcono) => {
                const Icon = (LucideIcons as any)[nombreIcono] || MapPin;
                return (
                  <button
                    key={nombreIcono}
                    type="button"
                    title={nombreIcono}
                    onClick={() => setIcono(nombreIcono)}
                    className={`p-3 flex flex-col items-center justify-center rounded-lg border transition-all ${
                      icono === nombreIcono 
                        ? 'bg-blue-600 text-white border-blue-700 shadow-md transform scale-110 z-10' 
                        : 'bg-white text-slate-400 border-slate-200 hover:border-blue-300 hover:text-blue-500'
                    }`}
                  >
                    <Icon size={20} />
                  </button>
                );
              })}
            </div>
          </section>

          {/* SECCIÓN 3: ATRIBUTOS */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-slate-400">
              <ChevronRight size={14} />
              <label className="text-[10px] font-black uppercase tracking-widest">Definición de Atributos</label>
            </div>
            
            <div className="space-y-3">
              {atributos.map((atrib, index) => (
                <div key={index} className="group p-4 border rounded-xl bg-white hover:border-blue-200 transition-colors shadow-sm">
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Nombre del Campo</label>
                      <input 
                        className="w-full p-1 border-b border-slate-100 focus:border-blue-500 outline-none text-sm font-medium" 
                        placeholder="Ej: Estado del Poste" 
                        value={atrib.campo} 
                        onChange={e => handleAtributoChange(index, 'campo', e.target.value)} 
                      />
                    </div>
                    
                    <div className="w-44">
                      <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Tipo de Dato</label>
                      <select className="w-full p-2 border rounded-md text-xs bg-slate-50 outline-none" 
                        value={atrib.tipo} onChange={e => handleAtributoChange(index, 'tipo', e.target.value)}>
                        <option value="text">Texto Corto</option>
                        <option value="number">Valor Numérico</option>
                        <option value="date">Fecha</option>
                        <option value="boolean">Interruptor (Si/No)</option>
                        <option value="select">Lista de Selección</option>
                        <option value="multiselect">Multiselección (Checkbox)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2 pb-2 px-2 border-l border-slate-100 ml-2">
                      <input 
                        type="checkbox" 
                        id={`req-${index}`} 
                        className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500" 
                        checked={atrib.requerido} 
                        onChange={e => handleAtributoChange(index, 'requerido', e.target.checked)} 
                      />
                      <label htmlFor={`req-${index}`} className="text-[9px] font-bold text-slate-500 uppercase cursor-pointer">Obligatorio</label>
                    </div>

                    <button 
                      type="button" 
                      className="pb-2 text-slate-300 hover:text-red-500 transition-colors" 
                      onClick={() => eliminarCampo(index)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {(atrib.tipo === 'select' || atrib.tipo === 'multiselect') && (
                    <div className="mt-4 animate-in fade-in duration-300">
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <label className="text-[9px] font-bold text-blue-600 uppercase block mb-1">Opciones de Lista (Separadas por coma)</label>
                        <input className="w-full bg-transparent p-1 text-sm outline-none border-b border-blue-200 placeholder:text-blue-300" 
                          placeholder="Bueno, Regular, Malo, Requiere Cambio..." value={atrib.opciones} 
                          onChange={e => handleAtributoChange(index, 'opciones', e.target.value)} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </form>

        {/* Acciones Finales */}
        <div className="p-6 border-t bg-slate-50 flex gap-4">
          <Button type="button" variant="ghost" className="flex-1 text-slate-500 hover:bg-slate-200" onClick={onClose}>
            Descartar Cambios
          </Button>
          <Button type="submit" onClick={handleSubmit} className="flex-[2] bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200" disabled={loading}>
            {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : (capa ? 'Guardar Cambios en Biblioteca' : 'Finalizar y Crear Elemento')}
          </Button>
        </div>
      </div>
    </div>
  )
}