'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/shadcnui/button'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'
import { ResetForm } from './ResetForm'
import { signIn } from 'next-auth/react'
import { NoSSR } from '@/components/ui/NoSSR'

type AuthMode = 'login' | 'register' | 'reset'

interface AuthFormProps {
  mode?: AuthMode
}

export const AuthForm = ({ mode = 'login' }: AuthFormProps) => {
  const router = useRouter()

  const handleGoogleSignIn = () => {
    signIn('google', { redirectTo: '/host' })
  }

  const switchMode = (newMode: AuthMode) => {
    router.push(`/auth?mode=${newMode}`)
  }

  const getTitle = () => {
    switch (mode) {
      case 'login':
        return 'Content de vous revoir !'
      case 'register':
        return 'Créer votre compte'
      case 'reset':
        return 'Réinitialiser votre mot de passe'
      default:
        return 'Authentification'
    }
  }

  const getSubtitle = () => {
    switch (mode) {
      case 'login':
        return 'Remplissez les champs ci dessous pour vous connecter'
      case 'register':
        return "Rejoignez la communauté Hosteed dès aujourd'hui"
      case 'reset':
        return 'Entrez votre email pour recevoir un lien de réinitialisation'
      default:
        return ''
    }
  }

  return (
    <NoSSR fallback={
      <div className='flex' style={{ height: 'calc(100vh - 64px)' }}>
        <div className='hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600'>
          <div className='w-full flex flex-col items-center justify-center text-white'>
            <div className='text-center'>
              <div className='text-6xl mb-4'>☀️</div>
              <h1 className='text-4xl font-bold mb-2'>Bienvenue sur Hosteed</h1>
              <p className='text-xl'>Chargement...</p>
            </div>
          </div>
        </div>
        <div className='w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50'>
          <div className='w-full max-w-md space-y-8'>
            <div className='text-center'>
              <div className='h-8 bg-gray-200 rounded animate-pulse mb-2'></div>
              <div className='h-4 bg-gray-200 rounded animate-pulse w-3/4 mx-auto'></div>
            </div>
          </div>
        </div>
      </div>
    }>
      <div className='flex' style={{ height: 'calc(100vh - 64px)' }}>
        {/* Left side - Image */}
        <div className='hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600'>
          <div className='w-full flex flex-col items-center justify-center text-white'>
            <div className='text-center'>
              <div className='text-6xl mb-4'>☀️</div>
              <h1 className='text-4xl font-bold mb-2'>Bienvenue sur Hosteed</h1>
              <p className='text-xl'>Découvrez des hébergements exceptionnels</p>
            </div>
            <div className='absolute bottom-10'>
              <Image src='/window.svg' alt='Window' width={64} height={64} />
            </div>
          </div>
        </div>

        {/* Right side - Form */}
        <div className='w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50'>
          <div className='w-full max-w-md space-y-8'>
            {/* Header */}
            <div className='text-center'>
              <h1 className='text-3xl font-bold text-gray-900 mb-2'>{getTitle()}</h1>
              <p className='text-gray-600'>{getSubtitle()}</p>
            </div>

            {/* Google Sign In (only for login and register) */}
            {mode !== 'reset' && (
              <>
                <Button
                  variant='outline'
                  onClick={handleGoogleSignIn}
                  className='w-full flex items-center justify-center gap-3 py-4 text-base border-gray-300 hover:bg-gray-50 cursor-pointer'
                >
                  <svg className='w-5 h-5' viewBox='0 0 24 24'>
                    <path
                      fill='#4285F4'
                      d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                    />
                    <path
                      fill='#34A853'
                      d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                    />
                    <path
                      fill='#FBBC05'
                      d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
                    />
                    <path
                      fill='#EA4335'
                      d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
                    />
                  </svg>
                  Se connecter avec Google
                </Button>

                {/* Divider */}
                <div className='flex items-center'>
                  <div className='flex-1 border-t border-gray-300' />
                  <span className='px-4 text-sm text-gray-500 bg-gray-50'>OU</span>
                  <div className='flex-1 border-t border-gray-300' />
                </div>
              </>
            )}

            {/* Form */}
            {mode === 'login' && <LoginForm />}
            {mode === 'register' && <RegisterForm />}
            {mode === 'reset' && <ResetForm />}

            {/* Mode Switch Links */}
            <div className='text-center space-y-2'>
              {mode === 'login' && (
                <p className='text-gray-600'>
                  Pas encore de compte ?{' '}
                  <button
                    onClick={() => switchMode('register')}
                    className='text-blue-600 hover:text-blue-500 font-medium cursor-pointer'
                  >
                    S&apos;inscrire
                  </button>
                </p>
              )}

              {mode === 'register' && (
                <p className='text-gray-600'>
                  Déjà un compte ?{' '}
                  <button
                    onClick={() => switchMode('login')}
                    className='text-blue-600 hover:text-blue-500 font-medium cursor-pointer'
                  >
                    Se connecter
                  </button>
                </p>
              )}

              {mode === 'reset' && (
                <p className='text-gray-600'>
                  Retour à la{' '}
                  <button
                    onClick={() => switchMode('login')}
                    className='text-blue-600 hover:text-blue-500 font-medium cursor-pointer'
                  >
                    connexion
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </NoSSR>
  )
}
