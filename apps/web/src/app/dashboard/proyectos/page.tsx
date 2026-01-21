import DashboardList from './DashboardList'

export default function ProyectosPage() {
  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">
          Gestión de <span className="text-blue-600">Proyectos</span>
        </h1>
        <p className="text-slate-500 mt-2 font-medium tracking-wide">
          Administración de infraestructura y asignación de personal técnico.
        </p>
      </div>

      <DashboardList />
    </div>
  )
}