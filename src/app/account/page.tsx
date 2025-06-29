import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/shadcnui/card'
import { Button } from '@/components/ui/shadcnui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/shadcnui/tabs'
import { UserCircle, Mail, Calendar, Settings, LogOut, MapPin, Camera, Edit2 } from 'lucide-react'
import { getUserData } from './actions'

export default async function AccountPage() {
  const user = await getUserData()

  return (
    <div className='min-h-screen bg-gradient-to-b from-blue-50 to-white'>
      <div className='container mx-auto pb-10 px-4 sm:px-6 lg:px-8'>
        {/* Profile Header with Background */}
        <div className='relative mb-8'>
          <div className='absolute inset-0 h-48 bg-gradient-to-r from-blue-600 to-blue-400 rounded-b-[40px]' />
          <div className='relative pt-10 pb-8 px-4'>
            <div className='max-w-4xl mx-auto'>
              <div className='flex flex-col sm:flex-row items-center sm:items-end gap-6 text-white'>
                <div className='relative group'>
                  <div className='relative rounded-full overflow-hidden bg-gray-200 border-4 border-[rgba(255,255,255,0.5)] shadow-lg'>
                    {user.image && (
                      <Image
                        src={user.image}
                        alt={user.name ?? 'guest'}
                        width={120}
                        height={120}
                        className='rounded-full object-cover'
                        referrerPolicy='no-referrer'
                      />
                    )}
                    {!user.image && (
                      <div className='absolute inset-0 flex items-center justify-center text-sm font-medium text-gray-600 bg-gray-100'>
                        {user.name?.charAt(0) ?? 'G'}
                      </div>
                    )}
                  </div>
                  <Link
                    href='/settings/profile-picture'
                    className='absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity'
                  >
                    <Camera className='w-4 h-4 text-blue-600' />
                  </Link>
                </div>
                <div className='text-center sm:text-left pb-5'>
                  <h1 className='text-3xl font-bold'>
                    {user.name} {user.lastname}
                  </h1>
                  <div className='mt-2 flex flex-col sm:flex-row items-center gap-4 text-blue-50'>
                    <div className='flex items-center gap-2'>
                      <Mail className='w-4 h-4' />
                      {user.email}
                    </div>
                    <div className='flex items-center gap-2'>
                      <Calendar className='w-4 h-4' />
                      Membre depuis {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

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
              {user.Rent.length === 0 ? (
                <Card className='bg-white/50 backdrop-blur-sm border-dashed'>
                  <CardContent className='py-12 text-center text-gray-500'>
                    <div className='flex flex-col items-center gap-3'>
                      <Calendar className='w-12 h-12 text-gray-400' />
                      <p className='text-lg'>Vous n'avez pas encore de réservations</p>
                      <Link href='/'>
                        <Button variant='outline' className='mt-2'>
                          Explorer les hébergements
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className='grid gap-4'>
                  {user.Rent.map(rent => (
                    <Card
                      key={rent.id}
                      className='overflow-hidden hover:shadow-lg transition-shadow p-0'
                    >
                      <CardContent className='p-0'>
                        <div className='flex flex-col sm:flex-row items-center justify-center'>
                          <div className='relative w-full sm:w-48 h-48'>
                            <Image
                              src={rent.product.img?.[0]?.img || '/placeholder.png'}
                              alt={rent.product.name}
                              fill
                              className='object-cover rounded-br-lg'
                            />
                          </div>
                          <div className='flex-1 p-6 py-0'>
                            <div className='flex flex-col lg:flex-row h-full justify-between'>
                              <div className='mt-auto'>
                                <h3 className='text-xl font-semibold mb-2'>{rent.product.name}</h3>
                                <div className='flex items-center gap-2 text-gray-600 mb-4'>
                                  <MapPin className='w-4 h-4' />
                                  <span>{rent.product.address}</span>
                                </div>
                                <div className='flex flex-wrap gap-4 text-sm text-gray-600'>
                                  <div>
                                    <p className='font-medium'>Arrivée</p>
                                    <p>{new Date(rent.arrivingDate).toLocaleDateString()}</p>
                                  </div>
                                  <div>
                                    <p className='font-medium'>Départ</p>
                                    <p>{new Date(rent.leavingDate).toLocaleDateString()}</p>
                                  </div>
                                  <div>
                                    <p className='font-medium'>Statut</p>
                                    <span
                                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                      ${
                                        rent.status === 'RESERVED'
                                          ? 'bg-green-100 text-green-800'
                                          : rent.status === 'WAITING'
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : rent.status === 'CANCEL'
                                              ? 'bg-red-100 text-red-800'
                                              : 'bg-blue-100 text-blue-800'
                                      }`}
                                    >
                                      {rent.status}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className='mt-4 flex justify-end lg:mt-auto'>
                                <Link href={`/reservations/${rent.id}`}>
                                  <Button variant='outline'>Voir les détails</Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value='favorites' className='space-y-6'>
              <div className='flex items-center justify-between'>
                <h2 className='text-2xl font-semibold text-gray-900'>Vos favoris</h2>
              </div>
              {user.favorites.length === 0 ? (
                <Card className='bg-white/50 backdrop-blur-sm border-dashed'>
                  <CardContent className='py-12 text-center text-gray-500'>
                    <div className='flex flex-col items-center gap-3'>
                      <div className='w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center'>
                        ❤️
                      </div>
                      <p className='text-lg'>Vous n'avez pas encore de favoris</p>
                      <Link href='/'>
                        <Button variant='outline' className='mt-2'>
                          Explorer les hébergements
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                  {user.favorites.map(favorite => (
                    <Card
                      key={favorite.id}
                      className='group overflow-hidden hover:shadow-lg transition-all'
                    >
                      <div className='aspect-[4/3] relative overflow-hidden'>
                        <Image
                          src={favorite.product.img?.[0]?.img || '/placeholder.png'}
                          alt={favorite.product.name}
                          fill
                          className='object-cover group-hover:scale-110 transition-transform duration-300'
                        />
                      </div>
                      <CardContent className='p-6'>
                        <h3 className='font-semibold text-lg mb-2'>{favorite.product.name}</h3>
                        <p className='text-gray-600 flex items-center gap-2 mb-4'>
                          <MapPin className='w-4 h-4' />
                          {favorite.product.address}
                        </p>
                        <Link href={`/host/${favorite.product.id}`}>
                          <Button className='w-full'>Voir l'annonce</Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value='profile' className='space-y-6'>
              <div className='flex items-center justify-between'>
                <h2 className='text-2xl font-semibold text-gray-900'>Paramètres du profil</h2>
              </div>
              <div className='grid gap-6'>
                <Card>
                  <CardContent className='p-6'>
                    <div className='space-y-6'>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-4'>
                          <div className='p-2 rounded-full bg-blue-50'>
                            <UserCircle className='w-6 h-6 text-blue-600' />
                          </div>
                          <div>
                            <h3 className='font-medium text-gray-900'>Informations personnelles</h3>
                            <p className='text-sm text-gray-500'>
                              Modifiez vos informations de profil
                            </p>
                          </div>
                        </div>
                        <Link href='/settings/profile'>
                          <Button variant='outline' className='gap-2'>
                            <Edit2 className='w-4 h-4' />
                            Modifier
                          </Button>
                        </Link>
                      </div>

                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-4'>
                          <div className='p-2 rounded-full bg-blue-50'>
                            <Mail className='w-6 h-6 text-blue-600' />
                          </div>
                          <div>
                            <h3 className='font-medium text-gray-900'>Email et mot de passe</h3>
                            <p className='text-sm text-gray-500'>
                              Gérez vos identifiants de connexion
                            </p>
                          </div>
                        </div>
                        <Link href='/settings/security'>
                          <Button variant='outline' className='gap-2'>
                            <Settings className='w-4 h-4' />
                            Gérer
                          </Button>
                        </Link>
                      </div>

                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-4'>
                          <div className='p-2 rounded-full bg-red-50'>
                            <LogOut className='w-6 h-6 text-red-600' />
                          </div>
                          <div>
                            <h3 className='font-medium text-gray-900'>Déconnexion</h3>
                            <p className='text-sm text-gray-500'>
                              Déconnectez-vous de votre compte
                            </p>
                          </div>
                        </div>
                        <Link href='/api/auth/signout'>
                          <Button variant='destructive' className='gap-2'>
                            <LogOut className='w-4 h-4' />
                            Déconnexion
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
