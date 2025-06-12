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
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@/shadcnui'
import { ChevronsUpDown, LogOut } from 'lucide-react'
import { findUserById } from '@/lib/services/user.service'

export function NavUser({ session }: { session: Session | null }) {
  const [user, setUser] = useState<Pick<User, 'id' | 'name' | 'email' | 'image'> | null>(null)

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div className='flex items-center gap-2'>
          <Avatar className='h-10 w-10 rounded-lg'>
            <AvatarImage src={user.image ?? undefined} alt={user.name ?? 'guest'} />
            <AvatarFallback className='rounded-lg'>{user.name?.charAt(0) ?? 'G'}</AvatarFallback>
          </Avatar>
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
            <Avatar className='h-10 w-10 rounded-lg'>
              <AvatarImage src={user.image ?? undefined} alt={user.name ?? 'guest'} />
              <AvatarFallback className='rounded-lg'>{user.name?.charAt(0) ?? 'G'}</AvatarFallback>
            </Avatar>
            <div className='grid flex-1 text-left text-sm leading-tight'>
              <span className='truncate font-medium'>{user.name}</span>
              <span className='truncate text-xs'>{user.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut />
          Déconnexion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
