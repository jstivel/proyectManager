import { ReactNode } from 'react'

interface StatCardProps {
  title: string
  value: string | number
  icon: ReactNode
  color: string
  description?: string
}

export function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-5 h-full group-hover:border-blue-300 transition-all group-hover:shadow-md">
      <div className={`${color} p-3.5 rounded-2xl text-white shadow-lg shadow-current/20`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">
          {title}
        </p>
        <p className="text-4xl font-black text-slate-900 mt-2 leading-none">
          {value}
        </p>
      </div>
    </div>
  )
}