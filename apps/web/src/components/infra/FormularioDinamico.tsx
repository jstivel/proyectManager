'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Save, X, MapPin, Trash2, Info } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query' // Asegúrate de importar useQueryClient
import { useInfraMutations } from '@/hooks/useInfraMutations'

interface Props {
  capaId: string
  proyectoId: string
  coordenadas: { lng: number; lat: number }
  onClose: () => void
  onSave: () => void
  idEdicion?: string | null 
}

export default function FormularioDinamico({
  capaId,
  proyectoId,
  coordenadas,
  onClose,
  onSave,
  idEdicion
}: Props) {
  const supabase = createClient()
  const queryClient = useQueryClient() // <--- ESTA LÍNEA ES LA QUE FALTABA
  
  const [formData, setFormData] = useState<Record<string, any>>({})
  const { saveMutation, deleteMutation } = useInfraMutations()

  /* 1. Cargar Definiciones de la Capa */
  const { data: atributos, isLoading: loadingDefs } = useQuery({
    queryKey: ['attribute_definitions', capaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attribute_definitions')
        .select('*')
        .eq('feature_type_id', capaId)
        .order('orden', { ascending: true })
      if (error) throw error
      return data || []
    }
  })

  /* 2. Cargar Datos si es Edición */
  const { data: featureData, isLoading: loadingFeature } = useQuery({
    queryKey: ['feature_data', idEdicion],
    queryFn: async () => {
      if (!idEdicion) return null
      const { data, error } = await supabase
        .from('feature_attributes')
        .select('data')
        .eq('feature_id', idEdicion)
        .maybeSingle()
      
      if (error) throw error
      return data?.data || null
    },
    enabled: !!idEdicion,
  })

  /* 3. Sincronizar Estado Inicial */
  useEffect(() => {
    if (!atributos) return
    
    const inicial: any = {}
    atributos.forEach(atrib => {
      if (atrib.tipo === 'multiselect') inicial[atrib.campo] = []
      else if (atrib.tipo === 'boolean') inicial[atrib.campo] = false
      else inicial[atrib.campo] = ''
    })

    if (idEdicion && featureData) {
      setFormData({ ...inicial, ...featureData })
    } else {
      setFormData(inicial)
    }
  }, [atributos, featureData, idEdicion])

  // Handlers
  const handleChange = (campo: string, valor: any) => {
    setFormData(prev => ({ ...prev, [campo]: valor }))
  }

  const handleMultiselect = (campo: string, opcion: string) => {
    const actuales = Array.isArray(formData[campo]) ? formData[campo] : []
    const nuevos = actuales.includes(opcion)
      ? actuales.filter((o: string) => o !== opcion)
      : [...actuales, opcion]
    handleChange(campo, nuevos)
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    saveMutation.mutate({
      idEdicion: idEdicion ?? null,
      proyectoId,
      capaId,
      coords: coordenadas, 
      formData
    }, {
      onSuccess: async () => {
        // Refrescar caché del mapa
        await queryClient.invalidateQueries({ queryKey: ['infraestructuras'] });
        await queryClient.invalidateQueries({ queryKey: ['feature_data', idEdicion] });
        
        onSave()
        onClose()
      }
    })
  }

  const handleEliminar = async () => {
    if (!idEdicion || !confirm('¿Eliminar este elemento permanentemente?')) return
    deleteMutation.mutate(idEdicion, {
      onSuccess: () => {
        // Refrescar caché del mapa
        queryClient.invalidateQueries({ queryKey: ['infraestructuras'] });
        onSave()
        onClose()
      }
    })
  }

  const isLoading = loadingDefs || (!!idEdicion && loadingFeature)
  const isSaving = saveMutation.isPending || deleteMutation.isPending

  // ... (mismo JSX de retorno que ya tienes)
  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-full bg-white absolute right-0 top-0 z-[100] w-80 border-l shadow-2xl">
      <Loader2 className="animate-spin text-blue-600 mb-2" />
      <span className="text-[10px] font-bold text-slate-400 uppercase">Cargando Ficha...</span>
    </div>
  )

  return (
    <div className="flex flex-col h-full bg-white text-slate-900 border-l shadow-2xl animate-in slide-in-from-right duration-300 w-80 md:w-96 absolute right-0 top-0 z-[100]">
      {/* Header Panel */}
      <div className="p-4 border-b bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-blue-400" />
          <h2 className="font-bold text-sm tracking-tight">
            {idEdicion ? 'Ficha Técnica' : 'Nuevo Registro'}
          </h2>
        </div>
        <button onClick={onClose} className="hover:bg-slate-800 p-1 rounded transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="px-4 py-2 bg-blue-50 border-b flex justify-between items-center">
        <span className="text-[10px] font-mono text-blue-700">
          {coordenadas.lat.toFixed(6)}, {coordenadas.lng.toFixed(6)}
        </span>
        <div className="flex items-center gap-1 text-[10px] text-blue-600 font-bold uppercase">
          <Info size={12} /> GPS Activo
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {atributos?.map(atrib => (
          <div key={atrib.id} className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
              {atrib.campo} {atrib.requerido && <span className="text-red-500">*</span>}
            </label>

            {atrib.tipo === 'text' && (
              <input 
                className="w-full p-2 text-sm border rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                value={formData[atrib.campo] ?? ''} 
                onChange={e => handleChange(atrib.campo, e.target.value)} 
              />
            )}

            {atrib.tipo === 'number' && (
              <input 
                type="number" 
                className="w-full p-2 text-sm border rounded outline-none focus:ring-2 focus:ring-blue-500" 
                value={formData[atrib.campo] ?? ''} 
                onChange={e => handleChange(atrib.campo, e.target.value)} 
              />
            )}

            {atrib.tipo === 'select' && (
              <select 
                className="w-full p-2 text-sm border rounded bg-white outline-none focus:ring-2 focus:ring-blue-500" 
                value={formData[atrib.campo] ?? ''} 
                onChange={e => handleChange(atrib.campo, e.target.value)}
              >
                <option value="">Seleccione...</option>
                {atrib.opciones?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            )}

            {atrib.tipo === 'multiselect' && (
              <div className="grid grid-cols-1 gap-1.5 p-3 bg-slate-50 rounded-lg border">
                {atrib.opciones?.map((opt: string) => (
                  <div key={opt} className="flex items-center gap-2">
                    <Checkbox 
                      id={`${atrib.id}-${opt}`}
                      checked={(formData[atrib.campo] || []).includes(opt)}
                      onCheckedChange={() => handleMultiselect(atrib.campo, opt)}
                    />
                    <label htmlFor={`${atrib.id}-${opt}`} className="text-xs text-slate-600 font-medium cursor-pointer">{opt}</label>
                  </div>
                ))}
              </div>
            )}

            {atrib.tipo === 'boolean' && (
              <div className="flex items-center gap-2 p-2 bg-slate-50 rounded border">
                <Checkbox 
                  checked={!!formData[atrib.campo]} 
                  onCheckedChange={val => handleChange(atrib.campo, !!val)} 
                />
                <span className="text-xs text-slate-600 font-bold uppercase">Cumple / Activo</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 border-t bg-slate-50 flex gap-2">
        {idEdicion && (
          <Button 
            onClick={handleEliminar} 
            variant="outline" 
            className="border-red-200 text-red-600 hover:bg-red-50 px-3"
            disabled={isSaving}
          >
            <Trash2 size={18} />
          </Button>
        )}
        <Button 
          onClick={() => handleSubmit()} 
          className="flex-1 bg-blue-600 hover:bg-blue-700 gap-2 shadow-md" 
          disabled={isSaving}
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {idEdicion ? 'Actualizar Ficha' : 'Guardar Punto'}
        </Button>
      </div>
    </div>
  )
}