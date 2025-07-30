'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ProductValidation } from '@prisma/client'
import Image from 'next/image'
import Link from 'next/link'
import { motion, Variants } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, XCircle, ArrowLeft, Eye, MapPin, Home, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getProductsForValidation, getValidationStats } from './actions'

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
  }[]
}

interface ValidationStats {
  pending: number
  approved: number
  rejected: number
  recheckRequest: number
}

export default function EnhancedValidationPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [stats, setStats] = useState<ValidationStats>({
    pending: 0,
    approved: 0,
    rejected: 0,
    recheckRequest: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTab, setSelectedTab] = useState('pending')

  useEffect(() => {
    if (!session?.user?.roles || session.user.roles !== 'ADMIN') {
      router.push('/')
    }
  }, [session, router])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [productsResult, statsResult] = await Promise.all([
        getProductsForValidation(),
        getValidationStats(),
      ])

      if (productsResult.success && productsResult.data) {
        setProducts(productsResult.data as Product[])
      }
      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data)
      }
    } catch (err) {
      setError('Erreur lors du chargement des données')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getStatusBadge = (status: ProductValidation) => {
    switch (status) {
      case ProductValidation.NotVerified:
        return (
          <Badge variant='secondary' className='bg-yellow-100 text-yellow-800'>
            En attente
          </Badge>
        )
      case ProductValidation.Approve:
        return (
          <Badge variant='secondary' className='bg-green-100 text-green-800'>
            Approuvé
          </Badge>
        )
      case ProductValidation.Refused:
        return (
          <Badge variant='secondary' className='bg-red-100 text-red-800'>
            Refusé
          </Badge>
        )
      case ProductValidation.RecheckRequest:
        return (
          <Badge variant='secondary' className='bg-blue-100 text-blue-800'>
            Révision demandée
          </Badge>
        )
      default:
        return <Badge variant='secondary'>Inconnu</Badge>
    }
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    )
  }

  if (error) {
    return (
      <Alert className='max-w-md mx-auto mt-8'>
        <XCircle className='h-4 w-4' />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  const pendingProducts = products.filter(
    p =>
      p.validate === ProductValidation.NotVerified ||
      p.validate === ProductValidation.RecheckRequest
  )

  const approvedProducts = products.filter(p => p.validate === ProductValidation.Approve)
  const rejectedProducts = products.filter(p => p.validate === ProductValidation.Refused)

  const ProductCard = ({ product }: { product: Product }) => {
    return (
      <motion.div variants={itemVariants}>
        <Card className='overflow-hidden hover:shadow-lg transition-shadow duration-300'>
          <div className='flex'>
            {/* Image */}
            <div className='w-48 h-48 relative flex-shrink-0'>
              {product.img && product.img.length > 0 ? (
                <Image src={product.img[0].img} alt={product.name} fill className='object-cover' />
              ) : (
                <div className='w-full h-full bg-gray-200 flex items-center justify-center'>
                  <Home className='h-12 w-12 text-gray-400' />
                </div>
              )}
            </div>

            {/* Contenu */}
            <div className='flex-1 p-6'>
              <div className='flex justify-between items-start mb-4'>
                <div>
                  <h3 className='text-xl font-semibold text-gray-900 mb-2'>{product.name}</h3>
                  <div className='flex items-center text-sm text-gray-600 mb-2'>
                    <MapPin className='h-4 w-4 mr-1' />
                    {product.address}
                  </div>
                  <div className='flex items-center text-sm text-gray-600'>
                    <User className='h-4 w-4 mr-1' />
                    {product.user[0]?.name || product.user[0]?.lastname || product.user[0]?.email}
                  </div>
                </div>
                <div className='flex flex-col items-end gap-2'>
                  {getStatusBadge(product.validate)}
                  <span className='text-lg font-bold text-blue-600'>{product.basePrice}€</span>
                </div>
              </div>

              {/* Description tronquée */}
              <p className='text-gray-600 text-sm mb-4 line-clamp-2'>{product.description}</p>

              {/* Actions */}
              <div className='flex gap-2'>
                <Button asChild size='sm'>
                  <Link href={`/admin/validation/${product.id}`}>
                    <Eye className='h-4 w-4 mr-2' />
                    Examiner
                  </Link>
                </Button>
                <Button variant='outline' size='sm' asChild>
                  <Link href={`/host/${product.id}?preview=true`}>Prévisualiser</Link>
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <motion.div
        variants={containerVariants}
        initial='hidden'
        animate='visible'
        className='space-y-8'
      >
        {/* Header */}
        <motion.div variants={itemVariants} className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>Validation des annonces</h1>
            <p className='text-gray-600 mt-1'>
              Gérez les demandes de validation et les commentaires
            </p>
          </div>
          <Button variant='outline' asChild>
            <Link href='/admin'>
              <ArrowLeft className='h-4 w-4 mr-2' />
              Retour au panel admin
            </Link>
          </Button>
        </motion.div>

        {/* Statistiques */}
        <motion.div variants={itemVariants}>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            <Card>
              <CardHeader className='pb-2'>
                <CardTitle className='text-sm font-medium text-gray-600'>En attente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold text-yellow-600'>
                  {stats.pending + stats.recheckRequest}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='pb-2'>
                <CardTitle className='text-sm font-medium text-gray-600'>Approuvées</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold text-green-600'>{stats.approved}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='pb-2'>
                <CardTitle className='text-sm font-medium text-gray-600'>Refusées</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold text-red-600'>{stats.rejected}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='pb-2'>
                <CardTitle className='text-sm font-medium text-gray-600'>Total annonces</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold text-blue-600'>
                  {stats.pending + stats.approved + stats.rejected + stats.recheckRequest}
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Filtres avec onglets */}
        <motion.div variants={itemVariants}>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className='grid w-full grid-cols-3'>
              <TabsTrigger value='pending'>En attente ({pendingProducts.length})</TabsTrigger>
              <TabsTrigger value='approved'>Approuvées ({approvedProducts.length})</TabsTrigger>
              <TabsTrigger value='rejected'>Refusées ({rejectedProducts.length})</TabsTrigger>
            </TabsList>

            <TabsContent value='pending' className='mt-6'>
              <div className='space-y-4'>
                {pendingProducts.length === 0 ? (
                  <Card>
                    <CardContent className='text-center py-8'>
                      <CheckCircle className='h-12 w-12 text-green-500 mx-auto mb-4' />
                      <h3 className='text-lg font-medium text-gray-900 mb-2'>
                        Aucune annonce en attente
                      </h3>
                      <p className='text-gray-600'>Toutes les annonces ont été traitées.</p>
                    </CardContent>
                  </Card>
                ) : (
                  pendingProducts.map(product => <ProductCard key={product.id} product={product} />)
                )}
              </div>
            </TabsContent>

            <TabsContent value='approved' className='mt-6'>
              <div className='space-y-4'>
                {approvedProducts.length === 0 ? (
                  <Card>
                    <CardContent className='text-center py-8'>
                      <p className='text-gray-600'>Aucune annonce approuvée pour le moment.</p>
                    </CardContent>
                  </Card>
                ) : (
                  approvedProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value='rejected' className='mt-6'>
              <div className='space-y-4'>
                {rejectedProducts.length === 0 ? (
                  <Card>
                    <CardContent className='text-center py-8'>
                      <p className='text-gray-600'>Aucune annonce refusée pour le moment.</p>
                    </CardContent>
                  </Card>
                ) : (
                  rejectedProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </div>
  )
}
