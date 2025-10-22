'use client'

import { useAuth } from '@/hooks/useAuth'
import HostNavbar from '../components/HostNavbar'
import CentralizedCalendarManager from '@/components/calendar/CentralizedCalendarManager'

export default function CentralizedCalendarsPage() {
  const { session, isLoading } = useAuth({ required: true, redirectTo: '/auth' })

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='flex flex-col items-center gap-4'>
          <div className='w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin'></div>
          <p className='text-slate-600 text-lg'>Chargement...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className='min-h-screen bg-gray-100'>
      <HostNavbar />
      <div className='container mx-auto py-6 px-4'>
        <CentralizedCalendarManager />
      </div>
    </div>
  )
}
