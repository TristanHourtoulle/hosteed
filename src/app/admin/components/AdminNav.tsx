'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { BarChart2, ClipboardCheck, Home, MessageSquare, Users, CreditCard } from 'lucide-react'

const navItems = [
  {
    title: 'Statistiques',
    href: '/admin/stats',
    icon: BarChart2,
  },
  {
    title: 'Validation',
    href: '/admin/validation',
    icon: ClipboardCheck,
  },
  {
    title: 'Utilisateurs',
    href: '/admin/users',
    icon: Users,
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
    title: 'Paiements',
    href: '/admin/payment',
    icon: CreditCard,
  },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className='sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur'>
      <div className='flex h-14 items-center px-4 md:px-6 w-full justify-center'>
        <div className='flex items-center justify-center w-full space-x-4 md:space-x-6'>
          {navItems.map(({ title, href, icon: Icon }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'relative inline-flex items-center px-2 py-1 text-sm font-medium transition-colors hover:text-blue-600',
                  isActive ? 'text-blue-600' : 'text-gray-600'
                )}
              >
                <span className='flex items-center gap-2'>
                  <Icon className='h-4 w-4' />
                  <span className='hidden md:inline'>{title}</span>
                </span>
                {isActive && (
                  <motion.div
                    className='absolute -bottom-[1px] left-0 right-0 h-0.5 bg-blue-600'
                    layoutId='navbar-active'
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
