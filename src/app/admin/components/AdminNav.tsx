'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { UserRole } from '@prisma/client'
import {
  BarChart2,
  CalendarDays,
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
  Image as ImageIcon,
  ShieldCheck,
} from 'lucide-react'
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
      { title: 'Dashboard', href: '/admin', icon: BarChart2 },
      { title: 'Aperçu Rapide', href: '/admin/overview', icon: TrendingUp },
    ],
  },
  {
    title: 'Contenus',
    icon: Shield,
    items: [
      { title: 'Validation', href: '/admin/validation', icon: ClipboardCheck },
      { title: 'Hébergements', href: '/admin/products', icon: Home },
      { title: 'Avis', href: '/admin/reviews', icon: MessageSquare },
      { title: 'Évaluations utilisateurs', href: '/admin/user-ratings', icon: Star },
      { title: 'Refus', href: '/admin/rejections', icon: XCircle },
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
      { title: 'Comptes', href: '/admin/users', icon: Users, requiredRoles: ['ADMIN'] },
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
        title: 'Réservations',
        href: '/admin/reservations',
        icon: CalendarDays,
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
      {
        title: 'Retraits',
        href: '/admin/withdrawals',
        icon: Wallet,
        requiredRoles: ['ADMIN', 'HOST_MANAGER'],
      },
    ],
  },
  {
    title: 'Configuration',
    icon: Settings,
    items: [
      { title: 'Services inclus', href: '/admin/included-services', icon: Package },
      { title: 'Extras', href: '/admin/extras', icon: Plus },
      { title: 'Points forts', href: '/admin/highlights', icon: Highlighter },
      { title: 'Équipements', href: '/admin/equipments', icon: Settings },
      { title: 'Repas', href: '/admin/meals', icon: Settings },
      { title: 'Sécurité', href: '/admin/security', icon: Shield },
      { title: 'Types de location', href: '/admin/typeRent', icon: Home },
      { title: 'Images Homepage', href: '/admin/homepage', icon: ImageIcon },
    ],
  },
]

export function AdminNav() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { data: session } = useSession()

  const userRole = session?.user?.roles

  const hasRequiredRole = (requiredRoles?: UserRole[]): boolean => {
    if (!requiredRoles || requiredRoles.length === 0) {
      return userRole === 'ADMIN' || userRole === 'HOST_MANAGER'
    }
    return userRole ? requiredRoles.includes(userRole) : false
  }

  const filteredNavGroups = navGroups
    .filter(group => hasRequiredRole(group.requiredRoles))
    .map(group => ({
      ...group,
      items: group.items.filter(item => hasRequiredRole(item.requiredRoles)),
    }))
    .filter(group => group.items.length > 0)

  const isActiveGroup = (group: NavGroup) => {
    if (group.items.some(item => item.href === '/admin' && pathname === '/admin')) {
      return true
    }
    return group.items.some(item => item.href !== '/admin' && pathname.startsWith(item.href))
  }

  const isActiveItem = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <nav className='sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md'>
      <div className='mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6'>
        {/* Logo */}
        <Link href='/admin' className='group flex items-center gap-3'>
          <div className='flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-sm transition group-hover:shadow-md'>
            <ShieldCheck className='h-5 w-5 text-white' />
          </div>
          <div className='hidden md:flex md:flex-col md:leading-tight'>
            <span className='text-xs font-semibold uppercase tracking-wide text-slate-500'>
              Hosteed
            </span>
            <span className='text-sm font-bold text-slate-900'>Admin Panel</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className='hidden items-center gap-1 lg:flex'>
          {filteredNavGroups.map(group => {
            const isGroupActive = isActiveGroup(group)
            const GroupIcon = group.icon

            return (
              <DropdownMenu key={group.title}>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      'relative inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
                      isGroupActive
                        ? 'text-blue-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    )}
                  >
                    <GroupIcon className='h-4 w-4' />
                    <span>{group.title}</span>
                    <ChevronDown className='h-3 w-3 opacity-60' />
                    {isGroupActive && (
                      <motion.span
                        layoutId='admin-nav-active'
                        className='absolute inset-x-2 -bottom-[1px] h-0.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600'
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align='start'
                  className='w-56 rounded-xl border border-slate-200 p-1.5 shadow-lg'
                >
                  <DropdownMenuLabel className='px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400'>
                    {group.title}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className='bg-slate-100' />
                  {group.items.map(item => {
                    const ItemIcon = item.icon
                    const active = isActiveItem(item.href)
                    return (
                      <DropdownMenuItem
                        key={item.href}
                        asChild
                        className='rounded-lg px-2 py-1.5 focus:bg-blue-50 focus:text-blue-700'
                      >
                        <Link
                          href={item.href}
                          className={cn(
                            'flex w-full cursor-pointer items-center gap-2.5 text-sm',
                            active
                              ? 'font-semibold text-blue-700'
                              : 'text-slate-700 hover:text-slate-900'
                          )}
                        >
                          <span
                            className={cn(
                              'flex h-7 w-7 items-center justify-center rounded-md',
                              active ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                            )}
                          >
                            <ItemIcon className='h-3.5 w-3.5' />
                          </span>
                          <span className='flex-1'>{item.title}</span>
                        </Link>
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )
          })}
        </div>

        {/* Mobile toggle */}
        <button
          className='inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 lg:hidden'
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label='Toggle navigation menu'
        >
          {mobileMenuOpen ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence initial={false}>
        {mobileMenuOpen && (
          <motion.div
            key='mobile-menu'
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className='border-t border-slate-200/80 bg-white/95 backdrop-blur-md lg:hidden'
          >
            <div className='mx-auto max-w-7xl space-y-6 px-4 py-5'>
              {filteredNavGroups.map(group => {
                const GroupIcon = group.icon
                return (
                  <div key={group.title} className='space-y-2'>
                    <div className='flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-400'>
                      <GroupIcon className='h-3.5 w-3.5' />
                      {group.title}
                    </div>
                    <div className='space-y-1'>
                      {group.items.map(item => {
                        const ItemIcon = item.icon
                        const active = isActiveItem(item.href)
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={cn(
                              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition',
                              active
                                ? 'bg-blue-50 font-semibold text-blue-700'
                                : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                            )}
                          >
                            <span
                              className={cn(
                                'flex h-8 w-8 items-center justify-center rounded-md',
                                active
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-slate-100 text-slate-600'
                              )}
                            >
                              <ItemIcon className='h-4 w-4' />
                            </span>
                            {item.title}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
