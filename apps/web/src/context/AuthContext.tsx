'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext<any>(null)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null)
  const [perfil, setPerfil] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true; // Control para evitar fugas de memoria

    // Función unificada para obtener el perfil
    const fetchPerfil = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('usuarios')
          .select('*, roles(nombre)')
          .eq('id', userId)
          .single()
        
        if (error) throw error;
        if (isMounted) setPerfil(data)
      } catch (error) {
        console.error("Error cargando perfil:", error)
        if (isMounted) setPerfil(null)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    // Escuchamos cambios de auth (esto ya detecta la sesión inicial automáticamente)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)
        await fetchPerfil(session.user.id)
      } else {
        setUser(null)
        setPerfil(null)
        setLoading(false)
      }
    })

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, perfil, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)