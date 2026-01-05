import { supabase } from './supabase'

export async function getInfraestructurasMapa() {
  const { data, error } = await supabase
    .from('v_infraestructuras_mapa')
    .select('*')

  if (error) {
    console.error('Error cargando infraestructuras:', error)
    throw error
  }

  return data
}

export async function crearInfraestructura({
  tipo,
  latitud,
  longitud
}: {
  tipo: 'poste' | 'camara' | 'predio' | 'otro'
  latitud: number
  longitud: number
}) {
  const { data, error } = await supabase.rpc(
    'crear_infraestructura',
    {
      tipo,
      latitud,
      longitud
    }
  )

  if (error) {
    console.error(error)
    throw error
  }

  return data
}
