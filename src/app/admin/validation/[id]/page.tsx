'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, use } from 'react'
import { findProductById, validateProduct, rejectProduct } from '@/lib/services/product.service'
import { Discount, ProductValidation, RentStatus } from '@prisma/client'
import Image from 'next/image'
import { getCityFromAddress } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcnui/card'
import { Button } from '@/components/ui/shadcnui/button'
import { Badge } from '@/components/ui/shadcnui/badge'
import { Separator } from '@/components/ui/shadcnui/separator'
import { Alert, AlertDescription } from '@/components/ui/shadcnui/alert'
import {
  CheckCircle,
  XCircle,
  Loader2,
  Home,
  MapPin,
  User,
  Mail,
  BedDouble,
  Bath,
  Clock,
  Utensils,
  Shield,
  Wrench,
} from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string
  address: string
  basePrice: string
  room: bigint | null
  bathroom: bigint | null
  arriving: number
  leaving: number
  validate: ProductValidation
  img?: { img: string }[]
  user: { name: string | null; email: string }[]
  equipments: { id: string; name: string }[]
  servicesList: { id: string; name: string }[]
  mealsList: { id: string; name: string }[]
  securities: { id: string; name: string }[]
  type: { id: string; name: string; description: string }
  options: { id: string; name: string; productId: string; type: bigint; price: bigint }[]
  rents: { id: string; status: RentStatus }[]
  discount: Discount[]
}

export default function ValidationPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [validationStatus, setValidationStatus] = useState<ProductValidation | null>(null)
  const resolvedParams = use(params)

  useEffect(() => {
    if (!session?.user?.roles || session.user.roles !== 'ADMIN') {
      router.push('/')
    }
  }, [session, router])

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const productData = await findProductById(resolvedParams.id)
        if (productData) {
          setProduct(productData)
          setValidationStatus(productData.validate)
        }
      } catch (err) {
        setError("Erreur lors du chargement de l'annonce")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [resolvedParams.id])

  const handleValidate = async () => {
    try {
      await validateProduct(resolvedParams.id)
      setValidationStatus(ProductValidation.Approve)
      router.push('/admin/validation')
    } catch (err) {
      setError("Erreur lors de la validation de l'annonce")
      console.error(err)
    }
  }

  const handleReject = async () => {
    try {
      await rejectProduct(resolvedParams.id)
      setValidationStatus(ProductValidation.Refused)
      router.push('/admin/validation')
    } catch (err) {
      setError("Erreur lors du rejet de l'annonce")
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8 flex items-center justify-center'>
        <div className='flex items-center gap-3'>
          <Loader2 className='h-6 w-6 animate-spin text-blue-600' />
          <p className='text-gray-600 text-lg'>Chargement des détails...</p>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8'>
        <div className='max-w-4xl mx-auto'>
          <Alert variant='destructive'>
            <AlertDescription>{error || 'Annonce non trouvée'}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8'>
      <motion.div
        className='max-w-4xl mx-auto space-y-6'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className='overflow-hidden py-0'>
          <div className='relative h-96 w-full'>
            {product.img && product.img.length > 0 ? (
              <Image
                src={product.img[0].img}
                alt={product.name}
                fill
                className='object-cover'
                priority
              />
            ) : (
              <div className='h-full bg-gray-100 flex items-center justify-center'>
                <Home className='h-16 w-16 text-gray-400' />
              </div>
            )}
            <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent' />
            <div className='absolute bottom-0 left-0 right-0 p-6 text-white'>
              <h1 className='text-3xl font-bold mb-2'>{product.name}</h1>
              <div className='flex items-center gap-2'>
                <MapPin className='h-5 w-5' />
                <span>{getCityFromAddress(product.address)}</span>
              </div>
            </div>
          </div>

          <CardContent className='p-6 space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <h2 className='text-xl font-semibold mb-4 flex items-center gap-2'>
                  <User className='h-5 w-5 text-blue-600' />
                  Propriétaire
                </h2>
                <div className='space-y-2'>
                  <p className='flex items-center gap-2'>
                    <span className='text-gray-600'>Nom:</span>
                    <span className='font-medium'>{product.user[0]?.name || 'Non renseigné'}</span>
                  </p>
                  <p className='flex items-center gap-2'>
                    <Mail className='h-4 w-4 text-gray-400' />
                    <span>{product.user[0]?.email}</span>
                  </p>
                </div>
              </div>

              <div>
                <h2 className='text-xl font-semibold mb-4'>Informations principales</h2>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='flex items-center gap-2'>
                    <BedDouble className='h-5 w-5 text-blue-600' />
                    <span>{product.room?.toString()} chambres</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Bath className='h-5 w-5 text-blue-600' />
                    <span>{product.bathroom?.toString()} sdb</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Clock className='h-5 w-5 text-blue-600' />
                    <span>Arrivée: {product.arriving}h</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Clock className='h-5 w-5 text-blue-600' />
                    <span>Départ: {product.leaving}h</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h2 className='text-xl font-semibold mb-4'>Description</h2>
              <p className='text-gray-600'>{product.description}</p>
            </div>

            <Separator />

            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <div>
                <h2 className='text-lg font-semibold mb-3 flex items-center gap-2'>
                  <Wrench className='h-5 w-5 text-blue-600' />
                  Équipements
                </h2>
                <ul className='space-y-2'>
                  {product.equipments.map(equipment => (
                    <li key={equipment.id} className='text-gray-600'>
                      • {equipment.name}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className='text-lg font-semibold mb-3 flex items-center gap-2'>
                  <Utensils className='h-5 w-5 text-blue-600' />
                  Repas
                </h2>
                <ul className='space-y-2'>
                  {product.mealsList.map(meal => (
                    <li key={meal.id} className='text-gray-600'>
                      • {meal.name}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className='text-lg font-semibold mb-3 flex items-center gap-2'>
                  <Shield className='h-5 w-5 text-blue-600' />
                  Sécurité
                </h2>
                <ul className='space-y-2'>
                  {product.securities.map(security => (
                    <li key={security.id} className='text-gray-600'>
                      • {security.name}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Separator />

            <div className='flex justify-end gap-4 pt-4'>
              <Button variant='outline' size='lg' className='gap-2' onClick={handleReject}>
                <XCircle className='h-5 w-5' />
                Refuser
              </Button>
              <Button
                variant='default'
                size='lg'
                className='bg-green-600 hover:bg-green-700 gap-2'
                onClick={handleValidate}
              >
                <CheckCircle className='h-5 w-5' />
                Valider
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
