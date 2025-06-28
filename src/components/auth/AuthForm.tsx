// TODO: refactor this file because it's larger than 200 lines
'use client'
import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createUser } from '@/lib/services/user.service'
import { Button, Input } from '@/shadcnui'
import { Eye, EyeOff } from 'lucide-react'

type AuthMode = 'login' | 'register' | 'reset'

export const AuthForm = () => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const mode = (searchParams.get('mode') || 'login') as AuthMode

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [lastname, setLastname] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      if (mode === 'login') {
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        })

        if (result?.error) {
          setError('Email ou mot de passe incorrect')
        } else {
          window.location.href = '/host'
        }
      } else if (mode === 'register') {
        if (password !== confirmPassword) {
          setError('Les mots de passe ne correspondent pas')
          return
        }

        if (password.length < 6) {
          setError('Le mot de passe doit contenir au moins 6 caractères')
          return
        }

        const newUser = await createUser({
          email,
          password,
          name,
          lastname,
        })

        if (!newUser) {
          setError("Erreur lors de la création de l'utilisateur")
          return
        }

        setSuccess('Compte créé avec succès ! Vous pouvez maintenant vous connecter.')
        setTimeout(() => {
          router.push('/auth?mode=login')
        }, 2000)
      } else if (mode === 'reset') {
        // TODO: Implement password reset logic
        setSuccess('Un email de réinitialisation a été envoyé à votre adresse.')
      }
    } catch {
      setError('Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = () => {
    signIn('google', { redirectTo: '/host' })
  }

  const switchMode = (newMode: AuthMode) => {
    router.push(`/auth?mode=${newMode}`)
    setError('')
    setSuccess('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setName('')
    setLastname('')
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
    <div className='flex' style={{ height: 'calc(100vh - 64px)' }}>
      {/* Left side - Image */}
      <div className='hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-orange-400 via-pink-500 to-blue-600'>
        <div className='absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent z-10' />
        <div className='absolute inset-0 flex items-center justify-center z-20'>
          <div className='text-center text-white'>
            <div className='mb-4'>
              <svg
                className='w-16 h-16 mx-auto mb-4 text-white/80'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={1.5}
                  d='M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z'
                />
              </svg>
            </div>
            <h2 className='text-3xl font-light mb-2'>Bienvenue sur Hosteed</h2>
            <p className='text-white/90 text-lg'>Découvrez des hébergements exceptionnels</p>
          </div>
        </div>
        {/* Decorative boat silhouette */}
        <div className='absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20'>
          <svg className='w-20 h-12 text-white/60' fill='currentColor' viewBox='0 0 100 50'>
            <path d='M10,40 L20,20 L80,20 L90,40 L85,45 L15,45 Z M45,20 L45,10 L55,10 L55,20' />
          </svg>
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
          <form className='space-y-6' onSubmit={handleSubmit}>
            <div className='space-y-5'>
              {/* Name fields for register */}
              {mode === 'register' && (
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <Input
                      id='name'
                      type='text'
                      required
                      placeholder='Prénom'
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className='w-full px-4 py-6 text-base rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    />
                  </div>
                  <div>
                    <Input
                      id='lastname'
                      type='text'
                      required
                      placeholder='Nom'
                      value={lastname}
                      onChange={e => setLastname(e.target.value)}
                      className='w-full px-4 py-6 text-base rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <Input
                  id='email'
                  type='email'
                  required
                  placeholder='Votre adresse mail'
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className='w-full px-4 py-6 text-base rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>

              {/* Password fields */}
              {mode !== 'reset' && (
                <>
                  <div className='relative'>
                    <Input
                      id='password'
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder='Votre mot de passe'
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className='w-full px-4 py-6 pr-12 text-base rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    />
                    <button
                      type='button'
                      onClick={() => setShowPassword(!showPassword)}
                      className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer'
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>

                  {/* Confirm Password for register */}
                  {mode === 'register' && (
                    <div className='relative'>
                      <Input
                        id='confirmPassword'
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        placeholder='Confirmez votre mot de passe'
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className='w-full px-4 py-6 pr-12 text-base rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      />
                      <button
                        type='button'
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer'
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Forgot Password (only for login) */}
            {mode === 'login' && (
              <div className='text-right'>
                <button
                  type='button'
                  onClick={() => switchMode('reset')}
                  className='text-sm text-blue-600 hover:text-blue-500 cursor-pointer'
                >
                  Mot de passe oublié ?
                </button>
              </div>
            )}

            {/* Error/Success Messages */}
            {error && (
              <div className='text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg'>
                {error}
              </div>
            )}

            {success && (
              <div className='text-green-500 text-sm text-center bg-green-50 p-3 rounded-lg'>
                {success}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type='submit'
              disabled={isLoading}
              className='w-full flex items-center justify-center gap-2 py-4 text-base cursor-pointer'
            >
              {isLoading ? (
                <>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                  {mode === 'login'
                    ? 'Connexion....'
                    : mode === 'register'
                      ? 'Création...'
                      : 'Envoi...'}
                </>
              ) : (
                <>
                  {mode === 'login'
                    ? 'Se connecter'
                    : mode === 'register'
                      ? 'Créer mon compte'
                      : 'Envoyer le lien'}
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 5l7 7-7 7'
                    />
                  </svg>
                </>
              )}
            </Button>
          </form>

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
  )
}
