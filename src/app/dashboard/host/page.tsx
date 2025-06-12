// TODO: refactor this file because it's larger than 200 lines
'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { findAllProductByHostId } from '@/lib/services/product.service'
import { ProductValidation } from '@prisma/client'
import Image from 'next/image'
import Link from 'next/link'
import { getCityFromAddress } from '@/lib/utils'

interface Product {
  id: string
  name: string
  description: string
  address: string
  basePrice: string
  validate: ProductValidation
  img?: { img: string }[]
}

export default function HostDashboard() {
  const { data: session } = useSession()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        if (session?.user?.id) {
          const userProducts = await findAllProductByHostId(session.user.id)
          if (userProducts) {
            setProducts(userProducts)
          }
        }
      } catch (err) {
        setError('Erreur lors du chargement des annonces')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (session?.user) {
      fetchProducts()
    }
  }, [session])

  const getStatusBadgeColor = (status: ProductValidation) => {
    switch (status) {
      case ProductValidation.Approve:
        return 'bg-green-100 text-green-800'
      case ProductValidation.Refused:
        return 'bg-red-100 text-red-800'
      case ProductValidation.NotVerified:
        return 'bg-yellow-100 text-yellow-800'
      case ProductValidation.RecheckRequest:
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: ProductValidation) => {
    switch (status) {
      case ProductValidation.Approve:
        return 'Validé'
      case ProductValidation.Refused:
        return 'Refusé'
      case ProductValidation.NotVerified:
        return 'En attente'
      case ProductValidation.RecheckRequest:
        return 'Révision demandée'
      default:
        return 'Inconnu'
    }
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-100 p-6'>
        <div className='max-w-7xl mx-auto'>
          <div className='animate-pulse'>
            <div className='h-8 bg-gray-200 rounded w-1/4 mb-8'></div>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {[1, 2, 3].map(i => (
                <div key={i} className='bg-white rounded-lg shadow-md p-6'>
                  <div className='h-48 bg-gray-200 rounded mb-4'></div>
                  <div className='h-4 bg-gray-200 rounded w-3/4 mb-2'></div>
                  <div className='h-4 bg-gray-200 rounded w-1/2'></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gray-100 p-6'>
        <div className='max-w-7xl mx-auto'>
          <p className='text-red-600'>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-100'>
      <div className='max-w-7xl mx-auto'>
        {/* Navigation */}
        <div className='bg-white shadow-sm mb-6'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='flex justify-between h-16'>
              <div className='flex'>
                <div className='flex space-x-8'>
                  <Link
                    href='/dashboard/host'
                    className='inline-flex items-center px-1 pt-1 border-b-2 border-blue-500 text-sm font-medium text-gray-900'
                  >
                    <svg
                      className='h-5 w-5 mr-2'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                    >
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
                    className='inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  >
                    <svg
                      className='h-5 w-5 mr-2'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                    >
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
                    href='/dashboard/host/reservations'
                    className='inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  >
                    <svg
                      className='h-5 w-5 mr-2'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                    >
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
                    href='/dashboard/host/settings'
                    className='inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  >
                    <svg
                      className='h-5 w-5 mr-2'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                    >
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
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className='p-6'>
          <div className='flex justify-between items-center mb-8'>
            <h1 className='text-3xl font-bold text-gray-900'>Mes annonces</h1>
            <Link
              href='/createProduct'
              className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
            >
              Créer une nouvelle annonce
            </Link>
          </div>

          {products.length === 0 ? (
            <div className='bg-white rounded-lg shadow-md p-6 text-center'>
              <p className='text-gray-600 mb-4'>Vous n&apos;avez pas encore d&apos;annonces</p>
              <Link href='/createProduct' className='text-blue-600 hover:text-blue-800'>
                Créer votre première annonce
              </Link>
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {products.map(product => (
                <div key={product.id} className='bg-white rounded-lg shadow-md overflow-hidden'>
                  {product.img && product.img[0] && (
                    <div className='relative h-48 w-full'>
                      <Image
                        src={product.img[0].img}
                        alt={product.name}
                        fill
                        className='object-cover'
                      />
                    </div>
                  )}
                  <div className='p-4'>
                    <div className='flex justify-between items-start mb-2'>
                      <h2 className='text-xl font-semibold text-gray-800'>{product.name}</h2>
                      <span
                        className={`px-2 py-1 rounded-full text-sm ${getStatusBadgeColor(product.validate)}`}
                      >
                        {getStatusText(product.validate)}
                      </span>
                    </div>
                    <p className='text-gray-600 mb-2'>{getCityFromAddress(product.address)}</p>
                    <p className='text-gray-600 mb-4'>{product.basePrice}€</p>
                    <div className='flex justify-between items-center'>
                      <Link
                        href={`/host/${product.id}`}
                        className='text-blue-600 hover:text-blue-800'
                      >
                        Voir l&apos;annonce
                      </Link>
                      <div className='flex space-x-4'>
                        <Link
                          href={`/dashboard/host/calendar?property=${product.id}`}
                          className='text-gray-600 hover:text-gray-800'
                        >
                          Calendrier
                        </Link>
                        <Link
                          href={`/dashboard/host/edit/${product.id}`}
                          className='text-gray-600 hover:text-gray-800'
                        >
                          Modifier
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
