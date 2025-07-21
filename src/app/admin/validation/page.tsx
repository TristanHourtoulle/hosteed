'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  findProductByValidation,
  rejectProduct,
  validateProduct,
} from '@/lib/services/product.service'
import { ProductValidation, UserRole } from '@prisma/client'
import Image from 'next/image'
import Link from 'next/link'
import { getCityFromAddress } from '@/lib/utils'
import { motion, Variants } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/shadcnui/card'
import { Button } from '@/components/ui/shadcnui/button'
import { Alert, AlertDescription } from '@/components/ui/shadcnui/alert'
import { Loader2, CheckCircle, XCircle, ArrowLeft, Eye, MapPin, Home } from 'lucide-react'
import { Badge } from '@/components/ui/shadcnui/badge'

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
      type: 'tween',
      duration: 0.5,
      ease: 'easeOut',
    },
  },
}

interface Product {
  id: string
  name: string
  description: string
  address: string
  basePrice: string
  validate: ProductValidation
  img?: { img: string }[]
  user: {
    id: string
    email: string
    name: string | null
    lastname: string | null
    image: string | null
    info: string | null
    emailVerified: Date | null
    password: string | null
    roles: UserRole
    createdAt: Date
    updatedAt: Date
    profilePicture: string | null
    stripeCustomerId: string | null
  }[]
}

export default function ValidationPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [validatingId, setValidatingId] = useState<string | null>(null)

  useEffect(() => {
    if (!session?.user?.roles || session.user.roles !== 'ADMIN') {
      router.push('/')
    }
  }, [session, router])

  const fetchProducts = async () => {
    try {
      const unvalidatedProducts = await findProductByValidation(ProductValidation.NotVerified)
      const recheck = await findProductByValidation(ProductValidation.RecheckRequest)
      if (unvalidatedProducts && recheck) {
        setProducts([...unvalidatedProducts, ...recheck])
      }
    } catch (err) {
      setError('Erreur lors du chargement des annonces')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleValidate = async (productId: string) => {
    setValidatingId(productId)
    try {
      const validated = await validateProduct(productId)
      if (validated) {
        setProducts(products.filter(p => p.id !== productId))
      } else {
        setError("Erreur lors de la validation de l'annonce")
      }
    } catch (err) {
      setError("Erreur lors de la validation de l'annonce")
      console.error(err)
    } finally {
      setValidatingId(null)
    }
  }

  const handleRefuse = async (productId: string) => {
    setValidatingId(productId)
    try {
      const rejected = await rejectProduct(productId)
      if (rejected) {
        setProducts(products.filter(p => p.id !== productId))
      } else {
        setError("Erreur lors de la validation de l'annonce")
      }
    } catch (err) {
      setError("Erreur lors de la validation de l'annonce")
      console.error(err)
    } finally {
      setValidatingId(null)
    }
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8'>
        <div className='max-w-7xl mx-auto flex items-center justify-center'>
          <div className='flex items-center space-x-2'>
            <Loader2 className='h-6 w-6 animate-spin text-blue-600' />
            <p className='text-gray-600 text-lg'>Chargement des annonces...</p>
          </div>
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
        className='max-w-7xl mx-auto space-y-8'
        variants={containerVariants}
        initial='hidden'
        animate='visible'
      >
        <div className='flex justify-between items-center'>
          <motion.h1
            className='text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600'
            variants={itemVariants}
          >
            Validation des annonces
          </motion.h1>
          <motion.div variants={itemVariants}>
            <Button variant='outline' asChild>
              <Link href='/admin' className='flex items-center space-x-2'>
                <ArrowLeft className='h-4 w-4' />
                <span>Retour au dashboard</span>
              </Link>
            </Button>
          </motion.div>
        </div>

        {products.length === 0 ? (
          <motion.div
            variants={itemVariants}
            className='bg-white rounded-lg shadow-md p-8 text-center'
          >
            <p className='text-gray-600 text-lg'>Aucune annonce en attente de validation</p>
          </motion.div>
        ) : (
          <motion.div
            className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            variants={containerVariants}
          >
            {products.map(product => (
              <motion.div
                key={product.id}
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className='py-0 overflow-hidden bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 group'>
                  {product.img && product.img[0] ? (
                    <div className='relative h-52 w-full overflow-hidden'>
                      <Image
                        src={product.img[0].img}
                        alt={product.name || 'Image du produit'}
                        fill
                        className='object-cover transition-transform duration-500 group-hover:scale-110'
                      />
                      <div className='absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
                    </div>
                  ) : (
                    <div className='h-52 bg-gray-100 flex items-center justify-center'>
                      <Home className='h-12 w-12 text-gray-400' />
                    </div>
                  )}
                  <CardContent className='p-5'>
                    <div className='space-y-3'>
                      <div>
                        <h2 className='text-xl font-semibold text-gray-800 group-hover:text-blue-600 transition-colors duration-300 line-clamp-1'>
                          {product.name}
                        </h2>
                        <p className='text-gray-600 text-sm flex items-center gap-1 mt-1'>
                          <MapPin className='h-4 w-4' />
                          {getCityFromAddress(product.address)}
                        </p>
                      </div>
                      <div className='flex items-center justify-between'>
                        <p className='text-blue-600 font-bold text-lg'>
                          {product.basePrice}€{' '}
                          <span className='text-sm text-gray-500 font-normal'>/ nuit</span>
                        </p>
                        <Badge variant='outline' className='bg-blue-50'>
                          En attente
                        </Badge>
                      </div>
                      <p className='text-gray-600 text-sm line-clamp-2'>{product.description}</p>
                      <div className='space-y-2 pt-2'>
                        <Button
                          variant='outline'
                          className='w-full bg-white hover:bg-gray-50'
                          asChild
                        >
                          <Link
                            href={`/admin/validation/${product.id}`}
                            className='flex items-center justify-center gap-2'
                          >
                            <Eye className='h-4 w-4' />
                            <span>Voir les détails</span>
                          </Link>
                        </Button>
                        <div className='flex gap-2'>
                          <Button
                            variant='default'
                            className='flex-1 bg-green-600 hover:bg-green-700 text-white gap-2'
                            onClick={() => handleValidate(product.id)}
                            disabled={validatingId === product.id}
                          >
                            {validatingId === product.id ? (
                              <Loader2 className='h-4 w-4 animate-spin' />
                            ) : (
                              <CheckCircle className='h-4 w-4' />
                            )}
                            <span>{validatingId === product.id ? 'Validation...' : 'Valider'}</span>
                          </Button>
                          <Button
                            variant='destructive'
                            className='flex-1 gap-2 rounded-full'
                            onClick={() => handleRefuse(product.id)}
                            disabled={validatingId === product.id}
                          >
                            {validatingId === product.id ? (
                              <Loader2 className='h-4 w-4 animate-spin' />
                            ) : (
                              <XCircle className='h-4 w-4' />
                            )}
                            <span>{validatingId === product.id ? 'Refus...' : 'Refuser'}</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
