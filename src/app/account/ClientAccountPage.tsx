'use client'

import { getUserData } from './actions'
import { ProfileHeader } from './components/ProfileHeader'
import { ReservationsList } from './components/ReservationsList'
import { FavoritesList } from './components/FavoritesList'
import { ProfileSettings } from './components/ProfileSettings'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Favorite, Product, Rent } from '@prisma/client'
import AccountLoading from './loading'
import { Calendar, Heart, User, Plus, Star, Home } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

type Tab = 'reservations' | 'favoris' | 'profil'

interface StatCard {
  title: string
  value: string | number
  icon: React.ReactNode
  color: string
}

interface ClientAccountPageProps {
  initialTab?: Tab
}

export default function ClientAccountPage({ initialTab = 'reservations' }: ClientAccountPageProps) {
  const [user, setUser] = useState<{
    id: string
    name: string | null
    email: string
    image: string | null
    profilePicture: string | null
    createdAt: Date
    lastname: string | null
    password: string | null
    averageRating: number | null
    totalRatings: number
    totalTrips: number
    Rent: (Rent & { product: Product & { img: { img: string }[] } })[]
    favorites: (Favorite & { product: Product & { img: { img: string }[] } })[]
  } | null>(null)
  const router = useRouter()
  const [tab, setTab] = useState<Tab>(initialTab)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getUserData()
        setUser(userData)
      } catch (error) {
        console.error('Error fetching user data:', error)
      }
    }
    fetchUser()
  }, [])

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab)
    const url = newTab === 'reservations' ? '/account' : `/account?tab=${newTab}`
    router.push(url)
  }

  if (!user) {
    return <AccountLoading />
  }

  // Calculate stats
  const totalReservations = user.Rent.length
  const completedReservations = user.Rent.filter(
    rent => new Date(rent.leavingDate) < new Date()
  ).length
  const upcomingReservations = user.Rent.filter(
    rent => new Date(rent.arrivingDate) > new Date()
  ).length
  const totalFavorites = user.favorites.length

  const stats: StatCard[] = [
    {
      title: 'Réservations totales',
      value: totalReservations,
      icon: <Calendar className='w-6 h-6' />,
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Séjours terminés',
      value: completedReservations,
      icon: <Star className='w-6 h-6' />,
      color: 'from-green-500 to-green-600',
    },
    {
      title: 'Séjours à venir',
      value: upcomingReservations,
      icon: <Home className='w-6 h-6' />,
      color: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Favoris',
      value: totalFavorites,
      icon: <Heart className='w-6 h-6' />,
      color: 'from-pink-500 to-pink-600',
    },
  ]

  const tabs = [
    { id: 'reservations', label: 'Mes voyages', icon: <Calendar className='w-5 h-5' /> },
    { id: 'favoris', label: 'Listes de souhaits', icon: <Heart className='w-5 h-5' /> },
    { id: 'profil', label: 'Profil', icon: <User className='w-5 h-5' /> },
  ]

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20'>
      <ProfileHeader user={user} />

      <div className='container mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10'>
        <div className='max-w-7xl mx-auto'>
          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className='grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8'
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className='bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300'
              >
                <div
                  className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${stat.color} text-white mb-4`}
                >
                  {stat.icon}
                </div>
                <div className='text-2xl font-bold text-gray-900 mb-1'>{stat.value}</div>
                <div className='text-sm text-gray-600'>{stat.title}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Navigation Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className='mb-8'
          >
            <div className='bg-white rounded-2xl p-2 shadow-sm border border-gray-100 inline-flex gap-1'>
              {tabs.map(tabItem => (
                <button
                  key={tabItem.id}
                  onClick={() => handleTabChange(tabItem.id as Tab)}
                  className={`relative px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                    tab === tabItem.id
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {tabItem.icon}
                  {tabItem.label}
                  {tab === tabItem.id && (
                    <motion.div
                      layoutId='activeTab'
                      className='absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 -z-10'
                      transition={{ type: 'spring', duration: 0.5 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Content Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className='bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden'
          >
            <div className='p-8'>
              {tab === 'reservations' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className='flex items-center justify-between mb-6'>
                    <div>
                      <h2 className='text-2xl font-bold text-gray-900'>Mes voyages</h2>
                      <p className='text-gray-600 mt-1'>
                        Gérez vos réservations et découvrez vos prochaines aventures
                      </p>
                    </div>
                    <Link
                      href='/host'
                      className='inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors'
                    >
                      <Plus className='w-4 h-4' />
                      Nouveau voyage
                    </Link>
                  </div>
                  <ReservationsList reservations={user.Rent} />
                </motion.div>
              )}

              {tab === 'favoris' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className='flex items-center justify-between mb-6'>
                    <div>
                      <h2 className='text-2xl font-bold text-gray-900'>Listes de souhaits</h2>
                      <p className='text-gray-600 mt-1'>
                        Vos hébergements préférés, organisés pour vous
                      </p>
                    </div>
                    <button className='inline-flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition-colors'>
                      <Plus className='w-4 h-4' />
                      Créer une liste
                    </button>
                  </div>
                  <FavoritesList favorites={user.favorites} />
                </motion.div>
              )}

              {tab === 'profil' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className='mb-6'>
                    <h2 className='text-2xl font-bold text-gray-900'>Informations personnelles</h2>
                    <p className='text-gray-600 mt-1'>
                      Gérez vos informations de compte et vos préférences
                    </p>
                  </div>
                  <ProfileSettings user={user} />
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
