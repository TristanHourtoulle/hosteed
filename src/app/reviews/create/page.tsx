'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createReview } from '@/lib/services/reviews.service'
import { getRentById } from '@/lib/services/rents.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcnui/card'
import { Input } from '@/components/ui/shadcnui/input'
import { Button } from '@/components/ui/shadcnui/button'
import { Label } from '@/components/ui/shadcnui/label'
import { Alert, AlertDescription } from '@/components/ui/shadcnui/alert'
import { Star, ChevronLeft } from 'lucide-react'
import { motion } from 'framer-motion'

interface ReviewFormData {
  productId: string
  rentId: string
  userId: string
  grade: number
  welcomeGrade: number
  staff: number
  comfort: number
  equipment: number
  cleaning: number
  title: string
  text: string
  visitingDate: string
  publishDate: string
}

interface FormErrors extends Partial<Record<keyof ReviewFormData, string>> {
  submit?: string
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

function RatingInput({
  value,
  onChange,
  label,
}: {
  value: number
  onChange: (value: number) => void
  label: string
}) {
  return (
    <motion.div
      variants={itemVariants}
      className='relative p-6 rounded-xl bg-white shadow-sm border border-gray-100 hover:border-blue-100 transition-all duration-300'
    >
      <Label className='text-base font-medium text-gray-800 mb-3 block'>{label}</Label>
      <div className='flex items-center gap-2'>
        {[1, 2, 3, 4, 5].map(rating => (
          <motion.button
            key={rating}
            type='button'
            onClick={() => onChange(rating)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={`p-2 rounded-full transition-all duration-300 ${
              rating <= value
                ? 'text-yellow-400 hover:text-yellow-500 transform hover:-translate-y-1'
                : 'text-gray-300 hover:text-gray-400'
            }`}
          >
            <Star
              className={`w-8 h-8 ${rating <= value ? 'fill-current filter drop-shadow-md' : ''}`}
              strokeWidth={1.5}
            />
          </motion.button>
        ))}
      </div>
      <div className='absolute top-4 right-4 text-2xl font-semibold text-blue-600'>{value}/5</div>
    </motion.div>
  )
}

function ReviewForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rentId = searchParams.get('rentId')

  const [formData, setFormData] = useState<ReviewFormData>({
    productId: '',
    rentId: rentId || '',
    userId: '',
    grade: 5,
    welcomeGrade: 5,
    staff: 5,
    comfort: 5,
    equipment: 5,
    cleaning: 5,
    title: '',
    text: '',
    visitingDate: '',
    publishDate: new Date().toISOString().split('T')[0],
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchRentData = async () => {
      if (!rentId) {
        setIsLoading(false)
        return
      }
      try {
        const rent = await getRentById(rentId)
        if (rent) {
          setFormData(prev => ({
            ...prev,
            rentId,
            productId: rent.product.id,
            userId: rent.userId,
            visitingDate: new Date(rent.arrivingDate).toISOString().split('T')[0],
          }))
        } else {
          setErrors(prev => ({
            ...prev,
            rentId: 'Location non trouvée',
          }))
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de la location:', error)
        setErrors(prev => ({
          ...prev,
          rentId: 'Erreur lors de la récupération de la location',
        }))
      } finally {
        setIsLoading(false)
      }
    }

    fetchRentData()
  }, [rentId])

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ReviewFormData, string>> = {}

    if (!formData.title) newErrors.title = 'Le titre est requis'
    if (!formData.text || formData.text.length < 10)
      newErrors.text = 'Le commentaire doit contenir au moins 10 caractères'
    if (!formData.visitingDate) newErrors.visitingDate = 'La date de visite est requise'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const result = await createReview({
        ...formData,
        visitingDate: new Date(formData.visitingDate),
        publishDate: new Date(formData.publishDate),
      })

      if (result) {
        router.push('/reservations')
      } else {
        setErrors(prev => ({
          ...prev,
          submit: "Erreur lors de la création de l'avis",
        }))
      }
    } catch (error) {
      console.error(error)
      setErrors(prev => ({
        ...prev,
        submit: 'Une erreur est survenue',
      }))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center'>
        <div className='animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent'></div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4'>
      <motion.div
        className='container max-w-4xl mx-auto'
        initial='hidden'
        animate='visible'
        variants={containerVariants}
      >
        <motion.div className='mb-8 flex items-center' variants={itemVariants}>
          <Button
            variant='ghost'
            onClick={() => router.back()}
            className='text-gray-600 hover:text-gray-900'
          >
            <ChevronLeft className='w-5 h-5 mr-2' />
            Retour
          </Button>
        </motion.div>

        <Card className='backdrop-blur-sm bg-white/90 shadow-xl border-0'>
          <CardHeader className='text-center border-b border-gray-100 pb-8 pt-10'>
            <CardTitle className='text-3xl font-bold text-gray-900'>
              Partagez votre expérience
            </CardTitle>
            <p className='text-gray-500 mt-2'>
              Votre avis aide les autres voyageurs à faire le bon choix
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className='space-y-10 pt-8'>
              {/* Notes Section */}
              <motion.div className='grid gap-6 md:grid-cols-2' variants={containerVariants}>
                <RatingInput
                  value={formData.grade}
                  onChange={value => setFormData(prev => ({ ...prev, grade: value }))}
                  label='Note globale'
                />
                <RatingInput
                  value={formData.welcomeGrade}
                  onChange={value => setFormData(prev => ({ ...prev, welcomeGrade: value }))}
                  label='Accueil'
                />
                <RatingInput
                  value={formData.staff}
                  onChange={value => setFormData(prev => ({ ...prev, staff: value }))}
                  label='Personnel'
                />
                <RatingInput
                  value={formData.comfort}
                  onChange={value => setFormData(prev => ({ ...prev, comfort: value }))}
                  label='Confort'
                />
                <RatingInput
                  value={formData.equipment}
                  onChange={value => setFormData(prev => ({ ...prev, equipment: value }))}
                  label='Équipement'
                />
                <RatingInput
                  value={formData.cleaning}
                  onChange={value => setFormData(prev => ({ ...prev, cleaning: value }))}
                  label='Nettoyage'
                />
              </motion.div>

              {/* Titre et Commentaire Section */}
              <motion.div className='space-y-6' variants={containerVariants}>
                <motion.div variants={itemVariants}>
                  <Label htmlFor='title' className='text-lg font-medium text-gray-900 mb-2 block'>
                    Donnez un titre à votre avis
                  </Label>
                  <Input
                    id='title'
                    name='title'
                    value={formData.title}
                    onChange={handleChange}
                    className={`mt-1 text-lg py-3 ${errors.title ? 'border-red-500 focus-visible:ring-red-200' : 'focus-visible:ring-blue-200'}`}
                    placeholder='Ex: Un séjour inoubliable !'
                  />
                  {errors.title && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className='text-red-500 text-sm mt-2'
                    >
                      {errors.title}
                    </motion.p>
                  )}
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Label htmlFor='text' className='text-lg font-medium text-gray-900 mb-2 block'>
                    Décrivez votre expérience
                  </Label>
                  <textarea
                    id='text'
                    name='text'
                    value={formData.text}
                    onChange={handleChange}
                    rows={6}
                    className={`mt-1 w-full rounded-xl border ${
                      errors.text ? 'border-red-500' : 'border-gray-200'
                    } bg-white/50 px-4 py-3 text-base shadow-sm outline-none transition-all duration-200 focus:border-blue-500 focus:ring-4 ${
                      errors.text ? 'focus:ring-red-100' : 'focus:ring-blue-100'
                    }`}
                    placeholder='Partagez les détails qui rendront votre avis utile (minimum 10 caractères)'
                  />
                  {errors.text && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className='text-red-500 text-sm mt-2'
                    >
                      {errors.text}
                    </motion.p>
                  )}
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Label
                    htmlFor='visitingDate'
                    className='text-lg font-medium text-gray-900 mb-2 block'
                  >
                    Quand avez-vous séjourné ?
                  </Label>
                  <Input
                    type='date'
                    id='visitingDate'
                    name='visitingDate'
                    value={formData.visitingDate}
                    onChange={handleChange}
                    className={`mt-1 py-3 ${errors.visitingDate ? 'border-red-500' : ''}`}
                  />
                  {errors.visitingDate && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className='text-red-500 text-sm mt-2'
                    >
                      {errors.visitingDate}
                    </motion.p>
                  )}
                </motion.div>
              </motion.div>

              {errors.submit && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <Alert variant='destructive'>
                    <AlertDescription>{errors.submit}</AlertDescription>
                  </Alert>
                </motion.div>
              )}

              <motion.div className='flex justify-end gap-4 pt-6' variants={itemVariants}>
                <Button
                  type='button'
                  variant='secondary'
                  onClick={() => router.back()}
                  className='px-6'
                >
                  Annuler
                </Button>
                <Button type='submit' disabled={isSubmitting} className='px-8'>
                  {isSubmitting ? (
                    <>
                      <div className='animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2'></div>
                      Envoi en cours...
                    </>
                  ) : (
                    'Publier mon avis'
                  )}
                </Button>
              </motion.div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default function CreateReviewPage() {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center'>
          <div className='animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent'></div>
        </div>
      }
    >
      <ReviewForm />
    </Suspense>
  )
}
