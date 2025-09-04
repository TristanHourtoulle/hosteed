'use client'

import { useState, useEffect, useCallback } from 'react'
import { User } from '@prisma/client'
import { signOut } from 'next-auth/react'
import { Session } from 'next-auth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shadcnui'
import { ChevronsUpDown, LogOut, Heart, Plus, User as UserIcon, MessageSquare, AlertCircle, RotateCcw, Loader2, Wifi } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { findUserById } from '@/lib/services/user.service'
import { getProfileImageUrl } from '@/lib/utils'
import { useUserProfile } from '@/contexts/UserProfileContext'
import { useLoadingWithTimeout } from '@/hooks/useLoadingWithTimeout'

export function NavUser({ session }: { session: Session | null }) {
  const [user, setUser] = useState<Pick<User, 'id' | 'name' | 'email' | 'image' | 'profilePicture'> | null>(null)
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const { profileUpdateTrigger } = useUserProfile()

  const { showSlowWarning, hasTimedOut, isLoadingWithTimeout } = useLoadingWithTimeout(isLoading, {
    timeout: 15000,
    slowConnectionWarning: 3000,
  })

  const handleLogout = () => {
    signOut()
  }

  const fetchUser = useCallback(async (isRetry = false) => {
    if (!session?.user?.id) {
      return
    }

    try {
      if (!isRetry) {
        setIsLoading(true)
        setError(null)
      }
      
      const userData = await findUserById(session.user.id)
      
      if (userData) {
        setUser({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          image: userData.image,
          profilePicture: userData.profilePicture,
        })
        setError(null)
        setRetryCount(0)
      } else {
        throw new Error('Impossible de récupérer les données utilisateur')
      }
    } catch (err) {
      console.error('Error fetching user data:', err)
      setError(err instanceof Error ? err.message : 'Erreur de connexion')
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.id])

  const handleRetry = () => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1)
      fetchUser(true)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [session, profileUpdateTrigger, fetchUser])

  if (!session) {
    return null
  }

  // Loading state with enhanced feedback
  if (isLoadingWithTimeout && !user) {
    return (
      <div className="flex items-center gap-2 px-2 py-1">
        <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
        <span className="text-sm text-gray-600">
          {showSlowWarning ? 'Connexion lente...' : 'Chargement...'}
        </span>
        {showSlowWarning && <Wifi className="w-3 h-3 text-orange-500" />}
      </div>
    )
  }

  // Timeout state
  if (hasTimedOut && !user) {
    return (
      <div className="flex items-center gap-2 px-2 py-1">
        <AlertCircle className="w-4 h-4 text-red-500" />
        <span className="text-sm text-red-600">Timeout</span>
        <button
          onClick={handleRetry}
          className="ml-1 p-1 hover:bg-gray-100 rounded transition-colors"
          title="Réessayer"
        >
          <RotateCcw className="w-3 h-3 text-gray-600" />
        </button>
      </div>
    )
  }

  // Error state with retry option
  if (error && !user && !isLoading) {
    return (
      <div className="flex items-center gap-2 px-2 py-1 max-w-48">
        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
        <span className="text-xs text-red-600 truncate" title={error}>
          Erreur de connexion
        </span>
        {retryCount < 3 && (
          <button
            onClick={handleRetry}
            className="ml-1 p-1 hover:bg-gray-100 rounded transition-colors"
            title="Réessayer"
          >
            <RotateCcw className="w-3 h-3 text-gray-600" />
          </button>
        )}
      </div>
    )
  }

  // If still no user after all attempts, show fallback with session data
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
          <UserIcon className="w-4 h-4 text-gray-600" />
        </div>
        <div className="hidden lg:grid flex-1 text-left text-sm leading-tight">
          <span className="truncate font-medium">{session.user?.name || 'Utilisateur'}</span>
          <span className="truncate text-xs">{session.user?.email}</span>
        </div>
      </div>
    )
  }

  // Prioritize profilePicture over image (OAuth profile photo)
  const profileImage = getProfileImageUrl(user.profilePicture || user.image)

  const UserAvatar = () => (
    <div className='relative h-10 w-10 rounded-full overflow-hidden bg-gray-200'>
      {!imageError && profileImage && (
        <Image
          src={profileImage}
          alt={user.name ?? 'guest'}
          width={40}
          height={40}
          className='h-full w-full object-cover rounded-full'
          referrerPolicy='no-referrer'
          onError={() => setImageError(true)}
        />
      )}
      {(imageError || !profileImage) && (
        <div className='absolute inset-0 flex items-center justify-center text-sm font-medium text-gray-600 bg-gray-100'>
          {user.name?.charAt(0) ?? 'G'}
        </div>
      )}
    </div>
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div className='flex items-center gap-2'>
          <UserAvatar />
          <div className='hidden lg:grid flex-1 text-left text-sm leading-tight'>
            <span className='truncate font-medium'>{user.name}</span>
            <span className='truncate text-xs'>{user.email}</span>
          </div>
          <ChevronsUpDown className='ml-auto size-4' />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
        side={'bottom'}
        align='end'
        sideOffset={4}
      >
        <DropdownMenuLabel className='p-0 font-normal'>
          <div className='flex items-center gap-2 px-1 py-1.5 text-left text-sm'>
            <UserAvatar />
            <div className='grid flex-1 text-left text-sm leading-tight'>
              <span className='truncate font-medium'>{user.name}</span>
              <span className='truncate text-xs'>{user.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href='/chat' className='flex items-center'>
            <MessageSquare className='w-4 h-4 mr-2' />
            Messages
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href='/favorites' className='flex items-center'>
            <Heart className='w-4 h-4 mr-2' />
            Mes favoris
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/* Add a button to add a new hosting product */}
        <DropdownMenuItem asChild>
          <Link href='/createProduct' className='flex items-center'>
            <Plus className='w-4 h-4 mr-2' />
            Créer une annonce
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/* Acceder à son compte */}
        <DropdownMenuItem asChild>
          <Link href='/account' className='flex items-center'>
            <UserIcon className='w-4 h-4 mr-2' />
            Mon compte
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className='w-4 h-4 mr-2' />
          Déconnexion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
