'use client';

import { useActionState } from 'react';
import { loginAction } from './actions';
import { KeyRound, Mail, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  // Usamos useActionState para manejar el estado del servidor (error, pending, etc.)
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <div className="max-w-[440px] w-full">
        {/* Logo / Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-xl shadow-blue-100 mb-6">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
            Bienvenido de nuevo
          </h1>
          <p className="text-slate-500 font-medium">
            Gestión de Infraestructura v2.0
          </p>
        </div>

        {/* Card del Formulario */}
        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-slate-200 border border-slate-100">
          <form action={formAction} className="space-y-6">
            
            {/* Input de Email */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">
                Correo Electrónico
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                </div>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="nombre@empresa.com"
                  className="block w-full pl-11 pr-4 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-0 transition-all outline-none"
                />
              </div>
            </div>

            {/* Input de Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-bold text-slate-700">
                  Contraseña
                </label>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <KeyRound className="w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                </div>
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="block w-full pl-11 pr-4 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-0 transition-all outline-none"
                />
              </div>
            </div>

            {/* Mensaje de Error (Desde el Action) */}
            {state?.error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm font-bold leading-tight">{state.error}</p>
              </div>
            )}

            {/* Botón de Submit */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold py-4 rounded-2xl shadow-lg shadow-slate-200 transition-all flex items-center justify-center gap-2 group"
            >
              {isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Entrar al sistema
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer del login */}
        <p className="text-center mt-10 text-sm text-slate-400 font-medium">
          ¿Problemas con tu acceso? <br />
          <span className="text-slate-600 font-bold cursor-pointer hover:text-blue-600">Contacta a soporte técnico</span>
        </p>
      </div>
    </div>
  );
}