'use client'

import { useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function SessionWatcher() {
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.refresh() // Recarga para que el Layout de servidor te mande al login
      }
      if (event === 'TOKEN_REFRESHED') {
        console.log('Sesión renovada automáticamente')
      }
    })

    return () => subscription.unsubscribe()
  }, [router, supabase])

  return null // No renderiza nada, solo escucha
}