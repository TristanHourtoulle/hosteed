'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcnui/card'
import { Input } from '@/components/ui/shadcnui/input'
import { Button } from '@/components/ui/shadcnui/button'
import { Label } from '@/components/ui/shadcnui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/shadcnui/checkbox'
import { Separator } from '@/components/ui/shadcnui/separator'
import { Alert, AlertDescription } from '@/components/ui/shadcnui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcnui/select'
import {
  Star,
  ChevronLeft,
  Plus,
  AlertTriangle,
  Building2,
  User,
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'

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

function SectionHeader({
  icon: Icon,
  label,
  iconBg,
  iconColor,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  iconBg: string
  iconColor: string
}) {
  return (
    <div className='space-y-3'>
      <div className='flex items-center gap-3'>
        <div className={`p-2 rounded-lg ${iconBg}`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <h2 className='text-base font-semibold text-gray-900'>{label}</h2>
      </div>
      <Separator className='bg-gray-100' />
    </div>
  )
}

export default function CreateAdminReviewPage() {
  const router = useRouter()
  const {
    session,
    isLoading: isAuthLoading,
    isAuthenticated,
  } = useAuth({ required: true, redirectTo: '/auth' })
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
    if (
      isAuthenticated &&
      (!session?.user?.roles || !['ADMIN', 'HOST_MANAGER'].includes(session.user.roles))
    ) {
      router.push('/admin')
      return
    }

    const fetchAllProducts = async () => {
      if (!isAuthenticated) return

      try {
        const allProducts: Array<{ id: string; name: string }> = []
        let page = 1
        let hasNext = true

        while (hasNext) {
          const response = await fetch(`/api/admin/products?page=${page}&limit=50`, {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' },
          })
          if (!response.ok) break

          const data = await response.json()
          allProducts.push(...(data.products || []))
          hasNext = data.pagination?.hasNext ?? false
          page++
        }

        setProducts(allProducts)
      } catch {
        toast.error('Erreur lors du chargement des hébergements')
      } finally {
        setLoading(false)
      }
    }

    fetchAllProducts()
  }, [isAuthenticated, session, router])

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Avis administratif créé avec succès')
        router.push('/admin/reviews')
      } else {
        toast.error(result.error || "Erreur lors de la création de l'avis")
      }
    } catch {
      toast.error('Une erreur est survenue lors de la création')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  if (isAuthLoading || loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='flex flex-col items-center gap-4'>
          <div className='w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin'></div>
          <p className='text-slate-600 text-lg'>Chargement...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-12 px-4'>
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

        <Card className='backdrop-blur-sm bg-white/90 shadow-xl border-0 rounded-2xl'>
          <CardHeader className='text-center border-b border-gray-100 pb-8 pt-10'>
            <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg mb-4 mx-auto'>
              <Plus className='w-8 h-8 text-white' />
            </div>
            <CardTitle className='text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent'>
              Créer un avis administratif
            </CardTitle>
            <p className='text-gray-500 mt-2'>
              Créer un avis fictif pour un hébergement (réservé aux administrateurs)
            </p>
            <Alert className='mt-6 bg-amber-50 border-amber-200 text-left'>
              <AlertTriangle className='h-4 w-4 text-amber-600' />
              <AlertDescription className='text-amber-800'>
                Cette fonctionnalité permet de créer des avis fictifs à des fins de test ou de
                démonstration. Utilisez cette fonction de manière responsable.
              </AlertDescription>
            </Alert>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className='space-y-10 pt-8'>
              {/* Section: Hebergement */}
              <motion.div variants={itemVariants} className='space-y-4'>
                <SectionHeader
                  icon={Building2}
                  label='Hébergement'
                  iconBg='bg-blue-100'
                  iconColor='text-blue-600'
                />
                <Select
                  value={formData.productId}
                  onValueChange={value => setFormData(prev => ({ ...prev, productId: value }))}
                >
                  <SelectTrigger className={`${errors.productId ? 'border-red-500' : ''}`}>
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
                  <p className='text-red-500 text-sm'>{errors.productId}</p>
                )}
              </motion.div>

              {/* Section: Author */}
              <motion.div variants={itemVariants} className='space-y-4'>
                <SectionHeader
                  icon={User}
                  label="Auteur de l'avis"
                  iconBg='bg-purple-100'
                  iconColor='text-purple-600'
                />
                <div className='flex items-center space-x-3'>
                  <Checkbox
                    id='useRealUser'
                    checked={formData.useRealUser}
                    onCheckedChange={(checked) =>
                      setFormData(prev => ({ ...prev, useRealUser: checked === true }))
                    }
                  />
                  <Label htmlFor='useRealUser' className='text-sm cursor-pointer'>
                    Créer avec un utilisateur fictif réaliste
                  </Label>
                </div>

                {formData.useRealUser && (
                  <motion.div
                    className='grid gap-6 md:grid-cols-2 mt-4'
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                  >
                    <div>
                      <Label htmlFor='fakeUserName' className='text-sm font-medium text-gray-700 mb-1 block'>
                        Nom de l&apos;utilisateur fictif
                      </Label>
                      <Input
                        id='fakeUserName'
                        name='fakeUserName'
                        value={formData.fakeUserName}
                        onChange={handleChange}
                        className={errors.fakeUserName ? 'border-red-500' : ''}
                        placeholder='Ex: Jean Dupont'
                      />
                      {errors.fakeUserName && (
                        <p className='text-red-500 text-sm mt-1'>{errors.fakeUserName}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor='fakeUserEmail' className='text-sm font-medium text-gray-700 mb-1 block'>
                        Email de l&apos;utilisateur fictif
                      </Label>
                      <Input
                        id='fakeUserEmail'
                        name='fakeUserEmail'
                        type='email'
                        value={formData.fakeUserEmail}
                        onChange={handleChange}
                        className={errors.fakeUserEmail ? 'border-red-500' : ''}
                        placeholder='Ex: jean.dupont@example.com'
                      />
                      {errors.fakeUserEmail && (
                        <p className='text-red-500 text-sm mt-1'>{errors.fakeUserEmail}</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>

              {/* Section: Ratings */}
              <motion.div variants={itemVariants} className='space-y-4'>
                <SectionHeader
                  icon={Star}
                  label='Notes'
                  iconBg='bg-yellow-100'
                  iconColor='text-yellow-600'
                />
                <div className='grid gap-6 md:grid-cols-2'>
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
                </div>
              </motion.div>

              {/* Section: Content */}
              <motion.div variants={itemVariants} className='space-y-6'>
                <SectionHeader
                  icon={FileText}
                  label="Contenu de l'avis"
                  iconBg='bg-green-100'
                  iconColor='text-green-600'
                />
                <div>
                  <Label htmlFor='title' className='text-sm font-medium text-gray-700 mb-1 block'>
                    Titre de l&apos;avis
                  </Label>
                  <Input
                    id='title'
                    name='title'
                    value={formData.title}
                    onChange={handleChange}
                    className={`text-lg py-3 ${errors.title ? 'border-red-500' : ''}`}
                    placeholder='Ex: Séjour exceptionnel !'
                  />
                  {errors.title && <p className='text-red-500 text-sm mt-1'>{errors.title}</p>}
                </div>

                <div>
                  <Label htmlFor='text' className='text-sm font-medium text-gray-700 mb-1 block'>
                    Contenu de l&apos;avis
                  </Label>
                  <Textarea
                    id='text'
                    name='text'
                    value={formData.text}
                    onChange={handleChange}
                    rows={6}
                    className={errors.text ? 'border-red-500' : ''}
                    placeholder="Décrivez l'expérience fictive (minimum 10 caractères)"
                  />
                  {errors.text && <p className='text-red-500 text-sm mt-1'>{errors.text}</p>}
                </div>

                <div className='grid gap-6 md:grid-cols-2'>
                  <div>
                    <Label htmlFor='visitingDate' className='text-sm font-medium text-gray-700 mb-1 block'>
                      Date de séjour fictive
                    </Label>
                    <Input
                      type='date'
                      id='visitingDate'
                      name='visitingDate'
                      value={formData.visitingDate}
                      onChange={handleChange}
                      className={`py-3 ${errors.visitingDate ? 'border-red-500' : ''}`}
                    />
                    {errors.visitingDate && (
                      <p className='text-red-500 text-sm mt-1'>{errors.visitingDate}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor='publishDate' className='text-sm font-medium text-gray-700 mb-1 block'>
                      Date de publication
                    </Label>
                    <Input
                      type='date'
                      id='publishDate'
                      name='publishDate'
                      value={formData.publishDate}
                      onChange={handleChange}
                      className='py-3'
                    />
                  </div>
                </div>
              </motion.div>

              {/* Actions */}
              <motion.div className='flex justify-end gap-4 pt-6' variants={itemVariants}>
                <Button
                  type='button'
                  variant='secondary'
                  onClick={() => router.back()}
                  className='px-6'
                >
                  Annuler
                </Button>
                <Button
                  type='submit'
                  disabled={isSubmitting}
                  className='px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg'
                >
                  {isSubmitting ? (
                    <>
                      <div className='animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2'></div>
                      Création en cours...
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
