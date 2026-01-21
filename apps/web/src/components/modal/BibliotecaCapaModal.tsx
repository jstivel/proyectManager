'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2, Plus, MapPin, Database, Tags, X, Layers, AlertTriangle } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { toast } from 'sonner'
import { useBiblioteca } from '@/hooks/useBiblioteca'
import { useLayers } from '@/hooks/useLayers'

interface AtributoInput {
  campo: string
  tipo: string
  requerido: boolean
  opciones?: string 
}

export default function BibliotecaCapaModal({ isOpen, onClose, onSuccess, capa }: any) {
  // HOOKS CENTRALIZADOS
  const { saveFeatureType, isSaving } = useBiblioteca()
  const { 
    layers: layersGis, 
    saveLayer, 
    deleteLayer, 
    isSaving: isSavingLayer, 
    isDeleting: isDeletingLayer, 
    isLoading: loadingLayers 
  } = useLayers()
  
  // ESTADOS LOCALES
  const [nombre, setNombre] = useState('')
  const [layerId, setLayerId] = useState('')
  const [icono, setIcono] = useState('MapPin')
  const [atributos, setAtributos] = useState<AtributoInput[]>([
    { campo: '', tipo: 'text', requerido: false, opciones: '' }
  ])

  const [mostrarCreadorLayer, setMostrarCreadorLayer] = useState(false)
  const [nuevoNombreTecnico, setNuevoNombreTecnico] = useState('')

  const ICONOS_DISPONIBLES = [
    'Square', 'Lamp', 'Router', 'Spline', 'Cable', 'RadioTower',
    'HardHat', 'Hammer', 'Compass', 'TriangleAlert',
    'Zap', 'Droplet', 'Wifi', 'Lightbulb', 'MapPin', 'Flag', 'Trash2', 'Home'
  ];

  // EFECTO PARA CARGA DE DATOS AL EDITAR
  useEffect(() => {
    if (isOpen) {
      if (capa) {
        setNombre(capa.nombre || '')
        setLayerId(capa.layer_id || '')
        setIcono(capa.icono || 'MapPin')
        
        const atribsFormateados = capa.attribute_definitions?.map((a: any) => ({
          ...a,
          opciones: Array.isArray(a.opciones) ? a.opciones.join(', ') : (a.opciones || '')
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

  // 1. CREAR NUEVA LAYER MAESTRA
  const handleCrearNuevaLayer = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!nuevoNombreTecnico.trim()) return toast.error("Ingresa un nombre para el grupo")
    
    try {
      const newId = await saveLayer({
        nombre_tecnico: nuevoNombreTecnico.toUpperCase().trim(),
        descripcion: 'Creado desde biblioteca'
      })

      if (newId) {
        setLayerId(newId)
        setNuevoNombreTecnico('')
        setMostrarCreadorLayer(false)
      }
    } catch (err) {}
  }

  // 2. ELIMINAR LAYER (GRUPO)
  const handleEliminarLayer = async (id: string) => {
    if (!id|| !layersGis) return;
    const layer = layersGis.find((l: any) => l.id === id);
    
    if (!confirm(`¿Estás seguro de eliminar el grupo "${layer?.nombre_tecnico}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await deleteLayer(id);
      setLayerId(''); // Limpiar selección tras borrar
    } catch (err) {console.error("Error al eliminar:", err);}
  }

  // MANEJO DE ATRIBUTOS DINÁMICOS
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

  // 3. ENVÍO FINAL DEL ELEMENTO DE BIBLIOTECA
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) return toast.error('Ingresa un nombre para el elemento')
    if (!layerId) return toast.error('Selecciona un Grupo GIS')

    try {
      const atributosLimpios = atributos
        .filter(a => a.campo.trim() !== '')
        .map((a, index) => ({
          campo: a.campo.trim(),
          tipo: a.tipo,
          requerido: a.requerido,
          orden: index,
          opciones: (a.tipo === 'select' || a.tipo === 'multiselect') && a.opciones
            ? a.opciones.split(',').map(opt => opt.trim()).filter(opt => opt !== '')
            : null
        }))

      await saveFeatureType({
        id: capa?.id || null,
        layer_id: layerId,
        nombre: nombre.trim(),
        icono: icono,
        atributos: atributosLimpios
      })

      if (onSuccess) onSuccess()
      onClose()
    } catch (err: any) {}
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-5xl w-full my-auto flex flex-col overflow-hidden text-slate-900 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-8 border-b bg-white flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                <Database size={20} />
              </div>
              <h2 className="text-2xl font-black uppercase italic tracking-tighter">Editor de <span className="text-blue-600">Biblioteca</span></h2>
            </div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Configuración técnica de elementos maestros</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto max-h-[70vh] space-y-10 custom-scrollbar">
          
          {/* SECCIÓN 1: JERARQUÍA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="space-y-4">
              <label className="text-[11px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" /> Grupo GIS / Layer
              </label>
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Seleccionar Contenedor</span>
                  <button 
                    type="button" 
                    onClick={() => setMostrarCreadorLayer(!mostrarCreadorLayer)} 
                    className="text-[10px] text-blue-600 font-black uppercase hover:underline"
                  >
                    {mostrarCreadorLayer ? 'Volver a lista' : '+ Crear Nuevo Grupo'}
                  </button>
                </div>

                {!mostrarCreadorLayer ? (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <select 
                        required 
                        value={layerId} 
                        onChange={(e) => setLayerId(e.target.value)}
                        disabled={loadingLayers}
                        className="w-full p-4 pl-12 border-2 border-white rounded-2xl bg-white text-xs font-bold shadow-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all uppercase appearance-none"
                      >
                        <option value="">{loadingLayers ? 'Cargando...' : '-- Seleccionar Grupo --'}</option>
                        {layersGis.map((l: any) => (
                          <option key={l.id} value={l.id}>{l.nombre_tecnico}</option>
                        ))}
                      </select>
                    </div>
                    {layerId && (
                      <Button
                        type="button"
                        onClick={() => handleEliminarLayer(layerId)}
                        disabled={isDeletingLayer}
                        className="bg-white hover:bg-red-50 text-red-400 border-2 border-white rounded-2xl px-4 shadow-sm transition-all"
                      >
                        {isDeletingLayer ? <Loader2 className="animate-spin w-4 h-4" /> : <Trash2 size={18} />}
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex gap-2 animate-in fade-in slide-in-from-top-2">
                    <input 
                      autoFocus 
                      className="flex-1 p-4 border-2 border-blue-100 rounded-2xl text-xs font-black uppercase outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
                      placeholder="Nombre del grupo (ej: POSTES)" 
                      value={nuevoNombreTecnico} 
                      onChange={e => setNuevoNombreTecnico(e.target.value)} 
                    />
                    <Button 
                      disabled={isSavingLayer}
                      type="button" 
                      onClick={handleCrearNuevaLayer} 
                      className="bg-blue-600 hover:bg-blue-700 rounded-2xl px-6 font-black uppercase text-[10px] text-white"
                    >
                      {isSavingLayer ? <Loader2 className="animate-spin w-4 h-4" /> : 'OK'}
                    </Button>
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-4">
              <label className="text-[11px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" /> Identidad del Elemento
              </label>
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                 <div className="relative">
                  <Tags className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    required 
                    className="w-full p-4 pl-12 border-2 border-white rounded-2xl text-xs font-black uppercase outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    placeholder="Ej: Poste Concreto 12M" 
                    value={nombre} 
                    onChange={e => setNombre(e.target.value)} 
                  />
                </div>
              </div>
            </section>
          </div>

          {/* SECCIÓN 2: ICONOS */}
          <section className="space-y-4">
            <label className="text-[11px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" /> Iconografía en Mapa
            </label>
            <div className="flex flex-wrap gap-3 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
              {ICONOS_DISPONIBLES.map((nombreIcono) => {
                const Icon = (LucideIcons as any)[nombreIcono] || MapPin;
                return (
                  <button 
                    key={nombreIcono} 
                    type="button" 
                    onClick={() => setIcono(nombreIcono)}
                    className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${
                      icono === nombreIcono 
                        ? 'bg-blue-600 text-white shadow-lg scale-110' 
                        : 'bg-white text-slate-400 hover:text-blue-500 border border-slate-100'
                    }`}
                  >
                    <Icon size={20} />
                  </button>
                );
              })}
            </div>
          </section>

          {/* SECCIÓN 3: ATRIBUTOS */}
          <section className="space-y-6">
            <div className="flex justify-between items-end">
              <label className="text-[11px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" /> Formulario Técnico (Campos)
              </label>
              <Button 
                type="button" 
                onClick={agregarCampo} 
                variant="outline" 
                className="rounded-xl h-10 text-[9px] font-black uppercase border-blue-100 text-blue-600 hover:bg-blue-50 px-4"
              >
                <Plus size={14} className="mr-2" /> Agregar Atributo
              </Button>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {atributos.map((atrib, index) => (
                <div key={index} className="flex flex-col bg-white p-6 rounded-3xl border border-slate-100 shadow-sm group hover:border-blue-200 transition-all">
                  <div className="flex flex-wrap md:flex-nowrap gap-4 items-center">
                    <div className="flex-1 min-w-[200px]">
                      <span className="text-[9px] font-black text-slate-300 uppercase block mb-1">Nombre del campo</span>
                      <input 
                        className="w-full text-sm font-bold uppercase outline-none focus:text-blue-600" 
                        placeholder="Ej: Material" 
                        value={atrib.campo} 
                        onChange={e => handleAtributoChange(index, 'campo', e.target.value)} 
                      />
                    </div>
                    
                    <div className="w-40">
                      <span className="text-[9px] font-black text-slate-300 uppercase block mb-1">Tipo</span>
                      <select 
                        className="w-full text-[10px] font-black uppercase bg-slate-50 p-2 rounded-lg outline-none cursor-pointer" 
                        value={atrib.tipo} 
                        onChange={e => handleAtributoChange(index, 'tipo', e.target.value)}
                      >
                        <option value="text">Texto</option>
                        <option value="number">Número</option>
                        <option value="select">Lista (Select)</option>
                        <option value="boolean">Si/No</option>
                        <option value="date">Fecha</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2 px-4 border-l border-slate-50">
                      <input 
                        type="checkbox" 
                        checked={atrib.requerido} 
                        onChange={e => handleAtributoChange(index, 'requerido', e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500" 
                      />
                      <span className="text-[9px] font-black text-slate-400 uppercase">Obligatorio</span>
                    </div>

                    <button 
                      type="button" 
                      onClick={() => eliminarCampo(index)} 
                      className="text-slate-200 hover:text-red-500 transition-colors ml-auto"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {(atrib.tipo === 'select') && (
                    <div className="w-full mt-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 animate-in zoom-in-95">
                      <span className="text-[9px] font-black text-blue-400 uppercase block mb-1">Opciones de la lista (separadas por coma)</span>
                      <input 
                        className="w-full bg-transparent text-xs font-bold text-blue-900 outline-none" 
                        placeholder="Opción 1, Opción 2..." 
                        value={atrib.opciones} 
                        onChange={e => handleAtributoChange(index, 'opciones', e.target.value)} 
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </form>

        {/* Footer */}
        <div className="p-8 border-t bg-slate-50 flex gap-4">
          <Button 
            type="button" 
            variant="ghost" 
            className="flex-1 text-[10px] font-black uppercase tracking-widest text-slate-400" 
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            onClick={handleSubmit} 
            disabled={isSaving}
            className="flex-[2] bg-slate-900 hover:bg-blue-600 text-white font-black text-[10px] uppercase tracking-[0.2em] py-7 rounded-[1.5rem] shadow-xl transition-all active:scale-95 disabled:opacity-70"
          >
            {isSaving ? <Loader2 className="animate-spin" /> : (capa ? 'Actualizar Elemento' : 'Registrar en Biblioteca')}
          </Button>
        </div>
      </div>
    </div>
  )
}