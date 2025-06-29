'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/shadcnui/card'
import { Button } from '@/components/ui/shadcnui/button'
import { UserCircle, Mail, Settings, LogOut } from 'lucide-react'
import { EditProfileDialog } from './EditProfileDialog'
import { updateUserProfile } from '../actions'

interface ProfileSettingsProps {
  user: {
    name: string | null
    lastname: string | null
    email: string
  }
}

export function ProfileSettings({ user }: ProfileSettingsProps) {
  return (
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
                <p className='text-sm text-gray-500'>Modifiez vos informations de profil</p>
              </div>
            </div>
            <EditProfileDialog
              user={user}
              onSave={async data => {
                await updateUserProfile(data)
              }}
            />
          </div>

          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <div className='p-2 rounded-full bg-blue-50'>
                <Mail className='w-6 h-6 text-blue-600' />
              </div>
              <div>
                <h3 className='font-medium text-gray-900'>Email et mot de passe</h3>
                <p className='text-sm text-gray-500'>Gérez vos identifiants de connexion</p>
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
                <p className='text-sm text-gray-500'>Déconnectez-vous de votre compte</p>
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
  )
}
