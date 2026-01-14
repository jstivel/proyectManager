'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { 
  Loader2, Save, X, MapPin, Trash2, Info, 
  Camera, Calendar, AlertCircle, Edit3, Maximize2
} from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useInfraMutations } from '@/hooks/useInfraMutations'
import imageCompression from 'browser-image-compression';

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
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [backendError, setBackendError] = useState<string | null>(null)
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [modoEdicion, setModoEdicion] = useState(false)
  const [fotoZoom, setFotoZoom] = useState<string | null>(null)
  
  const { saveMutation, deleteMutation } = useInfraMutations()

  // 1. Cargar Definiciones de Atributos
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

  // 2. Cargar Datos, Fotos e ID Técnico
  const { data: featureData, isLoading: loadingFeature } = useQuery({
    queryKey: ['feature_data', idEdicion],
    queryFn: async () => {
      if (!idEdicion) return null
      
      // Consultamos id_tecnico de la tabla features
      const { data: featBase } = await supabase
        .from('features')
        .select('id_tecnico')
        .eq('id', idEdicion)
        .maybeSingle()

      // Consultamos atributos dinámicos
      const { data: attrData } = await supabase
        .from('feature_attributes')
        .select('data')
        .eq('feature_id', idEdicion)
        .maybeSingle()

      // Consultamos fotos
      const { data: photosData } = await supabase
        .from('feature_photos')
        .select('*')
        .eq('feature_id', idEdicion)
        .order('creado_en', { ascending: false })

      return { 
        id_tecnico: featBase?.id_tecnico || null,
        attributes: attrData?.data || null, 
        photos: photosData || [] 
      }
    },
    enabled: !!idEdicion,
  })

  // 3. Sincronización de Estado
  useEffect(() => {
    if (!atributos) return;
    if (idEdicion) {
      setModoEdicion(false);
      if (featureData?.attributes) setFormData(featureData.attributes);
    } else {
      setModoEdicion(true);
      const inicial: any = {};
      atributos.forEach(atrib => {
        if (atrib.tipo === 'multiselect') inicial[atrib.campo] = [];
        else if (atrib.tipo === 'boolean') inicial[atrib.campo] = null;
        else if (atrib.tipo === 'number' || atrib.tipo === 'decimal') inicial[atrib.campo] = '';
        else inicial[atrib.campo] = '';
      });
      setFormData(inicial);
    }
    setErrors({});
    setBackendError(null);
  }, [atributos, featureData, idEdicion]);

  const handleChange = (campo: string, valor: any, tipo: string) => {
    if (!modoEdicion) return;
    let valorFinal = valor;

    if (valor === '' || valor === null) {
      valorFinal = tipo === 'multiselect' ? [] : '';
    } else {
      switch (tipo) {
        case 'number': valorFinal = valor === '' ? '' : parseInt(valor, 10); break;
        case 'decimal': valorFinal = valor === '' ? '' : parseFloat(valor); break;
        default: valorFinal = valor;
      }
    }
    setFormData(prev => ({ ...prev, [campo]: valorFinal }));
    if (errors[campo]) setErrors(prev => ({ ...prev, [campo]: '' }));
  }

  // GESTIÓN DE FOTOS CON COMPRESIÓN HD
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !idEdicion) return;
    setSubiendoFoto(true);
    const file = e.target.files[0];

    const options = {
      maxSizeMB: 0.3,
      maxWidthOrHeight: 1600,
      useWebWorker: true,
      fileType: 'image/jpeg'
    };

    try {
      const compressedFile = await imageCompression(file, options);
      const fileName = `${Date.now()}_${file.name.replace(/\.[^/.]+$/, "")}.jpg`;
      const filePath = `${proyectoId}/${idEdicion}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('feature-photos')
        .upload(filePath, compressedFile);

      if (uploadError) throw uploadError;

      const { data: userData } = await supabase.auth.getUser();
      const { error: insertError } = await supabase.from('feature_photos').insert({
        feature_id: idEdicion, 
        storage_path: filePath, 
        creado_por: userData.user?.id
      });

      if (insertError) throw insertError;
      queryClient.invalidateQueries({ queryKey: ['feature_data', idEdicion] });

    } catch (err: any) { 
      alert(`Error al procesar imagen: ${err.message}`); 
    } finally { 
      setSubiendoFoto(false); 
    }
  };

  const handleEliminarFoto = async (fotoId: string, path: string) => {
    if (!confirm('¿Eliminar esta fotografía?')) return;
    try {
      await supabase.storage.from('feature-photos').remove([path]);
      await supabase.from('feature_photos').delete().eq('id', fotoId);
      queryClient.invalidateQueries({ queryKey: ['feature_data', idEdicion] });
    } catch (err: any) { 
      alert(err.message); 
    }
  };

  const handleSubmit = async () => {
    saveMutation.mutate({ idEdicion, proyectoId, capaId, coords: coordenadas, formData }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['infraestructuras'] });
        onSave(); 
        onClose();
      },
      onError: (err: any) => setBackendError(err.message)
    });
  };

  const isLoading = loadingDefs || (!!idEdicion && loadingFeature)
  const isSaving = saveMutation.isPending || deleteMutation.isPending

  if (isLoading) return <div className="flex items-center justify-center h-full bg-white absolute right-0 top-0 z-[100] w-80 border-l shadow-2xl"><Loader2 className="animate-spin text-blue-600" /></div>

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[90]" onClick={!isSaving ? onClose : undefined} />

      {/* LIGHTBOX */}
      {fotoZoom && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 animate-in fade-in" onClick={() => setFotoZoom(null)}>
          <button className="absolute top-6 right-6 text-white"><X size={32} /></button>
          <img src={fotoZoom} className="max-w-full max-h-full object-contain" alt="Zoom" />
        </div>
      )}

      <div className="flex flex-col h-full bg-white text-slate-900 border-l shadow-2xl w-80 md:w-96 absolute right-0 top-0 z-[100] animate-in slide-in-from-right">
        
        {/* Header */}
        <div className="p-4 border-b bg-slate-900 text-white flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-blue-400" />
              <h2 className="font-bold text-sm tracking-tight">
                {idEdicion ? 'Ficha Técnica' : 'Nuevo Registro'}
              </h2>
              {/* ID TÉCNICO AMIGABLE */}
              {idEdicion && featureData?.id_tecnico && (
                <span className="bg-blue-600 text-white px-2 py-0.5 rounded-md text-[11px] font-black border border-blue-400 shadow-sm">
                  {featureData.id_tecnico}
                </span>
              )}
            </div>
            {idEdicion && (
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full mt-1.5 inline-block w-fit ${modoEdicion ? 'bg-orange-500' : 'bg-green-600'}`}>
                {modoEdicion ? 'MODO EDICIÓN' : 'MODO LECTURA'}
              </span>
            )}
          </div>
          <button onClick={onClose} className="hover:bg-slate-800 p-1 rounded transition-colors"><X size={20} /></button>
        </div>

        {/* Cuerpo */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {backendError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[11px]">{backendError}</div>}

          {atributos?.map(atrib => (
            <div key={atrib.id} className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{atrib.campo}</label>
              
              <div className={!modoEdicion ? "pointer-events-none" : ""}>
                {atrib.tipo === 'boolean' && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleChange(atrib.campo, true, 'boolean')}
                      className={`flex-1 py-2 rounded-md text-[10px] font-bold transition-all ${formData[atrib.campo] === true ? 'bg-green-600 text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}
                    >SÍ</button>
                    <button
                      type="button"
                      onClick={() => handleChange(atrib.campo, false, 'boolean')}
                      className={`flex-1 py-2 rounded-md text-[10px] font-bold transition-all ${formData[atrib.campo] === false ? 'bg-red-600 text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}
                    >NO</button>
                  </div>
                )}

                {atrib.tipo === 'date' && (
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 text-slate-400" size={14} />
                    <input 
                      type="date" 
                      className={`w-full p-2 pl-9 text-sm border rounded ${!modoEdicion ? 'bg-slate-50 border-transparent' : 'bg-white'}`} 
                      value={formData[atrib.campo] ?? ''} 
                      onChange={e => handleChange(atrib.campo, e.target.value, 'date')} 
                    />
                  </div>
                )}

                {atrib.tipo === 'select' && (
                  <select 
                    className={`w-full p-2 text-sm border rounded ${!modoEdicion ? 'bg-slate-50 border-transparent appearance-none' : 'bg-white'}`} 
                    value={formData[atrib.campo] ?? ''} 
                    onChange={e => handleChange(atrib.campo, e.target.value, 'select')}
                  >
                    <option value="">Seleccione...</option>
                    {atrib.opciones?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                )}

                {atrib.tipo === 'multiselect' && (
                  <div className="grid grid-cols-2 gap-2">
                    {atrib.opciones?.map((opt: string) => {
                      const isChecked = Array.isArray(formData[atrib.campo]) && formData[atrib.campo].includes(opt);
                      return (
                        <label key={opt} className={`flex items-center gap-2 p-2 border rounded-md ${isChecked ? 'bg-blue-50 border-blue-200' : 'bg-white'} cursor-pointer`}>
                          <input type="checkbox" checked={isChecked} onChange={(e) => {
                            const val = Array.isArray(formData[atrib.campo]) ? formData[atrib.campo] : [];
                            const next = e.target.checked ? [...val, opt] : val.filter((v: string) => v !== opt);
                            handleChange(atrib.campo, next, 'multiselect');
                          }} className="w-4 h-4 rounded text-blue-600" />
                          <span className="text-[11px] font-bold text-slate-600">{opt}</span>
                        </label>
                      )
                    })}
                  </div>
                )}

                {!['boolean', 'date', 'select', 'multiselect'].includes(atrib.tipo) && (
                  <input 
                    type={atrib.tipo === 'number' || atrib.tipo === 'decimal' ? 'number' : 'text'}
                    step={atrib.tipo === 'decimal' ? 'any' : undefined}
                    className={`w-full p-2 text-sm border rounded ${!modoEdicion ? 'bg-slate-50 border-transparent' : 'bg-white'}`} 
                    value={formData[atrib.campo] ?? ''} 
                    onChange={e => handleChange(atrib.campo, e.target.value, atrib.tipo)} 
                  />
                )}
              </div>
            </div>
          ))}

          {/* Galería de Fotos */}
          {idEdicion && (
            <div className="pt-4 border-t space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Evidencia Fotográfica</label>
              <div className="grid grid-cols-3 gap-2">
                {featureData?.photos?.map((foto: any) => {
                  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/feature-photos/${foto.storage_path}`;
                  return (
                    <div key={foto.id} className="group aspect-square bg-slate-100 rounded-lg border overflow-hidden relative">
                      <img src={url} className="w-full h-full object-cover cursor-pointer" onClick={() => setFotoZoom(url)} alt="Infra" />
                      {modoEdicion && (
                        <button type="button" onClick={() => handleEliminarFoto(foto.id, foto.storage_path)} className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded opacity-0 group-hover:opacity-100"><Trash2 size={12} /></button>
                      )}
                      <div className="absolute bottom-1 right-1 text-white opacity-0 group-hover:opacity-100 pointer-events-none"><Maximize2 size={12} /></div>
                    </div>
                  )
                })}
                {modoEdicion && (
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400 bg-slate-50 hover:bg-slate-100">
                    {subiendoFoto ? <Loader2 className="animate-spin" /> : <Camera size={20} />}
                    <span className="text-[9px] font-bold mt-1 uppercase">Cámara</span>
                  </button>
                )}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handlePhotoUpload} />
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="p-4 border-t bg-slate-50 flex gap-2">
          {!modoEdicion ? (
            <>
              <Button onClick={() => setModoEdicion(true)} className="flex-1 bg-slate-900 text-white font-bold uppercase text-xs h-11"><Edit3 size={16} className="mr-2"/> Editar</Button>
              <Button variant="outline" className="border-red-200 text-red-600" onClick={() => {if(confirm('¿Eliminar registro?')) deleteMutation.mutate(idEdicion!, {onSuccess: onClose})}}><Trash2 size={18} /></Button>
            </>
          ) : (
            <>
              <Button onClick={() => idEdicion ? setModoEdicion(false) : onClose()} variant="outline" className="flex-1 border-slate-300 text-slate-600 font-bold uppercase text-xs h-11">Cancelar</Button>
              <Button onClick={handleSubmit} className="flex-[2] bg-blue-600 text-white font-bold uppercase text-xs h-11 shadow-lg" disabled={isSaving || subiendoFoto}>
                {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />} Guardar
              </Button>
            </>
          )}
        </div>
      </div>
    </>
  )
}