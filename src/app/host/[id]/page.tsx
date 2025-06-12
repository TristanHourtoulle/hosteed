'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { findProductById } from '@/lib/services/product.service'
import { CheckRentIsAvailable } from '@/lib/services/rents.service'
import Link from 'next/link'
import { Equipment, Meals, Services } from '@prisma/client'

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
import PropertySafety from './components/PropertySafety'
import CancellationPolicy from './components/CancellationPolicy'
import PropertyReviews from './components/PropertyReviews'
import HostInformation from './components/HostInformation'
import BookingCard from './components/BookingCard'

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

  if (error) {
    return (
      <div className='min-h-screen bg-white flex items-center justify-center'>
        <div className='text-center'>
          <p className='text-red-600 text-lg mb-4'>{error}</p>
          <Link href='/host' className='text-blue-600 hover:underline'>
            Retour aux hébergements
          </Link>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className='min-h-screen bg-white flex items-center justify-center'>
        <p className='text-gray-600'>Produit non trouvé</p>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-white mb-20'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6'>
        <PropertyHeader
          name={product.name}
          reviews={product.reviews}
          globalGrade={globalGrade}
          address={product.address}
        />

        <ImageGallery
          images={product.img}
          productName={product.name}
          currentImageIndex={currentImageIndex}
          nextImage={nextImage}
          prevImage={prevImage}
          setShowAllPhotos={setShowAllPhotos}
        />

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12 mt-6 sm:mt-8'>
          <div className='lg:col-span-2 space-y-6 sm:space-y-8'>
            <PropertyOverview product={product} />
            <PropertyHighlights product={product} />
            <PropertyDescription description={product.description} />
            <PropertyAmenities equipments={product.equipments} />
            {product.servicesList && product.servicesList.length > 0 && (
              <PropertyServices services={product.servicesList} />
            )}
            {product.mealsList && product.mealsList.length > 0 && (
              <PropertyMeals meals={product.mealsList} />
            )}
            <PropertyLocation address={product.address} />
            <PropertyRules maxPeople={product.maxPeople} />
            <PropertySafety />
            <CancellationPolicy />
            {product.reviews && product.reviews.length > 0 && (
              <PropertyReviews reviews={product.reviews} globalGrade={globalGrade} />
            )}
            <HostInformation />
          </div>

          <div className='lg:col-span-1 order-first lg:order-last'>
            <div className='lg:sticky lg:top-6'>
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
      </div>
    </div>
  )
}
