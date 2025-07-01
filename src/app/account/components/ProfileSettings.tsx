'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/shadcnui/button'
import { EditProfileDialog } from './EditProfileDialog'
import { Edit2, Mail, Key, LogOut, AlertTriangle, CheckCircle } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { Alert, AlertDescription } from '@/components/ui/shadcnui/alert'

interface ProfileSettingsProps {
  user: {
    name: string | null
    lastname: string | null
    email: string
    password: string | null // Ajout du champ password pour vérifier si l'utilisateur est connecté via Google
  }
}

export function ProfileSettings({ user: initialUser }: ProfileSettingsProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [user, setUser] = useState(initialUser)
  const isGoogleUser = !user.password
  const [isUpdate, setIsUpdate] = useState(false)

  const handleUserUpdate = (updatedUser: typeof user) => {
    setUser(updatedUser)
    setIsUpdate(true)
  }

  return (
    <div className='space-y-6'>
      {/* Informations personnelles */}
      <div className='bg-white rounded-lg shadow-sm p-6'>
        {isUpdate && (
          <Alert className='mb-4 bg-green-50 text-green-800 border-green-200'>
            <CheckCircle className='h-4 w-4 text-green-800 my-auto' />
            <AlertDescription className='flex flex-wrap items-center justify-between gap-2'>
              Profil mis à jour avec succès, rechargez la page pour voir les changements
              <Button
                variant='outline'
                className='gap-2 py-0 px-6 text-xs rounded-full border-green-200 hover:bg-green-50 hover:text-green-800'
                onClick={() => window.location.reload()}
              >
                Recharger la page
              </Button>
            </AlertDescription>
          </Alert>
        )}
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold'>Informations personnelles</h3>
          <Button variant='outline' className='gap-2' onClick={() => setIsEditDialogOpen(true)}>
            <Edit2 className='w-4 h-4' />
            Modifier
          </Button>
        </div>
        <div className='space-y-4'>
          <div>
            <p className='text-sm font-medium text-gray-500'>Nom complet</p>
            <p className='mt-1'>
              {user.name} {user.lastname}
            </p>
          </div>
          <div>
            <p className='text-sm font-medium text-gray-500'>Email</p>
            <p className='mt-1'>{user.email}</p>
          </div>
        </div>
      </div>

      {/* Email et mot de passe */}
      <div className='bg-white rounded-lg shadow-sm p-6'>
        <h3 className='text-lg font-semibold mb-4'>Email et mot de passe</h3>
        {isGoogleUser && (
          <Alert className='mb-4 bg-yellow-50 text-yellow-800 border-yellow-200'>
            <AlertTriangle className='h-4 w-4 text-yellow-800' />
            <AlertDescription>
              Vous êtes connecté(e) via Google. La modification de l'email et du mot de passe n'est
              pas disponible. Pour modifier ces informations, veuillez les mettre à jour dans votre
              compte Google.
            </AlertDescription>
          </Alert>
        )}
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <Mail className='w-5 h-5 text-gray-400' />
              <div>
                <p className='font-medium'>Gérer votre email</p>
                <p className='text-sm text-gray-500'>Modifiez votre adresse email</p>
              </div>
            </div>
            <Button variant='outline' disabled={isGoogleUser}>
              Gérer
            </Button>
          </div>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <Key className='w-5 h-5 text-gray-400' />
              <div>
                <p className='font-medium'>Mot de passe</p>
                <p className='text-sm text-gray-500'>Modifiez votre mot de passe</p>
              </div>
            </div>
            <Button variant='outline' disabled={isGoogleUser}>
              Gérer
            </Button>
          </div>
        </div>
      </div>

      {/* Déconnexion */}
      <div className='bg-white rounded-lg shadow-sm p-6'>
        <h3 className='text-lg font-semibold mb-4'>Déconnexion</h3>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <LogOut className='w-5 h-5 text-gray-400' />
            <div>
              <p className='font-medium'>Se déconnecter</p>
              <p className='text-sm text-gray-500'>Déconnectez-vous de votre compte</p>
            </div>
          </div>
          <Button
            variant='outline'
            onClick={() => signOut()}
            className='text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300'
          >
            Déconnexion
          </Button>
        </div>
      </div>

      <EditProfileDialog
        user={user}
        isDialogOpen={isEditDialogOpen}
        setIsDialogOpen={setIsEditDialogOpen}
        onUpdate={handleUserUpdate}
      />
    </div>
  )
}
