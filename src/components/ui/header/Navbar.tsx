// TODO: refactor this file because it's larger than 200 lines
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
  Button,
} from '@/shadcnui'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
  SheetHeader,
} from '@/components/ui/shadcnui/sheet'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { findAllTypeRent } from '@/lib/services/typeRent.service'
import { TypeRent } from '@prisma/client'
import { NavUser } from './nav-user'
import { Menu } from 'lucide-react'

const Navbar = () => {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [typeRent, setTypeRent] = useState<TypeRent[]>([])
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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

  const isHostOrAdmin =
    session?.user?.roles === 'ADMIN' ||
    session?.user?.roles === 'HOST' ||
    session?.user?.roles === 'HOST_VERIFIED'

  const MobileNavLinks = () => (
    <div className='flex flex-col space-y-4 p-4'>
      {/* Main Links */}
      <Link
        href='/host'
        className='block py-3 px-4 text-lg font-medium text-gray-900 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer'
        onClick={() => setIsMobileMenuOpen(false)}
      >
        Tous les hébergements
      </Link>

      <Link
        href='/sponsored'
        className='block py-3 px-4 text-lg font-medium text-gray-900 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer'
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <span className='flex items-center'>⭐ Hébergements Sponsorisés</span>
      </Link>

      <Link
        href='/posts'
        className='block py-3 px-4 text-lg font-medium text-gray-900 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer'
        onClick={() => setIsMobileMenuOpen(false)}
      >
        Blog
      </Link>

      {/* <Link
        href='/search'
        className='block py-3 px-4 text-lg font-medium text-gray-900 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer'
        onClick={() => setIsMobileMenuOpen(false)}
      >
        Recherche
      </Link> */}

      {/* Quick Access */}
      <div className='border-t pt-4'>
        <h3 className='text-sm font-semibold text-gray-500 mb-3 px-4'>Accès rapide</h3>
        <Link
          href='/host?featured=true'
          className='block py-2 px-4 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer'
          onClick={() => setIsMobileMenuOpen(false)}
        >
          ⭐ Hébergements vedettes
        </Link>
        <Link
          href='/host?popular=true'
          className='block py-2 px-4 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer'
          onClick={() => setIsMobileMenuOpen(false)}
        >
          🔥 Plus populaires
        </Link>
        <Link
          href='/host?recent=true'
          className='block py-2 px-4 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer'
          onClick={() => setIsMobileMenuOpen(false)}
        >
          🆕 Récemment ajoutés
        </Link>
        <Link
          href='/host?promo=true'
          className='block py-2 px-4 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer'
          onClick={() => setIsMobileMenuOpen(false)}
        >
          💰 Offres spéciales
        </Link>
      </div>

      {/* Types d'hébergement */}
      <div className='border-t pt-4'>
        <h3 className='text-sm font-semibold text-gray-500 mb-3 px-4'>Types d&apos;hébergement</h3>
        {typeRent.map(type => (
          <Link
            key={type.id}
            href={`/host?type=${type.id}`}
            className='block py-2 px-4 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer'
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {type.name}
          </Link>
        ))}
      </div>

      {/* Authenticated User Links */}
      {session && (
        <div className='border-t pt-4'>
          <h3 className='text-sm font-semibold text-gray-500 mb-3 px-4'>Mon compte</h3>
          <Link
            href='/reservations'
            className='block py-2 px-4 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer'
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Réservations actuelles
          </Link>

          {isHostOrAdmin && (
            <Link
              href='/dashboard/host'
              className='block py-2 px-4 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer'
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Gestion Host
            </Link>
          )}

          {/* {(session.user.roles === 'BLOGWRITTER' || session.user.roles === 'ADMIN') && (
            <Link
              href='/host_manager'
              className='block py-2 px-4 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer'
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Gestion BLOG
            </Link>
          )} */}

          {session.user.roles === 'ADMIN' && (
            <Link
              href='/admin'
              className='block py-2 px-4 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer'
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Gestion Administrateur
            </Link>
          )}
        </div>
      )}

      {/* Auth Buttons for non-logged users */}
      {!session && (
        <div className='border-t pt-4 space-y-3 px-4'>
          <Button asChild className='w-full cursor-pointer'>
            <Link href='/auth?mode=login' onClick={() => setIsMobileMenuOpen(false)}>
              Se connecter
            </Link>
          </Button>
          <Button variant='secondary' asChild className='w-full cursor-pointer'>
            <Link href='/auth?mode=register' onClick={() => setIsMobileMenuOpen(false)}>
              S&apos;inscrire
            </Link>
          </Button>
        </div>
      )}
    </div>
  )

  return (
    <nav className='bg-white shadow-md sticky top-0 z-50'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-20'>
          {/* Logo */}
          <div className='flex items-center'>
            <Link href='/' className='flex items-center cursor-pointer'>
              <Image
                src='/logo-hosteed.png'
                alt='Hosteed'
                width={120}
                height={120}
                className='h-14 w-auto'
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className='hidden lg:flex items-center'>
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className='cursor-pointer'>
                    Hébergement
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className='grid w-[400px] gap-2 md:w-[500px] md:grid-cols-2 lg:w-[600px]'>
                      <li className='row-span-4'>
                        <NavigationMenuLink asChild>
                          <Link
                            className='relative flex h-full w-full flex-col justify-end rounded-md p-6 no-underline outline-none select-none focus:shadow-md overflow-hidden bg-gradient-to-b from-blue-500/20 to-blue-900/40 cursor-pointer'
                            href='/host'
                            style={{
                              backgroundImage:
                                'url(https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80)',
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                            }}
                          >
                            <div className='absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60 rounded-md'></div>
                            <div className='relative z-10 mt-4 mb-2 text-lg font-medium text-white'>
                              Tous les hébergements
                            </div>
                            <p className='relative z-10 text-white/90 text-sm leading-tight'>
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
                            className='block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer'
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
                            className='block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer'
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
                            className='block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer'
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
                            className='block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer'
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

                      <li>
                        <NavigationMenuLink asChild>
                          <Link
                            href='/sponsored'
                            className='block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer'
                          >
                            <div className='text-sm font-medium leading-none'>
                              ⭐ Hébergements Sponsorisés
                            </div>
                            <p className='text-muted-foreground line-clamp-2 text-sm leading-snug'>
                              Sélection mise en avant par nos partenaires
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
                              className='block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer'
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
                  <NavigationMenuLink asChild>
                    <Link href='/posts' className={navigationMenuTriggerStyle()}>
                      Blog
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>

                {/* <NavigationMenuItem>
                  <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                    <Link
                      href='/search'
                      className={`cursor-pointer ${isActive('/search') ? 'text-indigo-600 font-medium' : ''}`}
                    >
                      Recherche
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem> */}

                {session && (
                  <NavigationMenuItem>
                    <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                      <Link
                        href='/reservations'
                        className={`cursor-pointer ${isActive('/reservations') ? 'text-indigo-600 font-medium' : ''}`}
                      >
                        Réservations actuelles
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                )}

                {session && isHostOrAdmin && (
                  <NavigationMenuItem>
                    <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                      <Link
                        href='/dashboard/host'
                        className={`cursor-pointer ${isActive('/dashboard/host') ? 'text-indigo-600 font-medium' : ''}`}
                      >
                        Gestion Host
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                )}

                {/* {session &&
                  (session.user.roles === 'BLOGWRITTER' || session.user.roles === 'ADMIN') && (
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
                  )} */}

                {session && session.user.roles === 'ADMIN' && (
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

          {/* Desktop User Auth Section */}
          <div className='hidden lg:flex items-center space-x-4'>
            {session ? (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              <NavUser session={session as any} />
            ) : (
              <div className='flex items-center space-x-2'>
                <Button asChild size='sm'>
                  <Link href='/auth?mode=login'>Se connecter</Link>
                </Button>
                <Button variant='secondary' asChild size='sm'>
                  <Link href='/auth?mode=register'>S&apos;inscrire</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu */}
          <div className='lg:hidden flex items-center space-x-3'>
            {session && (
              <div className='scale-75'>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <NavUser session={session as any} />
              </div>
            )}

            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant='ghost' size='sm' className='p-2 cursor-pointer'>
                  <Menu className='h-6 w-6' />
                </Button>
              </SheetTrigger>
              <SheetContent side='right' className='w-full max-w-sm p-0'>
                <SheetHeader className='sr-only'>
                  <SheetTitle>Menu de navigation</SheetTitle>
                  <SheetDescription>
                    Menu de navigation mobile pour accéder aux différentes sections du site
                  </SheetDescription>
                </SheetHeader>
                <div className='flex flex-col h-full'>
                  <div className='flex items-center justify-between p-4 border-b'>
                    <h2 className='text-lg font-semibold'>Menu</h2>
                  </div>
                  <div className='flex-1 overflow-y-auto'>
                    <MobileNavLinks />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
