'use client'

import { motion, Variants } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/shadcnui/card'
import { User as UserIcon, Mail } from 'lucide-react'
import type { AdminProductOwner } from '../types'

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

interface ProductHostInfoProps {
  owner: AdminProductOwner
}

/** Sidebar card showing host/owner info. */
export function ProductHostInfo({ owner }: ProductHostInfoProps) {
  const fullName = [owner.name, owner.lastname].filter(Boolean).join(' ')
  const avatarSrc = owner.profilePicture || owner.profilePictureBase64 || owner.image

  return (
    <motion.div initial='hidden' animate='visible' variants={fadeIn}>
      <Card className='border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl py-0 gap-0'>
        <div className='px-6 py-4 border-b border-gray-100'>
          <h2 className='text-lg font-semibold text-gray-800 flex items-center gap-2'>
            <UserIcon className='h-5 w-5 text-blue-600' />
            Propriétaire
          </h2>
        </div>
        <CardContent className='p-6'>
          <div className='flex items-center gap-4'>
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={fullName || 'Avatar'}
                width={48}
                height={48}
                className='w-12 h-12 rounded-full object-cover'
              />
            ) : (
              <div className='w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center'>
                <UserIcon className='h-6 w-6 text-blue-600' />
              </div>
            )}
            <div className='min-w-0'>
              {fullName && (
                <p className='text-sm font-semibold text-gray-800 truncate'>{fullName}</p>
              )}
              <div className='flex items-center gap-1 text-xs text-gray-500'>
                <Mail className='h-3 w-3' />
                <span className='truncate'>{owner.email}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
