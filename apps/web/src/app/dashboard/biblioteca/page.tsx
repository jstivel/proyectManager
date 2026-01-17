import { createClient } from '@/utils/supabase/server'
import BibliotecaList from './BibliotecaList'

export default async function BibliotecaPage() {
  const supabase = await createClient()

  /**
   * Cambiamos la consulta directa .from('feature_types')
   * por el RPC get_biblioteca_segura() que ya incluye los atributos.
   */
  const { data: capas, error } = await supabase.rpc('get_biblioteca_segura')

  if (error) {
    console.error("Error cargando biblioteca segura:", error.message)
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Biblioteca Global</h1>
          <p className="text-slate-500 mt-1">Estructuras base para todos los proyectos de infraestructura.</p>
        </div>
      </div>

      <BibliotecaList initialCapas={capas || []} />
    </div>
  )
}