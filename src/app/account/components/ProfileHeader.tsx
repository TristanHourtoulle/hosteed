'use client'

import Image from 'next/image'
import { Mail, Calendar } from 'lucide-react'
import { EditPhotoDialog } from './EditPhotoDialog'
import { updateUserPhoto } from '../actions'

interface ProfileHeaderProps {
  user: {
    image: string | null
    name: string | null
    lastname: string | null
    email: string
    createdAt: Date
  }
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  return (
    <div className='relative mb-8'>
      <div className='absolute inset-0 h-48 bg-gradient-to-r from-blue-600 to-blue-400 rounded-b-[40px]' />
      <div className='relative pt-10 pb-8 px-4'>
        <div className='max-w-4xl mx-auto'>
          <div className='flex flex-col sm:flex-row items-center sm:items-end gap-6 text-white'>
            <div className='relative group'>
              <div className='relative rounded-full overflow-hidden bg-gray-200 border-4 border-[rgba(255,255,255,0.5)] shadow-lg w-[120px] h-[120px]'>
                {user.image && (
                  <Image
                    src={user.image}
                    alt={user.name ?? 'guest'}
                    fill
                    className='object-cover'
                    referrerPolicy='no-referrer'
                  />
                )}
                {!user.image && (
                  <div className='absolute inset-0 flex items-center justify-center text-sm font-medium text-gray-600 bg-gray-100'>
                    {user.name?.charAt(0) ?? 'G'}
                  </div>
                )}
              </div>
              <EditPhotoDialog
                user={user}
                onSave={async file => {
                  const formData = new FormData()
                  formData.append('file', file)
                  await updateUserPhoto(formData)
                }}
              />
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
  )
}
