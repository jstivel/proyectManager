export const validarAtributos = (definiciones: any[], valores: any) => {
  const errores: Record<string, string> = {};

  definiciones.forEach(def => {
    const valor = valores[def.campo];

    // 1. Validar Obligatoriedad
    if (def.requerido && (!valor || valor === '')) {
      errores[def.campo] = `El campo ${def.campo} es obligatorio.`;
    }

    // 2. Validar Tipos de datos específicos
    if (valor) {
      if (def.tipo === 'number' && isNaN(Number(valor))) {
        errores[def.campo] = `Debe ser un número válido.`;
      }
      // Aquí puedes agregar validaciones de Regex para otros tipos
    }
  });

  return errores;
};