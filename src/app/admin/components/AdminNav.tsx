'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { useState } from 'react'
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
  Calendar,
  Menu,
  X,
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
}

interface NavGroup {
  title: string
  icon: React.ComponentType<{ className?: string }>
  items: NavItem[]
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
        title: 'Refus',
        href: '/admin/rejections',
        icon: XCircle,
      },
    ],
  },
  {
    title: 'Utilisateurs',
    icon: Users,
    items: [
      {
        title: 'Comptes',
        href: '/admin/users',
        icon: Users,
      },
      {
        title: 'Réservations',
        href: '/admin/reservations',
        icon: Calendar,
      },
    ],
  },
  {
    title: 'Business',
    icon: TrendingUp,
    items: [
      {
        title: 'Statistiques',
        href: '/admin/stats',
        icon: BarChart2,
      },
      {
        title: 'Paiements',
        href: '/admin/payment',
        icon: CreditCard,
      },
      {
        title: 'Sponsorisés',
        href: '/admin/promoted',
        icon: Star,
      },
    ],
  },
]

export function AdminNav() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
          {navGroups.map(group => {
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
            {navGroups.map(group => (
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
