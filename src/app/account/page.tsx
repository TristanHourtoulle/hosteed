import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/shadcnui/tabs'
import { getUserData } from './actions'
import { ProfileHeader } from './components/ProfileHeader'
import { ReservationsList } from './components/ReservationsList'
import { FavoritesList } from './components/FavoritesList'
import { ProfileSettings } from './components/ProfileSettings'

export default async function AccountPage() {
  const user = await getUserData()

  return (
    <div className='min-h-screen bg-gradient-to-b from-blue-50 to-white'>
      <div className='container mx-auto pb-10 px-4 sm:px-6 lg:px-8'>
        <ProfileHeader user={user} />

        {/* Main Content */}
        <div className='max-w-4xl mx-auto'>
          <Tabs defaultValue='reservations' className='w-full'>
            <TabsList className='w-full justify-start bg-white shadow-sm mb-6 p-1 rounded-full'>
              <TabsTrigger
                value='reservations'
                className='rounded-full px-6 py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white'
              >
                Réservations
              </TabsTrigger>
              <TabsTrigger
                value='favorites'
                className='rounded-full px-6 py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white'
              >
                Favoris
              </TabsTrigger>
              <TabsTrigger
                value='profile'
                className='rounded-full px-6 py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white'
              >
                Profil
              </TabsTrigger>
            </TabsList>

            <TabsContent value='reservations' className='space-y-6'>
              <div className='flex items-center justify-between'>
                <h2 className='text-2xl font-semibold text-gray-900'>Vos réservations</h2>
              </div>
              <ReservationsList reservations={user.Rent} />
            </TabsContent>

            <TabsContent value='favorites' className='space-y-6'>
              <div className='flex items-center justify-between'>
                <h2 className='text-2xl font-semibold text-gray-900'>Vos favoris</h2>
              </div>
              <FavoritesList favorites={user.favorites} />
            </TabsContent>

            <TabsContent value='profile' className='space-y-6'>
              <div className='flex items-center justify-between'>
                <h2 className='text-2xl font-semibold text-gray-900'>Paramètres du profil</h2>
              </div>
              <div className='grid gap-6'>
                <ProfileSettings user={user} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
