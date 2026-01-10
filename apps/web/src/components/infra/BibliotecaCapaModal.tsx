'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2, Plus, ListChecks, ListFilter, MapPin } from 'lucide-react'
import * as LucideIcons from 'lucide-react' // Importación necesaria para los iconos dinámicos

interface AtributoInput {
  campo: string
  tipo: string
  requerido: boolean
  opciones?: string 
}

export default function BibliotecaCapaModal({ isOpen, onClose, onSuccess, capa }: any) {
  const [loading, setLoading] = useState(false)
  const [nombre, setNombre] = useState('')
  const [layer, setLayer] = useState('')
  // Nuevo estado para el icono
  const [icono, setIcono] = useState('MapPin')
  const [atributos, setAtributos] = useState<AtributoInput[]>([
    { campo: '', tipo: 'text', requerido: false, opciones: '' }
  ])

  const ICONOS_DISPONIBLES = [
    // Infraestructura Civil y Red
    'Square',      // Cámaras / Arquetas
    'Lamp',        // Postes
    'Router',      // CTO / NAP
    'Spline',      // Empalmes / Mufas
    'Cable',       // Cableado / Ductería
    'RadioTower',  // Antenas / Nodos
    
    // Obra y Replanteo
    'HardHat',     // Construcción / Cuadrilla
    'Hammer',      // Herramientas / Reparación
    'Compass',     // Replanteo / GPS
    'TriangleAlert', // Averías / Peligro
    
    // Servicios y General
    'Zap',         // Energía
    'Droplet',     // Agua
    'Wifi',        // Redes Inalámbricas
    'Lightbulb',   // Alumbrado
    'MapPin',      // Hito General
    'Flag',        // Inicio/Fin de Tramo
    'Trash2',       // Residuos
    'Home'
  ];

  const supabase = createClient()

  useEffect(() => {
    if (isOpen) {
      if (capa) {
        setNombre(capa.nombre || '')
        setLayer(capa.layer || '')
        setIcono(capa.icono || 'MapPin') // Cargar icono existente
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
        setLayer('')
        setIcono('MapPin')
        setAtributos([{ campo: '', tipo: 'text', requerido: false, opciones: '' }])
      }
    }
  }, [capa, isOpen])

  if (!isOpen) return null

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
    setLoading(true)

    try {
      let capaId = capa?.id

      // 1. Manejar la Capa (Feature Type) - SE AÑADIÓ EL CAMPO 'icono'
      if (capaId) {
        const { error: updError } = await supabase
          .from('feature_types')
          .update({ nombre, layer, icono }) // Update con icono
          .eq('id', capaId)
        if (updError) throw updError

        await supabase.from('attribute_definitions').delete().eq('feature_type_id', capaId)
      } else {
        const { data, error } = await supabase
          .from('feature_types')
          .insert([{ nombre, layer, icono }]) // Insert con icono
          .select().single()
        if (error) throw error
        capaId = data.id
      }

      // 2. Procesar y Guardar Atributos (Sin cambios aquí)
      const atributosData = atributos
        .filter(a => a.campo.trim() !== '')
        .map((a, index) => ({
          feature_type_id: capaId,
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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-900">
        {/* Header */}
        <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Configuración de Capa Maestro</h2>
            <p className="text-xs text-slate-500 font-medium">Define los campos para la recolección en campo</p>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={agregarCampo} className="text-blue-600 border-blue-200">
            <Plus size={16} className="mr-1" /> Nuevo Atributo
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          {/* Identificación de la Capa */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Nombre Visual (App)</label>
              <input required className="w-full p-2 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                placeholder="Ej: Poste de Energía" value={nombre} onChange={e => setNombre(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Nombre Capa (GIS/Postgres)</label>
              <input required className="w-full p-2 border rounded-md font-mono outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                placeholder="Ej: infra_postes" value={layer} onChange={e => setLayer(e.target.value)} />
            </div>
          </div>

          {/* Selector de Icono - CORREGIDO */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-400 block">Icono en Mapa</label>
            <div className="grid grid-cols-9 gap-2">
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
                        ? 'bg-blue-600 text-white border-blue-700 shadow-md' 
                        : 'bg-white text-slate-400 border-slate-200 hover:border-blue-300 hover:text-blue-500'
                    }`}
                  >
                    <Icon size={20} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Listado de Atributos */}
          <div className="space-y-4">
            <label className="text-[10px] uppercase font-bold text-slate-400 block -mb-2">Definición de Atributos</label>
            {atributos.map((atrib, index) => (
              <div key={index} className="p-4 border rounded-xl bg-white shadow-sm border-slate-200">
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="text-[10px] uppercase font-bold text-slate-300 block mb-1">Campo</label>
                    <input className="w-full p-2 border-b border-slate-100 focus:border-blue-500 outline-none text-sm font-medium" 
                      placeholder="Ej: Material" value={atrib.campo} onChange={e => handleAtributoChange(index, 'campo', e.target.value)} />
                  </div>
                  
                  <div className="w-40">
                    <select className="w-full p-2 border rounded-md text-xs bg-slate-50 outline-none" 
                      value={atrib.tipo} onChange={e => handleAtributoChange(index, 'tipo', e.target.value)}>
                      <option value="text">Texto</option>
                      <option value="number">Número</option>
                      <option value="date">Fecha</option>
                      <option value="boolean">Si/No</option>
                      <option value="select">Lista Desplegable</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pb-2 px-2">
                    <input type="checkbox" id={`req-${index}`} className="w-4 h-4 rounded text-blue-600" 
                      checked={atrib.requerido} onChange={e => handleAtributoChange(index, 'requerido', e.target.checked)} />
                    <label htmlFor={`req-${index}`} className="text-[9px] font-bold text-slate-400 uppercase cursor-pointer">Req.</label>
                  </div>

                  <Button type="button" variant="ghost" size="sm" className="text-slate-200 hover:text-red-500" onClick={() => eliminarCampo(index)}>
                    <Trash2 size={16} />
                  </Button>
                </div>

                {/* Opciones para Select */}
                {(atrib.tipo === 'select' || atrib.tipo === 'multiselect') && (
                  <div className="mt-3 bg-blue-50/50 p-2 rounded border border-blue-100 flex gap-2 items-center">
                    <div className="flex-1">
                      <input className="w-full bg-transparent p-1 text-xs outline-none" 
                        placeholder="Opciones: Madera, Metal, Concreto..." value={atrib.opciones} 
                        onChange={e => handleAtributoChange(index, 'opciones', e.target.value)} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </form>

        {/* Acciones */}
        <div className="p-6 border-t bg-slate-50 flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button type="submit" onClick={handleSubmit} className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={loading}>
            {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : (capa ? 'Actualizar Capa' : 'Crear Capa')}
          </Button>
        </div>
      </div>
    </div>
  )
}