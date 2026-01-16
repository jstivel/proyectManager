'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client' 
import { useRouter } from 'next/navigation'

const AuthContext = createContext<any>(null)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null)
  const [perfil, setPerfil] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient() // Cliente del lado del navegador con SSR
  const router = useRouter()

  useEffect(() => {
    let isMounted = true

    const fetchPerfil = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('usuarios')
          .select('*, roles(nombre)')
          .eq('id', userId)
          .single()
        
        if (error) throw error
        if (isMounted) setPerfil(data)
      } catch (error) {
        console.error("Error cargando perfil:", error)
        if (isMounted) setPerfil(null)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    // Inicializar sesión
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        await fetchPerfil(session.user.id)
      } else {
        setLoading(false)
      }
    }

    initializeAuth()

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)
        await fetchPerfil(session.user.id)
        
        // Si el evento es un login o cambio de password, refrescar para asegurar cookies
        if (event === 'SIGNED_IN') router.refresh()
      } else {
        setUser(null)
        setPerfil(null)
        setLoading(false)
        if (event === 'SIGNED_OUT') router.push('/login')
      }
    })

    return () => {
      isMounted = false
      authListener.subscription.unsubscribe()
    }
  }, [router, supabase])

  return (
    <AuthContext.Provider value={{ user, perfil, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)