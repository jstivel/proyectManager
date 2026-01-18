'use client'
import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    
    // Enviar a servicio de reporte de errores (ej: Sentry, LogRocket)
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    this.setState({
      error,
      errorInfo
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    if (this.state.hasError) {
      // Fallback personalizado si se proporciona
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Fallback por defecto
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-red-100 overflow-hidden">
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-full mb-6">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                ¡Ups! Algo salió mal
              </h2>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                Ha ocurrido un error inesperado. Por favor, intenta nuevamente o contacta al equipo de soporte si el problema persiste.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-left mb-6 p-4 bg-gray-50 rounded-lg text-sm">
                  <summary className="font-semibold text-gray-700 cursor-pointer mb-2">
                    Detalles del error (modo desarrollo)
                  </summary>
                  <div className="mt-2">
                    <p className="text-red-600 font-mono text-xs mb-2">
                      {this.state.error.name}: {this.state.error.message}
                    </p>
                    {this.state.errorInfo && (
                      <pre className="text-xs text-gray-600 overflow-auto max-h-32">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </details>
              )}

              <div className="space-y-3">
                <button
                  onClick={this.handleReset}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors shadow-lg"
                >
                  <RefreshCw className="w-4 h-4" />
                  Intentar nuevamente
                </button>
                
                <button
                  onClick={() => window.location.reload()}
                  className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-600 font-semibold py-3 px-4 rounded-xl transition-colors border border-gray-200"
                >
                  Recargar página
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook para manejar errores en componentes funcionales
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const captureError = React.useCallback((error: Error) => {
    console.error('Error captured by hook:', error)
    setError(error)
  }, [])

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return { captureError, resetError }
}