'use client'
import { findAllUser } from '@/lib/services/user.service'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Product, Rent } from '@prisma/client'

interface User {
  id: string
  name: string | null
  lastname: string | null
  email: string
  roles: string
  createdAt: Date
  Product: Product[]
  Rent: Rent[]
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  useEffect(() => {
    const fetchUsers = async () => {
      const user = await findAllUser()
      if (!user) return
      setUsers(user)
    }
    fetchUsers()
  }, [])
  if (!users) {
    return (
      <div className='flex justify-center items-center h-[200px] text-lg text-red-600'>
        Erreur lors du chargement des utilisateurs
      </div>
    )
  }

  return (
    <div className='max-w-7xl mx-auto p-8'>
      <div className='bg-white rounded-lg shadow-md'>
        <div className='px-6 py-4 border-b border-gray-200'>
          <h1 className='text-2xl font-semibold text-gray-800'>Gestion des Utilisateurs</h1>
        </div>
        <div className='p-6'>
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Nom
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Prénom
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Email
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Rôle
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Date de création
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {users.map(user => (
                  <tr key={user.id} className='hover:bg-gray-50'>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      {user.name || '-'}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      {user.lastname || '-'}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      {user.email}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      {user.roles}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      <Link
                        href={`/admin/users/${user.id}`}
                        className='text-blue-600 hover:text-blue-800'
                      >
                        Voir détails
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
