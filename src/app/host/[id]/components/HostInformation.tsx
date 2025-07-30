import { Shield } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { getProfileImageUrl } from '@/lib/utils'

interface HostInformationProps {
  hostName: string
  hostImage?: string | null
}

export default function HostInformation({ hostName, hostImage }: HostInformationProps) {
  const [imageError, setImageError] = useState(false)
  const profileImage = getProfileImageUrl(hostImage || null)

  return (
    <div>
      <h3 className='text-lg sm:text-xl font-semibold text-gray-900 mb-4'>
        À propos de l&apos;hôte
      </h3>
      <div className='flex flex-col sm:flex-row gap-4 sm:gap-6'>
        <div className='w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden flex-shrink-0'>
          {!imageError && profileImage ? (
            <Image
              src={profileImage}
              alt={hostName}
              width={80}
              height={80}
              className='h-full w-full object-cover rounded-full'
              referrerPolicy='no-referrer'
              onError={() => setImageError(true)}
            />
          ) : (
            <div className='w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xl sm:text-2xl'>
              {hostName[0].toUpperCase()}
            </div>
          )}
        </div>
        <div className='flex-1 min-w-0'>
          <div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2'>
            <h4 className='font-semibold text-gray-900 text-lg sm:text-xl'>{hostName}</h4>
          </div>
          <div className='flex flex-col sm:flex-row gap-3'>
            {/* Hide this part because the user cannot contact the host before booking for safety reasons */}
            {/* <button className='flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base font-medium'>
              <MessageCircle className='h-4 w-4 sm:h-5 sm:w-5' />
              Contacter l&apos;hôte
            </button> */}
            <button className='flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base font-medium'>
              <Shield className='h-4 w-4 sm:h-5 sm:w-5' />
              Protection des paiements
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
