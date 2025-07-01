'use client'

import { getUserData } from './actions'
import { ProfileHeader } from './components/ProfileHeader'
import { ReservationsList } from './components/ReservationsList'
import { FavoritesList } from './components/FavoritesList'
import { ProfileSettings } from './components/ProfileSettings'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

type Tab = 'reservations' | 'favoris' | 'profil'

export default function AccountPage() {
  const [user, setUser] = useState<any>(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const tab = (searchParams.get('tab') as Tab) || 'reservations'

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
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', newTab)
    router.push(`/account?${params.toString()}`)
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className='min-h-screen bg-gradient-to-b from-blue-50 to-white'>
      <ProfileHeader user={user} />
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='max-w-6xl mx-auto'>
          <div className='flex gap-2 mb-6 bg-white rounded-full p-2'>
            <button
              onClick={() => handleTabChange('reservations')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                tab === 'reservations'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Réservations
            </button>
            <button
              onClick={() => handleTabChange('favoris')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                tab === 'favoris' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Favoris
            </button>
            <button
              onClick={() => handleTabChange('profil')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                tab === 'profil' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Profil
            </button>
          </div>

          {tab === 'reservations' && <ReservationsList reservations={user.Rent} />}
          {tab === 'favoris' && <FavoritesList favorites={user.favorites} />}
          {tab === 'profil' && <ProfileSettings user={user} />}
        </div>
      </div>
    </div>
  )
}
