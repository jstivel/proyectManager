'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2, Plus, ListChecks, ListFilter } from 'lucide-react'

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
  const [atributos, setAtributos] = useState<AtributoInput[]>([
    { campo: '', tipo: 'text', requerido: false, opciones: '' }
  ])

  const mountedRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true

    if (capa) {
      setNombre(capa.nombre || '')
      setLayer(capa.layer || '')
      const atribsFormateados = capa.attribute_definitions?.map((a: any) => ({
        ...a,
        opciones: Array.isArray(a.opciones) ? a.opciones.join(', ') : ''
      }))
      setAtributos(
        atribsFormateados || [{ campo: '', tipo: 'text', requerido: false, opciones: '' }]
      )
    } else {
      setNombre('')
      setLayer('')
      setAtributos([{ campo: '', tipo: 'text', requerido: false, opciones: '' }])
    }

    return () => {
      mountedRef.current = false
    }
  }, [capa, isOpen])

  if (!isOpen) return null

  const agregarCampo = () => {
    setAtributos(prev => [...prev, { campo: '', tipo: 'text', requerido: false, opciones: '' }])
  }

  const eliminarCampo = (index: number) => {
    if (atributos.length > 1) {
      setAtributos(atributos.filter((_, i) => i !== index))
    } else {
      setAtributos([{ campo: '', tipo: 'text', requerido: false, opciones: '' }])
    }
  }

  const handleAtributoChange = (index: number, key: string, value: any) => {
    const nuevos = [...atributos]
    nuevos[index] = { ...nuevos[index], [key]: value }
    setAtributos(nuevos)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return 
    setLoading(true)

    try {
      let capaId = capa?.id

      if (capaId) {
        const { error: updError } = await supabase
          .from('feature_types')
          .update({ nombre, layer })
          .eq('id', capaId)

        if (updError) throw updError

        const { error: delError } = await supabase
          .from('attribute_definitions')
          .delete()
          .eq('feature_type_id', capaId)

        if (delError) throw delError
      } else {
        const { data, error } = await supabase
          .from('feature_types')
          .insert([{ nombre, layer }])
          .select()
          .single()

        if (error) throw error
        capaId = data.id
      }

      const atributosData = atributos
        .filter(a => a.campo.trim() !== '')
        .map((a, index) => ({
          feature_type_id: capaId,
          campo: a.campo,
          tipo: a.tipo,
          requerido: a.requerido,
          orden: index,
          opciones:
            (a.tipo === 'select' || a.tipo === 'multiselect') && a.opciones
              ? a.opciones
                  .split(',')
                  .map(opt => opt.trim())
                  .filter(opt => opt !== '')
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
      console.error('Error guardando capa:', err)
      alert('Error: ' + err.message)
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Configuración de Capa Maestro
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Define los campos y tipos de datos para la recolección
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={agregarCampo}
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <Plus size={16} className="mr-1" /> Nuevo Atributo
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          {/* Datos Generales */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Nombre Visual (App)</label>
              <input 
                required
                className="w-full p-2 border rounded-md text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ej: Poste de Energía"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Nombre Capa (GIS)</label>
              <input 
                required
                className="w-full p-2 border rounded-md text-slate-900 font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ej: infraestructura_postes"
                value={layer}
                onChange={e => setLayer(e.target.value)}
              />
            </div>
          </div>

          {/* Listado de Atributos */}
          <div className="space-y-4">
            {atributos.map((atrib, index) => (
              <div key={index} className="p-4 border rounded-xl bg-white shadow-sm hover:border-blue-300 transition-all border-slate-200">
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Nombre del Campo</label>
                    <input 
                      className="w-full p-2 border-b border-slate-200 focus:border-blue-500 outline-none text-sm font-medium"
                      placeholder="Ej: Tipo de Red"
                      value={atrib.campo}
                      onChange={e => handleAtributoChange(index, 'campo', e.target.value)}
                    />
                  </div>
                  
                  <div className="w-48">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Tipo de Control</label>
                    <select 
                      className="w-full p-2 border rounded-md text-sm bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500"
                      value={atrib.tipo}
                      onChange={e => handleAtributoChange(index, 'tipo', e.target.value)}
                    >
                      <optgroup label="Básicos">
                        <option value="text">Texto Corto</option>
                        <option value="number">Número</option>
                        <option value="date">Fecha</option>
                        <option value="boolean">Interruptor (Si/No)</option>
                      </optgroup>
                      <optgroup label="Listados">
                        <option value="select">Selección Única (Dropdown)</option>
                        <option value="multiselect">Selección Múltiple (Checkboxes)</option>
                      </optgroup>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pb-2 px-2 border-l border-slate-100">
                    <input 
                      type="checkbox"
                      id={`req-${index}`}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                      checked={atrib.requerido}
                      onChange={e => handleAtributoChange(index, 'requerido', e.target.checked)}
                    />
                    <label htmlFor={`req-${index}`} className="text-[10px] font-bold text-slate-500 uppercase cursor-pointer">Requerido</label>
                  </div>

                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="text-slate-300 hover:text-red-600 h-9 w-9 p-0"
                    onClick={() => eliminarCampo(index)}
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>

                {/* OPCIONES PARA SELECT Y MULTISELECT */}
                {(atrib.tipo === 'select' || atrib.tipo === 'multiselect') && (
                  <div className="mt-3 bg-blue-50 p-3 rounded-lg border border-blue-100 flex gap-3 items-center animate-in fade-in slide-in-from-top-1">
                    <div className="bg-blue-600 p-2 rounded-lg text-white">
                      {atrib.tipo === 'select' ? <ListFilter size={16} /> : <ListChecks size={16} />}
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] uppercase font-bold text-blue-600 block mb-1">
                        Opciones de {atrib.tipo === 'select' ? 'Selección Única' : 'Selección Múltiple'} (Separar por comas)
                      </label>
                      <input 
                        className="w-full p-2 border border-blue-200 rounded text-sm outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="Ej: MT, BT, Alumbrado Público"
                        value={atrib.opciones}
                        onChange={e => handleAtributoChange(index, 'opciones', e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-4 sticky bottom-0 bg-white border-t mt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 shadow-md" disabled={loading}>
              {loading ? <Loader2 className="animate-spin mr-2" /> : null}
              {capa ? 'Actualizar Capa Maestro' : 'Guardar en Biblioteca'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}