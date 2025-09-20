'use client'

import React, { Component, ReactNode } from 'react'
import { signOut } from 'next-auth/react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

interface AuthErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

interface AuthErrorBoundaryProps {
  children: ReactNode
  fallback?: (props: AuthErrorFallbackProps) => ReactNode
}

interface AuthErrorFallbackProps {
  error: Error | null
  resetErrorBoundary: () => void
}

const DefaultAuthErrorFallback = ({ error, resetErrorBoundary }: AuthErrorFallbackProps) => {
  const isAuthError = error?.message.includes('auth') || 
                      error?.message.includes('session') ||
                      error?.message.includes('token') ||
                      error?.message.includes('utilisateur')

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/signin' })
  }

  return (
    <div className="min-h-[200px] flex items-center justify-center bg-gray-50/50 p-4 rounded-lg">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          {isAuthError ? 'Erreur d&apos;authentification' : 'Erreur inattendue'}
        </h3>
        
        <p className="text-gray-600 text-sm mb-6">
          {isAuthError 
            ? 'Votre session a expiré ou est invalide. Veuillez vous reconnecter.'
            : 'Une erreur inattendue s\'est produite dans l\'interface utilisateur.'
          }
        </p>
        
        <div className="space-y-3">
          <button 
            onClick={resetErrorBoundary}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Réessayer
          </button>
          
          {isAuthError && (
            <button 
              onClick={handleSignOut}
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
            >
              Se reconnecter
            </button>
          )}
        </div>
        
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mt-4 text-xs text-gray-500 bg-gray-100 p-3 rounded text-left">
            <summary className="cursor-pointer font-medium">Détails de l&apos;erreur (dev)</summary>
            <pre className="mt-2 whitespace-pre-wrap overflow-auto max-h-32">
              {error.stack || error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}

export class AuthErrorBoundary extends Component<AuthErrorBoundaryProps, AuthErrorBoundaryState> {
  constructor(props: AuthErrorBoundaryProps) {
    super(props)
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<AuthErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AuthErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // You can log to error reporting service here
    // Example: logErrorToService(error, errorInfo)
  }

  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultAuthErrorFallback
      
      return (
        <FallbackComponent 
          error={this.state.error}
          resetErrorBoundary={this.resetErrorBoundary}
        />
      )
    }

    return this.props.children
  }
}