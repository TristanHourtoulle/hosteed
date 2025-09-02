'use client'

import { AdminGuard } from '@/components/admin/AdminGuard'
import { AdminNav } from './components/AdminNav'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard
      fallback={
        <div className='min-h-screen flex items-center justify-center bg-gray-50'>
          <div className='text-center'>
            <div className='w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <div className='w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin'></div>
            </div>
            <h2 className='text-xl font-semibold text-gray-900 mb-2'>Chargement de l&apos;administration</h2>
            <p className='text-gray-600'>Vérification des autorisations...</p>
          </div>
        </div>
      }
    >
      <div className='flex min-h-screen flex-col w-full'>
        <AdminNav />
        <main className='flex-1'>{children}</main>
      </div>
    </AdminGuard>
  )
}
