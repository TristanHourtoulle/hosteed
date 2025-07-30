'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcnui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/shadcnui/avatar'
import { Button } from '@/components/ui/shadcnui/button'
import { User as UserIcon, Mail, Calendar, Shield, Edit3 } from 'lucide-react'
import type { ExtendedUser } from '../types'
import { RoleBadge } from '@/components/ui/RoleBadge'

interface UserPersonalInfoProps {
  user: ExtendedUser
}

export function UserPersonalInfo({ user }: UserPersonalInfoProps) {
  return (
    <div className='space-y-6'>
      {/* Photo de profil et informations principales */}
      <Card className='border-0 shadow-xl bg-white rounded-2xl overflow-hidden'>
        <div className='relative h-24 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600'>
          <div className='absolute inset-0 bg-black/10' />
        </div>
        <CardContent className='p-4 -mt-12 relative'>
          <div className='flex flex-col items-center text-center space-y-3'>
            <Avatar className='h-20 w-20 border-4 border-white shadow-lg'>
              <AvatarImage
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                className='object-cover'
              />
              <AvatarFallback className='bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xl font-bold'>
                {(user.name?.[0] || user.email[0]).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className='space-y-1'>
              <h2 className='text-xl font-bold text-gray-900'>
                {user.name || user.lastname
                  ? `${user.name || ''} ${user.lastname || ''}`.trim()
                  : 'Utilisateur sans nom'}
              </h2>
              <p className='text-gray-500 text-sm flex items-center justify-center gap-1'>
                <Mail className='h-3 w-3' />
                {user.email}
              </p>
            </div>

            <RoleBadge role={user.roles} size='sm' />
          </div>
        </CardContent>
      </Card>

      {/* Informations détaillées */}
      <Card className='border-0 shadow-lg bg-white rounded-2xl'>
        <CardHeader className='pb-3'>
          <CardTitle className='flex items-center gap-2 text-lg'>
            <UserIcon className='h-4 w-4 text-blue-600' />
            Informations
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-3'>
            <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-lg'>
              <div className='p-1.5 bg-blue-100 rounded-lg'>
                <Calendar className='h-3.5 w-3.5 text-blue-600' />
              </div>
              <div className='flex-1 min-w-0'>
                <p className='text-xs text-gray-500'>Inscription</p>
                <p className='text-sm font-medium text-gray-900 truncate'>
                  {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-lg'>
              <div className='p-1.5 bg-green-100 rounded-lg'>
                <Shield className='h-3.5 w-3.5 text-green-600' />
              </div>
              <div className='flex-1 min-w-0'>
                <p className='text-xs text-gray-500'>Email</p>
                <div className='flex items-center gap-2'>
                  <span className='text-sm font-medium text-gray-900'>
                    {user.emailVerified ? 'Vérifié' : 'Non vérifié'}
                  </span>
                  <div
                    className={`h-1.5 w-1.5 rounded-full ${user.emailVerified ? 'bg-green-500' : 'bg-orange-500'}`}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions rapides */}
      <Card className='border-0 shadow-lg bg-white rounded-2xl'>
        <CardHeader className='pb-3'>
          <CardTitle className='text-lg'>Actions</CardTitle>
        </CardHeader>
        <CardContent className='space-y-2'>
          <Button variant='outline' size='sm' className='w-full justify-start rounded-lg text-sm'>
            <Edit3 className='h-3.5 w-3.5 mr-2' />
            Modifier
          </Button>
          <Button variant='outline' size='sm' className='w-full justify-start rounded-lg text-sm'>
            <Mail className='h-3.5 w-3.5 mr-2' />
            Email
          </Button>
          <Button
            variant='outline'
            size='sm'
            className='w-full justify-start rounded-lg text-sm text-red-600 hover:text-red-700 hover:bg-red-50'
          >
            <Shield className='h-3.5 w-3.5 mr-2' />
            Suspendre
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
