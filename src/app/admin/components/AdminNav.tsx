'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { UserRole } from '@prisma/client'
import {
  BarChart2,
  ClipboardCheck,
  Home,
  Users,
  Star,
  MessageSquare,
  CreditCard,
  XCircle,
  ChevronDown,
  Shield,
  TrendingUp,
  Menu,
  X,
  Settings,
  Package,
  Plus,
  Highlighter,
  BookOpen,
  Edit3,
  Wallet,
  Tag,
} from 'lucide-react'
import { Button } from '@/components/ui/shadcnui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/shadcnui/dropdown-menu'

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  requiredRoles?: UserRole[]
}

interface NavGroup {
  title: string
  icon: React.ComponentType<{ className?: string }>
  items: NavItem[]
  requiredRoles?: UserRole[]
}

const navGroups: NavGroup[] = [
  {
    title: "Vue d'ensemble",
    icon: TrendingUp,
    items: [
      {
        title: 'Dashboard',
        href: '/admin',
        icon: BarChart2,
      },
      {
        title: 'Aperçu Rapide',
        href: '/admin/overview',
        icon: TrendingUp,
      },
    ],
  },
  {
    title: 'Contenus',
    icon: Shield,
    items: [
      {
        title: 'Validation',
        href: '/admin/validation',
        icon: ClipboardCheck,
      },
      {
        title: 'Hébergements',
        href: '/admin/products',
        icon: Home,
      },
      {
        title: 'Avis',
        href: '/admin/reviews',
        icon: MessageSquare,
      },
      {
        title: 'Évaluations utilisateurs',
        href: '/admin/user-ratings',
        icon: Star,
      },
      {
        title: 'Refus',
        href: '/admin/rejections',
        icon: XCircle,
      },
    ],
  },
  {
    title: 'Blog',
    icon: BookOpen,
    requiredRoles: ['ADMIN', 'BLOGWRITER'],
    items: [
      {
        title: 'Gestion des articles',
        href: '/admin/blog',
        icon: Edit3,
        requiredRoles: ['ADMIN', 'BLOGWRITER'],
      },
      {
        title: 'Créer un article',
        href: '/createPost',
        icon: Plus,
        requiredRoles: ['ADMIN', 'BLOGWRITER'],
      },
    ],
  },
  {
    title: 'Utilisateurs',
    icon: Users,
    requiredRoles: ['ADMIN'],
    items: [
      {
        title: 'Comptes',
        href: '/admin/users',
        icon: Users,
        requiredRoles: ['ADMIN'],
      },
    ],
  },
  {
    title: 'Business',
    icon: TrendingUp,
    requiredRoles: ['ADMIN'],
    items: [
      {
        title: 'Statistiques',
        href: '/admin/stats',
        icon: BarChart2,
        requiredRoles: ['ADMIN'],
      },
      {
        title: 'Paiements',
        href: '/admin/payment',
        icon: CreditCard,
        requiredRoles: ['ADMIN'],
      },
      {
        title: 'Sponsorisés',
        href: '/admin/promoted',
        icon: Star,
        requiredRoles: ['ADMIN'],
      },
      {
        title: 'Promotions',
        href: '/admin/promotions',
        icon: Tag,
        requiredRoles: ['ADMIN', 'HOST_MANAGER'],
      },
      {
        title: 'Commissions',
        href: '/admin/commissions',
        icon: Settings,
        requiredRoles: ['ADMIN'],
      },
    ],
  },
  {
    title: 'Configuration',
    icon: Settings,
    items: [
      {
        title: 'Services inclus',
        href: '/admin/included-services',
        icon: Package,
      },
      {
        title: 'Extras',
        href: '/admin/extras',
        icon: Plus,
      },
      {
        title: 'Points forts',
        href: '/admin/highlights',
        icon: Highlighter,
      },
      {
        title: 'Équipements',
        href: '/admin/equipments',
        icon: Settings,
      },
      {
        title: 'Repas',
        href: '/admin/meals',
        icon: Settings,
      },
      {
        title: 'Sécurité',
        href: '/admin/security',
        icon: Shield,
      },
      {
        title: 'Types de location',
        href: '/admin/typeRent',
        icon: Home,
      },
      {
        title: 'Retraits',
        href: '/admin/withdrawals',
        icon: Wallet,
        requiredRoles: ['ADMIN', 'HOST_MANAGER'],
      },
    ],
  },
]

export function AdminNav() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { data: session } = useSession()

  const userRole = session?.user?.roles

  // Filter function to check if user has required role
  const hasRequiredRole = (requiredRoles?: UserRole[]): boolean => {
    if (!requiredRoles || requiredRoles.length === 0) {
      // No specific roles required, allow ADMIN and HOST_MANAGER
      return userRole === 'ADMIN' || userRole === 'HOST_MANAGER'
    }
    return userRole ? requiredRoles.includes(userRole) : false
  }

  // Filter nav groups and items based on user role
  const filteredNavGroups = navGroups
    .filter(group => hasRequiredRole(group.requiredRoles))
    .map(group => ({
      ...group,
      items: group.items.filter(item => hasRequiredRole(item.requiredRoles)),
    }))
    .filter(group => group.items.length > 0) // Remove groups with no visible items

  const isActiveGroup = (group: NavGroup) => {
    return group.items.some(item => pathname === item.href)
  }

  const isActiveItem = (href: string) => {
    return pathname === href
  }

  return (
    <nav className='sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-md shadow-sm'>
      <div className='flex h-16 items-center justify-between px-4 md:px-6'>
        {/* Logo/Home Link */}
        <Link
          href='/admin'
          className='flex items-center gap-2 font-semibold text-slate-800 hover:text-blue-600 transition-colors'
        >
          <Shield className='h-6 w-6' />
          <span className='hidden md:inline'>Admin Panel</span>
        </Link>

        {/* Desktop Navigation */}
        <div className='hidden lg:flex items-center space-x-1'>
          {filteredNavGroups.map(group => {
            const isGroupActive = isActiveGroup(group)

            return (
              <DropdownMenu key={group.title}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors hover:text-blue-600 hover:bg-blue-50',
                      isGroupActive ? 'text-blue-600 bg-blue-50' : 'text-slate-600'
                    )}
                  >
                    <group.icon className='h-4 w-4' />
                    <span>{group.title}</span>
                    <ChevronDown className='h-3 w-3 opacity-50' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='start' className='w-48'>
                  <DropdownMenuLabel className='text-xs text-slate-500 uppercase tracking-wide'>
                    {group.title}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {group.items.map(item => (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center gap-2 w-full cursor-pointer',
                          isActiveItem(item.href)
                            ? 'text-blue-600 bg-blue-50'
                            : 'text-slate-700 hover:text-blue-600'
                        )}
                      >
                        <item.icon className='h-4 w-4' />
                        {item.title}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )
          })}
        </div>

        {/* Mobile Navigation Toggle */}
        <Button
          variant='ghost'
          size='sm'
          className='lg:hidden'
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
        </Button>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className='lg:hidden border-t bg-white'
        >
          <div className='px-4 py-4 space-y-4'>
            {filteredNavGroups.map(group => (
              <div key={group.title} className='space-y-2'>
                <div className='flex items-center gap-2 text-sm font-medium text-slate-800 px-2 py-1'>
                  <group.icon className='h-4 w-4' />
                  {group.title}
                </div>
                <div className='pl-6 space-y-1'>
                  {group.items.map(item => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-2 px-2 py-2 text-sm rounded-md transition-colors',
                        isActiveItem(item.href)
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon className='h-4 w-4' />
                      {item.title}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </nav>
  )
}
