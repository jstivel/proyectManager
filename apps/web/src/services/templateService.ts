// apps/web/src/services/templateService.ts
import { createClient } from '@/utils/supabase/client'

export const downloadLayerTemplate = async (capaId: string, nombreCapa: string) => {
  const supabase = createClient()

  // Traemos las definiciones tal cual están en la BD
  const { data: defs, error } = await supabase
    .from('attribute_definitions')
    .select('campo, tipo, requerido, opciones')
    .eq('feature_type_id', capaId)
    .order('orden', { ascending: true });

  if (error) {
    console.error("Error al obtener definiciones:", error);
    return;
  }

  // 1. Encabezados: Mantenemos 'latitude', 'longitude' y 'estado' en minúsculas 
  // porque el BulkUploadModal los busca así para extraer la geografía.
  const baseHeaders = ['latitude', 'longitude', 'estado'];

  // IMPORTANTE: NO usamos .toLowerCase() aquí. 
  // Queremos que el encabezado sea "PROPIETARIO", "TIPO", etc., tal cual viene del campo 'campo'
  const dynamicHeaders = defs?.map(d => d.campo) || [];
  const allHeaders = [...baseHeaders, ...dynamicHeaders];

  // 2. Fila de Instrucciones (Ejemplo)
  const instructionRow = [
    '4.612345',     // latitude
    '-74.081234',   // longitude
    'PENDIENTE',     // estado
    ...defs?.map(d => {
      const nota = d.requerido ? ' (RECOMENDADO)' : ' (OPCIONAL)';
      
      let opcionesTexto = '';
      if (Array.isArray(d.opciones)) {
        opcionesTexto = d.opciones
          .map((opt: any) => (typeof opt === 'object' ? opt.label || opt.value : opt))
          .join(' o ');
      }

      if (d.tipo === 'multiselect') {
        return `ELEGIR: [${opcionesTexto}] SEPARADOS POR ;${nota}`;
      }
      if (d.tipo === 'select') {
        return `ELEGIR UNO: [${opcionesTexto}]${nota}`;
      }
      
      switch (d.tipo) {
        case 'boolean': return `SI o NO${nota}`;
        case 'date': return `AAAA-MM-DD${nota}`;
        case 'number': return `NUMEROS${nota}`;
        default: return `TEXTO${nota}`;
      }
    }) || []
  ];

  // 3. Generación del CSV con BOM para soporte de caracteres especiales (tildes/ñ)
  const csvContent = [
    allHeaders.join(','), 
    instructionRow.join(',')
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  const safeName = nombreCapa
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, '_')
    .toLowerCase();

  link.setAttribute('href', url);
  link.setAttribute('download', `plantilla_${safeName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};