import { createClient } from '@/utils/supabase/server'
import BibliotecaList from './BibliotecaList'

export default async function BibliotecaPage() {
  const supabase = await createClient()

  // Precarga de datos en el servidor
  const { data: capas, error } = await supabase.rpc('get_biblioteca_segura')

  if (error) {
    console.error("Error inicial biblioteca:", error.message)
  }

  return (
    <div className="p-10 max-w-7xl mx-auto animate-in fade-in duration-700">
      <header className="mb-12">
        <h1 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
          Biblioteca <span className="text-blue-600">Global</span>
        </h1>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3 italic">
          Diccionario maestro de infraestructura y atributos técnicos
        </p>
      </header>

      {/* Pasamos los datos del servidor como initialCapas */}
      <BibliotecaList initialCapas={capas || []} />
    </div>
  )
}