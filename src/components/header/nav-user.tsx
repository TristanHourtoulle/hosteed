'use client'

import { useState, useEffect } from 'react'
import { Session, User } from '@prisma/client'
import {
  DropdownMenu,
  SidebarMenuButton,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@/shadcnui'
import { ChevronsUpDown, Sparkles, BadgeCheck, CreditCard, Bell, LogOut } from 'lucide-react'
import { findUserById } from '@/lib/services/user.service'

export function NavUser({ session }: { session: Session | null }) {
  const [user, setUser] = useState<Pick<User, 'id' | 'name' | 'email' | 'image'> | null>(null)

  if (!session) {
    // TODO: display Auth buttons
    return
  }
  if (!user) {
    // TODO: display loading spinner
    return <div>Loading...</div>
  }

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await findUserById(session.userId)
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size='lg'
          className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
        >
          <Avatar className='h-10 w-10 rounded-lg'>
            <AvatarImage src={user.image ?? undefined} alt={user.name ?? 'guest'} />
            <AvatarFallback className='rounded-lg'>{user.name?.charAt(0) ?? 'G'}</AvatarFallback>
          </Avatar>
          <div className='grid flex-1 text-left text-sm leading-tight'>
            <span className='truncate font-medium'>{user.name}</span>
            <span className='truncate text-xs'>{user.email}</span>
          </div>
          <ChevronsUpDown className='ml-auto size-4' />
        </SidebarMenuButton>
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
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <Sparkles />
            Upgrade to Pro
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <BadgeCheck />
            Account
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CreditCard />
            Billing
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Bell />
            Notifications
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
