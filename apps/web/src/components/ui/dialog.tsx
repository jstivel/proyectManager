'use client'

import * as React from "react"
import { X } from "lucide-react"

export function Dialog({ open, onOpenChange, children }: any) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay / Fondo oscuro */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity animate-in fade-in duration-300" 
        onClick={() => onOpenChange(false)} 
      />
      {/* Contenedor del Modal */}
      <div className="relative w-full max-w-lg transform transition-all animate-in zoom-in-95 duration-200">
        {children}
      </div>
    </div>
  )
}

export function DialogContent({ children, className = "" }: any) {
  return (
    <div className={`bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden relative ${className}`}>
      {children}
    </div>
  )
}

export function DialogHeader({ children }: any) {
  return (
    <div className="p-8 pb-4 flex flex-col space-y-1.5 relative">
      {children}
    </div>
  )
}

export function DialogTitle({ children, className = "" }: any) {
  return (
    <h2 className={`text-2xl font-black text-slate-900 tracking-tighter ${className}`}>
      {children}
    </h2>
  )
}

export function DialogDescription({ children, className = "" }: any) {
  return (
    <p className={`text-sm text-slate-400 font-bold uppercase tracking-widest ${className}`}>
      {children}
    </p>
  )
}

// DEFINICIÓN DEL FOOTER
export function DialogFooter({ children, className = "" }: any) {
  return (
    <div className={`p-8 pt-4 bg-slate-50/50 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-4 gap-3 ${className}`}>
      {children}
    </div>
  )
}