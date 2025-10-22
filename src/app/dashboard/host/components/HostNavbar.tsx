'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function HostNavbar() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path
      ? 'border-blue-500 text-gray-900'
      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
  }

  return (
    <div className='bg-white shadow-sm mb-6'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between h-16'>
          <div className='flex'>
            <div className='flex space-x-8'>
              <Link
                href='/dashboard/host'
                className={`inline-flex items-center px-1 pt-1 border-b-2 ${isActive('/dashboard/host')} text-sm font-medium`}
              >
                <svg className='h-5 w-5 mr-2' viewBox='0 0 24 24' fill='none' stroke='currentColor'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
                  />
                </svg>
                Mes annonces
              </Link>
              <Link
                href='/dashboard/host/calendar'
                className={`inline-flex items-center px-1 pt-1 border-b-2 ${isActive('/dashboard/host/calendar')} text-sm font-medium`}
              >
                <svg className='h-5 w-5 mr-2' viewBox='0 0 24 24' fill='none' stroke='currentColor'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                  />
                </svg>
                Calendrier
              </Link>
              <Link
                href='/dashboard/host/calendars'
                className={`inline-flex items-center px-1 pt-1 border-b-2 ${isActive('/dashboard/host/calendars')} text-sm font-medium`}
              >
                <svg className='h-5 w-5 mr-2' viewBox='0 0 24 24' fill='none' stroke='currentColor'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M8 7h12M8 12h12M8 17h12M3 7h.01M3 12h.01M3 17h.01'
                  />
                </svg>
                Calendriers externes
              </Link>
              <Link
                href='/dashboard/host/reservations'
                className={`inline-flex items-center px-1 pt-1 border-b-2 ${isActive('/dashboard/host/reservations')} text-sm font-medium`}
              >
                <svg className='h-5 w-5 mr-2' viewBox='0 0 24 24' fill='none' stroke='currentColor'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
                  />
                </svg>
                Locations
              </Link>
              <Link
                href='/dashboard/host/promotions'
                className={`inline-flex items-center px-1 pt-1 border-b-2 ${isActive('/dashboard/host/promotions')} text-sm font-medium`}
              >
                <svg className='h-5 w-5 mr-2' viewBox='0 0 24 24' fill='none' stroke='currentColor'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z'
                  />
                </svg>
                Promotions
              </Link>
              {/* <Link
                href='/dashboard/host/settings'
                className={`inline-flex items-center px-1 pt-1 border-b-2 ${isActive('/dashboard/host/settings')} text-sm font-medium`}
              >
                <svg className='h-5 w-5 mr-2' viewBox='0 0 24 24' fill='none' stroke='currentColor'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
                  />
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                  />
                </svg>
                Paramètres
              </Link> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
