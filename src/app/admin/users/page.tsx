'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { findAllUser } from '@/lib/services/user.service'
import { User } from '@prisma/client'
import Link from 'next/link'
import { motion, Variants } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/shadcnui/card'
import { Button } from '@/components/ui/shadcnui/button'
import { Badge } from '@/components/ui/shadcnui/badge'
import { Input } from '@/components/ui/shadcnui/input'
import { Alert, AlertDescription } from '@/components/ui/shadcnui/alert'
import {
  Loader2,
  Search,
  User as UserIcon,
  Calendar,
  Mail,
  Shield,
  Eye,
} from 'lucide-react'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'tween' as const,
      duration: 0.5,
      ease: 'easeOut',
    },
  },
}

export default function UsersPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!session?.user?.roles || session.user.roles !== 'ADMIN') {
      router.push('/')
    }
  }, [session, router])

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersData = await findAllUser()
        if (usersData) {
          setUsers(usersData as unknown as User[])
        }
      } catch (err) {
        setError('Erreur lors du chargement des utilisateurs')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  const filteredUsers = users.filter(
    user =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8 flex items-center justify-center'>
        <div className='flex items-center gap-3'>
          <Loader2 className='h-6 w-6 animate-spin text-blue-600' />
          <p className='text-gray-600 text-lg'>Chargement des utilisateurs...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8'>
        <div className='max-w-7xl mx-auto'>
          <Alert variant='destructive'>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8'>
      <motion.div
        className='max-w-7xl mx-auto space-y-6'
        variants={containerVariants}
        initial='hidden'
        animate='visible'
      >
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
          <motion.div variants={itemVariants}>
            <h1 className='text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600'>
              Gestion des Utilisateurs
            </h1>
            <p className='text-gray-600 mt-2'>
              {users.length} utilisateur{users.length > 1 ? 's' : ''} enregistré
              {users.length > 1 ? 's' : ''}
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className='w-full sm:w-auto'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
              <Input
                type='text'
                placeholder='Rechercher un utilisateur...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='pl-10 w-full sm:w-64 py-5 rounded-full'
              />
            </div>
          </motion.div>
        </div>

        <motion.div variants={itemVariants}>
          <Card className='overflow-hidden py-0'>
            <CardContent className='p-0'>
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead>
                    <tr className='bg-gray-50 border-b'>
                      <th className='text-left py-4 px-6 text-gray-500 font-medium'>NOM</th>
                      <th className='text-left py-4 px-6 text-gray-500 font-medium'>PRÉNOM</th>
                      <th className='text-left py-4 px-6 text-gray-500 font-medium'>EMAIL</th>
                      <th className='text-left py-4 px-6 text-gray-500 font-medium'>RÔLE</th>
                      <th className='text-left py-4 px-6 text-gray-500 font-medium'>
                        DATE DE CRÉATION
                      </th>
                      <th className='text-center py-4 px-6 text-gray-500 font-medium'>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y'>
                    {filteredUsers.map(user => (
                      <tr key={user.id} className='hover:bg-gray-50 transition-colors duration-200'>
                        <td className='py-4 px-6'>
                          <div className='flex items-center gap-2'>
                            <UserIcon className='h-4 w-4 text-gray-400' />
                            <span>{user.name || '-'}</span>
                          </div>
                        </td>
                        <td className='py-4 px-6'>{user.lastname || '-'}</td>
                        <td className='py-4 px-6'>
                          <div className='flex items-center gap-2'>
                            <Mail className='h-4 w-4 text-gray-400' />
                            <span>{user.email}</span>
                          </div>
                        </td>
                        <td className='py-4 px-6'>
                          <Badge
                            variant={user.roles === 'ADMIN' ? 'destructive' : 'default'}
                            className='flex w-fit items-center gap-1'
                          >
                            <Shield className='h-3 w-3' />
                            {user.roles}
                          </Badge>
                        </td>
                        <td className='py-4 px-6'>
                          <div className='flex items-center gap-2'>
                            <Calendar className='h-4 w-4 text-gray-400' />
                            <span>{new Date(user.createdAt).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </td>
                        <td className='py-4 px-6'>
                          <div className='flex justify-center'>
                            <Button
                              variant='ghost'
                              size='sm'
                              asChild
                              className='hover:bg-blue-50 hover:text-blue-600 rounded-full px-4 py-2'
                            >
                              <Link href={`/admin/users/${user.id}`}>
                                <Eye className='h-4 w-4' />
                              </Link>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}
