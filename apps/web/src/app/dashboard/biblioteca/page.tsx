import { createClient } from '@/utils/supabase/server'
import BibliotecaList from './BibliotecaList'

export default async function BibliotecaPage() {
  const supabase = await createClient()

  // Traemos las capas con sus definiciones de atributos directamente
  const { data: capas, error } = await supabase
    .from('feature_types')
    .select(`*, attribute_definitions (*)`)
    .order('nombre')

  if (error) {
    console.error("Error cargando biblioteca:", error.message)
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