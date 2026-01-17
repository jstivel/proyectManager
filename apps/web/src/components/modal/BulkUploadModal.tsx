'use client'

import React, { useState } from 'react';
import Papa from 'papaparse';
import { FileUp, Loader2, AlertTriangle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';

interface BulkUploadModalProps {
  proyectoId: string;
  capa: { 
    id: string; 
    nombre: string; 
    campos_requeridos: string[] 
  };
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkUploadModal({ proyectoId, capa, onClose, onSuccess }: BulkUploadModalProps) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{line: number, message: string}[]>([]);
  const [dataReady, setDataReady] = useState<any[]>([]);
  const supabase = createClient();

  /**
   * Procesa el archivo CSV, valida estructura técnica y normaliza datos para la BD.
   */
  const handleProcessCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: Papa.ParseResult<any>) => {
        const validatedData: any[] = [];
        const validationErrors: {line: number, message: string}[] = [];
        
        // 1. Normalización de encabezados del CSV para validación de estructura
        const csvHeaders = (results.meta.fields || []).map(h => h.toLowerCase().trim());
        
        const baseRequired = ['latitude', 'longitude'];
        const technicalIdentity = (capa.campos_requeridos || [])
            .map(f => f.toLowerCase().trim())
            .filter(f => f !== 'id_tecnico');

        const missingHeaders = [...baseRequired, ...technicalIdentity].filter(f => !csvHeaders.includes(f));

        if (missingHeaders.length > 0) {
          setErrors([{ 
            line: 0, 
            message: `Estructura incorrecta. Faltan columnas: ${missingHeaders.join(', ')}` 
          }]);
          setDataReady([]);
          return;
        }

        // 2. Filtrado de filas (omitir ejemplo e instrucciones del template)
        const rows = results.data.filter(r => 
           r.latitude !== '4.612345' && Object.values(r).some(v => v !== "" && v !== null)
        );

        // 3. Procesamiento y Limpieza (Normalización de Nulos y Mayúsculas)
        rows.forEach((row: any, index: number) => {
          const lineNum = index + 3; // +1 header, +1 ejemplo, +1 actual
          const lat = parseFloat(row.latitude);
          const lng = parseFloat(row.longitude);

          if (isNaN(lat) || isNaN(lng)) {
            validationErrors.push({ line: lineNum, message: "Coordenadas lat/lng inválidas." });
            return;
          }

          const attributes: any = {};
          
          Object.keys(row).forEach(key => {
            // NORMALIZACIÓN DE LLAVE: Para la BD, la llave debe ser MAYÚSCULA
            const dbKey = key.trim().toUpperCase();
            
            // LISTA NEGRA: Columnas que NO deben ir dentro del JSONB de atributos
            const blackList = ['LATITUDE', 'LONGITUDE', 'ESTADO', 'ID_TECNICO', 'ID_TÉCNICO'];

            if (!blackList.includes(dbKey)) {
              const rawValue = row[key];
              
              // NORMALIZACIÓN DE VALORES: Detectar vacíos para enviar NULL real
              const isNull = rawValue === null || 
                             rawValue === undefined || 
                             rawValue.toString().trim() === "" || 
                             rawValue.toString().toLowerCase() === "null";

              if (isNull) {
                attributes[dbKey] = null;
              } else {
                // Limpieza de texto: quitar acentos y pasar a MAYÚSCULAS
                attributes[dbKey] = rawValue.toString()
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "")
                  .trim()
                  .toUpperCase();
              }
            }
          });

          // Ensamblaje de la fila validada para el RPC
          validatedData.push({
            latitude: lat,
            longitude: lng,
            estado: row.estado?.toString().toUpperCase() || 'PENDIENTE',
            ...attributes 
          });
        });

        setErrors(validationErrors);
        setDataReady(validationErrors.length === 0 ? validatedData : []);
      }
    });
  };

  /**
   * Ejecuta el RPC 'bulk_insert_features' para inserción masiva atómica.
   */
  const handleUpload = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.rpc('bulk_insert_features', {
        p_proyecto_id: proyectoId,
        p_feature_type_id: capa.id,
        p_creado_por: user?.id,
        p_rows: dataReady 
      });

      if (error) throw error;
      onSuccess();
    } catch (err: any) {
      console.error("Error en carga masiva:", err);
      const errorMsg = err.message || "Error desconocido en el servidor";
      alert("Error de Integridad: " + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b bg-slate-50 flex justify-between items-center">
          <div>
            <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest leading-none">Validador de Carga</h3>
            <p className="text-[10px] text-blue-600 font-bold uppercase mt-1">Capa: {capa.nombre}</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-400 hover:text-red-500 transition-all font-bold"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {/* Alerta Informativa */}
          <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-lg">
            <p className="text-[10px] text-amber-700 leading-tight">
              <strong>Importante:</strong> Se están ignorando las columnas de ID Técnico para permitir la autogeneración por parte del sistema y evitar errores de duplicidad de registros.
            </p>
          </div>

          {/* Zona de Drop/Upload */}
          <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer transition-all mb-4 ${
            dataReady.length > 0 
              ? 'border-green-400 bg-green-50 shadow-inner' 
              : 'border-slate-300 hover:bg-slate-50 hover:border-blue-400'
          }`}>
            <div className={`p-3 rounded-full mb-1 ${dataReady.length > 0 ? 'bg-green-100' : 'bg-slate-100'}`}>
              <FileUp className={dataReady.length > 0 ? 'text-green-500' : 'text-slate-400'} size={24} />
            </div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
              {dataReady.length > 0 ? `${dataReady.length} Filas Preparadas para Inserción` : "Seleccionar Archivo .CSV"}
            </span>
            <input type="file" className="hidden" accept=".csv" onChange={handleProcessCsv} disabled={loading} />
          </label>

          {/* Visualización de Errores */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4 max-h-40 overflow-y-auto shadow-sm">
              <div className="flex items-center gap-2 text-red-700 font-black text-[10px] uppercase mb-2">
                <AlertTriangle size={14} /> Errores detectados:
              </div>
              <div className="space-y-1">
                {errors.map((err, i) => (
                  <p key={i} className="text-[10px] text-red-600 font-medium flex items-start gap-1">
                    <span className="opacity-50">•</span> 
                    <span>{err.message} {err.line > 0 && <span className="font-bold underline">(Línea {err.line})</span>}</span>
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="flex gap-3 mt-4">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="flex-1 font-black text-[10px] h-12 uppercase tracking-widest border-slate-200 text-slate-500" 
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              disabled={dataReady.length === 0 || loading || errors.length > 0}
              onClick={handleUpload}
              className={`flex-[2] font-black text-[10px] h-12 uppercase tracking-widest text-white transition-all shadow-lg active:scale-[0.98] ${
                dataReady.length > 0 ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-slate-300'
              }`}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={16} />
                  <span>Insertando Datos...</span>
                </div>
              ) : (
                "Confirmar e Insertar"
              )}
            </Button>
          </div>
        </div>

        {/* Footer sutil */}
        <div className="px-6 py-3 bg-slate-50 border-t flex justify-center">
          <p className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em]">Data Engine v2.0 • Validated Process</p>
        </div>
      </div>
    </div>
  );
}