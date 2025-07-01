'use client'

import { useState, useEffect } from 'react'
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
import { ChevronsUpDown, LogOut, Heart, Plus, User as UserIcon } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { findUserById } from '@/lib/services/user.service'
import { getProfileImageUrl } from '@/lib/utils'

export function NavUser({ session }: { session: Session | null }) {
  const [user, setUser] = useState<Pick<User, 'id' | 'name' | 'email' | 'image'> | null>(null)
  const [imageError, setImageError] = useState(false)

  const handleLogout = () => {
    signOut()
  }

  useEffect(() => {
    const fetchUser = async () => {
      if (!session?.user?.id) {
        return
      }
      const userData = await findUserById(session.user.id)
      if (userData) {
        setUser({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          image: userData.image,
        })
      }
    }
    fetchUser()
  }, [session])

  if (!session) {
    return null
  }

  if (!user) {
    return <div>Loading...</div>
  }

  const profileImage = getProfileImageUrl(user.image)

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
