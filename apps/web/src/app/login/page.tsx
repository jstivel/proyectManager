'use client'

import { useActionState } from 'react' // Hook moderno de React para formularios
import { loginAction } from './actions'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  /**
   * useActionState recibe:
   * 1. La función que se ejecutará (nuestra Server Action).
   * 2. El estado inicial (en este caso, null para el error).
   * * Devuelve:
   * - state: El resultado que devuelve la acción (el mensaje de error si falla).
   * - formAction: La función que vincularemos al formulario.
   * - isPending: Un booleano automático que indica si la acción se está ejecutando.
   */
  const [state, formAction, isPending] = useActionState(loginAction, null)

  return (
    <div className="flex flex-col max-w-[400px] mx-auto mt-[100px] gap-6 p-6 border rounded-lg shadow-sm">
      <h1 className="text-2xl font-bold text-center text-slate-800">
        Telecom Admin
      </h1>
      <p className="text-sm text-center text-slate-500 -mt-4">
        Ingresa tus credenciales para acceder al panel
      </p>

      {/* Vinculamos el formulario directamente a la acción. 
         Next.js se encarga de recolectar los datos (email, password) 
         y enviarlos al servidor de forma segura.
      */}
      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="correo@empresa.com"
            required
            disabled={isPending}
            className="border p-2 rounded-md text-black focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-sm font-medium">Contraseña</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            disabled={isPending}
            className="border p-2 rounded-md text-black focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50"
          />
        </div>

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? 'Validando...' : 'Iniciar Sesión'}
        </Button>
      </form>

      {/* Mostramos el error si la Server Action devuelve uno */}
      {state?.error && (
        <p className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-md text-sm text-center">
          {state.error}
        </p>
      )}
    </div>
  )
}