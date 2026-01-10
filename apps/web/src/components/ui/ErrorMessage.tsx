import { AlertCircle } from 'lucide-react'

export function ErrorMessage({ message }: { message: string | null }) {
  if (!message) return null;
  
  return (
    <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded-r-lg flex items-start gap-2 text-red-700 animate-in fade-in slide-in-from-top-2 duration-300">
      <AlertCircle size={16} className="shrink-0 mt-0.5" />
      <div className="flex flex-col">
        <span className="text-[10px] font-black uppercase tracking-tight">Error de Validación de Datos</span>
        <span className="text-xs font-medium leading-tight">{message}</span>
      </div>
    </div>
  );
}