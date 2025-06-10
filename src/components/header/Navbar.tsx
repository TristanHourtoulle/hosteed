// TODO: refactor this file because it's larger than 200 lines
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
} from '@/shadcnui'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { findAllTypeRent } from '@/lib/services/typeRent.service'
import { TypeRent } from '@prisma/client'

const Navbar = () => {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [typeRent, setTypeRent] = useState<TypeRent[]>([])

  useEffect(() => {
    const fetchTypeRent = async () => {
      const types = await findAllTypeRent()
      if (types) {
        setTypeRent(types)
      }
    }
    fetchTypeRent()
  }, [])

  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <nav className='bg-white shadow-md'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between h-16'>
          <div className='flex items-center'>
            <div className='flex-shrink-0 flex items-center mr-8'>
              <Link href='/' className='text-xl font-bold text-gray-800'>
                <Image src='/logo-hosteed.png' alt='Hosteed' width={100} height={100} />
              </Link>
            </div>

            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Hébergement</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className='grid w-[400px] gap-2 md:w-[500px] md:grid-cols-2 lg:w-[600px]'>
                      <li className='row-span-4'>
                        <NavigationMenuLink asChild>
                          <Link
                            className='from-muted/50 to-muted flex h-full w-full flex-col justify-end rounded-md bg-gradient-to-b p-6 no-underline outline-none select-none focus:shadow-md'
                            href='/host'
                          >
                            <div className='mt-4 mb-2 text-lg font-medium'>
                              Tous les hébergements
                            </div>
                            <p className='text-muted-foreground text-sm leading-tight'>
                              Découvrez tous nos hébergements disponibles
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>

                      {/* Quick Access Links */}
                      <li>
                        <NavigationMenuLink asChild>
                          <Link
                            href='/host?featured=true'
                            className='block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
                          >
                            <div className='text-sm font-medium leading-none'>
                              ⭐ Hébergements vedettes
                            </div>
                            <p className='text-muted-foreground line-clamp-2 text-sm leading-snug'>
                              Nos meilleurs hébergements sélectionnés
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>

                      <li>
                        <NavigationMenuLink asChild>
                          <Link
                            href='/host?popular=true'
                            className='block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
                          >
                            <div className='text-sm font-medium leading-none'>
                              🔥 Plus populaires
                            </div>
                            <p className='text-muted-foreground line-clamp-2 text-sm leading-snug'>
                              Les hébergements les plus réservés
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>

                      <li>
                        <NavigationMenuLink asChild>
                          <Link
                            href='/host?recent=true'
                            className='block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
                          >
                            <div className='text-sm font-medium leading-none'>
                              🆕 Récemment ajoutés
                            </div>
                            <p className='text-muted-foreground line-clamp-2 text-sm leading-snug'>
                              Découvrez nos nouveaux hébergements
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>

                      <li>
                        <NavigationMenuLink asChild>
                          <Link
                            href='/host?promo=true'
                            className='block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
                          >
                            <div className='text-sm font-medium leading-none'>
                              💰 Offres spéciales
                            </div>
                            <p className='text-muted-foreground line-clamp-2 text-sm leading-snug'>
                              Hébergements avec promotions
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>

                      {/* Separator */}
                      <li className='col-span-1'>
                        <div className='my-2 h-px bg-muted' />
                        <div className='text-xs font-medium text-muted-foreground px-3 py-1'>
                          Par type d&apos;hébergement
                        </div>
                      </li>

                      {/* TypeRent Categories */}
                      {typeRent.map(type => (
                        <li key={type.id}>
                          <NavigationMenuLink asChild>
                            <Link
                              href={`/host?type=${type.id}`}
                              className='block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
                            >
                              <div className='text-sm font-medium leading-none'>{type.name}</div>
                              <p className='text-muted-foreground line-clamp-2 text-sm leading-snug'>
                                {type.description}
                              </p>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                    <Link
                      href='/search'
                      className={isActive('/search') ? 'text-indigo-600 font-medium' : ''}
                    >
                      Recherche
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>

                {session && (
                  <NavigationMenuItem>
                    <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                      <Link
                        href='/reservations'
                        className={isActive('/reservations') ? 'text-indigo-600 font-medium' : ''}
                      >
                        Réservations actuelles
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                )}

                {session && (
                  <NavigationMenuItem>
                    <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                      <Link
                        href='/dashboard/host'
                        className={isActive('/dashboard/host') ? 'text-indigo-600 font-medium' : ''}
                      >
                        Gestion Host
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                )}

                {session &&
                  (session.user.roles == 'BLOGWRITTER' || session.user.roles == 'ADMIN') && (
                    <NavigationMenuItem>
                      <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                        <Link
                          href='/host_manager'
                          className={isActive('/host_manager') ? 'text-indigo-600 font-medium' : ''}
                        >
                          Gestion BLOG
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  )}

                {session && session.user.roles == 'ADMIN' && (
                  <NavigationMenuItem>
                    <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                      <Link
                        href='/admin'
                        className={isActive('/admin') ? 'text-indigo-600 font-medium' : ''}
                      >
                        Gestion Administrateur
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                )}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* User Authentication Section */}
          <div className='flex items-center space-x-4'>
            {session ? (
              // User is logged in - show user dropdown
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
                    <Avatar className='h-8 w-8'>
                      <AvatarImage src='' alt={session.user?.name || 'User'} />
                      <AvatarFallback>{session.user?.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className='w-56' align='end' forceMount>
                  <DropdownMenuLabel className='font-normal'>
                    <div className='flex flex-col space-y-1'>
                      <p className='text-sm font-medium leading-none'>{session.user?.name}</p>
                      <p className='text-xs leading-none text-muted-foreground'>
                        {session.user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href='/dashboard'>📊 Tableau de bord</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href='/reservations'>📋 Mes réservations</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href='/dashboard/host'>🏠 Gestion hébergements</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className='cursor-pointer' onClick={() => signOut()}>
                    🚪 Se déconnecter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              // User is not logged in - show login/register buttons
              <div className='flex items-center space-x-2'>
                <Button asChild>
                  <Link href='/auth?mode=login' className='cursor-pointer'>
                    Se connecter
                  </Link>
                </Button>
                <Button variant='secondary' asChild>
                  <Link href='/auth?mode=register' className='cursor-pointer'>
                    S&apos;inscrire
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
