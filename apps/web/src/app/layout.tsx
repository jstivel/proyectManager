import QueryProvider from '@/providers/QueryProvider'
import { AuthProvider } from '@/context/AuthContext'
import ErrorBoundary from '@/components/ErrorBoundary'
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <ErrorBoundary>
          <AuthProvider>
            <QueryProvider>
              {children}
            </QueryProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}