'use client'

import Image from 'next/image'
import { Mail, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { EditPhotoDialog } from './EditPhotoDialog'
import { motion } from 'framer-motion'

interface ProfileHeaderProps {
  user: {
    image: string | null
    profilePicture: string | null
    name: string | null
    lastname: string | null
    email: string
    createdAt: Date
    averageRating: number | null
    totalRatings: number
    totalTrips: number
  }
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  return (
    <div className='relative overflow-hidden'>
      {/* Background with gradient and pattern */}
      <div className='absolute inset-0'>
        <div className='absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800' />
        <div className='absolute inset-0 bg-[url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")] opacity-30' />
        <div className='absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/10 to-transparent' />
      </div>

      <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className='flex flex-col lg:flex-row items-start lg:items-end gap-8'
        >
          {/* Profile Image */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className='relative group'
          >
            <div className='relative rounded-3xl overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl w-32 h-32 lg:w-40 lg:h-40'>
              {(user.profilePicture || user.image) && (
                <Image
                  src={user.profilePicture || user.image || ''}
                  alt={`${user.name} ${user.lastname}`}
                  fill
                  className='object-cover'
                />
              )}
              {!(user.profilePicture || user.image) && (
                <div className='absolute inset-0 flex items-center justify-center text-2xl lg:text-3xl font-bold text-white bg-gradient-to-br from-blue-400 to-blue-600'>
                  {user.name?.charAt(0) ?? 'G'}
                </div>
              )}

              {/* Online status indicator */}
              <div className='absolute bottom-3 right-3 w-6 h-6 bg-green-400 border-3 border-white rounded-full shadow-lg' />
            </div>
            <EditPhotoDialog
              currentPhoto={user.profilePicture || user.image || undefined}
              onPhotoUpdate={async () => {
                // Ici on met à jour directement avec l'API endpoint
                // qui est déjà géré dans le composant EditPhotoDialog
                if (typeof window !== 'undefined') {
                  window.location.reload() // Recharger pour voir les changements
                }
              }}
            />
          </motion.div>

          {/* User Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className='flex-1 text-white'
          >
            <div className='flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6'>
              <div>
                <h1 className='text-4xl lg:text-5xl font-bold mb-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent'>
                  {user.name} {user.lastname}
                </h1>

                <div className='flex flex-wrap items-center gap-6 text-blue-100 mb-4'>
                  <div className='flex items-center gap-2'>
                    <Mail className='w-4 h-4' />
                    <span className='text-sm'>{user.email}</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Calendar className='w-4 h-4' />
                    <span className='text-sm'>
                      Membre depuis {format(new Date(user.createdAt), 'MMMM yyyy', { locale: fr })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick stats - Only show if data exists */}
              {(user.averageRating !== null && user.totalRatings > 0) || user.totalTrips > 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className='flex gap-4'
                >
                  {user.averageRating !== null && user.totalRatings > 0 && (
                    <div className='text-center bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20'>
                      <div className='text-2xl font-bold'>{user.averageRating.toFixed(1)}</div>
                      <div className='text-xs text-blue-100'>Note moyenne</div>
                    </div>
                  )}
                  {user.totalTrips > 0 && (
                    <div className='text-center bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20'>
                      <div className='text-2xl font-bold'>{user.totalTrips}</div>
                      <div className='text-xs text-blue-100'>
                        Voyage{user.totalTrips > 1 ? 's' : ''}
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Decorative bottom wave */}
      <div className='absolute bottom-0 left-0 right-0'>
        <svg
          className='w-full h-16 text-gray-50'
          preserveAspectRatio='none'
          viewBox='0 0 1200 120'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path
            d='M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z'
            fill='currentColor'
          />
        </svg>
      </div>
    </div>
  )
}
