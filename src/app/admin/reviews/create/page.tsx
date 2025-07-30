'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcnui/card'
import { Input } from '@/components/ui/shadcnui/input'
import { Button } from '@/components/ui/shadcnui/button'
import { Label } from '@/components/ui/shadcnui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/shadcnui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcnui/select'
import { Star, ChevronLeft, Plus, AlertTriangle } from 'lucide-react'

interface AdminReviewFormData {
  productId: string
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
  useRealUser: boolean
  fakeUserName: string
  fakeUserEmail: string
}

interface FormErrors extends Partial<Record<keyof AdminReviewFormData, string>> {
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

export default function CreateAdminReviewPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [products, setProducts] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)

  const [formData, setFormData] = useState<AdminReviewFormData>({
    productId: '',
    grade: 5,
    welcomeGrade: 5,
    staff: 5,
    comfort: 5,
    equipment: 5,
    cleaning: 5,
    title: '',
    text: '',
    visitingDate: new Date().toISOString().split('T')[0],
    publishDate: new Date().toISOString().split('T')[0],
    useRealUser: false,
    fakeUserName: '',
    fakeUserEmail: '',
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // Vérifier les permissions
    if (!session?.user?.roles || !['ADMIN', 'HOST_MANAGER'].includes(session.user.roles)) {
      router.push('/admin')
      return
    }

    // Charger la liste des produits
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/admin/products')
        if (response.ok) {
          const data = await response.json()
          setProducts(data.products || [])
        }
      } catch (error) {
        console.error('Erreur lors du chargement des produits:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [session, router])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.productId) newErrors.productId = 'Sélectionnez un hébergement'
    if (!formData.title) newErrors.title = 'Le titre est requis'
    if (!formData.text || formData.text.length < 10)
      newErrors.text = 'Le commentaire doit contenir au moins 10 caractères'
    if (!formData.visitingDate) newErrors.visitingDate = 'La date de visite est requise'

    if (formData.useRealUser) {
      if (!formData.fakeUserName) newErrors.fakeUserName = 'Le nom est requis'
      if (!formData.fakeUserEmail) newErrors.fakeUserEmail = "L'email est requis"
      if (formData.fakeUserEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.fakeUserEmail)) {
        newErrors.fakeUserEmail = 'Email invalide'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !session?.user?.id) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/admin/reviews/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        router.push('/admin/reviews?success=created')
      } else {
        setErrors(prev => ({
          ...prev,
          submit: result.error || "Erreur lors de la création de l'avis",
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
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  if (loading) {
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
            <CardTitle className='text-3xl font-bold text-gray-900 flex items-center justify-center gap-3'>
              <Plus className='w-8 h-8 text-blue-600' />
              Créer un avis administratif
            </CardTitle>
            <p className='text-gray-500 mt-2'>
              Créer un avis fictif pour un hébergement (réservé aux administrateurs)
            </p>
            <Alert className='mt-4 bg-orange-50 border-orange-200'>
              <AlertTriangle className='h-4 w-4 text-orange-600' />
              <AlertDescription className='text-orange-800'>
                Cette fonctionnalité permet de créer des avis fictifs à des fins de test ou de
                démonstration. Utilisez cette fonction de manière responsable.
              </AlertDescription>
            </Alert>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className='space-y-10 pt-8'>
              {/* Sélection du produit */}
              <motion.div variants={itemVariants}>
                <Label htmlFor='productId' className='text-lg font-medium text-gray-900 mb-2 block'>
                  Hébergement
                </Label>
                <Select
                  value={formData.productId}
                  onValueChange={value => setFormData(prev => ({ ...prev, productId: value }))}
                >
                  <SelectTrigger className={`mt-1 ${errors.productId ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder='Sélectionnez un hébergement...' />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.productId && (
                  <p className='text-red-500 text-sm mt-2'>{errors.productId}</p>
                )}
              </motion.div>

              {/* Type d'utilisateur */}
              <motion.div variants={itemVariants}>
                <Label className='text-lg font-medium text-gray-900 mb-4 block'>
                  Type d&apos;auteur de l&apos;avis
                </Label>
                <div className='flex items-center space-x-2'>
                  <input
                    type='checkbox'
                    id='useRealUser'
                    name='useRealUser'
                    checked={formData.useRealUser}
                    onChange={handleChange}
                    className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                  />
                  <Label htmlFor='useRealUser' className='text-sm'>
                    Créer avec un utilisateur fictif réaliste
                  </Label>
                </div>
              </motion.div>

              {/* Informations utilisateur fictif */}
              {formData.useRealUser && (
                <motion.div className='grid gap-6 md:grid-cols-2' variants={containerVariants}>
                  <motion.div variants={itemVariants}>
                    <Label
                      htmlFor='fakeUserName'
                      className='text-lg font-medium text-gray-900 mb-2 block'
                    >
                      Nom de l&apos;utilisateur fictif
                    </Label>
                    <Input
                      id='fakeUserName'
                      name='fakeUserName'
                      value={formData.fakeUserName}
                      onChange={handleChange}
                      className={`mt-1 ${errors.fakeUserName ? 'border-red-500' : ''}`}
                      placeholder='Ex: Jean Dupont'
                    />
                    {errors.fakeUserName && (
                      <p className='text-red-500 text-sm mt-2'>{errors.fakeUserName}</p>
                    )}
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Label
                      htmlFor='fakeUserEmail'
                      className='text-lg font-medium text-gray-900 mb-2 block'
                    >
                      Email de l&apos;utilisateur fictif
                    </Label>
                    <Input
                      id='fakeUserEmail'
                      name='fakeUserEmail'
                      type='email'
                      value={formData.fakeUserEmail}
                      onChange={handleChange}
                      className={`mt-1 ${errors.fakeUserEmail ? 'border-red-500' : ''}`}
                      placeholder='Ex: jean.dupont@example.com'
                    />
                    {errors.fakeUserEmail && (
                      <p className='text-red-500 text-sm mt-2'>{errors.fakeUserEmail}</p>
                    )}
                  </motion.div>
                </motion.div>
              )}

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
                    Titre de l&apos;avis
                  </Label>
                  <Input
                    id='title'
                    name='title'
                    value={formData.title}
                    onChange={handleChange}
                    className={`mt-1 text-lg py-3 ${errors.title ? 'border-red-500' : ''}`}
                    placeholder='Ex: Séjour exceptionnel !'
                  />
                  {errors.title && <p className='text-red-500 text-sm mt-2'>{errors.title}</p>}
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Label htmlFor='text' className='text-lg font-medium text-gray-900 mb-2 block'>
                    Contenu de l&apos;avis
                  </Label>
                  <Textarea
                    id='text'
                    name='text'
                    value={formData.text}
                    onChange={handleChange}
                    rows={6}
                    className={`mt-1 ${errors.text ? 'border-red-500' : ''}`}
                    placeholder="Décrivez l'expérience fictive (minimum 10 caractères)"
                  />
                  {errors.text && <p className='text-red-500 text-sm mt-2'>{errors.text}</p>}
                </motion.div>

                <motion.div className='grid gap-6 md:grid-cols-2' variants={containerVariants}>
                  <motion.div variants={itemVariants}>
                    <Label
                      htmlFor='visitingDate'
                      className='text-lg font-medium text-gray-900 mb-2 block'
                    >
                      Date de séjour fictive
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
                      <p className='text-red-500 text-sm mt-2'>{errors.visitingDate}</p>
                    )}
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Label
                      htmlFor='publishDate'
                      className='text-lg font-medium text-gray-900 mb-2 block'
                    >
                      Date de publication
                    </Label>
                    <Input
                      type='date'
                      id='publishDate'
                      name='publishDate'
                      value={formData.publishDate}
                      onChange={handleChange}
                      className='mt-1 py-3'
                    />
                  </motion.div>
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
                      Creation en cours...
                    </>
                  ) : (
                    "Créer l'avis administratif"
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
