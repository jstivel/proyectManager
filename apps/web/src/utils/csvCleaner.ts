export const cleanCsvData = (rawData: any[]) => {
  const errors: { line: number; message: string }[] = [];
  
  // 1. Filtrar fila de instrucciones y filas totalmente vacías
  const dataRows = rawData.filter(row => 
    row.id_tecnico !== 'ID_UNICO_001' && 
    Object.values(row).some(v => v !== null && v !== undefined && v !== '')
  );

  const cleaned = dataRows.map((row, index) => {
    const lineNum = index + 2; 
    const newRow: any = {};

    Object.keys(row).forEach(key => {
      const rawVal = row[key];
      
      // --- LÓGICA DE NULOS CRÍTICA ---
      // Si el valor no existe, es string vacío, o es la palabra "null"/"undefined"
      if (
        rawVal === null || 
        rawVal === undefined || 
        rawVal.toString().trim() === "" || 
        rawVal.toString().toLowerCase() === "null"
      ) {
        newRow[key] = null; // ENVIAR NULL REAL
      } else {
        // Solo procesamos si hay texto real
        let val = rawVal.toString().trim();
        val = val.normalize("NFD")
                 .replace(/[\u0300-\u036f]/g, "")
                 .toUpperCase();
        newRow[key] = val;
      }
    });

    // 2. Validación de Coordenadas
    const lat = parseFloat(newRow.latitude);
    const lng = parseFloat(newRow.longitude);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.push({ line: lineNum, message: `Latitud inválida` });
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      errors.push({ line: lineNum, message: `Longitud inválida` });
    }

    // 3. Manejo de campos especiales
    const estadosValidos = ['PENDIENTE', 'VALIDADO', 'PROYECTADO', 'EJECUTADO'];
    newRow.estado = estadosValidos.includes(newRow.estado) ? newRow.estado : 'PENDIENTE';

    // Si id_tecnico es null, lo eliminamos del objeto para que la DB use su Default/Sequence
    if (newRow.id_tecnico === null) {
      delete newRow.id_tecnico;
    }

    return {
      ...newRow,
      latitude: lat,
      longitude: lng
    };
  });

  return { cleaned, errors };
};