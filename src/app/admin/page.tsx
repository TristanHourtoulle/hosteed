'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { motion, Variants } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/shadcnui/card'
import {
  ClipboardCheck,
  Users,
  BarChart2,
  MessageSquare,
  Home,
  ArrowRight,
  Cctv,
  Soup,
  BrushCleaning
} from 'lucide-react'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
  },
}

export default function AdminDashboard() {
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!session?.user?.roles || session.user.roles !== 'ADMIN') {
      router.push('/')
    }
  }, [session, router])

  const cards = [
    {
      title: 'Validation des annonces',
      description: 'Gérer les annonces en attente de validation',
      icon: <ClipboardCheck className='h-8 w-8 text-blue-500' />,
      href: '/admin/validation',
      gradient: 'from-blue-50 to-blue-100',
    },
    {
      title: 'Gestion des utilisateurs',
      description: 'Gérer les utilisateurs et leurs rôles',
      icon: <Users className='h-8 w-8 text-green-500' />,
      href: '/admin/users',
      gradient: 'from-green-50 to-green-100',
    },
    {
      title: 'Statistiques',
      description: 'Voir les statistiques du site',
      icon: <BarChart2 className='h-8 w-8 text-purple-500' />,
      href: '/admin/stats',
      gradient: 'from-purple-50 to-purple-100',
    },
    {
      title: 'Avis en attente',
      description: 'Voir les avis en attente de validation',
      icon: <MessageSquare className='h-8 w-8 text-yellow-500' />,
      href: '/admin/reviews',
      gradient: 'from-yellow-50 to-yellow-100',
    },
    {
      title: 'Gestion des hébergements',
      description: 'Voir et gérer tous les hébergements',
      icon: <Home className='h-8 w-8 text-red-500' />,
      href: '/admin/products',
      gradient: 'from-red-50 to-red-100',
    },
    {
      title: 'Gestion des options de sécurité',
      description: 'Voir et gérer toutes les options de sécurité',
      icon: <Cctv className='h-8 w-8 text-red-500' />,
      href: '/admin/security',
      gradient: 'from-red-50 to-red-100',
    },
    {
      title: 'Gestion des options de repas',
      description: 'Voir et gérer toutes les options de repas',
      icon: <Soup className='h-8 w-8 text-red-500' />,
      href: '/admin/meals',
      gradient: 'from-red-50 to-red-100',
    },
    {
      title: 'Gestion des options d\'équipements',
      description: 'Voir et gérer toutes les options d\'équipements',
      icon: <BrushCleaning className='h-8 w-8 text-red-500' />,
      href: '/admin/equipments',
      gradient: 'from-red-50 to-red-100',
    },
  ]

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8'>
      <motion.div
        className='max-w-7xl mx-auto space-y-8'
        variants={containerVariants}
        initial='hidden'
        animate='visible'
      >
        <motion.div className='text-center space-y-4' variants={itemVariants}>
          <h1 className='text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600'>
            Dashboard Administrateur
          </h1>
          <p className='text-gray-600 max-w-2xl mx-auto'>
            Gérez votre plateforme efficacement avec nos outils d&apos;administration intuitifs
          </p>
        </motion.div>

        <motion.div
          className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          variants={containerVariants}
        >
          {cards.map(card => (
            <motion.div
              key={card.title}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link href={card.href} className='block h-full'>
                <Card
                  className={`h-full bg-gradient-to-br ${card.gradient} border-none shadow-lg hover:shadow-xl transition-all duration-300`}
                >
                  <CardHeader className='pb-4'>
                    <div className='flex items-center justify-between'>
                      {card.icon}
                      <ArrowRight className='h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors' />
                    </div>
                    <CardTitle className='text-xl font-semibold text-gray-800'>
                      {card.title}
                    </CardTitle>
                    <CardDescription className='text-gray-600'>{card.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}
