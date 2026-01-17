'use client'

import * as React from "react"
import { X } from "lucide-react"

export function Dialog({ open, onOpenChange, children }: any) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay / Fondo oscuro */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={() => onOpenChange(false)} 
      />
      {/* Contenedor del Modal */}
      <div className="relative w-full max-w-md transform transition-all">
        {children}
      </div>
    </div>
  )
}

export function DialogContent({ children, className = "" }: any) {
  return (
    <div className={`bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden ${className}`}>
      {children}
    </div>
  )
}

export function DialogHeader({ children }: any) {
  return (
    <div className="p-6 pb-2 flex flex-col space-y-1.5 relative">
      {children}
    </div>
  )
}

export function DialogTitle({ children, className = "" }: any) {
  return (
    <h2 className={`text-xl font-black text-slate-900 tracking-tight ${className}`}>
      {children}
    </h2>
  )
}

export function DialogDescription({ children }: any) {
  return (
    <p className="text-sm text-slate-500 font-medium">
      {children}
    </p>
  )
}