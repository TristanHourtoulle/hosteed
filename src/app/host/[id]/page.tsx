'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { findProductById } from '@/lib/services/product.service'
import { CheckRentIsAvailable } from '@/lib/services/rents.service'
import Link from 'next/link'
import Image from 'next/image'
import { Equipment, Meals, Services, User } from '@prisma/client'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

import PropertyHeader from './components/PropertyHeader'
import ImageGallery from './components/ImageGallery'
import PropertyOverview from './components/PropertyOverview'
import PropertyHighlights from './components/PropertyHighlights'
import PropertyDescription from './components/PropertyDescription'
import PropertyAmenities from './components/PropertyAmenities'
import PropertyServices from './components/PropertyServices'
import PropertyMeals from './components/PropertyMeals'
import PropertyLocation from './components/PropertyLocation'
import PropertyRules from './components/PropertyRules'
import PropertyInfo from './components/PropertyInfo'
import PropertySafety from './components/PropertySafety'
import CancellationPolicy from './components/CancellationPolicy'
import PropertyReviews from './components/PropertyReviews'
import HostInformation from './components/HostInformation'
import BookingCard from './components/BookingCard'
import AdminPromoteButton from './components/AdminPromoteButton'

interface Reviews {
  id: string
  title: string
  text: string
  grade: number
  welcomeGrade: number
  staff: number
  comfort: number
  equipment: number
  cleaning: number
  visitDate: Date
  publishDate: Date
  approved: boolean
}

interface Rules {
  id: string
  productId: string
  smokingAllowed: boolean
  petsAllowed: boolean
  eventsAllowed: boolean
  checkInTime: string
  checkOutTime: string
  selfCheckIn: boolean
  selfCheckInType?: string
}

interface Product {
  id: string
  name: string
  description: string
  basePrice: string
  equipments: Equipment[]
  servicesList: Services[]
  mealsList: Meals[]
  reviews: Reviews[]
  img: { img: string }[]
  address?: string
  room?: number
  bathroom?: number
  minPeople?: number
  maxPeople?: number
  sizeRoom?: number
  autoAccept?: boolean
  certified?: boolean
  contract?: boolean
  longitude?: number
  latitude?: number
  rules: Rules[]
  user: User[]
  nearbyPlaces?: {
    name: string
    distance: number
    duration: number
    transport: string
  }[]
  transportOptions?: {
    name: string
    description?: string
  }[]
  propertyInfo?: {
    hasStairs: boolean
    hasElevator: boolean
    hasHandicapAccess: boolean
    hasPetsOnProperty: boolean
    additionalNotes?: string
  }
  cancellationPolicy?: {
    freeCancellationHours: number
    partialRefundPercent: number
    additionalTerms?: string
  }
}

export default function ProductDetails() {
  const { id } = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAvailable, setIsAvailable] = useState<boolean>(true)
  const [globalGrade, setglobalGrade] = useState<number>(0)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [, setShowAllPhotos] = useState(false)
  const [formData, setFormData] = useState({
    arrivingDate: '',
    leavingDate: '',
  })
  const [showFullscreen, setShowFullscreen] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    function getGlobalGrade(reviews: Reviews[]) {
      if (!reviews || reviews.length === 0) return 0
      let grade = 0
      let welcomeGrade = 0
      let staffGrade = 0
      let comfortGrade = 0
      let equipmentGrade = 0
      let cleaningGrade = 0
      let index = 0
      reviews.forEach(review => {
        grade += review.grade
        welcomeGrade += review.welcomeGrade
        staffGrade += review.staff
        comfortGrade += review.comfort
        equipmentGrade += review.equipment
        cleaningGrade += review.cleaning
        index += 1
      })
      setglobalGrade(grade / index)
      return {
        global: grade / index,
        welcome: welcomeGrade / index,
        staff: staffGrade / index,
        comfort: comfortGrade / index,
        equipment: equipmentGrade / index,
        cleaning: cleaningGrade / index,
      }
    }
    if (product?.reviews) {
      const grades = getGlobalGrade(product.reviews)
      if (typeof grades === 'object') {
        setglobalGrade(grades.global)
      }
    }
  }, [product])

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const productData = await findProductById(id as string)
        if (productData) {
          setProduct(productData as unknown as Product)
        } else {
          setError('Produit non trouvé')
        }
      } catch {
        setError('Erreur lors de la récupération du produit')
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [id])

  useEffect(() => {
    const checkAvailability = async () => {
      if (formData.arrivingDate && formData.leavingDate) {
        const available = await CheckRentIsAvailable(
          id as string,
          new Date(formData.arrivingDate),
          new Date(formData.leavingDate)
        )
        setIsAvailable(available.available)
      }
    }
    checkAvailability()
  }, [formData.arrivingDate, formData.leavingDate, id])

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    if (name === 'arrivingDate') {
      if (formData.leavingDate && value > formData.leavingDate) {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          leavingDate: '',
        }))
        return
      }
    }

    if (name === 'leavingDate' && value <= formData.arrivingDate) {
      return
    }

    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const nextImage = () => {
    if (product?.img) {
      setCurrentImageIndex(prev => (prev + 1) % product.img.length)
    }
  }

  const prevImage = () => {
    if (product?.img) {
      setCurrentImageIndex(prev => (prev - 1 + product.img.length) % product.img.length)
    }
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-white flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className='min-h-screen bg-white flex items-center justify-center'>
        <div className='text-center'>
          <h2 className='text-2xl font-semibold text-gray-900 mb-2'>Une erreur est survenue</h2>
          <p className='text-gray-600'>{error || "Le produit n'a pas été trouvé"}</p>
          <Link href='/' className='text-blue-600 hover:text-blue-800 mt-4 inline-block'>
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-white'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <PropertyHeader
          name={product.name}
          reviews={product.reviews}
          globalGrade={globalGrade}
          address={product.address}
          productId={product.id}
        />

        <ImageGallery
          images={product.img}
          productName={product.name}
          currentImageIndex={currentImageIndex}
          nextImage={nextImage}
          prevImage={prevImage}
          setShowAllPhotos={setShowAllPhotos}
          setShowFullscreen={setShowFullscreen}
          setCurrentImageIndex={setCurrentImageIndex}
        />

        {showFullscreen && (
          <div
            className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-lg transition-all animate-fadein'
            tabIndex={-1}
            onKeyDown={e => {
              if (e.key === 'Escape') setShowFullscreen(false)
              if (e.key === 'ArrowLeft') prevImage()
              if (e.key === 'ArrowRight') nextImage()
            }}
          >
            <div className='relative bg-white p-0 rounded-2xl shadow-2xl flex items-center justify-center max-w-4xl w-full max-h-[80vh] animate-popin'>
              {/* Close button */}
              <button
                onClick={() => setShowFullscreen(false)}
                className='absolute top-4 right-4 bg-white hover:bg-gray-100 rounded-full p-2 shadow-lg z-10'
                aria-label='Fermer'
              >
                <X className='h-6 w-6 text-gray-700' />
              </button>
              {/* Prev button */}
              <button
                onClick={e => {
                  e.stopPropagation()
                  prevImage()
                }}
                className='absolute left-2 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-100 rounded-full p-2 shadow-lg z-10'
                aria-label='Précédent'
              >
                <ChevronLeft className='h-6 w-6 text-gray-700' />
              </button>
              {/* Next button */}
              <button
                onClick={e => {
                  e.stopPropagation()
                  nextImage()
                }}
                className='absolute right-2 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-100 rounded-full p-2 shadow-lg z-10'
                aria-label='Suivant'
              >
                <ChevronRight className='h-6 w-6 text-gray-700' />
              </button>
              {/* Image */}
              <div className='relative max-h-[80vh] w-auto aspect-auto'>
                <Image
                  src={product.img[currentImageIndex]?.img || ''}
                  alt={product.name}
                  width={800}
                  height={600}
                  className='max-h-[80vh] w-auto object-contain rounded-2xl transition-all'
                  draggable={false}
                />
              </div>
            </div>
          </div>
        )}

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          <div className='lg:col-span-2 space-y-10'>
            <PropertyOverview product={product} />

            <PropertyHighlights
              product={{ certified: product.certified, autoAccept: product.autoAccept }}
            />

            <PropertyDescription description={product.description} />

            <PropertyAmenities equipments={product.equipments} />

            <PropertyServices services={product.servicesList} />

            <PropertyMeals meals={product.mealsList} />

            <PropertyLocation
              address={product.address}
              nearbyPlaces={product.nearbyPlaces}
              transportOptions={product.transportOptions}
            />

            <PropertyRules
              maxPeople={product.maxPeople}
              rules={
                product.rules?.[0] || {
                  smokingAllowed: false,
                  petsAllowed: false,
                  eventsAllowed: false,
                  checkInTime: '15:00',
                  checkOutTime: '11:00',
                  selfCheckIn: false,
                }
              }
            />

            <PropertyInfo propertyInfo={product.propertyInfo} />

            <PropertySafety />

            <CancellationPolicy policy={product.cancellationPolicy} />

            <PropertyReviews reviews={product.reviews} globalGrade={globalGrade} />

            <div className='mt-12'>
              <HostInformation
                hostName={product.user[0]?.name || 'Hôte inconnu'}
                hostImage={product.user[0]?.image}
              />
            </div>
          </div>

          <div className='lg:col-span-1'>
            <BookingCard
              product={product}
              globalGrade={globalGrade}
              formData={formData}
              handleDateChange={handleDateChange}
              isAvailable={isAvailable}
              today={today}
            />
          </div>
        </div>
      </div>

      {/* Admin Promote Button */}
      <AdminPromoteButton productId={product.id} productName={product.name} />
    </div>
  )
}
