'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcnui/card'
import { Badge } from '@/components/ui/shadcnui/badge'
import { Separator } from '@/components/ui/shadcnui/separator'
import { User as UserIcon, Mail, Calendar, Shield } from 'lucide-react'
import type { ExtendedUser } from '../types'

interface UserPersonalInfoProps {
  user: ExtendedUser
}

export function UserPersonalInfo({ user }: UserPersonalInfoProps) {
  return (
    <Card className='lg:col-span-1 hover:shadow-lg transition-shadow duration-200'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-xl'>
          <UserIcon className='h-5 w-5 text-blue-600' />
          Informations personnelles
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='space-y-2'>
          <div className='flex items-center gap-2'>
            <span className='text-gray-600'>Nom:</span>
            <span className='font-medium'>{user.name || '-'}</span>
          </div>
          <div className='flex items-center gap-2'>
            <span className='text-gray-600'>Prénom:</span>
            <span className='font-medium'>{user.lastname || '-'}</span>
          </div>
          <div className='flex items-center gap-2 text-gray-600'>
            <Mail className='h-4 w-4' />
            <span>{user.email}</span>
          </div>
        </div>
        <Separator />
        <div className='space-y-3'>
          <Badge
            variant={user.roles === 'ADMIN' ? 'destructive' : 'default'}
            className='flex w-fit items-center gap-1'
          >
            <Shield className='h-3 w-3' />
            {user.roles}
          </Badge>
          <div className='flex items-center gap-2 text-gray-600'>
            <Calendar className='h-4 w-4' />
            <span>Inscrit le {new Date(user.createdAt).toLocaleDateString('fr-FR')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
