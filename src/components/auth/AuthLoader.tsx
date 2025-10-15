interface AuthLoaderProps {
  message?: string
  className?: string
}

/**
 * Composant de chargement pour l'authentification
 * Affiche un spinner et un message pendant la vérification de la session
 */
export function AuthLoader({ message = 'Chargement...', className = '' }: AuthLoaderProps) {
  return (
    <div className={`min-h-screen flex items-center justify-center ${className}`}>
      <div className='flex flex-col items-center gap-4'>
        <div className='w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin'></div>
        <p className='text-slate-600 text-lg'>{message}</p>
      </div>
    </div>
  )
}
