import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Función principal del Proxy (Middleware)
 * Ajustada para validar el rol_id: 4 como Administrador Global vía RPC
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // 1. Obtenemos el usuario de la sesión de Auth
  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // 2. EXCEPCIÓN PARA INVITACIONES Y ASSETS PÚBLICOS
  if (pathname.startsWith('/auth/set-password') || pathname.startsWith('/public')) {
    return response
  }

  // 3. PROTECCIÓN DEL DASHBOARD GENERAL (Si no hay sesión)
  if (!user && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // 4. PROTECCIÓN DE RUTA ADMIN GLOBAL (Validación de Rol 4)
  if (user && pathname.startsWith('/dashboard/organizaciones')) {
    /**
     * IMPORTANTE: Usamos el RPC 'get_mi_perfil_seguro' para evitar 
     * problemas con RLS, ya que la función es SECURITY DEFINER.
     */
    const { data: perfiles } = await supabase.rpc('get_mi_perfil_seguro')
    
    // El RPC devuelve un conjunto de filas (array)
    const perfil = perfiles && perfiles.length > 0 ? perfiles[0] : null

    /**
     * REGLA DE NEGOCIO:
     * Solo el rol_id 4 (Super Admin) puede gestionar organizaciones.
     */
    if (!perfil || perfil.rol_id !== 4) {
      console.warn(`[PROXY] Acceso denegado a Organizaciones. Usuario: ${user.id} | Rol detectado: ${perfil?.rol_id}`)
      // Redirigimos al home del dashboard si no tiene permisos
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }
  
  // 5. EVITAR BUCLES EN LOGIN
  if (user && (pathname === '/auth/login' || pathname === '/login')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

/**
 * Configuración del Matcher para el Proxy
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
}