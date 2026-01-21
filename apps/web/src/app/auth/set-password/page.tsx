'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2, ShieldAlert, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export default function SetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const handleAuthSession = async () => {
      try {
        // 1. Verificar si ya tenemos una sesión activa (Supabase procesa el hash automáticamente)
        const { data: { session }, error: initialError } = await supabase.auth.getSession()

        if (session) {
          setLoading(false)
          return
        }

        // 2. Si no hay sesión, intentamos capturar los tokens del hash manualmente por si acaso
        const hash = window.location.hash
        if (hash && hash.includes('access_token')) {
          const params = new URLSearchParams(hash.replace('#', '?'))
          const accessToken = params.get('access_token')
          const refreshToken = params.get('refresh_token')

          if (accessToken && refreshToken) {
            const { error: setSessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })

            if (!setSessionError) {
              setLoading(false)
              return
            }
          }
        }

        // 3. Pequeña espera por si Supabase está terminando de procesar el hash
        await new Promise(resolve => setTimeout(resolve, 1500))
        const { data: { session: retrySession } } = await supabase.auth.getSession()

        if (!retrySession) {
          setErrorMsg("No se pudo detectar una invitación válida. El enlace puede haber expirado o ya fue utilizado.")
        }
      } catch (err) {
        setErrorMsg("Error al procesar la invitación.")
      } finally {
        setLoading(false)
      }
    }

    handleAuthSession()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres")
      return
    }

    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden")
      return
    }

    setIsUpdating(true)
    
    // Actualizamos la contraseña del usuario logueado mediante el token de invitación
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      toast.error(error.message)
      setIsUpdating(false)
    } else {
      toast.success("¡Contraseña establecida correctamente!")
      // Importante: Cerramos sesión para limpiar tokens de invitación y forzar login limpio
      await supabase.auth.signOut()
      router.push('/login?message=Tu cuenta ha sido activada. Por favor, inicia sesión.')
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="p-8 text-center">
          <Loader2 className="animate-spin text-blue-600 mb-4 mx-auto" size={40} />
          <h2 className="text-xl font-bold text-slate-800">Verificando invitación</h2>
          <p className="text-slate-500">Espera un momento mientras validamos tus credenciales...</p>
        </div>
      </div>
    )
  }

  if (errorMsg) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-slate-50">
        <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
          <ShieldAlert className="text-red-500 mb-6 mx-auto" size={60} />
          <h2 className="text-2xl font-black mb-3 text-slate-900">Enlace Inválido</h2>
          <p className="text-slate-500 mb-8">{errorMsg}</p>
          <Button 
            onClick={() => router.push('/login')}
            className="w-full bg-slate-900 hover:bg-slate-800 h-12 rounded-2xl font-bold"
          >
            Volver al Inicio
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100">
        <div className="mb-10 text-center">
          <div className="h-14 w-14 bg-green-100 rounded-2xl flex items-center justify-center mb-6 mx-auto rotate-3">
            <CheckCircle2 className="text-green-600" size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Activa tu cuenta</h1>
          <p className="text-slate-500 mt-2 font-medium">Define la contraseña para tu perfil de Project Manager.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Nueva Contraseña</label>
            <input 
              type="password" 
              placeholder="••••••••"
              required 
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Confirmar Contraseña</label>
            <input 
              type="password" 
              placeholder="••••••••"
              required 
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 h-14 rounded-2xl font-black text-lg shadow-lg shadow-blue-100 transition-all active:scale-[0.98]" 
            disabled={isUpdating}
          >
            {isUpdating ? <Loader2 className="animate-spin" /> : 'ACTIVAR MI CUENTA'}
          </Button>
        </form>
      </div>
    </div>
  )
}