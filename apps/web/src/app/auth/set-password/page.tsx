'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2, ShieldAlert, CheckCircle2 } from 'lucide-react'

export default function SetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const processInvitation = async () => {
      // 1. Extraer tokens de la URL manualmente (evita que se pierdan en reloads)
      const hash = window.location.hash
      
      if (hash && hash.includes('access_token')) {
        // 2. Limpieza preventiva: Si hay sesión de otro usuario, la cerramos
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        if (currentSession) {
          await supabase.auth.signOut()
        }

        // 3. INTERCAMBIO MANUAL: Forzamos a Supabase a usar los tokens del hash
        const params = new URLSearchParams(hash.replace('#', '?'))
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (error) {
            setErrorMsg("El enlace es inválido o ha expirado.")
            setLoading(false)
            return
          }
        }
      }

      // 4. Verificación final de sesión
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        setErrorMsg("No se encontró una sesión de invitación válida. Intenta solicitar una nueva.")
      }
      
      setLoading(false)
    }

    processInvitation()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      alert("Las contraseñas no coinciden")
      return
    }

    setIsUpdating(true)
    
    // 5. Actualizamos la contraseña del usuario logueado vía invitación
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      alert("Error: " + error.message)
      setIsUpdating(false)
    } else {
      alert("¡Contraseña establecida!")
      // Limpiamos sesión y mandamos al login para que entre de cero
      await supabase.auth.signOut()
      router.push('/login')
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-blue-600 mb-2" size={32} />
        <p className="text-slate-500">Configurando tu acceso seguro...</p>
      </div>
    )
  }

  if (errorMsg) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <ShieldAlert className="text-red-500 mb-4" size={48} />
        <h2 className="text-xl font-bold mb-2">Invitación no válida</h2>
        <p className="text-slate-500 max-w-xs mb-6">{errorMsg}</p>
        <Button onClick={() => router.push('/login')}>Ir al Login</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-2xl shadow-slate-200 border border-slate-100">
        <div className="mb-8 text-center">
          <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 mx-auto">
            <CheckCircle2 className="text-blue-600" size={24} />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Finaliza tu registro</h1>
          <p className="text-slate-500 text-sm mt-1">Ingresa tu nueva contraseña para activar tu cuenta.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nueva Contraseña</label>
            <input 
              type="password" 
              required 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Confirmar Contraseña</label>
            <input 
              type="password" 
              required 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-12 rounded-xl font-bold mt-2" disabled={isUpdating}>
            {isUpdating ? <Loader2 className="animate-spin" /> : 'Activar Cuenta'}
          </Button>
        </form>
      </div>
    </div>
  )
}