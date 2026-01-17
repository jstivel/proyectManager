'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { 
  Loader2, Save, X, MapPin, Trash2, 
  Camera, Calendar, Edit3, Maximize2
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import imageCompression from 'browser-image-compression'

// IMPORTAMOS NUESTRA NUEVA ARQUITECTURA DE HOOKS
import { useInfraestructura } from '@/hooks/useInfraestructuras'
import { useBiblioteca } from '@/hooks/useBiblioteca'

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
  
  // HOOKS NORMALIZADOS
  const { useDetalle, saveMutation, deleteMutation } = useInfraestructura(proyectoId)
  const { capas, isLoading: loadingBiblioteca } = useBiblioteca()
  
  // ESTADOS LOCALES
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [backendError, setBackendError] = useState<string | null>(null)
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [modoEdicion, setModoEdicion] = useState(false)
  const [fotoZoom, setFotoZoom] = useState<string | null>(null)

  // 1. CARGAR DEFINICIÓN DE LA CAPA DESDE LA BIBLIOTECA
  const capaActual = capas?.find((c: any) => c.id === capaId)
  const atributos = capaActual?.attribute_definitions || []

  // 2. CARGAR DATOS EXISTENTES (Si estamos editando)
  const { data: featureData, isLoading: loadingFeature } = useDetalle(idEdicion)

  // 3. SINCRONIZACIÓN DE ESTADO
  useEffect(() => {
    if (!atributos.length) return;

    if (idEdicion && featureData) {
      setModoEdicion(false);
      setFormData(featureData.atributos || {});
    } else if (!idEdicion) {
      setModoEdicion(true);
      const inicial: any = {};
      atributos.forEach((atrib: any) => {
        if (atrib.tipo === 'multiselect') inicial[atrib.campo] = [];
        else if (atrib.tipo === 'boolean') inicial[atrib.campo] = null;
        else inicial[atrib.campo] = '';
      });
      setFormData(inicial);
    }
    setBackendError(null);
  }, [atributos, featureData, idEdicion]);

  // 4. MANEJADORES DE CAMBIO
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
  }

  // 5. GESTIÓN DE FOTOS
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !idEdicion) return;
    setSubiendoFoto(true);
    try {
      const file = e.target.files[0];
      const options = { maxSizeMB: 0.3, maxWidthOrHeight: 1600, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);
      
      const fileName = `${Date.now()}.jpg`;
      const filePath = `${proyectoId}/${idEdicion}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('feature-photos')
        .upload(filePath, compressedFile);

      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.rpc('fn_insert_feature_photo', {
        p_feature_id: idEdicion,
        p_storage_path: filePath,
        p_descripcion: 'Captura de campo'
      });

      if (insertError) throw insertError;
      queryClient.invalidateQueries({ queryKey: ['infra_detalle', idEdicion] });

    } catch (err: any) { 
      setBackendError(`Error de imagen: ${err.message}`); 
    } finally { 
      setSubiendoFoto(false); 
    }
  };

  // 6. PERSISTENCIA
  const handleSubmit = async () => {
    setBackendError(null);
    saveMutation.mutate({ 
      idEdicion: idEdicion || undefined, 
      proyectoId, 
      featureTypeId: capaId, 
      latitud: coordenadas.lat, 
      longitud: coordenadas.lng, 
      atributos: formData 
    }, {
      onSuccess: (result) => {
        if (!result.error) {
          onSave(); 
          onClose();
        }
      }
    });
  };

  const isLoading = loadingBiblioteca || (!!idEdicion && loadingFeature)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-white absolute right-0 top-0 z-[100] w-80 border-l shadow-2xl">
        <Loader2 className="animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[90]" onClick={!saveMutation.isPending ? onClose : undefined} />

      {fotoZoom && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 animate-in fade-in cursor-zoom-out" onClick={() => setFotoZoom(null)}>
          <button className="absolute top-6 right-6 text-white"><X size={32} /></button>
          <img src={fotoZoom} className="max-w-full max-h-full object-contain rounded-sm shadow-2xl" alt="Zoom" />
        </div>
      )}

      <div className="flex flex-col h-full bg-white text-slate-900 border-l shadow-2xl w-80 md:w-96 absolute right-0 top-0 z-[100] animate-in slide-in-from-right duration-300">
        
        <div className="p-4 border-b bg-slate-900 text-white flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-blue-400" />
              <h2 className="font-bold text-sm">{idEdicion ? 'Ficha Técnica' : 'Nuevo Registro'}</h2>
              {idEdicion && featureData?.id_tecnico && (
                <span className="bg-blue-600 text-white px-2 py-0.5 rounded-md text-[11px] font-black italic shadow-sm">
                  {featureData.id_tecnico}
                </span>
              )}
            </div>
            {idEdicion && (
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full mt-1.5 inline-block w-fit tracking-wider ${modoEdicion ? 'bg-orange-500 animate-pulse' : 'bg-green-600'}`}>
                {modoEdicion ? 'MODO EDICIÓN' : 'MODO LECTURA'}
              </span>
            )}
          </div>
          <button onClick={onClose} className="hover:bg-slate-800 p-1.5 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {backendError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[11px] font-bold">
              {backendError}
            </div>
          )}

          {atributos?.map((atrib: any) => (
            <div key={atrib.campo} className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">{atrib.campo}</label>
              
              <div className={!modoEdicion ? "pointer-events-none opacity-90" : ""}>
                {atrib.tipo === 'boolean' && (
                  <div className="flex gap-2">
                    {[true, false].map((val) => (
                      <button
                        key={String(val)}
                        type="button"
                        onClick={() => handleChange(atrib.campo, val, 'boolean')}
                        className={`flex-1 py-2.5 rounded-md text-[10px] font-black transition-all border ${formData[atrib.campo] === val ? (val ? 'bg-green-600 border-green-700 text-white' : 'bg-red-600 border-red-700 text-white') : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                      >{val ? 'SÍ' : 'NO'}</button>
                    ))}
                  </div>
                )}

                {atrib.tipo === 'date' && (
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 text-slate-400" size={14} />
                    <input 
                      type="date" 
                      className="w-full p-2.5 pl-9 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none" 
                      value={formData[atrib.campo] ?? ''} 
                      onChange={e => handleChange(atrib.campo, e.target.value, 'date')} 
                    />
                  </div>
                )}

                {atrib.tipo === 'select' && (
                  <select 
                    className="w-full p-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none bg-white" 
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
                        <label key={opt} className={`flex items-center gap-2 p-2 border rounded-md transition-colors ${isChecked ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-100'} cursor-pointer`}>
                          <input 
                            type="checkbox" 
                            checked={isChecked} 
                            onChange={(e) => {
                              const val = Array.isArray(formData[atrib.campo]) ? formData[atrib.campo] : [];
                              const next = e.target.checked ? [...val, opt] : val.filter((v: string) => v !== opt);
                              handleChange(atrib.campo, next, 'multiselect');
                            }} 
                            className="w-4 h-4 rounded text-blue-600 border-slate-300" 
                          />
                          <span className="text-[10px] font-bold text-slate-600 uppercase">{opt}</span>
                        </label>
                      )
                    })}
                  </div>
                )}

                {!['boolean', 'date', 'select', 'multiselect'].includes(atrib.tipo) && (
                  <input 
                    type={atrib.tipo === 'number' || atrib.tipo === 'decimal' ? 'number' : 'text'}
                    className="w-full p-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none" 
                    value={formData[atrib.campo] ?? ''} 
                    placeholder={`Ingrese ${atrib.campo.toLowerCase()}...`}
                    onChange={e => handleChange(atrib.campo, e.target.value, atrib.tipo)} 
                  />
                )}
              </div>
            </div>
          ))}

          {idEdicion && (
            <div className="pt-4 border-t space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Evidencia Fotográfica</label>
              <div className="grid grid-cols-3 gap-2">
                {featureData?.fotos?.map((foto: any) => {
                  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/feature-photos/${foto.storage_path}`;
                  return (
                    <div key={foto.id} className="group aspect-square bg-slate-100 rounded-lg border overflow-hidden relative shadow-sm">
                      <img src={url} className="w-full h-full object-cover cursor-zoom-in" onClick={() => setFotoZoom(url)} alt="Evidencia" />
                      <div className="absolute bottom-1 right-1 text-white opacity-0 group-hover:opacity-100 pointer-events-none p-1 bg-black/20 rounded">
                        <Maximize2 size={10} />
                      </div>
                    </div>
                  )
                })}
                {modoEdicion && (
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400 bg-slate-50 hover:bg-blue-50 transition-all">
                    {subiendoFoto ? <Loader2 className="animate-spin text-blue-500" /> : <Camera size={20} />}
                    <span className="text-[9px] font-black mt-1 uppercase">Cámara</span>
                  </button>
                )}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handlePhotoUpload} />
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-slate-50 flex gap-2">
          {!modoEdicion ? (
            <>
              <Button onClick={() => setModoEdicion(true)} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-[10px] tracking-widest h-12 shadow-lg">
                <Edit3 size={14} className="mr-2"/> Editar Ficha
              </Button>
              <Button 
                variant="outline" 
                className="border-red-200 text-red-600 hover:bg-red-50 w-12 h-12 p-0" 
                onClick={() => {if(confirm('¿Eliminar registro permanentemente?')) deleteMutation.mutate({id: idEdicion!, proyectoId}, {onSuccess: onClose})}}
              >
                <Trash2 size={18} />
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => idEdicion ? setModoEdicion(false) : onClose()} variant="outline" className="flex-1 border-slate-300 text-slate-600 font-black uppercase text-[10px] tracking-widest h-12">
                Cancelar
              </Button>
              <Button 
                onClick={handleSubmit} 
                className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] tracking-widest h-12 shadow-lg shadow-blue-200" 
                disabled={saveMutation.isPending || subiendoFoto}
              >
                {saveMutation.isPending ? <Loader2 className="animate-spin mr-2" size={14} /> : <Save className="mr-2" size={14} />} Confirmar y Guardar
              </Button>
            </>
          )}
        </div>
      </div>
    </>
  )
}