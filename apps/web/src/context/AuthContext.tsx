'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client' 
import { useRouter } from 'next/navigation'

const AuthContext = createContext<any>(null)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null)
  const [perfil, setPerfil] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  const cargarPerfilConRPC = async () => {
    try {
      // Usamos el RPC que ya definiste en el Layout
      const { data, error } = await supabase.rpc('get_mi_perfil_seguro')
      
      if (error) throw error

      // El RPC devuelve un array, tomamos el primer objeto
      if (data && data.length > 0) {
        setPerfil(data[0])
      }
    } catch (err) {
      console.error('Error al obtener perfil vía RPC:', err)
    }
  }

  useEffect(() => {
    const initialize = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const currentUser = session?.user ?? null
      setUser(currentUser)
      
      if (currentUser) {
        await cargarPerfilConRPC()
      }
      
      setLoading(false)
    }

    initialize()

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      
      if (event === 'SIGNED_IN') {
        await cargarPerfilConRPC()
        router.refresh()
      }
      
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setPerfil(null)
        router.push('/login')
        router.refresh()
      }
    })

    return () => authListener.subscription.unsubscribe()
  }, [router, supabase])

  return (
    <AuthContext.Provider value={{ user, perfil, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)