// TODO: refactor this file because it's larger than 200 lines
'use client'

import { useEffect, useState, use } from 'react'
import { findProductById, validateProduct, rejectProduct } from '@/lib/services/product.service'
import { findAllRentByProductId } from '@/lib/services/rents.service'
import { findSpecialsPricesByProduct, createSpecialPrices, updateSpecialPrices, toggleSpecialPriceStatus, deleteSpecialsPricesByProduct } from '@/lib/services/specialPrices.service'
import { Product, RentStatus, PaymentStatus, ProductValidation } from '@prisma/client'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { getCityFromAddress } from '@/lib/utils'
import { Tag, Power, PowerOff } from 'lucide-react'
import CreateSpecialPriceModal from '@/components/ui/CreateSpecialPriceModal'

interface ProductWithRelations extends Product {
  type?: {
    id: string
    name: string
  } | null
  equipments?: Array<{
    id: string
    name: string
  }>
  servicesList?: Array<{
    id: string
    name: string
  }>
  mealsList?: Array<{
    id: string
    name: string
  }>
  img?: Array<{
    id: string
    img: string
  }>
  reviews?: Array<{
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
  }>
}

interface Rent {
  id: string
  arrivingDate: Date
  leavingDate: Date
  numberPeople: bigint
  status: RentStatus
  payment: PaymentStatus
  prices: bigint
  user: {
    id: string
    name: string | null
    email: string
  }
  options: {
    id: string
    name: string
    price: bigint
  }[]
}

interface SpecialPrice {
  id: string
  pricesMga: string
  pricesEuro: string
  day: string[]
  startDate: Date | null
  endDate: Date | null
  activate: boolean
  productId: string
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [product, setProduct] = useState<ProductWithRelations | null>(null)
  const [rents, setRents] = useState<Rent[]>([])
  const [loading, setLoading] = useState(true)
  const [specialPrices, setSpecialPrices] = useState<SpecialPrice[]>([])
  const [specialPriceModalOpen, setSpecialPriceModalOpen] = useState(false)
  const [editingSpecialPrice, setEditingSpecialPrice] = useState<SpecialPrice | null>(null)
  const router = useRouter()
  const resolvedParams = use(params)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productData, rentsData, specialPricesData] = await Promise.all([
          findProductById(resolvedParams.id),
          findAllRentByProductId(resolvedParams.id),
          findSpecialsPricesByProduct(resolvedParams.id),
        ])

        if (productData) {
          setProduct(productData)
        }
        if (rentsData) {
          setRents(rentsData)
        }
        if (Array.isArray(specialPricesData)) {
          setSpecialPrices(specialPricesData as unknown as SpecialPrice[])
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [resolvedParams.id])

  const handleValidate = async () => {
    try {
      const updatedProduct = await validateProduct(resolvedParams.id)
      if (updatedProduct) {
        setProduct(updatedProduct)
      }
    } catch (error) {
      console.error('Erreur lors de la validation du produit:', error)
    }
  }

  const handleReject = async () => {
    try {
      const updatedProduct = await rejectProduct(resolvedParams.id)
      if (updatedProduct) {
        setProduct(updatedProduct)
      }
    } catch (error) {
      console.error('Erreur lors du rejet du produit:', error)
    }
  }

  // Fonctions pour gérer les prix spéciaux
  const handleSpecialPriceCreated = async (specialPriceData: any) => {
    try {
      let result
      
      if (editingSpecialPrice) {
        // Mode modification
        result = await updateSpecialPrices(
          editingSpecialPrice.id,
          specialPriceData.pricesMga,
          specialPriceData.pricesEuro,
          specialPriceData.day,
          specialPriceData.startDate,
          specialPriceData.endDate,
          specialPriceData.activate
        )
      } else {
        // Mode création
        result = await createSpecialPrices(
          specialPriceData.pricesMga,
          specialPriceData.pricesEuro,
          specialPriceData.day,
          specialPriceData.startDate,
          specialPriceData.endDate,
          specialPriceData.activate,
          resolvedParams.id
        )
      }

      if (result) {
        // Si l'opération a réussi, recharger la liste des prix spéciaux
        const updatedSpecialPrices = await findSpecialsPricesByProduct(resolvedParams.id)
        if (Array.isArray(updatedSpecialPrices)) {
          setSpecialPrices(updatedSpecialPrices as unknown as SpecialPrice[])
        }
        setSpecialPriceModalOpen(false)
        setEditingSpecialPrice(null)
      } else {
        console.error('Erreur lors de l\'opération sur le prix spécial')
      }
    } catch (error) {
      console.error('Erreur lors de l\'opération sur le prix spécial:', error)
    }
  }

  const handleEditSpecialPrice = (price: SpecialPrice) => {
    setEditingSpecialPrice(price)
    setSpecialPriceModalOpen(true)
  }

  const handleToggleSpecialPriceStatus = async (priceId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus
      const result = await toggleSpecialPriceStatus(priceId, newStatus)

      if (result) {
        // Si la mise à jour a réussi, recharger la liste des prix spéciaux
        const updatedSpecialPrices = await findSpecialsPricesByProduct(resolvedParams.id)
        if (Array.isArray(updatedSpecialPrices)) {
          setSpecialPrices(updatedSpecialPrices as unknown as SpecialPrice[])
        }
      } else {
        console.error('Erreur lors de la mise à jour du statut du prix spécial')
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut du prix spécial:', error)
    }
  }

  const handleDeleteSpecialPrice = async (priceId: string) => {
    try {
      // Demander confirmation avant suppression
      if (!confirm('Êtes-vous sûr de vouloir supprimer ce prix spécial ?')) {
        return
      }

      // Appeler le service pour supprimer le prix spécial
      const result = await deleteSpecialsPricesByProduct(priceId)

      if (result) {
        // Si la suppression a réussi, recharger la liste des prix spéciaux
        const updatedSpecialPrices = await findSpecialsPricesByProduct(resolvedParams.id)
        if (Array.isArray(updatedSpecialPrices)) {
          setSpecialPrices(updatedSpecialPrices as unknown as SpecialPrice[])
        }
      } else {
        console.error('Erreur lors de la suppression du prix spécial')
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du prix spécial:', error)
    }
  }

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary'></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <h2 className='text-2xl font-bold text-gray-800 mb-4'>Produit non trouvé</h2>
          <button
            onClick={() => router.push('/admin/products')}
            className='bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors'
          >
            Retour à la liste
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='flex justify-between items-center mb-8'>
        <h1 className='text-3xl font-bold text-gray-900'>Détails de l&apos;hébergement</h1>
        <div className='flex gap-4'>
          <button
            onClick={() => router.push('/admin/products')}
            className='border-2 border-gray-300 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors text-gray-700'
          >
            Retour
          </button>
          {product.validate === ProductValidation.NotVerified && (
            <>
              <button
                onClick={handleValidate}
                className='bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors font-medium'
              >
                Valider
              </button>
              <button
                onClick={handleReject}
                className='bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors font-medium'
              >
                Refuser
              </button>
            </>
          )}
          {product.validate === ProductValidation.Approve && (
            <button
              onClick={handleReject}
              className='bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors font-medium'
            >
              Refuser
            </button>
          )}
          {product.validate === ProductValidation.Refused && (
            <button
              onClick={handleValidate}
              className='bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors font-medium'
            >
              Valider
            </button>
          )}
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        {/* Informations principales */}
        <div className='bg-white rounded-lg shadow-lg p-6 border border-gray-200'>
          <h2 className='text-xl font-bold mb-4 text-gray-900'>Informations principales</h2>
          <div className='space-y-4'>
            <div>
              <h3 className='font-semibold text-gray-800'>Nom</h3>
              <p className='text-gray-700'>{product.name}</p>
            </div>
            <div>
              <h3 className='font-semibold text-gray-800'>Description</h3>
              <p className='text-gray-700'>{product.description}</p>
            </div>
            <div>
              <h3 className='font-semibold text-gray-800'>Adresse</h3>
              <p className='text-gray-700'>{getCityFromAddress(product.address)}</p>
            </div>
            <div>
              <h3 className='font-semibold text-gray-800'>Prix de base</h3>
              <p className='text-gray-700'>{product.basePrice}€ / nuit</p>
            </div>
            <div>
              <h3 className='font-semibold text-gray-800'>Statut</h3>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  product.validate === 'Approve'
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                }`}
              >
                {product.validate}
              </span>
            </div>
          </div>
        </div>

        {/* Caractéristiques */}
        <div className='bg-white rounded-lg shadow-lg p-6 border border-gray-200'>
          <h2 className='text-xl font-bold mb-4 text-gray-900'>Caractéristiques</h2>
          <div className='space-y-4'>
            <div>
              <h3 className='font-semibold text-gray-800'>Type d&apos;hébergement</h3>
              <p className='text-gray-700'>{product.type?.name}</p>
            </div>
            <div>
              <h3 className='font-semibold text-gray-800'>Nombre de chambres</h3>
              <p className='text-gray-700'>{product.room || 'Non spécifié'}</p>
            </div>
            <div>
              <h3 className='font-semibold text-gray-800'>Nombre de salles de bain</h3>
              <p className='text-gray-700'>{product.bathroom || 'Non spécifié'}</p>
            </div>
            <div>
              <h3 className='font-semibold text-gray-800'>Heure d&apos;arrivée</h3>
              <p className='text-gray-700'>{product.arriving}h</p>
            </div>
            <div>
              <h3 className='font-semibold text-gray-800'>Heure de départ</h3>
              <p className='text-gray-700'>{product.leaving}h</p>
            </div>
          </div>
        </div>

        {/* Équipements et services */}
        <div className='bg-white rounded-lg shadow-lg p-6 border border-gray-200'>
          <h2 className='text-xl font-bold mb-4 text-gray-900'>Équipements et services</h2>
          <div className='space-y-4'>
            <div>
              <h3 className='font-semibold text-gray-800'>Équipements</h3>
              <div className='flex flex-wrap gap-2 mt-2'>
                {product.equipments?.map(equipment => (
                  <span
                    key={equipment.id}
                    className='bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm border border-gray-200'
                  >
                    {equipment.name}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className='font-semibold text-gray-800'>Services</h3>
              <div className='flex flex-wrap gap-2 mt-2'>
                {product.servicesList?.map(service => (
                  <span
                    key={service.id}
                    className='bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm border border-gray-200'
                  >
                    {service.name}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className='font-semibold text-gray-800'>Repas</h3>
              <div className='flex flex-wrap gap-2 mt-2'>
                {product.mealsList?.map(meal => (
                  <span
                    key={meal.id}
                    className='bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm border border-gray-200'
                  >
                    {meal.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className='bg-white rounded-lg shadow-lg p-6 border border-gray-200'>
          <h2 className='text-xl font-bold mb-4 text-gray-900'>Images</h2>
          <div className='grid grid-cols-2 gap-4'>
            {product.img?.map((image, index) => (
              <div key={index} className='relative h-48'>
                <Image
                  src={image.img}
                  alt={`Image ${index + 1} de ${product.name}`}
                  fill
                  className='object-cover rounded-lg'
                />
              </div>
            ))}
          </div>
        </div>

        {/* Réservations */}
        <div className='bg-white rounded-lg shadow-lg p-6 border border-gray-200 lg:col-span-2'>
          <h2 className='text-xl font-bold mb-4 text-gray-900'>Réservations</h2>
          {rents.length === 0 ? (
            <p className='text-gray-600'>Aucune réservation pour ce produit</p>
          ) : (
            <div className='space-y-4'>
              {rents.map(rent => (
                <div key={rent.id} className='border border-gray-200 rounded-lg p-4'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                      <h3 className='font-semibold text-gray-800'>Client</h3>
                      <p className='text-gray-700'>{rent.user.name || 'Anonyme'}</p>
                      <p className='text-gray-600 text-sm'>{rent.user.email}</p>
                    </div>
                    <div>
                      <h3 className='font-semibold text-gray-800'>Dates</h3>
                      <p className='text-gray-700'>
                        Du {new Date(rent.arrivingDate).toLocaleDateString()} au{' '}
                        {new Date(rent.leavingDate).toLocaleDateString()}
                      </p>
                      <p className='text-gray-600 text-sm'>
                        {rent.numberPeople.toString()} personne(s)
                      </p>
                    </div>
                    <div>
                      <h3 className='font-semibold text-gray-800'>Options</h3>
                      {rent.options.length > 0 ? (
                        <ul className='list-disc list-inside text-gray-700'>
                          {rent.options.map(option => (
                            <li key={option.id}>
                              {option.name} - {option.price}€
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className='text-gray-600'>Aucune option</p>
                      )}
                    </div>
                    <div>
                      <h3 className='font-semibold text-gray-800'>Statut</h3>
                      <div className='flex gap-2'>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            rent.status === RentStatus.RESERVED
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : rent.status === RentStatus.CANCEL
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                          }`}
                        >
                          {rent.status}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            rent.payment === PaymentStatus.CLIENT_PAID
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : rent.payment === PaymentStatus.REFUNDED
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                          }`}
                        >
                          {rent.payment}
                        </span>
                      </div>
                      <p className='text-gray-700 mt-2'>Total: {rent.prices}€</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Avis */}
        <div className='bg-white rounded-lg shadow-lg p-6 border border-gray-200'>
          <h2 className='text-xl font-bold mb-4 text-gray-900'>Avis</h2>
          {product.reviews && product.reviews.length > 0 ? (
            <div className='space-y-4'>
              <div className='bg-gray-50 p-4 rounded-lg'>
                <h3 className='text-lg font-semibold mb-2'>Notes moyennes</h3>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <p className='text-gray-600'>
                      Note globale :{' '}
                      {product.reviews.reduce((acc, review) => acc + review.grade, 0) /
                        product.reviews.length}
                      /5
                    </p>
                    <p className='text-gray-600'>
                      Accueil :{' '}
                      {product.reviews.reduce((acc, review) => acc + review.welcomeGrade, 0) /
                        product.reviews.length}
                      /5
                    </p>
                    <p className='text-gray-600'>
                      Personnel :{' '}
                      {product.reviews.reduce((acc, review) => acc + review.staff, 0) /
                        product.reviews.length}
                      /5
                    </p>
                    <p className='text-gray-600'>
                      Confort :{' '}
                      {product.reviews.reduce((acc, review) => acc + review.comfort, 0) /
                        product.reviews.length}
                      /5
                    </p>
                  </div>
                  <div>
                    <p className='text-gray-600'>
                      Équipement :{' '}
                      {product.reviews.reduce((acc, review) => acc + review.equipment, 0) /
                        product.reviews.length}
                      /5
                    </p>
                    <p className='text-gray-600'>
                      Nettoyage :{' '}
                      {product.reviews.reduce((acc, review) => acc + review.cleaning, 0) /
                        product.reviews.length}
                      /5
                    </p>
                  </div>
                </div>
              </div>
              {product.reviews.map(review => (
                <div key={review.id} className='border-b border-gray-200 pb-4'>
                  <div className='flex justify-between items-start mb-2'>
                    <h4 className='font-semibold'>{review.title}</h4>
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        review.approved
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {review.approved ? 'Approuvé' : 'En attente'}
                    </span>
                  </div>
                  <p className='text-gray-600 text-sm mb-2'>
                    {new Date(review.publishDate).toLocaleDateString('fr-FR')}
                  </p>
                  <div className='grid grid-cols-2 gap-4 mb-2'>
                    <div>
                      <p className='text-gray-600'>Accueil : {review.welcomeGrade}/5</p>
                      <p className='text-gray-600'>Personnel : {review.staff}/5</p>
                      <p className='text-gray-600'>Confort : {review.comfort}/5</p>
                    </div>
                    <div>
                      <p className='text-gray-600'>Équipement : {review.equipment}/5</p>
                      <p className='text-gray-600'>Nettoyage : {review.cleaning}/5</p>
                    </div>
                  </div>
                  <p className='text-gray-700'>{review.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className='text-gray-600'>Aucun avis pour le moment</p>
          )}
        </div>

        {/* Prix spéciaux */}
        <div className='bg-white rounded-lg shadow-lg p-6 border border-gray-200'>
          <div className='flex items-center justify-between mb-6'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-orange-100 rounded-lg'>
                <Tag className='h-5 w-5 text-orange-600' />
              </div>
              <div>
                <h2 className='text-xl font-bold text-gray-900'>Gestion des prix spéciaux</h2>
                <p className='text-sm text-gray-500'>
                  {specialPrices.length} prix spécial{specialPrices.length > 1 ? 'aux' : ''} configuré{specialPrices.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSpecialPriceModalOpen(true)}
              className='px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2'
            >
              <Tag className='h-4 w-4' />
              Créer un prix spécial
            </button>
          </div>

          {specialPrices.length === 0 ? (
            <div className='text-center py-8'>
              <Tag className='h-12 w-12 text-gray-300 mx-auto mb-4' />
              <p className='text-gray-500 mb-4'>Aucun prix spécial configuré</p>
              <button
                onClick={() => setSpecialPriceModalOpen(true)}
                className='px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 mx-auto'
              >
                <Tag className='h-4 w-4' />
                Créer un prix spécial
              </button>
            </div>
          ) : (
            <div className='space-y-4'>
              {specialPrices.map(price => (
                <div key={price.id} className='border rounded-lg p-4'>
                  <div className='flex items-center justify-between mb-3'>
                    <div className='flex items-center gap-3'>
                      <div className='w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center'>
                        <Tag className='h-5 w-5 text-orange-600' />
                      </div>
                      <div>
                        <p className='font-medium text-gray-900'>
                          {price.pricesEuro}€ / nuit
                        </p>
                        <p className='text-sm text-gray-500'>
                          Prix MGA: {price.pricesMga}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      price.activate ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {price.activate ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                  
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4'>
                    <div>
                      <p className='text-gray-600 mb-1'>Jours applicables</p>
                      <div className='flex flex-wrap gap-1'>
                        {price.day.map(day => (
                          <span key={day} className='bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs border border-gray-200'>
                            {day}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <p className='text-gray-600 mb-1'>Période</p>
                      <p className='text-gray-900'>
                        {price.startDate && price.endDate ? (
                          <>
                            {new Date(price.startDate).toLocaleDateString('fr-FR')} - {' '}
                            {new Date(price.endDate).toLocaleDateString('fr-FR')}
                          </>
                        ) : price.startDate ? (
                          `À partir du ${new Date(price.startDate).toLocaleDateString('fr-FR')}`
                        ) : price.endDate ? (
                          `Jusqu'au ${new Date(price.endDate).toLocaleDateString('fr-FR')}`
                        ) : (
                          'Toute l\'année'
                        )}
                      </p>
                    </div>
                    
                    <div className='flex items-end justify-end gap-2'>
                      <button
                        onClick={() => handleEditSpecialPrice(price)}
                        className='px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors'
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleToggleSpecialPriceStatus(price.id, price.activate)}
                        className={`px-3 py-1 text-sm border rounded transition-colors flex items-center gap-1 ${
                          price.activate 
                            ? 'border-orange-300 text-orange-600 hover:bg-orange-50' 
                            : 'border-green-300 text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {price.activate ? (
                          <>
                            <PowerOff className='h-3 w-3' />
                            Désactiver
                          </>
                        ) : (
                          <>
                            <Power className='h-3 w-3' />
                            Activer
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteSpecialPrice(price.id)}
                        className='px-3 py-1 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors'
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de création/modification de prix spécial */}
      <CreateSpecialPriceModal
        isOpen={specialPriceModalOpen}
        onClose={() => {
          setSpecialPriceModalOpen(false)
          setEditingSpecialPrice(null)
        }}
        onSpecialPriceCreated={handleSpecialPriceCreated}
        editingSpecialPrice={editingSpecialPrice}
      />
    </div>
  )
}
