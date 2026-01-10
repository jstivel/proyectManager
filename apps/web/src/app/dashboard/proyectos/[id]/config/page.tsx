// 'use client'

// import { useEffect, useState, useRef } from 'react'
// import { useSearchParams, useRouter } from 'next/navigation'
// import { supabase } from '@/lib/supabase'
// import { Button } from '@/components/ui/button'
// import Map from '@/components/map/Map'
// import { ArrowLeft, Save, Settings2, Loader2 } from 'lucide-react'

// export default function AsignarCapasProyecto() {
//   const searchParams = useSearchParams()
//   const proyectoId = searchParams.get('id')
//   const router = useRouter()

//   const mountedRef = useRef(true)

//   const [proyecto, setProyecto] = useState<any>(null)
//   const [biblioteca, setBiblioteca] = useState<any[]>([])
//   const [asignadas, setAsignadas] = useState<string[]>([])
//   const [loading, setLoading] = useState(true)
//   const [saving, setSaving] = useState(false)

//   useEffect(() => {
//     mountedRef.current = true
//     if (proyectoId) {
//       fetchData()
//     }
//     return () => {
//       mountedRef.current = false
//     }
//   }, [proyectoId])

//   async function fetchData() {
//     setLoading(true)

//     try {
//       const [
//         { data: proy, error: proyError },
//         { data: biblio, error: biblioError },
//         { data: yaAsignadas, error: asignadasError }
//       ] = await Promise.all([
//         supabase.from('proyectos').select('*').eq('id', proyectoId).single(),
//         supabase.from('feature_types').select('*'),
//         supabase
//           .from('proyecto_capas')
//           .select('feature_type_id')
//           .eq('proyecto_id', proyectoId)
//       ])

//       if (proyError) throw proyError
//       if (biblioError) throw biblioError
//       if (asignadasError) throw asignadasError

//       if (!mountedRef.current) return

//       setProyecto(proy)
//       setBiblioteca(biblio || [])
//       setAsignadas(yaAsignadas?.map(a => a.feature_type_id) || [])

//     } catch (error) {
//       console.error('Error cargando datos:', error)
//     } finally {
//       if (mountedRef.current) {
//         setLoading(false)
//       }
//     }
//   }

//   const toggleCapa = (id: string) => {
//     setAsignadas(prev =>
//       prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
//     )
//   }

//   async function guardarCambios() {
//     if (!proyectoId) return

//     setSaving(true)

//     try {
//       const { error: deleteError } = await supabase
//         .from('proyecto_capas')
//         .delete()
//         .eq('proyecto_id', proyectoId)

//       if (deleteError) throw deleteError

//       if (asignadas.length > 0) {
//         const rows = asignadas.map(capaId => ({
//           proyecto_id: proyectoId,
//           feature_type_id: capaId
//         }))

//         const { error: insertError } = await supabase
//           .from('proyecto_capas')
//           .insert(rows)

//         if (insertError) throw insertError
//       }

//       alert('Configuración guardada con éxito')
//       router.refresh()

//     } catch (error) {
//       console.error('Error al guardar:', error)
//       alert('Error al guardar la configuración')
//     } finally {
//       setSaving(false)
//     }
//   }

//   if (loading) {
//     return (
//       <div className="flex h-screen items-center justify-center bg-slate-50">
//         <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
//       </div>
//     )
//   }

//   return (
//     <div className="flex flex-col h-screen bg-slate-50">
//       {/* Header */}
//       <div className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm z-20">
//         <div className="flex items-center gap-4">
//           <Button variant="ghost" size="sm" onClick={() => router.back()}>
//             <ArrowLeft className="h-4 w-4 mr-2" /> Volver
//           </Button>
//           <div>
//             <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
//               <Settings2 className="h-5 w-5 text-blue-600" />
//               Configuración de Capas
//             </h1>
//             <p className="text-xs text-slate-500 font-medium">
//               Proyecto:{' '}
//               <span className="text-blue-600">
//                 {proyecto?.nombre || 'Cargando...'}
//               </span>
//             </p>
//           </div>
//         </div>
//         <Button
//           onClick={guardarCambios}
//           disabled={saving}
//           className="bg-blue-600 hover:bg-blue-700 shadow-md"
//         >
//           {saving ? (
//             <Loader2 className="h-4 w-4 animate-spin mr-2" />
//           ) : (
//             <Save className="h-4 w-4 mr-2" />
//           )}
//           {saving ? 'Guardando...' : 'Guardar Configuración'}
//         </Button>
//       </div>

//       {/* Main Content */}
//       <div className="flex-1 flex overflow-hidden">
//         {/* Sidebar */}
//         <div className="w-80 border-r bg-white overflow-y-auto p-6 shadow-inner">
//           <h2 className="text-[11px] font-bold text-slate-400 mb-4 uppercase tracking-widest">
//             Biblioteca de Infraestructura
//           </h2>
//           <div className="space-y-2">
//             {biblioteca.map((capa) => (
//               <div
//                 key={capa.id}
//                 onClick={() => toggleCapa(capa.id)}
//                 className={`group flex items-center p-3 border rounded-xl cursor-pointer transition-all duration-200 ${
//                   asignadas.includes(capa.id)
//                     ? 'border-blue-500 bg-blue-50/50 shadow-sm'
//                     : 'hover:border-slate-300 hover:bg-slate-50 border-slate-100'
//                 }`}
//               >
//                 <div
//                   className={`w-5 h-5 rounded-md border flex items-center justify-center mr-3 transition-colors ${
//                     asignadas.includes(capa.id)
//                       ? 'bg-blue-600 border-blue-600'
//                       : 'bg-white border-slate-300'
//                   }`}
//                 >
//                   {asignadas.includes(capa.id) && (
//                     <div className="w-1.5 h-1.5 bg-white rounded-full shadow-sm" />
//                   )}
//                 </div>
//                 <div className="flex-1">
//                   <p
//                     className={`text-sm font-semibold ${
//                       asignadas.includes(capa.id)
//                         ? 'text-blue-900'
//                         : 'text-slate-600'
//                     }`}
//                   >
//                     {capa.nombre}
//                   </p>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Map Area */}
//         <div className="flex-1 bg-slate-100 relative">
//           {proyectoId && <Map proyectoId={proyectoId} />}
//         </div>
//       </div>
//     </div>
//   )
// }
