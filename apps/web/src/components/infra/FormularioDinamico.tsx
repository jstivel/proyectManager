'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Save, X, MapPin, Navigation, Trash2 } from 'lucide-react'

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
  console.log("DEBUG - Formulario recibe Capa:", capaId);
  console.log("DEBUG - Formulario recibe ID Edición:", idEdicion);
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [atributos, setAtributos] = useState<any[]>([])
  const [formData, setFormData] = useState<any>({})
  const [coords, setCoords] = useState(coordenadas)

  useEffect(() => {
    setCoords(coordenadas);
  }, [coordenadas]);

  // 4️⃣ CARGAR DATOS EXISTENTES (SI HAY IDEDICION)
  useEffect(() => {
    let isMounted = true
    const cargarDatos = async () => {
      setLoading(true)
      
      // Cargar definiciones de atributos
      const { data: defs, error: defError } = await supabase
        .from('attribute_definitions')
        .select('*')
        .eq('feature_type_id', capaId)
        .order('orden', { ascending: true })

      if (!isMounted) return
      if (defError) {
        console.error('Error cargando estructura:', defError)
        setLoading(false)
        return
      }

      setAtributos(defs || [])

      // Inicializar con valores vacíos
      const inicial: any = {}
      defs?.forEach(atrib => {
        if (atrib.tipo === 'multiselect') inicial[atrib.campo] = []
        else if (atrib.tipo === 'boolean') inicial[atrib.campo] = false
        else inicial[atrib.campo] = ''
      })

      // Si estamos en modo EDICIÓN, sobreescribir con datos de la DB
      if (idEdicion) {
        const { data: featureData, error } = await supabase
          .from('v_infraestructuras_mapa')
          .select('atributos')
          .eq('id', idEdicion)
          .maybeSingle();

        if (featureData?.atributos) {
          // IMPORTANTE: Primero tomamos el esquema inicial (con campos vacíos)
          // y luego le encimamos los datos de la DB
          const datosNormalizados: any = { ...inicial };
          
          Object.keys(featureData.atributos).forEach(key => {
            const valor = featureData.atributos[key];
            // Guardamos en la versión original y en minúscula para asegurar match
            datosNormalizados[key] = valor;
            datosNormalizados[key.toLowerCase()] = valor;
            datosNormalizados[key.toUpperCase()] = valor;
          });

          console.log("DATOS CARGADOS AL FORM:", datosNormalizados);
          setFormData(datosNormalizados);
        }
      }
      
      setLoading(false)
    }

    cargarDatos()
    return () => { isMounted = false }
  }, [capaId, idEdicion])

  const handleChange = (campo: string, valor: any) => {
    setFormData((prev: any) => ({ ...prev, [campo]: valor }))
  }

  const handleMultiselect = (campo: string, opcion: string) => {
    const actuales = formData[campo] || []
    if (actuales.includes(opcion)) {
      handleChange(campo, actuales.filter((o: string) => o !== opcion))
    } else {
      handleChange(campo, [...actuales, opcion])
    }
  }

  // 6️⃣ UPDATE VS INSERT
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (saving) return
    setSaving(true)

    try {
      const point = `SRID=4326;POINT(${coords.lng} ${coords.lat})`

      if (idEdicion) {
        // ACTUALIZAR (Modo Edición)
        const { error: fError } = await supabase
          .from('features')
          .update({ geom: point })
          .eq('id', idEdicion)
        if (fError) throw fError

        const { error: aError } = await supabase
          .from('feature_attributes')
          .update({ data: formData })
          .eq('feature_id', idEdicion)
        if (aError) throw aError

      } else {
        // CREAR (Modo Nuevo)
        const { data: newFeature, error: fError } = await supabase
          .from('features')
          .insert([{
            proyecto_id: proyectoId,
            feature_type_id: capaId,
            geom: point,
            estado: 'preliminar'
          }])
          .select().single()

        if (fError) throw fError

        const { error: aError } = await supabase
          .from('feature_attributes')
          .insert([{
            feature_id: newFeature.id,
            data: formData
          }])
        if (aError) throw aError
      }

      onSave()
      onClose()
    } catch (err: any) {
      alert('Error al guardar: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  // 5️⃣ ELIMINACIÓN
  const handleEliminar = async () => {
    if (!idEdicion) return
    if (!confirm('¿Estás seguro de que deseas eliminar este elemento?')) return
    
    setSaving(true)
    try {
      const { error } = await supabase
        .from('features')
        .delete()
        .eq('id', idEdicion)

      if (error) throw error
      
      onSave()
      onClose()
    } catch (err: any) {
      alert('Error al eliminar: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[2000] flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-600 h-10 w-10" />
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[2000] flex items-center justify-end">
      <div className="bg-white h-full w-full max-w-md shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* HEADER */}
        <div className="p-4 border-b flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h2 className="font-bold text-lg text-slate-800">
              {idEdicion ? 'Editar Infraestructura' : 'Nueva Infraestructura'}
            </h2>
            <p className="text-[10px] text-slate-400 font-mono">ID: {idEdicion || 'Temporal'}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full"><X size={20} /></Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* GEOPOSICIÓN */}
          <div className="p-4 bg-slate-50 border-b">
             <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Latitud</label>
                <input type="number" step="any" className="w-full p-2 text-sm border rounded" value={coords.lat} onChange={e => setCoords({ ...coords, lat: parseFloat(e.target.value) })} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Longitud</label>
                <input type="number" step="any" className="w-full p-2 text-sm border rounded" value={coords.lng} onChange={e => setCoords({ ...coords, lng: parseFloat(e.target.value) })} />
              </div>
            </div>
          </div>

          {/* CAMPOS DINÁMICOS */}
          <div className="p-6 space-y-6">
            {atributos.map(atrib => (
              <div key={atrib.id} className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-700 uppercase">
                  {atrib.campo} {atrib.requerido && <span className="text-red-500">*</span>}
                </label>

                {atrib.tipo === 'text' && (
                  <input className="w-full p-2 border rounded-md" value={formData[atrib.campo] ?? formData[atrib.campo.toUpperCase()] ?? ''} onChange={e => handleChange(atrib.campo, e.target.value)} />
                )}

                {atrib.tipo === 'number' && (
                  <input type="number" className="w-full p-2 border rounded-md" value={formData[atrib.campo] ?? formData[atrib.campo.toUpperCase()] ?? ''} onChange={e => handleChange(atrib.campo, e.target.value)} />
                )}

                {atrib.tipo === 'select' && (
                  <select className="w-full p-2 border rounded-md" value={formData[atrib.campo] ?? formData[atrib.campo.toUpperCase()] ?? ''} onChange={e => handleChange(atrib.campo, e.target.value)}>
                    <option value="">Seleccione...</option>
                    {atrib.opciones?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                )}

                {atrib.tipo === 'multiselect' && (
                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg border border-dashed">
                    {atrib.opciones?.map((opt: string) => (
                      <div key={opt} className="flex items-center gap-2">
                        <Checkbox 
                          id={`${atrib.id}-${opt}`}
                          checked={(formData[atrib.campo] || []).includes(opt)}
                          onCheckedChange={() => handleMultiselect(atrib.campo, opt)}
                        />
                        <label htmlFor={`${atrib.id}-${opt}`} className="text-xs text-slate-600 cursor-pointer">{opt}</label>
                      </div>
                    ))}
                  </div>
                )}

                {atrib.tipo === 'boolean' && (
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-md border">
                    <Checkbox checked={formData[atrib.campo] || false} onCheckedChange={val => handleChange(atrib.campo, !!val)} />
                    <span className="text-sm text-slate-600">Marcar como activo</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER ACCIONES */}
        <div className="p-4 border-t bg-white flex flex-col gap-3 sticky bottom-0">
          <div className="flex gap-3">
            {idEdicion && (
              <Button 
                variant="destructive" 
                onClick={handleEliminar} 
                disabled={saving} 
                className="gap-2"
              >
                <Trash2 size={16} />
              </Button>
            )}
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={saving}>Cancelar</Button>
            <Button onClick={handleSubmit} className="flex-1 bg-blue-600 hover:bg-blue-700 gap-2" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {idEdicion ? 'Actualizar' : 'Guardar'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}